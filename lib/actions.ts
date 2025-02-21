"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getUsers() {
  try {
    const { data: users, error } = await supabase.from("users").select("id, username, email")

    if (error) {
      console.error("Supabase error fetching users:", error)
      return { users: [], error: error.message }
    }

    if (!users || users.length === 0) {
      console.log("No users found in the database")
    } else {
      console.log(`Found ${users.length} users`)
    }

    return { users, error: null }
  } catch (error) {
    console.error("Unexpected error in getUsers:", error)
    return { users: [], error: "An unexpected error occurred" }
  }
}

export async function getChannels(userId: string) {
  const { data: channels, error } = await supabase
    .from("channels")
    .select("*, user1:users!user1_id(username), user2:users!user2_id(username)")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  if (error) {
    console.error("Error fetching channels:", error)
    return { channels: [] }
  }

  return {
    channels: channels.map((channel) => ({
      ...channel,
      name: channel.user1.id === userId ? channel.user2.username : channel.user1.username,
    })),
  }
}

export async function createChannel(user1Id: string, user2Id: string) {
  const { data: existingChannel, error: fetchError } = await supabase
    .from("channels")
    .select("id")
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking existing channel:", fetchError)
    return { channelId: null }
  }

  if (existingChannel) {
    return { channelId: existingChannel.id }
  }

  const { data: newChannel, error: insertError } = await supabase
    .from("channels")
    .insert({ user1_id: user1Id, user2_id: user2Id })
    .select("id")
    .single()

  if (insertError) {
    console.error("Error creating channel:", insertError)
    return { channelId: null }
  }

  return { channelId: newChannel.id }
}

export async function getMessages(channelId: string) {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*, user:users(username)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return { messages: [] }
  }

  return { messages }
}

export async function sendMessage(channelId: string, userId: string, content: string) {
  const { error } = await supabase.from("messages").insert({ channel_id: channelId, user_id: userId, content })

  if (error) {
    console.error("Error sending message:", error)
    return { error }
  }

  return { error: null }
}

