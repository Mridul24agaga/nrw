import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getAvatarUrl(path: string | null): string {
  if (!path) return "/placeholder.svg"
  const { data } = supabase.storage.from("avatars").getPublicUrl(path)
  return data.publicUrl
}

