import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
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

