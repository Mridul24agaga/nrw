"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export async function uploadMemoryImage(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "You must be logged in to upload an image" }
  }

  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size exceeds 5MB limit" }
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files are allowed" }
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `memory_images/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("memorial_images").upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("memorial_images").getPublicUrl(filePath)

    return {
      success: true,
      imageUrl: publicUrlData.publicUrl,
    }
  } catch (error) {
    console.error("Error uploading memory image:", error)
    return { error: "Failed to upload image" }
  }
}

