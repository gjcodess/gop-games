import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'

export type BilliardsMode = '15_ball_consecutive' | '8_ball' | 'cutthroat'
export type BilliardsEventType = 'assignment_changed' | 'ball_toggled' | 'correction' | 'turn_ended' | 'turn_started'
export type BilliardsResult = 'draw' | 'no_contest' | 'winner'

export type InitializeBilliardsMatchRequest = {
  activeParticipantId?: string
  activeTeamId?: string
  clientEventId: string
  expectedVersion: number
  matchId: string
  mode: BilliardsMode
}

export async function initializeBilliardsMatch(
  client: SupabaseClient<Database>,
  request: InitializeBilliardsMatchRequest,
): Promise<number> {
  const args = {
    p_active_participant_id: request.activeParticipantId,
    p_active_team_id: request.activeTeamId,
    p_client_event_id: request.clientEventId,
    p_expected_version: request.expectedVersion,
    p_match_id: request.matchId,
    p_mode: request.mode,
  } as unknown as Database['public']['Functions']['initialize_billiards_match']['Args']

  const { data, error } = await client.rpc('initialize_billiards_match', args)
  if (error) {
    throw error
  }

  return data
}

export type ApplyBilliardsEventRequest = {
  ballNumber?: number
  clientEventId: string
  eventType: BilliardsEventType
  expectedVersion: number
  matchId: string
  participantId?: string
  payload?: Json
  teamId?: string
}

export async function applyBilliardsEvent(
  client: SupabaseClient<Database>,
  request: ApplyBilliardsEventRequest,
): Promise<number> {
  const args = {
    p_ball_number: request.ballNumber,
    p_client_event_id: request.clientEventId,
    p_event_type: request.eventType,
    p_expected_version: request.expectedVersion,
    p_match_id: request.matchId,
    p_participant_id: request.participantId,
    p_payload: request.payload ?? {},
    p_team_id: request.teamId,
  } as unknown as Database['public']['Functions']['apply_billiards_event']['Args']

  const { data, error } = await client.rpc('apply_billiards_event', args)
  if (error) {
    throw error
  }

  return data
}

export type CompleteBilliardsMatchRequest = {
  clientEventId: string
  expectedVersion: number
  matchId: string
  notes?: string
  result: BilliardsResult
  winnerTeamIds?: readonly string[]
}

export async function completeBilliardsMatch(
  client: SupabaseClient<Database>,
  request: CompleteBilliardsMatchRequest,
): Promise<number> {
  const args = {
    p_client_event_id: request.clientEventId,
    p_expected_version: request.expectedVersion,
    p_match_id: request.matchId,
    p_notes: request.notes,
    p_result: request.result,
    p_winner_team_ids: request.winnerTeamIds ?? [],
  } as unknown as Database['public']['Functions']['complete_billiards_match']['Args']

  const { data, error } = await client.rpc('complete_billiards_match', args)
  if (error) {
    throw error
  }

  return data
}
