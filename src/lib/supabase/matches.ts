import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type CreateMatchRequest = {
  gameId: string
  groupId: string
  notes?: string
  participantProfileIds: string[]
  variantId?: string
}

export async function createMatch(
  client: SupabaseClient<Database>,
  request: CreateMatchRequest,
): Promise<string> {
  // Generated Supabase types express nullable SQL function arguments as required
  // scalar properties. Passing null is the intentional database contract here.
  const args = {
    p_game_id: request.gameId,
    p_group_id: request.groupId,
    p_notes: request.notes ?? null,
    p_participant_profile_ids: request.participantProfileIds,
    p_variant_id: request.variantId ?? null,
  } as unknown as Database['public']['Functions']['create_match']['Args']

  const { data, error } = await client.rpc('create_match', args)
  if (error) {
    throw error
  }

  return data
}

export type StartMatchRequest = {
  clientEventId: string
  expectedVersion: number
  matchId: string
}

export async function startMatch(
  client: SupabaseClient<Database>,
  request: StartMatchRequest,
): Promise<number> {
  const { data, error } = await client.rpc('start_match', {
    p_client_event_id: request.clientEventId,
    p_expected_version: request.expectedVersion,
    p_match_id: request.matchId,
  })

  if (error) {
    throw error
  }

  return data
}

export type BinaryResultInput = {
  outcome: 'draw' | 'loss' | 'no_contest' | 'win'
  placement?: number
  teamId: string
}

export type RecordBinaryResultRequest = {
  clientEventId: string
  expectedVersion: number
  matchId: string
  results: readonly BinaryResultInput[]
}

export async function recordBinaryResult(
  client: SupabaseClient<Database>,
  request: RecordBinaryResultRequest,
): Promise<number> {
  const args = {
    p_client_event_id: request.clientEventId,
    p_expected_version: request.expectedVersion,
    p_match_id: request.matchId,
    p_results: request.results.map((result) => ({
      outcome: result.outcome,
      ...(result.placement === undefined ? {} : { placement: result.placement }),
      team_id: result.teamId,
    })),
  } as unknown as Database['public']['Functions']['record_binary_result']['Args']

  const { data, error } = await client.rpc('record_binary_result', args)
  if (error) {
    throw error
  }

  return data
}
