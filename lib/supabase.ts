import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Post = {
  id: string
  content: string
  user_id: string
  created_at: string
  user: {
    username: string
    avatar_url: string
  }
}

export type Comment = {
  id: string
  content: string
  post_id: string
  user_id: string
  created_at: string
  user: {
    username: string
    avatar_url: string
  }
}

export type Like = {
  id: string
  post_id: string
  user_id: string
}

export type Bookmark = {
  id: string
  post_id: string
  user_id: string
}

