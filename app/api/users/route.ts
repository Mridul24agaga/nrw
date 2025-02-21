import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: users, error } = await supabase.from("users").select("id, email, username").order("username")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users) {
      return NextResponse.json([])
    }

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username || user.email?.split("@")[0] || "Unknown User",
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

