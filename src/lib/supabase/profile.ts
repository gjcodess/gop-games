import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export type PickerProfile = Pick<Profile, 'avatar_path' | 'display_name' | 'id'> & {
  avatarUrl: string | null
}

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

export async function fetchPickerProfiles(
  client: SupabaseClient<Database>,
): Promise<PickerProfile[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id, display_name, avatar_path')
    .order('display_name', { ascending: true })

  if (error) {
    throw error
  }

  return Promise.all(data.map(async (profile) => {
    if (!profile.avatar_path) {
      return { ...profile, avatarUrl: null }
    }

    const { data: signedUrl } = await client.storage.from('avatars').createSignedUrl(profile.avatar_path, 60 * 60)
    return { ...profile, avatarUrl: signedUrl?.signedUrl ?? null }
  }))
}
