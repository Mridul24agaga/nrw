"use server"

import { createMutableClient } from "@/utils/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export async function updateProfile(formData: FormData) {
  const supabase = await createMutableClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: "Not authenticated" }
  }

  try {
    const file = formData.get("avatar") as File
    let avatar_url = null

    if (file && file.size > 0) {
      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        return { error: "Invalid file type. Please upload a JPEG, PNG, or GIF image." }
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { error: "File size too large. Maximum size is 5MB." }
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}/${uuidv4()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return { error: `Error uploading file: ${uploadError.message}` }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      avatar_url = publicUrl
    }

    // Update profile
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        avatar_url: avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return { error: `Error updating profile: ${updateError.message}` }
    }

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

