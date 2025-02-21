"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export default function ReedemIdPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useParams()
  const { id } = params

  useEffect(() => {
    verifyReedemAttempt()
  }, [])

  const verifyReedemAttempt = async () => {
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
      const { data, error } = await supabase
        .from("reedem_attempts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error || !data) {
        throw new Error("Invalid reedemption attempt")
      }

      if (data.used) {
        setError("This reedemption code has already been used.")
        setIsLoading(false)
        return
      }

      // Generate promo code
      const promoCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { error: updateError } = await supabase.from("reedem_attempts").update({ used: true }).eq("id", id)

      if (updateError) {
        throw new Error("Failed to update reedemption attempt")
      }

      // Store the promo code
      const { error: promoError } = await supabase
        .from("promo_codes")
        .insert({ code: promoCode, user_id: user.id, reedem_attempt_id: id })

      if (promoError) {
        throw new Error("Failed to store promo code")
      }

      setPromoCode(promoCode)
    } catch (error) {
      console.error("Error verifying reedem attempt:", error)
      setError("Failed to verify reedemption attempt. Please try again.")
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
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Return to Home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Your Promo Code</h1>
      {promoCode ? (
        <>
          <p className="mb-4">Here's your unique promo code:</p>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <span className="text-2xl font-mono font-bold">{promoCode}</span>
          </div>
          <p className="mt-4 text-sm text-gray-600">Use this code to activate your subscription on the main page.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
          >
            Go to Main Page
          </button>
        </>
      ) : (
        <p>There was an error generating your promo code. Please try again later.</p>
      )}
    </div>
  )
}

