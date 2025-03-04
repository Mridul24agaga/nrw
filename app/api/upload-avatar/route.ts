import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public/uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Save the file to the public/uploads directory
    const filePath = path.join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // The public URL will be /uploads/filename.ext
    const publicUrl = `/uploads/${fileName}`

    console.log("Saved file locally:", filePath)
    console.log("Public URL:", publicUrl)

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

