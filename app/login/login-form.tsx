"use client"

import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabase-client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Listen for auth state changes only
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.email)
      if (event === 'SIGNED_IN' && session) {
        setLoading(false)
        router.push("/")
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
          try {
        console.log("Attempting login...")
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) {
          console.error("Login error:", error)
          setError(error.message)
          setLoading(false)
        } else if (data.user) {
          console.log("Login successful, user:", data.user.email)
          // The useEffect hook will handle the redirection
        }
      } catch (err) {
        console.error("Unexpected error during login:", err)
        setError("An error occurred. Please try again later.")
        setLoading(false)
      }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image src="/memories.png" alt="Company Logo" width={120} height={120} className="h-12 w-auto" />
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-black placeholder-gray-400"
                placeholder="Enter your password"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/signup" className="text-green-600 hover:text-green-500">
              Sign up now
            </Link>
            <Link href="/forgot-password" className="text-green-600 hover:text-green-500">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Memorial Image */}
      <div className="relative hidden lg:block w-1/2 overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[800px]">
          <Image
            src="/login-image.jpg"
            alt="Memories We Lived"
            fill
            className="object-contain object-right"
            priority
            sizes="800px"
          />
        </div>
      </div>
    </div>
  )
}