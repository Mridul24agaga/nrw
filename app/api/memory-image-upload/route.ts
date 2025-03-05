import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

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

    return NextResponse.json({
      success: true,
      imageUrl: publicPath,
    })
  } catch (error) {
    console.error("Error uploading memory image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
}

