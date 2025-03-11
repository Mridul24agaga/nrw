// app/api/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`memories/${userId}/${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN, // Optional, depending on your setup
    })

    // Initialize Supabase client (use service role key for server-side operations)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the user's avatar_url in Supabase
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: blob.url })
      .eq("id", userId)

    if (error) {
      throw new Error(`Supabase update failed: ${error.message}`)
    }

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error) {
    console.error("Error in /api/upload-avatar:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload avatar" },
      { status: 500 }
    )
  }
}