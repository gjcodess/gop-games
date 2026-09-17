import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.').max(80, 'Display name must be 80 characters or fewer.'),
})

export async function fetchProfile(
  client: SupabaseClient<Database>,
  authUserId: string,
): Promise<Profile | null> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function updateProfile(
  client: SupabaseClient<Database>,
  profileId: string,
  input: { displayName: string },
): Promise<Profile> {
  const values = profileUpdateSchema.parse(input)
  const { data, error } = await client
    .from('profiles')
    .update({ display_name: values.displayName })
    .eq('id', profileId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}
