import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']

export type MatchSnapshot = {
  assignments: Tables['billiards_assignments']['Row'][]
  billiardsEvents: Tables['billiards_events']['Row'][]
  billiardsMatchState: Tables['billiards_match_state']['Row'] | null
  billiardsTurns: Tables['billiards_turns']['Row'][]
  balls: Tables['billiards_ball_states']['Row'][]
  events: Tables['match_events']['Row'][]
  flip7Cards: Tables['flip7_round_cards']['Row'][]
  flip7PlayerStates: Tables['flip7_round_player_state']['Row'][]
  match: Tables['matches']['Row']
  participants: Tables['match_participants']['Row'][]
  results: Tables['match_results']['Row'][]
  rounds: Tables['match_rounds']['Row'][]
  scores: Tables['match_scores']['Row'][]
  teamMembers: Tables['match_team_members']['Row'][]
  teams: Tables['match_teams']['Row'][]
}

export async function fetchMatchSnapshot(
  client: SupabaseClient<Database>,
  matchId: string,
): Promise<MatchSnapshot> {
  const [
    matchResult,
    teamsResult,
    participantsResult,
    teamMembersResult,
    resultsResult,
    eventsResult,
    roundsResult,
    scoresResult,
    flip7PlayerStatesResult,
    flip7CardsResult,
    billiardsStateResult,
    ballsResult,
    assignmentsResult,
    turnsResult,
    billiardsEventsResult,
  ] = await Promise.all([
    client.from('matches').select('*').eq('id', matchId).single(),
    client.from('match_teams').select('*').eq('match_id', matchId).order('position'),
    client.from('match_participants').select('*').eq('match_id', matchId).order('seat_order'),
    client.from('match_team_members').select('*').eq('match_id', matchId),
    client.from('match_results').select('*').eq('match_id', matchId),
    client.from('match_events').select('*').eq('match_id', matchId).order('sequence'),
    client.from('match_rounds').select('*').eq('match_id', matchId).order('round_number'),
    client.from('match_scores').select('*').eq('match_id', matchId),
    client.from('flip7_round_player_state').select('*').eq('match_id', matchId),
    client.from('flip7_round_cards').select('*').eq('match_id', matchId).order('entry_order'),
    client.from('billiards_match_state').select('*').eq('match_id', matchId).maybeSingle(),
    client.from('billiards_ball_states').select('*').eq('match_id', matchId).order('ball_number'),
    client.from('billiards_assignments').select('*').eq('match_id', matchId),
    client.from('billiards_turns').select('*').eq('match_id', matchId).order('turn_number'),
    client.from('billiards_events').select('*').eq('match_id', matchId).order('sequence'),
  ])

  const errors = [
    matchResult.error,
    teamsResult.error,
    participantsResult.error,
    teamMembersResult.error,
    resultsResult.error,
    eventsResult.error,
    roundsResult.error,
    scoresResult.error,
    flip7PlayerStatesResult.error,
    flip7CardsResult.error,
    billiardsStateResult.error,
    ballsResult.error,
    assignmentsResult.error,
    turnsResult.error,
    billiardsEventsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw errors[0]
  }

  if (!matchResult.data) {
    throw new Error('Match snapshot did not include a match row.')
  }

  return {
    assignments: assignmentsResult.data ?? [],
    billiardsEvents: billiardsEventsResult.data ?? [],
    billiardsMatchState: billiardsStateResult.data,
    billiardsTurns: turnsResult.data ?? [],
    balls: ballsResult.data ?? [],
    events: eventsResult.data ?? [],
    flip7Cards: flip7CardsResult.data ?? [],
    flip7PlayerStates: flip7PlayerStatesResult.data ?? [],
    match: matchResult.data,
    participants: participantsResult.data ?? [],
    results: resultsResult.data ?? [],
    rounds: roundsResult.data ?? [],
    scores: scoresResult.data ?? [],
    teamMembers: teamMembersResult.data ?? [],
    teams: teamsResult.data ?? [],
  }
}
