import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { unlink } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const { memorialId } = await request.json()

    if (!memorialId) {
      return NextResponse.json({ error: "Missing memorialId" }, { status: 400 })
    }

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
      .select("created_by, memorial_avatar_url")
      .eq("id", memorialId)
      .single()

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (memorial.created_by !== session.user.id) {
      return NextResponse.json({ error: "Only the memorial creator can update the avatar" }, { status: 403 })
    }

    // If there's an existing avatar, try to delete the file
    if (memorial.memorial_avatar_url) {
      try {
        // Extract the filename from the URL
        const fileName = memorial.memorial_avatar_url.split("/").pop()
        if (fileName) {
          const filePath = path.join(process.cwd(), "public/uploads/memorials", fileName)
          await unlink(filePath)
          console.log("Deleted memorial avatar file:", filePath)
        }
      } catch (fileError) {
        console.error("Error deleting memorial avatar file:", fileError)
        // Continue even if file deletion fails
      }
    }

    // Update memorial to remove the avatar_url
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memorial_avatar_url: null })
      .eq("id", memorialId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update memorial: ${updateError.message}` }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Memorial avatar removed successfully",
    })
  } catch (error) {
    console.error("Error handling memorial avatar removal:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

