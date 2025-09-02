import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { redirect } from "next/navigation"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get the current user from the session
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

    const userId = session.user.id

    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`

    // Upload file to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
    })

    console.log("Uploaded avatar to Vercel Blob:", blob.url)

    // Update user's avatar_url in the database
    const { error: updateError } = await supabase.from("users").update({ avatar_url: blob.url }).eq("id", userId)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 })
    }

    // Get the username to redirect back to the profile page
    const { data: userData } = await supabase.from("users").select("username").eq("id", userId).single()

    // Check if userData exists before accessing username
    if (!userData || !userData.username) {
      console.warn("User data not found or username is missing, redirecting to homepage")
      return redirect("/")
    }

    // Redirect back to the profile page
    return redirect(`/profile/${userData.username}`)
  } catch (error) {
    console.error("Error handling avatar upload:", error)
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

