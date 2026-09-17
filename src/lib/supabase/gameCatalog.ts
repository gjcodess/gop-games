import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type GameCatalogRow = Database['public']['Tables']['games']['Row']
export type GameVariantCatalogRow = Database['public']['Tables']['game_variants']['Row']

export async function fetchActiveGameCatalog(
  client: SupabaseClient<Database>,
): Promise<{ games: GameCatalogRow[]; variants: GameVariantCatalogRow[] }> {
  const [{ data: games, error: gamesError }, { data: variants, error: variantsError }] = await Promise.all([
    client.from('games').select('*').eq('is_active', true).order('name'),
    client.from('game_variants').select('*').eq('is_active', true).order('name'),
  ])

  if (gamesError) {
    throw gamesError
  }

  if (variantsError) {
    throw variantsError
  }

  return { games: games ?? [], variants: variants ?? [] }
}
