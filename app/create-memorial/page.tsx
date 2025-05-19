"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createMemorial } from "@/actions/memorial"
import { useFormStatus } from "react-dom"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import PremiumPopup from "@/components/PremiumPopup"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/seperator"
import { Calendar, Info, User, Heart, ImageIcon, MapPin, Cake } from "lucide-react"
import MemorialPreview from "./memorial-preview"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#22C55E] text-white p-3 rounded-full font-semibold hover:bg-[#1EA750] disabled:bg-[#86E5A9] disabled:cursor-not-allowed transition-colors"
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
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    dateOfDeath: "",
    anniversary: "",
    bio: "",
    location: "",
    coverPhoto: "/memorial-background.png",
  })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="container mx-auto p-4">
          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <p className="text-center">Loading user data...</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#22C55E]">Create a Memorial Page</h1>
              <div className="text-sm text-gray-500">
                {!isPremium && (
                  <span>
                    {memorialCount}/2 free pages used •{" "}
                    <a href="/pricing" className="text-[#22C55E] hover:underline">
                      Upgrade
                    </a>
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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

            {!isPremium && memorialCount >= 2 ? (
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
                        You've reached the limit for free accounts. Upgrade to premium to create unlimited memorial
                        pages.
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => router.push("/pricing")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-[#22C55E] hover:bg-[#1EA750] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22C55E]"
                      >
                        View Pricing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Form */}
                <div className="w-full lg:w-1/2">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border-b">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                    </TabsList>

                    <form action={handleSubmit} className="space-y-4">
                      <TabsContent value="basic" className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name of the person <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                              placeholder="Full name"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="dateOfDeath" className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Passing <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="dateOfDeath"
                              name="dateOfDeath"
                              type="date"
                              value={formData.dateOfDeath}
                              onChange={handleInputChange}
                              required
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Cake className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                            Biography <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                              <Info className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                              id="bio"
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              required
                              className="pl-10 mt-1 w-full p-3 border rounded-2xl focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] min-h-[120px] resize-y"
                              placeholder="Share their story..."
                            ></textarea>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div>
                          <label htmlFor="anniversary" className="block text-sm font-medium text-gray-700 mb-1">
                            Anniversary Date (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Heart className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="anniversary"
                              name="anniversary"
                              type="date"
                              value={formData.anniversary}
                              onChange={handleInputChange}
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                            Location (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                              placeholder="City, State, Country"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="media" className="space-y-4">
                        <div>
                          <label htmlFor="coverPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                            Cover Photo (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="coverPhoto"
                              name="coverPhoto"
                              type="file"
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                              accept="image/*"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Recommended size: 820 x 312 pixels</p>
                        </div>

                        <div>
                          <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Photo (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="profilePhoto"
                              name="profilePhoto"
                              type="file"
                              className="pl-10 mt-1 w-full p-2 border rounded-full focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                              accept="image/*"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Recommended size: 170 x 170 pixels</p>
                        </div>
                      </TabsContent>

                      <div className="pt-4">
                        <Separator className="my-4" />
                        <SubmitButton />
                      </div>
                    </form>
                  </Tabs>
                </div>

                {/* Right side - Preview */}
                <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
                  <div className="sticky top-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Preview</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        This is how your memorial page will appear to visitors.
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                      <MemorialPreview data={formData} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPremiumPopup && <PremiumPopup onClose={() => setShowPremiumPopup(false)} />}
    </div>
  )
}
