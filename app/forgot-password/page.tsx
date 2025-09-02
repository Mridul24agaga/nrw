"use client"

import type React from "react"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const generateResetToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      console.log("Starting password reset for email:", email)

      // First, check if user exists and get their UUID
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

      if (userError || !userData) {
        console.log("User not found or error:", userError)
        // Don't reveal if email exists or not for security
        setSuccess("If your email is registered, you will receive a password reset link shortly.")
        setLoading(false)
        return
      }

      console.log("Found user with ID:", userData.id)

      // Generate a unique reset token
      const resetToken = generateResetToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      console.log("Generated token:", resetToken)
      console.log("Expires at:", expiresAt)

      // First, clean up any existing tokens for this user
      const { error: cleanupError } = await supabase.from("password_reset_tokens").delete().eq("user_id", userData.id)

      if (cleanupError) {
        console.log("Cleanup error (this is okay):", cleanupError)
      }

      // Store the reset token in our custom table with user_id
      const { data: tokenData, error: tokenError } = await supabase
        .from("password_reset_tokens")
        .insert({
          user_id: userData.id,
          email: email,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          used: false,
        })
        .select()

      console.log("Token insert result:", { tokenData, tokenError })

      if (tokenError) {
        console.error("Error creating reset token:", tokenError)
        throw new Error(`Failed to create reset token: ${tokenError.message || "Unknown error"}`)
      }

      // Create the reset URL
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`
      console.log("Reset URL:", resetUrl)

      // For now, we'll just log the reset URL since email sending might not be configured
      console.log("Password reset link:", resetUrl)

      // Try to send email using Supabase's built-in functionality
      try {
        const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetUrl,
        })

        if (emailError) {
          console.log("Email sending error (this is okay):", emailError)
        }
      } catch (emailErr) {
        console.log("Email error (continuing anyway):", emailErr)
      }

      setSuccess(
        `Password reset link generated! For testing, check the console or use this link: ${resetUrl.substring(0, 50)}...`,
      )
    } catch (err) {
      console.error("Forgot password error:", err)
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center">
          <Image src="/memories.png" alt="Company Logo" width={120} height={120} className="h-12 w-auto" />
        </div>

        <h2 className="text-center text-2xl font-bold text-black">Forgot Password</h2>
        <p className="text-center text-gray-600">Enter your email address and we&apos;ll generate a password reset link.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-700 whitespace-pre-wrap">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
          >
            {loading ? "Generating..." : "Generate Reset Link"}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-black hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
