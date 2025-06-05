"use server"

import { createClient } from "@/utils/server"
import { revalidatePath } from "next/cache"
import type { FollowResponse } from "@/lib/types"

export async function toggleFollow(userIdToToggle: string): Promise<FollowResponse> {
  const supabase = await createClient()

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData?.session?.user) {
      throw new Error("You must be logged in to follow users")
    }

    const currentUserId = sessionData.session.user.id

    let result
    if (currentUserId === userIdToToggle) {
      throw new Error("You cannot follow yourself")
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from("users")
      .select("followers")
      .eq("id", userIdToToggle)
      .single()

    if (followCheckError) throw new Error("Error checking follow status")

    const isFollowing = existingFollow.followers.includes(currentUserId)

    if (isFollowing) {
      // Unfollow
      result = await supabase.rpc("remove_follower", {
        current_user_id: currentUserId,
        target_user_id: userIdToToggle,
      })
    } else {
      // Follow
      result = await supabase.rpc("add_follower", {
        current_user_id: currentUserId,
        target_user_id: userIdToToggle,
      })
    }

    if (result.error)
      throw new Error(`Error ${isFollowing ? "unfollowing" : "following"} user: ${result.error.message}`)

    // Fetch updated follower count
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .select("followers_count")
      .eq("id", userIdToToggle)
      .single()

    if (userError) throw new Error("Error fetching updated user data")

    revalidatePath("/profile/[username]")
    return {
      success: true,
      isFollowing: !isFollowing,
      followersCount: updatedUser.followers_count,
    }
  } catch (error) {
    console.error("Error in toggleFollow:", error)
    throw error
  }
}
