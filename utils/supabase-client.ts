import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null
  
  // If it's already a full URL, return as is
  if (avatarUrl.startsWith('http')) {
    return avatarUrl
  }
  
  // If it's a Supabase storage path, construct the full URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && avatarUrl.startsWith('avatars/')) {
    return `${supabaseUrl}/storage/v1/object/public/${avatarUrl}`
  }
  
  return avatarUrl
}