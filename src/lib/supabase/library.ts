import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type RuleRevisionRow = Database['public']['Tables']['rule_revisions']['Row']
export type RuleDocumentRow = Database['public']['Tables']['rule_documents']['Row']
export type MatchRow = Database['public']['Tables']['matches']['Row']
type HistoryParticipantRow = Pick<Database['public']['Tables']['match_participants']['Row'], 'id' | 'match_id' | 'profile_id' | 'status'>
export type LibraryGameRow = Database['public']['Tables']['games']['Row']
export type LibraryVariantRow = Database['public']['Tables']['game_variants']['Row']
export type LibraryProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'id'>

export type RuleEntry = {
  document: RuleDocumentRow
  game: LibraryGameRow
  revision: RuleRevisionRow
  variant: LibraryVariantRow | null
}

export type MatchHistoryParticipant = {
  displayName: string
  outcome: string | null
  placement: number | null
  profileId: string
  teamName: string
}

export type MatchHistoryEntry = {
  completedAt: string | null
  createdAt: string
  gameName: string
  gameSlug: string
  id: string
  notes: string | null
  participants: MatchHistoryParticipant[]
}

export type PlayerStats = {
  draws: number
  gamesPlayed: number
  losses: number
  noContests: number
  profileId: string
  winRate: number
  wins: number
  displayName: string
}

export async function fetchPublishedRules(client: SupabaseClient<Database>): Promise<RuleEntry[]> {
  const [gamesResult, variantsResult, documentsResult, revisionsResult] = await Promise.all([
    client.from('games').select('*').eq('is_active', true).order('name'),
    client.from('game_variants').select('*').eq('is_active', true).order('name'),
    client.from('rule_documents').select('*'),
    client.from('rule_revisions').select('*').eq('status', 'published').order('updated_at', { ascending: false }),
  ])

  if (gamesResult.error) throw gamesResult.error
  if (variantsResult.error) throw variantsResult.error
  if (documentsResult.error) throw documentsResult.error
  if (revisionsResult.error) throw revisionsResult.error

  const gamesById = new Map((gamesResult.data ?? []).map((game) => [game.id, game]))
  const variantsById = new Map((variantsResult.data ?? []).map((variant) => [variant.id, variant]))
  const revisionByDocumentId = new Map((revisionsResult.data ?? []).map((revision) => [revision.document_id, revision]))

  return (documentsResult.data ?? [])
    .map((document) => {
      const game = gamesById.get(document.game_id)
      const revision = revisionByDocumentId.get(document.id)
      if (!game || !revision) return null
      return {
        document,
        game,
        revision,
        variant: document.variant_id ? variantsById.get(document.variant_id) ?? null : null,
      }
    })
    .filter((entry): entry is RuleEntry => entry !== null)
    .sort((left, right) => left.game.name.localeCompare(right.game.name) || (left.variant?.name ?? '').localeCompare(right.variant?.name ?? ''))
}

export async function fetchCompletedMatchHistory(
  client: SupabaseClient<Database>,
  limit = 50,
): Promise<MatchHistoryEntry[]> {
  const [matchesResult, gamesResult, participantsResult, teamsResult, membersResult, resultsResult, profilesResult] = await Promise.all([
    client.from('matches').select('id, game_id, status, completed_at, created_at, notes').eq('status', 'completed').order('completed_at', { ascending: false }).limit(limit),
    client.from('games').select('id, name, slug'),
    client.from('match_participants').select('id, match_id, profile_id, status'),
    client.from('match_teams').select('id, match_id, name, position'),
    client.from('match_team_members').select('match_id, team_id, participant_id'),
    client.from('match_results').select('match_id, team_id, outcome, placement'),
    client.from('profiles').select('id, display_name'),
  ])

  const results = [matchesResult, gamesResult, participantsResult, teamsResult, membersResult, resultsResult, profilesResult]
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  const matches = matchesResult.data ?? []
  const gamesById = new Map((gamesResult.data ?? []).map((game) => [game.id, game]))
  const participantsByMatch = new Map<string, HistoryParticipantRow[]>()
  for (const participant of participantsResult.data ?? []) {
    const current = participantsByMatch.get(participant.match_id) ?? []
    current.push(participant)
    participantsByMatch.set(participant.match_id, current)
  }
  const teamsById = new Map((teamsResult.data ?? []).map((team) => [team.id, team]))
  const memberByParticipant = new Map((membersResult.data ?? []).map((member) => [member.participant_id, member]))
  const resultByTeam = new Map((resultsResult.data ?? []).map((result) => [result.team_id, result]))
  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))

  return matches.flatMap((match) => {
    const game = gamesById.get(match.game_id)
    if (!game) return []
    return [{
      completedAt: match.completed_at,
      createdAt: match.created_at,
      gameName: game.name,
      gameSlug: game.slug,
      id: match.id,
      notes: match.notes,
      participants: (participantsByMatch.get(match.id) ?? []).map((participant) => {
        const member = memberByParticipant.get(participant.id)
        const team = member ? teamsById.get(member.team_id) : undefined
        const result = team ? resultByTeam.get(team.id) : undefined
        return {
          displayName: profilesById.get(participant.profile_id)?.display_name ?? 'Unknown player',
          outcome: result?.outcome ?? null,
          placement: result?.placement ?? null,
          profileId: participant.profile_id,
          teamName: team?.name ?? `Team ${team?.position ?? '?'}`,
        }
      }),
    }]
  })
}

export function derivePlayerStats(history: readonly MatchHistoryEntry[]): PlayerStats[] {
  const stats = new Map<string, PlayerStats>()
  for (const match of history) {
    for (const participant of match.participants) {
      const current = stats.get(participant.profileId) ?? {
        displayName: participant.displayName,
        draws: 0,
        gamesPlayed: 0,
        losses: 0,
        noContests: 0,
        profileId: participant.profileId,
        winRate: 0,
        wins: 0,
      }
      current.displayName = participant.displayName
      current.gamesPlayed += 1
      if (participant.outcome === 'win') current.wins += 1
      else if (participant.outcome === 'loss') current.losses += 1
      else if (participant.outcome === 'draw') current.draws += 1
      else if (participant.outcome === 'no_contest') current.noContests += 1
      const decidedGames = current.wins + current.losses + current.draws
      current.winRate = decidedGames > 0 ? Math.round((current.wins / decidedGames) * 100) : 0
      stats.set(participant.profileId, current)
    }
  }

  return [...stats.values()].sort((left, right) => right.wins - left.wins || left.displayName.localeCompare(right.displayName))
}

export function specialRulesAsText(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
