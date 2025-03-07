"use client"

import { useState, useEffect } from "react"
import { getMemorial, getPostsWithComments } from "@/actions/memorial"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Sidebar from "@/components/sidebar"
import { AddMemoryForm } from "@/components/add-memory-form"
import { createClientComponentClient, type User } from "@supabase/auth-helpers-nextjs"
import { MemoryCard } from "@/components/memory-card"
import { Button } from "@/components/ui/button"
import { CustomAvatar } from "@/components/custom-avatar"
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog"
import { MemorialAvatarDialog } from "@/components/memorial-avatar-dialog"
import { Pencil } from "lucide-react"

// Define types for our data structures
interface Memorial {
  id: string
  name: string
  date_of_passing: string
  date_of_birth?: string
  anniversary?: string
  bio: string
  created_by: string
  creator?: {
    id?: string
    username: string
    avatar_url: string | null
  }
  memorial_avatar_url?: string | null
  memory_message?: string[]
}

interface Post {
  id: string
  content: string
  created_at: string
}

interface ExtendedUser extends User {
  id: string
  email: string
  created_at: string
  bio: string | null
  profile?: {
    username?: string
    full_name?: string
    avatar_url: string | null
  }
}

interface VirtualFlower {
  id: string
  memorial_id: string
  sender_name: string
  sender_id?: string
  sender_avatar: string | null
  created_at: string
}

interface MemoryAuthor {
  id: string
  username: string
  avatar_url: string | null
  email?: string
  bio?: string | null
  created_at?: string
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
  const [memories, setMemories] = useState<{ content: string; imageUrl: string | null; createdAt: string }[]>([])
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([])
  const [isSendingFlower, setIsSendingFlower] = useState(false)
  const [isCurrentUserCreator, setIsCurrentUserCreator] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        // Get current user first
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        const currentUserId = session?.user?.id

        // Fetch memorial data
        const memorialData = await getMemorial(pageName)
        if (!memorialData || !isMemorial(memorialData)) {
          throw new Error("Memorial not found or invalid for page: " + pageName)
        }

        // Check if current user is the creator
        setIsCurrentUserCreator(currentUserId === memorialData.created_by)

        // Fetch creator details including avatar
        if (memorialData.created_by) {
          const { data: creatorData, error: creatorError } = await supabase
            .from("users")
            .select("id, username, avatar_url")
            .eq("id", memorialData.created_by)
            .single()

          if (!creatorError && creatorData) {
            memorialData.creator = {
              id: creatorData.id,
              username: creatorData.username || "Anonymous",
              avatar_url: creatorData.avatar_url,
            }
          }
        }

        setMemorial(memorialData)

        // Fetch posts with better error handling
        try {
          const postsData = await getPostsWithComments(memorialData.id)
          setPosts(postsData || [])
        } catch (postError) {
          console.error("Failed to fetch posts for memorial:", memorialData.id)
          setPosts([])
        }

        const { data: memoriesData, error: memoriesError } = await supabase
          .from("memorialpages212515")
          .select("memory_message")
          .eq("id", memorialData.id)
          .single()

        if (memoriesError && memoriesError.code !== "PGRST116") {
          console.error("Error fetching memories:", memoriesError)
        }

        setMemories(memoriesData?.memory_message || [])

        if (currentUserId && session?.user) {
          // Fetch the user's profile data
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", currentUserId)
            .single()

          if (!profileError && profileData) {
            setUser({
              ...session.user,
              id: session.user.id,
              email: session.user.email || "",
              created_at: session.user.created_at || new Date().toISOString(),
              bio: null,
              profile: profileData,
            })
          } else {
            setUser({
              ...session.user,
              id: session.user.id,
              email: session.user.email || "",
              created_at: session.user.created_at || new Date().toISOString(),
              bio: null,
              profile: {
                username: session.user.email?.split("@")[0],
                avatar_url: null,
              },
            })
          }
        }

        // Fetch virtual flowers with better error handling
        try {
          // First try with the join query
          const { data: flowersData, error: flowersError } = await supabase
            .from("virtual_flowers")
            .select("id, memorial_id, sender_name, sender_id, created_at")
            .eq("memorial_id", memorialData.id)
            .order("created_at", { ascending: false })

          if (flowersError) {
            throw flowersError
          }

          // Fetch sender avatars separately to avoid join issues
          const transformedFlowers = await Promise.all(
            (flowersData || []).map(async (flower) => {
              let senderAvatar = null
              let senderId = flower.sender_id

              if (flower.sender_id) {
                try {
                  const { data: senderData } = await supabase
                    .from("users")
                    .select("id, avatar_url")
                    .eq("id", flower.sender_id)
                    .single()

                  if (senderData) {
                    senderAvatar = senderData.avatar_url
                    senderId = senderData.id
                  }
                } catch (senderError) {
                  // Ignore errors fetching sender data
                  console.log("Error fetching sender data:", senderError)
                }
              }

              return {
                ...flower,
                sender_avatar: senderAvatar,
                sender_id: senderId,
              }
            }),
          )

          setVirtualFlowers(transformedFlowers)
        } catch (flowersError) {
          console.error("Error fetching flowers:", flowersError)
          setVirtualFlowers([]) // Set empty array in case of error
        }
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
    if (!user || !memorial) {
      console.error("Cannot send flower: User or memorial is null")
      return
    }

    setIsSendingFlower(true)
    try {
      const senderName = user.profile?.full_name || user.profile?.username || user.email || "Anonymous"

      console.log("Attempting to send flower for:", {
        memorial_id: memorial.id,
        sender_name: senderName,
        sender_id: user.id,
      })

      // First check if the table exists by doing a simple select
      const { error: checkError } = await supabase.from("virtual_flowers").select("id").limit(1)

      if (checkError) {
        console.error("Error checking virtual_flowers table:", checkError)
        throw new Error(`Table check failed: ${checkError.message}`)
      }

      // Insert the flower record
      const { data, error } = await supabase
        .from("virtual_flowers")
        .insert({
          memorial_id: memorial.id,
          sender_name: senderName,
          sender_id: user.id,
        })
        .select()

      if (error) {
        console.error("Supabase insert error:", error)
        throw new Error(`Failed to insert flower: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.error("No data returned from insert")
        throw new Error("No data returned from insert operation")
      }

      console.log("Successfully inserted flower:", data[0])

      // Add the sender's avatar to the new flower
      const newFlower: VirtualFlower = {
        ...data[0],
        sender_avatar: user.profile?.avatar_url || null,
        sender_id: user.id,
      }

      // Update the UI with the new flower
      setVirtualFlowers((prev) => [newFlower, ...prev])

      // Only redirect to PayPal after successful database operation
      console.log("Redirecting to PayPal...")
      window.location.href = "https://www.paypal.com/ncp/payment/5L53UJ7NSJ6VA"
    } catch (err) {
      // Log the full error details
      console.error("Error sending virtual flower:", err)

      // Set a more descriptive error message
      setError(
        err instanceof Error
          ? `Failed to send virtual flower: ${err.message}`
          : "Failed to send virtual flower. Please try again.",
      )
    } finally {
      setIsSendingFlower(false)
    }
  }

  const handleNewMemory = (newContent: string, imageUrl?: string) => {
    const newMemory = {
      content: newContent,
      imageUrl: imageUrl || null, // Convert undefined to null explicitly
      createdAt: new Date().toISOString(),
    }

    // Type assertion to ensure compatibility with the memories array type
    setMemories((prevMemories) => [...prevMemories, newMemory as (typeof prevMemories)[0]])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => router.refresh()}>Try Again</Button>
      </div>
    )
  }

  // Create current user object for memory card
  const currentUserForMemoryCard = user
    ? {
        id: user.id,
        username: user.profile?.username || user.email?.split("@")[0] || "Anonymous",
        avatar_url: user.profile?.avatar_url || null,
      }
    : null

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

                {/* Memorial Avatar with edit capability if current user is creator */}
                {isCurrentUserCreator && memorial ? (
                  <div className="absolute top-6 right-6">
                    <MemorialAvatarDialog
                      memorialId={memorial.id}
                      avatarUrl={memorial.memorial_avatar_url || null}
                      memorialName={memorial.name}
                    >
                      <div className="relative group cursor-pointer">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-white border-2 border-white shadow-lg">
                          {memorial.memorial_avatar_url ? (
                            <Image
                              src={memorial.memorial_avatar_url || "/placeholder.svg"}
                              alt={memorial.name}
                              width={96}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200">
                              <span className="text-4xl text-gray-500">{memorial.name[0]?.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </MemorialAvatarDialog>
                  </div>
                ) : memorial?.memorial_avatar_url ? (
                  <div className="absolute top-6 right-6">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-white border-2 border-white shadow-lg">
                      <Image
                        src={memorial.memorial_avatar_url || "/placeholder.svg"}
                        alt={memorial.name}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ) : null}

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
                  {/* Creator Avatar with edit capability if current user is creator */}
                  {isCurrentUserCreator && memorial?.creator ? (
                    <AvatarUploadDialog
                      userId={memorial.creator.id || memorial.created_by}
                      avatarUrl={memorial.creator.avatar_url}
                      username={memorial.creator.username}
                    >
                      <div className="relative group cursor-pointer">
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <CustomAvatar
                            user={{
                              id: memorial.creator.id || memorial.created_by,
                              username: memorial.creator.username,
                              avatar_url: memorial.creator.avatar_url,
                              email: "",
                              bio: null,
                              created_at: "",
                            }}
                            size={48}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </AvatarUploadDialog>
                  ) : (
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <CustomAvatar
                        user={{
                          id: memorial?.creator?.id || memorial?.created_by || "",
                          username: memorial?.creator?.username || "Anonymous",
                          avatar_url: memorial?.creator?.avatar_url || null,
                          email: "",
                          bio: null,
                          created_at: "",
                        }}
                        size={48}
                      />
                    </div>
                  )}
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
                  <div className="space-y-4">
                    {virtualFlowers.map((flower) => (
                      <div key={flower.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-8 w-8 rounded-full overflow-hidden">
                          <CustomAvatar
                            user={{
                              id: flower.sender_id || "",
                              username: flower.sender_name,
                              avatar_url: flower.sender_avatar,
                              email: "",
                              bio: null,
                              created_at: "",
                            }}
                            size={32}
                          />
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{flower.sender_name}</span> sent a virtual flower on{" "}
                          <span className="text-gray-600">{new Date(flower.created_at).toLocaleDateString()}</span>
                        </div>
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
                        memoryId={index.toString()}
                        memorialId={memorial?.id || ""}
                        memory={memory}
                        pageName={memorial?.name || pageName}
                        currentUser={currentUserForMemoryCard}
                        isCreator={isCurrentUserCreator}
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

