"use server"

import { put } from "@vercel/blob"
import { createMutableClient } from "@/utils/server"
import { revalidatePath } from "next/cache"

export async function uploadAvatar(formData: FormData) {
  try {
    const supabase = await createMutableClient()

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      return { error: "You must be logged in to upload an avatar" }
    }

    const userId = session.user.id
    const file = formData.get("avatar") as File

    if (!file || file.size === 0) {
      return { error: "No file selected" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" }
    }

    // Limit file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" }
    }

    // Generate a unique filename with user ID
    const filename = `avatars/${userId}/${Date.now()}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    // Update user record in Supabase
    const { error: updateError } = await supabase.from("users").update({ avatar_url: blob.url }).eq("id", userId)

    if (updateError) {
      console.error("Error updating user avatar:", updateError)
      return { error: "Failed to update profile" }
    }

    // Get the username to revalidate the path
    const { data: userData } = await supabase.from("users").select("username").eq("id", userId).single()

    if (userData?.username) {
      // Revalidate the user's profile page to show the new avatar
      revalidatePath(`/${userData.username}`)
    }

    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Avatar upload error:", error)
    return { error: "Failed to upload avatar" }
  }
}

