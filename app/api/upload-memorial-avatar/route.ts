import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const memorialId = formData.get("memorialId") as string

    if (!file || !memorialId) {
      return NextResponse.json({ error: "Missing file or memorialId" }, { status: 400 })
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
      .select("created_by")
      .eq("id", memorialId)
      .single()

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (memorial.created_by !== session.user.id) {
      return NextResponse.json({ error: "Only the memorial creator can update the avatar" }, { status: 403 })
    }

    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `memorial-${memorialId}-${Date.now()}.${fileExt}`

    // Upload file to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type,
    })

    console.log("Uploaded memorial avatar to Vercel Blob:", blob.url)

    // Update memorial's avatar_url in the database with the Blob URL
    const { error: updateError } = await supabase
      .from("memorialpages212515")
      .update({ memorial_avatar_url: blob.url })
      .eq("id", memorialId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update memorial: ${updateError.message}` }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "Memorial avatar updated successfully",
    })
  } catch (error) {
    console.error("Error handling memorial avatar upload:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

