import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { PickerProfile } from './profile'

type GroupRow = Database['public']['Tables']['groups']['Row']

export type ActiveGroup = Pick<GroupRow, 'id' | 'name'>

export async function fetchActiveGroups(
  client: SupabaseClient<Database>,
): Promise<ActiveGroup[]> {
  const { data, error } = await client
    .from('groups')
    .select('id, name')
    .order('name')

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchActiveGroupProfiles(
  client: SupabaseClient<Database>,
  groupId: string,
): Promise<PickerProfile[]> {
  const { data: memberships, error: membershipsError } = await client
    .from('group_memberships')
    .select('profile_id')
    .eq('group_id', groupId)
    .eq('status', 'active')

  if (membershipsError) {
    throw membershipsError
  }

  const profileIds = (memberships ?? []).map((membership) => membership.profile_id)
  if (profileIds.length === 0) {
    return []
  }

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, display_name, avatar_path')
    .in('id', profileIds)
    .order('display_name')

  if (profilesError) {
    throw profilesError
  }

  return (profiles ?? []).map((profile) => ({ ...profile, avatarUrl: null }))
}
