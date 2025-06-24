"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function addMemory(memorialId: string, content: string, imageUrl?: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "You must be logged in to add a memory" }
  }

  try {
    // Get the current memorial
    const { data: memorial, error: memorialError } = await supabase
      .from("memorialpages212515")
      .select("memory_message")
      .eq("id", memorialId)
      .single()

    if (memorialError) throw memorialError

    // Create the new memory object
    const newMemory = {
      content,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      author: {
        id: session.user.id,
        username: session.user.user_metadata?.username || "Anonymous",
        avatar_url: session.user.user_metadata?.avatar_url || null,
      },
    }

    // Append the new memory to the existing array
    const updatedMemories = [...(memorial.memory_message || []), newMemory]

    // Update the memorial with the new memories array
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memory_message: updatedMemories })
      .eq("id", memorialId)

    if (updateError) throw updateError

    // Revalidate the memorial page
    revalidatePath(`/memorial/${memorialId}`)

    return { success: true, memory: newMemory }
  } catch (error) {
    console.error("Error adding memory:", error)
    return { error: "Failed to add memory" }
  }
}

export async function likeMemory(memoryId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "You must be logged in to like a memory" }
  }

  try {
    // Check if user already liked this memory
    const { data: existingLike } = await supabase
      .from("memory_likes")
      .select()
      .eq("memory_id", memoryId)
      .eq("user_id", session.user.id)
      .single()

    if (existingLike) {
      // Unlike if already liked
      const { error } = await supabase
        .from("memory_likes")
        .delete()
        .eq("memory_id", memoryId)
        .eq("user_id", session.user.id)

      if (error) throw error

      return { success: true, action: "unliked" }
    } else {
      // Like if not already liked
      const { error } = await supabase.from("memory_likes").insert({
        memory_id: memoryId,
        user_id: session.user.id,
      })

      if (error) throw error

      return { success: true, action: "liked" }
    }
  } catch (error) {
    console.error("Error toggling memory like:", error)
    return { error: "Failed to like memory" }
  }
}

export async function addMemoryComment(memoryId: string, content: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "You must be logged in to comment" }
  }

  try {
    const { data, error } = await supabase
      .from("memory_comments")
      .insert({
        memory_id: memoryId,
        user_id: session.user.id,
        content,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, comment: data }
  } catch (error) {
    console.error("Error adding memory comment:", error)
    return { error: "Failed to add comment" }
  }
}

export async function deleteMemory(memoryId: string, memorialId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "You must be logged in to delete a memory" }
  }

  try {
    // Get the memorial to check ownership and memory data
    const { data: memorial, error: memorialError } = await supabase
      .from("memorialpages212515")
      .select("created_by, memory_message")
      .eq("id", memorialId)
      .single()

    if (memorialError) throw memorialError

    // Find the memory in the array
    const memoryMessages = memorial.memory_message || []
    const memoryIndex = parseInt(memoryId, 10) // Convert memoryId to index
    const memory = memoryMessages[memoryIndex]

    if (!memory) {
      return { error: "Memory not found" }
    }

    // Parse the memory to get author information
    let parsedMemory
    try {
      parsedMemory = typeof memory === "string" ? JSON.parse(memory) : memory
    } catch (e) {
      return { error: "Invalid memory format" }
    }

    // Check if the user is either the memorial creator or the memory author
    const isCreator = memorial.created_by === session.user.id
    const isAuthor = parsedMemory.author?.id === session.user.id

    if (!isCreator && !isAuthor) {
      return { error: "You are not authorized to delete this memory" }
    }

    // Remove the memory from the array
    const updatedMemories = memoryMessages.filter((_: unknown, index: number) => index !== memoryIndex)

    // Update the memorial with the new memories array
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memory_message: updatedMemories })
      .eq("id", memorialId)

    if (updateError) throw updateError

    // Revalidate the memorial page
    revalidatePath(`/memorial/${memorialId}`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting memory:", error)
    return { error: "Failed to delete memory" }
  }
}

export async function getMemoryLikes(memoryId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { count, error } = await supabase
      .from("memory_likes")
      .select("*", { count: "exact" })
      .eq("memory_id", memoryId)

    if (error) throw error

    return { count: count || 0 }
  } catch (error) {
    console.error("Error getting memory likes:", error)
    return { count: 0 }
  }
}

export async function getMemoryComments(memoryId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data, error, count } = await supabase
      .from("memory_comments")
      .select(
        `
        id,
        content,
        created_at,
        user:user_id (id, username, avatar_url)
      `,
        { count: "exact" },
      )
      .eq("memory_id", memoryId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return { comments: data || [], count: count || 0 }
  } catch (error) {
    console.error("Error getting memory comments:", error)
    return { comments: [], count: 0 }
  }
}

export async function isMemoryLiked(memoryId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { isLiked: false }
  }

  try {
    const { data, error } = await supabase
      .from("memory_likes")
      .select()
      .eq("memory_id", memoryId)
      .eq("user_id", session.user.id)
      .single()

    return { isLiked: !!data }
  } catch (error) {
    return { isLiked: false }
  }
}