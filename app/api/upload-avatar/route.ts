import { createClient } from "@/utils/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars") // Make sure this bucket exists in your Supabase project
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError)
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

    const publicUrl = publicUrlData.publicUrl

    // Update user's avatar_url in the database
    const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update user profile: ${updateError.message}` }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Avatar updated successfully",
    })
  } catch (error) {
    console.error("Error handling upload:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

