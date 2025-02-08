"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function toggleLike(postId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if post is already liked
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)

    if (error) return { error: error.message }
  } else {
    // Like
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id })

    if (error) return { error: error.message }
  }

  revalidatePath("/posts/[id]")
  revalidatePath("/")
  return { success: true }
}

export async function toggleBookmark(postId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if post is already bookmarked
  const { data: existingBookmark } = await supabase
    .from("post_bookmarks")
    .select()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existingBookmark) {
    // Remove bookmark
    const { error } = await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)

    if (error) return { error: error.message }
  } else {
    // Add bookmark
    const { error } = await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id })

    if (error) return { error: error.message }
  }

  revalidatePath("/posts/[id]")
  revalidatePath("/bookmarks")
  return { success: true }
}

