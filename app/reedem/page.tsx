"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export default function ReedemPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reedemId, setReedemId] = useState<string | null>(null)
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const router = useRouter()

  useEffect(() => {
    createReedemAttempt()
  }, [])

  const createReedemAttempt = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError("You must be logged in to access this page.")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from("reedem_attempts").insert({ user_id: user.id }).select().single()

      if (error) throw error

      setReedemId(data.id)
    } catch (error) {
      console.error("Error creating reedem attempt:", error)
      setError("Failed to start reedemption process. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-100 border border-red-400 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (reedemId) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Reedemption Process Started</h1>
        <p className="mb-4">
          Your reedemption ID is: <span className="font-mono font-bold">{reedemId}</span>
        </p>
        <p className="mb-4">Please use this ID to complete your subscription activation.</p>
        <button
          onClick={() => router.push(`/reedem/${reedemId}`)}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
        >
          Continue to Activation
        </button>
      </div>
    )
  }

  return null
}

