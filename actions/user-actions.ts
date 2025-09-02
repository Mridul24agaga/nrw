"use server"

import { createMutableClient } from "@/utils/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { cache } from "react"

// Cache the Supabase client creation
const getSupabase = cache(async () => {
  return await createMutableClient()
})

export async function toggleFollow(
  userToFollowId: string,
): Promise<{ success: boolean; following: boolean; error?: string }> {
  const supabase = await getSupabase()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error("Not authenticated")

    console.log("Current user:", user.id, "Following:", userToFollowId) // Debug log

    // Begin transaction-like operation
    // 1. First, check current status
    const { data: existingFollow, error: checkError } = await supabase
      .from("user_relationships")
      .select("id")
      .eq("user_id", user.id)
      .eq("related_user_id", userToFollowId)
      .eq("relationship_type", "follow")
      .maybeSingle()

    if (checkError) {
      console.error("Check error:", checkError) // Debug log
      throw checkError
    }

    console.log("Existing follow:", existingFollow) // Debug log

    if (existingFollow) {
      // Unfollow - use specific ID and user combination
      const { error: deleteError } = await supabase.from("user_relationships").delete().match({
        id: existingFollow.id,
        user_id: user.id,
        related_user_id: userToFollowId,
        relationship_type: "follow",
      })

      if (deleteError) {
        console.error("Delete error:", deleteError) // Debug log
        throw deleteError
      }

      console.log("Successfully unfollowed") // Debug log
    } else {
      // Follow - insert with specific user combination
      const { error: insertError } = await supabase
        .from("user_relationships")
        .insert({
          user_id: user.id,
          related_user_id: userToFollowId,
          relationship_type: "follow",
        })
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError) // Debug log
        throw insertError
      }

      console.log("Successfully followed") // Debug log
    }

    // Revalidate only the specific paths that need updating
    revalidatePath("/")
    revalidatePath("/[username]")

    return {
      success: true,
      following: !existingFollow,
    }
  } catch (error) {
    console.error("Toggle follow error:", error) // Debug log
    return {
      success: false,
      following: false,
      error: "Failed to toggle follow",
    }
  }
}

export async function getFollowingStatus(userId: string) {
  const supabase = await getSupabase()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { isFollowing: false }

    const { data, error } = await supabase
      .from("user_relationships")
      .select("id")
      .eq("user_id", user.id)
      .eq("related_user_id", userId)
      .eq("relationship_type", "follow")
      .maybeSingle()

    if (error) throw error

    return { isFollowing: !!data }
  } catch (error) {
    console.error("Get following status error:", error)
    return { isFollowing: false }
  }
}

export async function getFollowingCount(userId: string) {
  const supabase = await getSupabase()

  try {
    const { count, error } = await supabase
      .from("user_relationships")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("relationship_type", "follow")

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Get following count error:", error)
    return 0
  }
}

export async function getFollowerCount(userId: string) {
  const supabase = await getSupabase()

  try {
    const { count, error } = await supabase
      .from("user_relationships")
      .select("*", { count: "exact" })
      .eq("related_user_id", userId)
      .eq("relationship_type", "follow")

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Get follower count error:", error)
    return 0
  }
}

