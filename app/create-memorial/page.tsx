"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createMemorial } from "@/actions/memorial"
import { useFormStatus } from "react-dom"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import PremiumPopup from "@/components/PremiumPopup"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
    >
      {pending ? "Creating..." : "Create Memorial"}
    </button>
  )
}

export default function CreateMemorialForm() {
  const [error, setError] = useState<string | null>(null)
  const [memorialCount, setMemorialCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showPremiumPopup, setShowPremiumPopup] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUserStatus()
  }, [])

  async function checkUserStatus() {
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw new Error("Authentication error: " + userError.message)
      if (!user) {
        router.push("/login")
        return
      }

      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single()

      if (userDataError) throw new Error("Error fetching user data: " + userDataError.message)

      setIsPremium(userData.is_premium)

      const { count, error: memorialError } = await supabase
        .from("memorialpages212515")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)

      if (memorialError) throw new Error("Error fetching memorial pages: " + memorialError.message)
      setMemorialCount(count || 0)
    } catch (error) {
      console.error("Error checking user status:", error)
      setError("Error checking user status: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)

    if (!isPremium && memorialCount >= 2) {
      setShowPremiumPopup(true)
      return
    }

    try {
      const newPage = await createMemorial(formData)
      if (newPage && newPage.page_name) {
        router.push(`/memorial/${newPage.page_name}`)
      } else {
        throw new Error("Failed to create memorial page")
      }
    } catch (e) {
      console.error("Error creating memorial:", e)
      setError("Error creating memorial: " + (e instanceof Error ? e.message : String(e)))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-black">
        <div className="container mx-auto p-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <p className="text-center">Loading user data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPremium && memorialCount >= 2 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Upgrade Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You've reached the limit for free accounts. Upgrade to premium to create unlimited memorial pages.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push("/pricing")}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      View Pricing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Create a Memorial</h2>
            {!isPremium && memorialCount >= 2 ? (
              <p className="text-red-500">
                You cannot create more memorial pages with a free account. Please upgrade to premium.
              </p>
            ) : (
              <form action={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name of the person
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfDeath" className="block text-sm font-medium text-gray-700">
                    Date of Passing
                  </label>
                  <input
                    id="dateOfDeath"
                    name="dateOfDeath"
                    type="date"
                    required
                    className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth (optional)
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="anniversary" className="block text-sm font-medium text-gray-700">
                    Anniversary (optional)
                  </label>
                  <input
                    id="anniversary"
                    name="anniversary"
                    type="date"
                    className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Biography
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  ></textarea>
                </div>
                <SubmitButton />
              </form>
            )}
          </div>
        </div>
      </div>
      {showPremiumPopup && <PremiumPopup onClose={() => setShowPremiumPopup(false)} />}
    </div>
  )
}

