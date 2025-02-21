"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getUsers() {
  const { data: users, error } = await supabase.from("users").select("id, username, email, avatar_url")

  if (error) {
    console.error("Error fetching users:", error)
    return { users: [], error: error.message }
  }

  return { users }
}

export async function getChannels(userId: string) {
  const { data: channels, error } = await supabase
    .from("channels")
    .select(`
      id,
      name,
      avatar_url,
      updated_at,
      channel_members!inner(user_id)
    `)
    .eq("channel_members.user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching channels:", error)
    return { channels: [], error: error.message }
  }

  return { channels }
}

export async function createChannel(userId1: string, userId2: string) {
  const { data, error } = await supabase
    .from("channels")
    .insert({ name: `${userId1}-${userId2}` })
    .select()
    .single()

  if (error) {
    console.error("Error creating channel:", error)
    return { channelId: null, error: error.message }
  }

  const channelId = data.id

  // Add both users to the channel
  const { error: memberError } = await supabase.from("channel_members").insert([
    { channel_id: channelId, user_id: userId1 },
    { channel_id: channelId, user_id: userId2 },
  ])

  if (memberError) {
    console.error("Error adding members to channel:", memberError)
    return { channelId: null, error: memberError.message }
  }

  return { channelId }
}

