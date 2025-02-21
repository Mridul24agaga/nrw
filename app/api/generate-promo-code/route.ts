import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { userId, redeemId } = body

  // Verify that the redeemId is valid and hasn't been used
  const { data: redeemData, error: redeemError } = await supabase
    .from("redeem_attempts")
    .select("used")
    .eq("id", redeemId)
    .single()

  if (redeemError || !redeemData || redeemData.used) {
    return NextResponse.json({ error: "Invalid or used redeem ID" }, { status: 400 })
  }

  // Generate a unique promo code
  const promoCode = crypto.randomBytes(4).toString("hex").toUpperCase()

  // Store the promo code in the database and mark the redeem attempt as used
  const { error } = await supabase.from("users").update({ promo_code: promoCode }).eq("id", userId)
  if (error) {
    console.error("Error storing promo code:", error)
    return NextResponse.json({ error: "Failed to generate promo code" }, { status: 500 })
  }

  const { error: updateError } = await supabase.from("redeem_attempts").update({ used: true }).eq("id", redeemId)

  if (updateError) {
    console.error("Error updating redeem attempt:", updateError)
    // We don't return an error here because the promo code was successfully generated
  }

  return NextResponse.json({ promoCode })
}

