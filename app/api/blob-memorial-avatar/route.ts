import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const memorialId = formData.get("memorialId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!memorialId) {
      return NextResponse.json({ error: "Memorial ID required" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Check if user owns this memorial
    const { data: memorial, error: memorialError } = await supabase
      .from("memorialpages212515")
      .select("created_by")
      .eq("id", memorialId)
      .single()

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (memorial.created_by !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this memorial" }, { status: 403 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const filename = `memorial-avatar-${memorialId}-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Update memorial's avatar URL in Supabase
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memorial_avatar_url: blob.url })
      .eq("id", memorialId)

    if (updateError) {
      console.error("Error updating memorial avatar:", updateError)
      return NextResponse.json({ error: "Failed to update memorial avatar" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error("Error uploading memorial avatar:", error)
    return NextResponse.json({ error: "Failed to upload memorial avatar" }, { status: 500 })
  }
}
