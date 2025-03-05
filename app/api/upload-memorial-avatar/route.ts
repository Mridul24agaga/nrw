import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const memorialId = formData.get("memorialId") as string

    if (!file || !memorialId) {
      return NextResponse.json({ error: "Missing file or memorialId" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is the creator of the memorial
    const { data: memorial, error: memorialError } = await supabase
      .from("memorialpages212515")
      .select("created_by")
      .eq("id", memorialId)
      .single()

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (memorial.created_by !== session.user.id) {
      return NextResponse.json({ error: "Only the memorial creator can update the avatar" }, { status: 403 })
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `memorial-${memorialId}-${Date.now()}.${fileExt}`

    // Ensure the memorial uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public/uploads/memorials")
    await mkdir(uploadsDir, { recursive: true })

    // Save the file to the public/uploads/memorials directory
    const filePath = path.join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // The public URL will be /uploads/memorials/filename.ext
    const publicUrl = `/uploads/memorials/${fileName}`

    console.log("Saved memorial avatar locally:", filePath)
    console.log("Public URL:", publicUrl)

    // Update memorial's avatar_url in the database
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memorial_avatar_url: publicUrl })
      .eq("id", memorialId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update memorial: ${updateError.message}` }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Memorial avatar updated successfully",
    })
  } catch (error) {
    console.error("Error handling memorial avatar upload:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

