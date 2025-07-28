"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const generateUsername = (input: string) => {
    // Simple username generation - just clean the input
    return (
      input
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .substring(0, 20) || "user" + Date.now()
    )
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }
    setError(null)
    setLoading(true)

    try {
      // Validate inputs
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters long")
      }

      console.log("Starting signup process...")

      const cleanUsername = generateUsername(username)
      console.log("Generated username:", cleanUsername)

      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", cleanUsername)
        .single()

      if (existingProfile) {
        throw new Error("Username is already taken. Please choose a different one.")
      }

      console.log("Username is available, creating auth user...")

      // Create the auth user with minimal metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      })

      console.log("Auth signup result:", { user: authData.user?.id, error: authError })

      if (authError) {
        console.error("Auth error:", authError)

        // Handle specific auth errors
        if (authError.message.includes("User already registered")) {
          throw new Error("An account with this email already exists. Please try logging in instead.")
        } else if (authError.message.includes("Invalid email")) {
          throw new Error("Please enter a valid email address.")
        } else if (authError.message.includes("Password")) {
          throw new Error("Password must be at least 6 characters long.")
        } else {
          throw new Error(`Signup failed: ${authError.message}`)
        }
      }

      if (!authData.user) {
        throw new Error("Failed to create user account. Please try again.")
      }

      console.log("Auth user created successfully:", authData.user.id)

      // Wait a moment for the auth user to be fully created
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        console.log("Creating profile record...")

        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: cleanUsername,
          display_name: username || email.split("@")[0],
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't throw here, continue with user creation
        }

        console.log("Creating user record...")

        // Create user record
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          username: cleanUsername,
          display_name: username || email.split("@")[0],
        })

        if (userError) {
          console.error("User creation error:", userError)
          // Don't throw here either
        }

        console.log("User creation completed successfully")
      } catch (dbError) {
        console.error("Database error (continuing anyway):", dbError)
        // Don't fail the signup if database records fail
      }

      // Success - redirect to login with hard refresh
      window.location.href = "/login?message=Account created successfully! Please check your email to confirm your account before logging in."
    } catch (error) {
      console.error("Signup error:", error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-center">
        <Image src="/memories.png" alt="Company Logo" width={120} height={120} className="h-12 w-auto" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-black">Create Account</h2>
        <p className="text-gray-600 mt-2">Join us to create and share memorial pages</p>
      </div>

      <form className="space-y-6" onSubmit={handleSignUp}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-black">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={20}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
              placeholder="Choose a username (3-20 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            />
            <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and underscores allowed</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-black">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                placeholder="Create a password (min 6 characters)"
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
            {password && (
              <div className="text-xs mt-1">
                <p className={password.length >= 6 ? "text-green-600" : "text-red-600"}>
                  {password.length >= 6 ? "✓" : "✗"} At least 6 characters
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-black">
            I agree to the{" "}
            <Link href="/legal" className="text-green-600 hover:text-green-500">
              terms and conditions
            </Link>
          </label>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !agreedToTerms || password.length < 6 || username.length < 3}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-black hover:underline">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  )
} 