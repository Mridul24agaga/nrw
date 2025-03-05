"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function toggleLike(postId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user has already liked the post
  const { data: existingLike, error: fetchError } = await supabase
    .from("post_likes")
    .select()
    .eq("post_id", postId)
    .eq("user_id", session.user.id)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    return { error: fetchError.message }
  }

  if (existingLike) {
    // Unlike
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", session.user.id)

    if (error) return { error: error.message }
  } else {
    // Like
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: session.user.id })

    if (error) return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function toggleBookmark(postId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user has already bookmarked the post
  const { data: existingBookmark, error: fetchError } = await supabase
    .from("post_bookmarks")
    .select()
    .eq("post_id", postId)
    .eq("user_id", session.user.id)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    return { error: fetchError.message }
  }

  if (existingBookmark) {
    // Remove bookmark
    const { error } = await supabase
      .from("post_bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", session.user.id)

    if (error) return { error: error.message }
  } else {
    // Add bookmark
    const { error } = await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: session.user.id })

    if (error) return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function addComment(postId: string, content: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: session.user.id,
      content,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  return { success: true, commentId: data.id }
}

export async function deleteComment(commentId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase.from("post_comments").delete().eq("id", commentId).eq("user_id", session.user.id)

  if (error) return { error: error.message }

  revalidatePath("/")
  return { success: true }
}

export async function deletePost(postId: string) {
  const supabase = createServerActionClient({ cookies })

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  if (!session) {
    return { error: "Not authenticated" }
  }
  
  // First, verify that the user is the author of the post
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single()
  
  if (fetchError) {
    return { error: fetchError.message }
  }
  
  if (post.user_id !== session.user.id) {
    return { error: "You can only delete your own posts" }
  }
  
  // Delete related records first (comments, likes, bookmarks)
  // This assumes you have foreign key constraints with ON DELETE CASCADE,
  // but it's safer to delete them explicitly
  
  // Delete comments
  await supabase.from("post_comments").delete().eq("post_id", postId)
  
  // Delete likes
  await supabase.from("post_likes").delete().eq("post_id", postId)
  
  // Delete bookmarks
  await supabase.from("post_bookmarks").delete().eq("post_id", postId)
  
  // Finally, delete the post
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
  
  if (deleteError) {
    return { error: deleteError.message }
  }
  
  // Revalidate the feed page to reflect the changes
  revalidatePath("/")
  
  return { success: true }
}