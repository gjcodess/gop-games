import type { GameDefinition } from '../games/gameRegistry'
import type { MatchResultDraft, MatchSetupDraft, MatchTeamDraft } from './matchTypes'

export type ValidationIssue = {
  code: string
  message: string
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

export function normalizeTeams(draft: MatchSetupDraft): MatchTeamDraft[] {
  if (draft.teams?.length) {
    return draft.teams.map((team, index) => ({
      ...team,
      participantProfileIds: unique(team.participantProfileIds),
      position: team.position || index + 1,
    }))
  }

  return draft.participants.map((participant, index) => ({
    name: `Player ${index + 1}`,
    participantProfileIds: [participant.profileId],
    position: index + 1,
  }))
}

export function validateMatchSetup(draft: MatchSetupDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const participantIds = unique(draft.participants.map((participant) => participant.profileId))
  const teams = normalizeTeams(draft)
  const assignedIds = teams.flatMap((team) => team.participantProfileIds)
  const assignedUniqueIds = unique(assignedIds)

  if (participantIds.length < draft.game.minPlayers) {
    issues.push({ code: 'too_few_players', message: `${draft.game.name} needs at least ${draft.game.minPlayers} players.` })
  }

  if (draft.game.maxPlayers !== null && participantIds.length > draft.game.maxPlayers) {
    issues.push({ code: 'too_many_players', message: `${draft.game.name} supports at most ${draft.game.maxPlayers} players.` })
  }

  if (!draft.game.allowsTeams && teams.some((team) => team.participantProfileIds.length > 1)) {
    issues.push({ code: 'teams_not_supported', message: `${draft.game.name} uses one team per player.` })
  }

  if (
    assignedUniqueIds.length !== assignedIds.length
    || assignedUniqueIds.length !== participantIds.length
    || assignedUniqueIds.some((id) => !participantIds.includes(id))
  ) {
    issues.push({ code: 'invalid_team_assignment', message: 'Every participant must belong to exactly one team.' })
  }

  if (teams.some((team) => team.participantProfileIds.length === 0)) {
    issues.push({ code: 'empty_team', message: 'Teams cannot be empty.' })
  }

  if (draft.variantSlug && !draft.game.variants?.some((variant) => variant.slug === draft.variantSlug)) {
    issues.push({ code: 'invalid_variant', message: `${draft.variantSlug} is not a valid ${draft.game.name} variant.` })
  }

  return issues
}

export function validateCompletedResult(game: GameDefinition, results: readonly MatchResultDraft[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const winningTeams = results.filter((result) => result.outcome === 'win')
  const teamIds = results.map((result) => result.teamId)
  const hasDraw = results.some((result) => result.outcome === 'draw')
  const hasNoContest = results.some((result) => result.outcome === 'no_contest')

  if (unique(teamIds).length !== teamIds.length) {
    issues.push({ code: 'duplicate_team_result', message: 'Each team can have only one result.' })
  }

  if (results.length === 0) {
    issues.push({ code: 'missing_results', message: 'Every participating team needs a result.' })
  }

  if (!hasDraw && !hasNoContest && (winningTeams.length < game.minWinners || winningTeams.length > game.maxWinners)) {
    issues.push({ code: 'invalid_winner_count', message: `${game.name} allows ${game.minWinners}–${game.maxWinners} winner(s).` })
  }

  if ((hasDraw || hasNoContest) && winningTeams.length > 0) {
    issues.push({ code: 'mixed_outcomes', message: 'Draw and no-contest results cannot be mixed with winners.' })
  }

  return issues
}
