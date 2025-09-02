"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

export async function resetUserPassword(email: string, newPassword: string, token: string) {
  try {
    const cookieStore = cookies()
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

    // First validate the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("email, expires_at, used")
      .eq("token", token)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: "Invalid reset token" }
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: "Reset token has expired" }
    }

    if (tokenData.used) {
      return { success: false, error: "Reset token has already been used" }
    }

    if (tokenData.email !== email) {
      return { success: false, error: "Token email mismatch" }
    }

    // Find the user
    const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

    if (userError || !userData) {
      return { success: false, error: "User not found" }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the password in auth.users table using raw SQL
    const { error: updateError } = await supabase.rpc("update_auth_user_password", {
      user_id: userData.id,
      new_password_hash: hashedPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return { success: false, error: "Failed to update password" }
    }

    // Mark token as used
    await supabase.from("password_reset_tokens").update({ used: true }).eq("token", token)

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
