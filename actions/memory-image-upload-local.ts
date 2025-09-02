"use server"

import { createMutableClient } from "@/utils/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

export async function uploadMemoryImageLocal(formData: FormData) {
  const supabase = await createMutableClient()

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

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { error: "File size exceeds 2MB limit" }
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files are allowed" }
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "memorialpage")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = path.join(uploadDir, fileName)

    // Convert file to buffer and save to filesystem
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write file to disk
    fs.writeFileSync(filePath, buffer)

    // Return the public URL path
    const publicPath = `/memorialpage/${fileName}`

    return {
      success: true,
      imageUrl: publicPath,
    }
  } catch (error) {
    console.error("Error uploading memory image:", error)
    return { error: "Failed to upload image" }
  }
}

