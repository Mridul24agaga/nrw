"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get("token")

      console.log("Validating token:", token)

      if (!token) {
        setError("Invalid reset link. No token provided.")
        setIsValidToken(false)
        return
      }

      try {
        // Check if token exists and is valid
        const { data: tokenData, error: tokenError } = await supabase
          .from("password_reset_tokens")
          .select("user_id, email, expires_at, used")
          .eq("token", token)
          .single()

        console.log("Token validation result:", { tokenData, tokenError })

        if (tokenError || !tokenData) {
          setError("Invalid or expired reset link.")
          setIsValidToken(false)
          return
        }

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setError("Reset link has expired. Please request a new one.")
          setIsValidToken(false)
          return
        }

        // Check if token has been used
        if (tokenData.used) {
          setError("Reset link has already been used. Please request a new one.")
          setIsValidToken(false)
          return
        }

        // Verify that the user still exists
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("id", tokenData.user_id)
          .eq("email", tokenData.email)
          .single()

        if (userError || !userData) {
          console.error("User verification error:", userError)
          setError("User not found or email mismatch. Please request a new reset link.")
          setIsValidToken(false)
          return
        }

        // Token is valid and user exists
        setUserEmail(tokenData.email)
        setUserId(tokenData.user_id)
        setIsValidToken(true)
        console.log("Token is valid for user:", tokenData.user_id, "with email:", tokenData.email)
      } catch (err) {
        console.error("Token validation error:", err)
        setError("An error occurred while validating the reset link.")
        setIsValidToken(false)
      }
    }

    validateToken()
  }, [searchParams, supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!userEmail || !userId) {
      setError("Invalid session. Please try the reset link again.")
      setLoading(false)
      return
    }

    try {
      const token = searchParams.get("token")

      if (!token) {
        throw new Error("No token provided")
      }

      console.log("Attempting to reset password for user:", userId, "with email:", userEmail)

      // Update the password using the RPC function
      const { data: updateResult, error: updateError } = await supabase.rpc("update_user_password", {
        user_id: userId,
        new_password: password,
      })

      console.log("Password update result:", { updateResult, updateError })

      if (updateError) {
        console.error("Password update error:", updateError)
        throw new Error("Failed to update password")
      }

      // Check if the function returned false (user not found)
      if (updateResult === false) {
        throw new Error("User not found or password update failed")
      }

      // Mark token as used
      const { error: tokenUpdateError } = await supabase
        .from("password_reset_tokens")
        .update({ used: true })
        .eq("token", token)
        .eq("user_id", userId) // Extra security check

      if (tokenUpdateError) {
        console.log("Token update error:", tokenUpdateError)
      }

      setSuccess("Password successfully reset! Redirecting to login...")

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login?message=Password reset successful. Please log in with your new password.")
      }, 2000)
    } catch (err) {
      console.error("Password reset error:", err)
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-black">Validating reset link...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we verify your request</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center">
          <Image src="/memories.png" alt="Company Logo" width={120} height={120} className="h-12 w-auto" />
        </div>

        <h2 className="text-center text-2xl font-bold text-black">Set New Password</h2>

        {!isValidToken ? (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error || "This reset link is invalid or has expired."}</p>
            </div>
            <div className="text-center space-y-3">
              <Link
                href="/forgot-password"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Request New Reset Link
              </Link>
              <div>
                <Link href="/login" className="text-sm text-gray-600 hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-700">✓ Reset link verified for {userEmail}!</p>
              <p className="text-xs text-green-600 mt-1">User ID: {userId?.substring(0, 8)}...</p>
            </div>

            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-black">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                    placeholder="Enter new password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-black" /> : <Eye className="h-5 w-5 text-black" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-black">
                  Confirm New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Password requirements */}
              {password && (
                <div className="text-xs space-y-1">
                  <p className={password.length >= 6 ? "text-green-600" : "text-red-600"}>
                    {password.length >= 6 ? "✓" : "✗"} At least 6 characters
                  </p>
                  <p className={password === confirmPassword && password ? "text-green-600" : "text-red-600"}>
                    {password === confirmPassword && password ? "✓" : "✗"} Passwords match
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 6}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        <div className="text-center text-sm">
          <Link href="/login" className="text-black hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
