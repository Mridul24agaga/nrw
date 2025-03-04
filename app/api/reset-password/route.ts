import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, password, token } = await request.json()

    if (!userId || !password || !token) {
      return NextResponse.json({ error: { message: "Missing required fields" } }, { status: 400 })
    }

    // Initialize Supabase client with admin privileges
    const supabase = createRouteHandlerClient({ cookies })

    // Verify the token is valid
    const { data: resetData, error: resetError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .eq("user_id", userId)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (resetError || !resetData) {
      console.error("Invalid token:", resetError)
      return NextResponse.json({ error: { message: "Invalid or expired token" } }, { status: 400 })
    }

    // Update the user's password using the admin API
    // Note: In a real implementation, you would use Supabase's admin functions
    // which require service_role key and proper authentication
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: { message: "Failed to update password" } }, { status: 500 })
    }

    // Mark the token as used
    await supabase.from("password_resets").update({ used: true, used_at: new Date().toISOString() }).eq("token", token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: { message: "An unexpected error occurred" } }, { status: 500 })
  }
}

