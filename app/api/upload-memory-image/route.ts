import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  // Authentication check
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
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

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `memory-${uuidv4()}.${fileExt}`

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "memories")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save file to filesystem
    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, buffer)

    // Return public URL
    const publicUrl = `/uploads/memories/${fileName}`

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
    })
  } catch (error) {
    console.error("Error handling memory image upload:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

// Increase body size limit for this API route only
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
}

