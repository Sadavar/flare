import { supabase } from './supabase'

export async function isFavorited(userId: string | null | undefined, brandId: number) {
  if (!userId) return false
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('brand_id', brandId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return !!data?.id
}

export async function toggleFavorite(userId: string | null | undefined, brandId: number) {
  if (!userId) throw new Error('Not authenticated')

  // Check existing
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('brand_id', brandId)
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (data?.id) {
    // delete
    const { error: delError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', data.id)

    if (delError) throw delError
    return { favorited: false }
  } else {
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({ user_id: userId, brand_id: brandId })

    if (insertError) throw insertError
    return { favorited: true }
  }
}

export async function getFavoritesForUser(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('brand:brands(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data?.map((r: any) => r.brand) ?? []
}
