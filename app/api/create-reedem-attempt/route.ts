import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
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
  const body = await request.json()
  const { userId } = body

  const redeemId = crypto.randomBytes(16).toString("hex")

  const { error } = await supabase.from("redeem_attempts").insert({ id: redeemId, user_id: userId, used: false })

  if (error) {
    console.error("Error creating redeem attempt:", error)
    return NextResponse.json({ error: "Failed to create redeem attempt" }, { status: 500 })
  }

  return NextResponse.json({ redeemId })
}

