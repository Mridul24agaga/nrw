"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { generateUsername } from "@/lib/utils"
import { setCookie, getCookie } from "cookies-next"

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

    // Get the session and store it in cookies
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data?.session) {
        setCookie("sb-auth-token", JSON.stringify(data.session))
      }
    }
    getSession()

    // Listen for auth state changes and update cookies
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCookie("sb-auth-token", JSON.stringify(session))
      } else {
        setCookie("sb-auth-token", "", { maxAge: -1 }) // Delete cookie on logout
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  if (!mounted) {
    return null
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
      const generatedUsername = generateUsername(username || email.split("@")[0])

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: generatedUsername,
            display_name: username || email.split("@")[0],
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Store session in cookies
        setCookie("sb-auth-token", JSON.stringify(authData.session))

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            username: generatedUsername,
            display_name: username || email.split("@")[0],
          })
          .select()
          .single()

        if (profileError) {
          console.error("Profile creation failed:", profileError.message)
          throw new Error("Failed to create user profile. Please try again.")
        }

        router.push(
          "/login?message=Account created. Please check your email to confirm your account before logging in.",
        )
      } else {
        throw new Error("Failed to create user account. Please try again.")
      }
    } catch (error) {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center">
          <Image src="/memories.png" alt="Company Logo" width={120} height={120} className="h-12 w-auto" />
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
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
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
                placeholder="Email"
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
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-10 text-black placeholder-gray-400"
                  placeholder="Password"
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
              <Link href="/terms" className="text-green-600 hover:text-green-500">
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
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Create account
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-black hover:underline">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
