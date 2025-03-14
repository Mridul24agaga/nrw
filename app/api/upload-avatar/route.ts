import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { avatarUrl, userId } = await request.json()

    if (!avatarUrl) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 })
    }

    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is updating their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update user's avatar_url in the database
    const { error: updateError } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", userId)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error) {
    console.error("Error handling avatar update:", error)
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

