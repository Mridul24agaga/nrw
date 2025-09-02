import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    // Allow uploads even if not authenticated - this enables any logged-in user to post
    // We'll still track the user if they are logged in
    const userId = session?.user?.id || null

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `memory-${timestamp}-${randomString}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // If user is authenticated, log the upload
    if (userId) {
      try {
        await supabase.from("user_uploads").insert({
          user_id: userId,
          file_url: blob.url,
          file_type: file.type,
          file_name: filename,
          file_size: file.size,
        })
      } catch (err) {
        // Log error but don't fail the upload
        console.error("Failed to log upload:", err)
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
      filename: filename,
      userId: userId,
    })
  } catch (error) {
    console.error("Error uploading memory image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
