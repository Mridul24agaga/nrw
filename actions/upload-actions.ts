"use server"

import { createMutableClient } from "@/utils/server"
import { cookies } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function uploadPostImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    const cookieStore = cookies()
    const supabase = await createMutableClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { error: "Unauthorized" }
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `post-${session.user.id}-${Date.now()}.${fileExt}`

    // Ensure the posts uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public/uploads/posts")
    await mkdir(uploadsDir, { recursive: true })

    // Save the file to the public/uploads/posts directory
    const filePath = path.join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // The public URL will be /uploads/posts/filename.ext
    const publicUrl = `/uploads/posts/${fileName}`

    console.log("Saved post image locally:", filePath)
    console.log("Public URL:", publicUrl)

    // Return success response
    return {
      success: true,
      url: publicUrl,
    }
  } catch (error) {
    console.error("Error handling post image upload:", error)
    return { error: "An unexpected error occurred" }
  }
}

