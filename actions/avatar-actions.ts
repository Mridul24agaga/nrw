"use server"

import { createClient } from "@/utils/server"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

export async function uploadAvatar(formData: FormData) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()

    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData?.session

    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const file = formData.get("avatar") as File

    if (!file || file.size === 0) {
      return { error: "No file provided" }
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" }
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" }
    }

    // Upload to Vercel Blob
    const blob = await put(`avatars/${session.user.id}-${Date.now()}.${file.type.split("/")[1]}`, file, {
      access: "public",
    })

    // Update user's avatar_url in the database
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: blob.url })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Error updating avatar URL:", updateError)
      return { error: "Failed to update avatar" }
    }

    // Revalidate the profile page
    revalidatePath(`/profile/${session.user.id}`)

    return { url: blob.url }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return { error: "Failed to upload avatar" }
  }
}

