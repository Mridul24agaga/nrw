"use client"

import { useState, useEffect } from "react"
import { getMemorial, getPostsWithComments } from "@/actions/memorial"
import { useParams, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { AddMemoryForm } from "@/components/add-memory-form"
import { createClientComponentClient, type User } from "@supabase/auth-helpers-nextjs"
import { MemoryCard } from "@/components/memory-card"
import { Button } from "@/components/ui/button"

// Define types for our data structures
interface Memorial {
  id: string
  name: string
  date_of_passing: string
  date_of_birth?: string
  anniversary?: string // Changed from date_of_anniversary
  bio: string
  created_by: string
  creator?: {
    username: string
  }
}

interface Post {
  id: string
  content: string
  created_at: string
  // Add other relevant fields
}

interface ExtendedUser extends User {
  profile?: {
    username?: string
    full_name?: string
  }
}

interface VirtualFlower {
  id: string
  memorial_id: string
  sender_name: string
  created_at: string
}

// Type guard for Memorial
function isMemorial(data: any): data is Memorial {
  return (
    data &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    typeof data.date_of_passing === "string" &&
    typeof data.bio === "string" &&
    typeof data.created_by === "string"
  )
}

export default function MemorialPage() {
  const params = useParams()
  const pageName = params.pageName as string
  const router = useRouter()

  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [memories, setMemories] = useState<string[]>([])
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([])
  const [isSendingFlower, setIsSendingFlower] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        const memorialData = await getMemorial(pageName)
        if (!memorialData || !isMemorial(memorialData)) {
          throw new Error("Memorial not found or invalid for page: " + pageName)
        }
        setMemorial(memorialData)

        const postsData = await getPostsWithComments(memorialData.id)
        if (!postsData) {
          console.error("Failed to fetch posts for memorial:", memorialData.id)
        }
        setPosts(postsData || [])

        const { data: memoriesData, error: memoriesError } = await supabase
          .from("memorialpages212515")
          .select("memory_message")
          .eq("id", memorialData.id)
          .single()

        if (memoriesError) throw memoriesError
        setMemories(memoriesData?.memory_message || [])

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError

        if (user) {
          // Fetch the user's profile data
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", user.id)
            .single()

          if (!profileError && profileData) {
            setUser({
              ...user,
              profile: profileData,
            })
          } else {
            setUser(user)
          }
        }

        // Fetch virtual flowers
        const { data: flowersData, error: flowersError } = await supabase
          .from("virtual_flowers")
          .select("*")
          .eq("memorial_id", memorialData.id)
          .order("created_at", { ascending: false })

        if (flowersError) throw flowersError
        setVirtualFlowers(flowersData || [])
      } catch (err) {
        console.error("Error in MemorialPage:", err)
        setError("Failed to load memorial page. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [pageName, supabase])

  const handleSendVirtualFlower = async () => {
    if (!user || !memorial) return

    setIsSendingFlower(true)
    try {
      const senderName = user.profile?.full_name || user.profile?.username || user.email || "Anonymous"

      const { data, error } = await supabase
        .from("virtual_flowers")
        .insert({
          memorial_id: memorial.id,
          sender_name: senderName,
        })
        .select()
        .single()

      if (error) throw error

      setVirtualFlowers((prev) => [data, ...prev])

      // Redirect to PayPal
      window.location.href = "https://www.paypal.com/ncp/payment/5L53UJ7NSJ6VA" // Replace with your actual PayPal.me link
    } catch (err) {
      console.error("Error sending virtual flower:", err)
      setError("Failed to send virtual flower. Please try again.")
    } finally {
      setIsSendingFlower(false)
    }
  }

  const handleNewMemory = (newMemory: string) => {
    setMemories((prevMemories) => [...prevMemories, newMemory])
  }

  if (isLoading) {
    return <div className="text-black">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-500">
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h1 className="text-4xl font-bold mb-2">{memorial?.name}</h1>
                  <p className="text-lg opacity-90">
                    {memorial?.date_of_passing &&
                      new Date(memorial.date_of_passing).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                  {memorial?.anniversary && (
                    <p className="text-lg opacity-90">
                      {`Anniversary: ${new Date(memorial.anniversary).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <p className="text-sm text-black">Created by</p>
                    <p className="font-medium text-lg text-black">{memorial?.creator?.username || "Anonymous"}</p>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h2 className="text-2xl font-semibold mb-4 text-black">Biography</h2>
                  <p className="text-black whitespace-pre-wrap">{memorial?.bio}</p>
                </div>

                {/* Virtual Flowers Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4 text-black">Virtual Flowers</h2>
                  {user && (
                    <Button onClick={handleSendVirtualFlower} disabled={isSendingFlower} className="mb-4">
                      {isSendingFlower ? "Sending..." : "Send Virtual Flower"}
                    </Button>
                  )}
                  <div className="space-y-2">
                    {virtualFlowers.map((flower) => (
                      <div key={flower.id} className="text-sm text-gray-600">
                        {flower.sender_name} sent a virtual flower on {new Date(flower.created_at).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memories Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4 text-black">Memories</h2>
                  {memorial && <AddMemoryForm memorialId={memorial.id} onMemoryAdded={handleNewMemory} />}
                  <div className="mt-6">
                    {memories.map((memory, index) => (
                      <MemoryCard
                        key={index}
                        content={memory}
                        createdAt={new Date().toISOString()}
                        pageName={memorial?.name || pageName}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

