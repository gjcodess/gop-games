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
