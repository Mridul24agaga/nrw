"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if there's a valid session when the component mounts
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        console.error("Session error:", error)
        setError("Invalid or expired reset link. Please request a new one.")
        setIsValidSession(false)
        return
      }

      console.log("Valid session found")
      setIsValidSession(true)
    }

    checkSession()
  }, [supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      // Update the user's password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error("Password update error:", error)
        throw error
      }

      setSuccess("Password successfully reset. Redirecting to login...")

      // Sign out after successful password reset
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      console.error("Password reset error:", err)
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isValidSession === null) {
    // Loading state
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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

        {!isValidSession ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error || "Invalid reset link. Please request a new one."}</p>
            <div className="mt-3">
              <Link href="/forgot-password" className="text-sm font-medium text-red-700 hover:underline">
                Request a new password reset
              </Link>
            </div>
          </div>
        ) : (
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
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                  placeholder="Enter new password"
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
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

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
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
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

