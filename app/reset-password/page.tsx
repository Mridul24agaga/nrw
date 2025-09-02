"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

function ResetPasswordContent() {
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
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
