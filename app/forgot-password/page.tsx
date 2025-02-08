"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/"
            alt="Memories Lived"
            width={200}
            height={80}
            className="mx-auto"
          />
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-green-600">
            <p className="mb-4">Password reset link sent!</p>
            <p className="text-sm">Check your email for instructions to reset your password.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-center text-2xl font-bold">Reset Password</h1>
            <p className="text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">{error}</div>}

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-lg bg-blue-50 p-3 outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-500 p-3 text-white hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-blue-500 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

