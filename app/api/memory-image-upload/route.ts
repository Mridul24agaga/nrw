import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // Upload to Vercel Blob Storage
    const blob = await put(`memorialpage/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    })

    // Return the Blob Storage URL
    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    })
  } catch (error) {
    console.error("Error uploading memory image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

// Note: The config export is not needed with App Router
// The bodyParser config was used in the Pages Router

