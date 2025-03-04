import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { unlink } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
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

    // Get the current avatar URL
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: `Failed to fetch user data: ${userError.message}` }, { status: 500 })
    }

    // If there's an existing avatar and it's a local file, delete it
    if (userData.avatar_url && userData.avatar_url.startsWith("/uploads/")) {
      try {
        const filePath = path.join(process.cwd(), "public", userData.avatar_url)
        await unlink(filePath)
        console.log("Deleted file:", filePath)
      } catch (err) {
        console.error("Error deleting file:", err)
        // Continue anyway to update the database
      }
    }

    // Update the user's avatar_url to null
    const { error: updateError } = await supabase.from("users").update({ avatar_url: null }).eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing avatar:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

