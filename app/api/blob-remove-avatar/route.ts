import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Update user's avatar URL to null in Supabase
    const { error: updateError } = await supabase.from("users").update({ avatar_url: null }).eq("id", userId)

    if (updateError) {
      console.error("Error removing user avatar:", updateError)
      return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully",
    })
  } catch (error) {
    console.error("Error removing avatar:", error)
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 })
  }
}
