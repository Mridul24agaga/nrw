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
import { Pencil, Calendar, Flower, Heart, Save, X, MessageCircle } from "lucide-react"

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
  theme?: string
  header_style?: string
  header_image_url?: string
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

interface ThemeColor {
  name: string
  color: string
  hoverColor: string
  lightColor: string
  superLightColor: string
  textColor: string
}

interface HeaderStyle {
  name: string
  style: string
  description: string
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
  const [memories, setMemories] = useState<any[]>([])
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([])
  const [isSendingFlower, setIsSendingFlower] = useState(false)
  const [isCurrentUserCreator, setIsCurrentUserCreator] = useState(false)

  // New state for bio editing
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [editedBio, setEditedBio] = useState("")
  const [isSavingBio, setIsSavingBio] = useState(false)

  // Theme customization
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>({
    name: "purple",
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
    lightColor: "bg-purple-100",
    superLightColor: "bg-purple-50",
    textColor: "text-purple-600",
  })

  // Header style customization
  const [currentHeaderStyle, setCurrentHeaderStyle] = useState<HeaderStyle>({
    name: "gradient",
    style: "bg-gradient-to-r",
    description: "Gradient background",
  })

  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null)

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

        // Set theme if available
        if (memorialData.theme) {
          try {
            const savedTheme = JSON.parse(memorialData.theme)
            if (savedTheme && savedTheme.name) {
              setCurrentTheme(savedTheme)
            }
          } catch (e) {
            console.error("Error parsing saved theme:", e)
          }
        }

        // Set header style if available
        if (memorialData.header_style) {
          try {
            const savedHeaderStyle = JSON.parse(memorialData.header_style)
            if (savedHeaderStyle && savedHeaderStyle.name) {
              setCurrentHeaderStyle(savedHeaderStyle)
            }
          } catch (e) {
            console.error("Error parsing saved header style:", e)
          }
        }

        // Set header image if available
        if (memorialData.header_image_url) {
          setHeaderImageUrl(memorialData.header_image_url)
        }

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
    // Refresh the page to show the new memory with all functionality
    router.refresh()
  }

  // New function to handle editing bio
  const handleEditBio = () => {
    if (!memorial) return
    setEditedBio(memorial.bio)
    setIsEditingBio(true)
  }

  // New function to handle canceling bio edit
  const handleCancelEditBio = () => {
    setIsEditingBio(false)
    setEditedBio("")
  }

  // New function to handle saving bio
  const handleSaveBio = async () => {
    if (!memorial || !editedBio.trim()) return

    setIsSavingBio(true)
    setError(null)

    try {
      // Update the bio in the memorialpages212515 table
      const { error } = await supabase
        .from("memorialpages212515")
        .update({ bio: editedBio.trim() })
        .eq("id", memorial.id)

      if (error) throw error

      // Update local state
      setMemorial((prev) => ({
        ...prev!,
        bio: editedBio.trim(),
      }))

      setIsEditingBio(false)
    } catch (err) {
      console.error("Error updating bio:", err)
      setError(
        err instanceof Error
          ? `Failed to update biography: ${err.message}`
          : "Failed to update biography. Please try again.",
      )
    } finally {
      setIsSavingBio(false)
    }
  }

  // Handle theme change
  const handleThemeChange = async (theme: ThemeColor) => {
    setCurrentTheme(theme)

    if (memorial && isCurrentUserCreator) {
      try {
        const { error } = await supabase
          .from("memorialpages212515")
          .update({ theme: JSON.stringify(theme) })
          .eq("id", memorial.id)

        if (error) throw error
      } catch (err) {
        console.error("Error saving theme:", err)
      }
    }
  }

  // Handle header style change
  const handleHeaderStyleChange = async (style: HeaderStyle) => {
    setCurrentHeaderStyle(style)

    if (memorial && isCurrentUserCreator) {
      try {
        const { error } = await supabase
          .from("memorialpages212515")
          .update({ header_style: JSON.stringify(style) })
          .eq("id", memorial.id)

        if (error) throw error
      } catch (err) {
        console.error("Error saving header style:", err)
      }
    }
  }

  // Get dynamic header classes based on current style and theme
  const getHeaderClasses = () => {
    if (currentHeaderStyle.name === "gradient") {
      return `${currentHeaderStyle.style} from-${currentTheme.name}-100 to-${currentTheme.name}-300`
    } else if (currentHeaderStyle.name === "solid") {
      return currentTheme.lightColor
    } else if (currentHeaderStyle.name === "image") {
      return "bg-cover bg-center"
    }
    return `${currentHeaderStyle.style} from-${currentTheme.name}-100 to-${currentTheme.name}-300`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className={`animate-spin rounded-full h-8 w-8 border-b-2 ${currentTheme.textColor.replace("text", "border")}`}
        ></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-red-500 mb-4">{error}</div>
        <Button
          onClick={() => router.refresh()}
          variant="outline"
          className={`border-${currentTheme.name}-500 ${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
        >
          Try Again
        </Button>
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
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row">
          {/* Left Sidebar */}
          <div className="w-full md:w-1/4 p-4">
            <div className="sticky top-4">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-1/2 bg-white min-h-screen shadow-sm">
           

            {/* Header with dynamic styling */}
            <div
              className={`relative h-48 ${getHeaderClasses()} overflow-hidden`}
              style={
                currentHeaderStyle.name === "image" && headerImageUrl
                  ? { backgroundImage: `url(${headerImageUrl})` }
                  : {}
              }
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

              {/* Memorial Avatar - FIXED: Increased z-index from 10 to 30 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-30">
                {isCurrentUserCreator && memorial ? (
                  <MemorialAvatarDialog
                    memorialId={memorial.id}
                    avatarUrl={memorial.memorial_avatar_url || null}
                    memorialName={memorial.name}
                  >
                    <div className="relative group cursor-pointer">
                      <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                        {memorial.memorial_avatar_url ? (
                          <Image
                            src={memorial.memorial_avatar_url || "/placeholder.svg"}
                            alt={memorial.name}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div
                            className={`h-full w-full flex items-center justify-center ${currentTheme.superLightColor}`}
                          >
                            <span className={`text-3xl ${currentTheme.textColor} font-serif`}>
                              {memorial.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </MemorialAvatarDialog>
                ) : memorial?.memorial_avatar_url ? (
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <Image
                      src={memorial.memorial_avatar_url || "/placeholder.svg"}
                      alt={memorial.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className={`h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center ${currentTheme.superLightColor}`}
                  >
                    <span className={`text-3xl ${currentTheme.textColor} font-serif`}>
                      {memorial?.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Memorial Name and Dates */}
            <div className="mt-16 text-center px-6">
              <h1 className="text-3xl font-serif text-gray-800 mb-2">{memorial?.name}</h1>
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                {memorial?.date_of_birth && (
                  <span>
                    {new Date(memorial.date_of_birth).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {memorial?.date_of_birth && memorial?.date_of_passing && <span>-</span>}
                {memorial?.date_of_passing && (
                  <span>
                    {new Date(memorial.date_of_passing).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Creator info */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
              <span>Created by</span>
              <div className="flex items-center gap-1.5">
                {isCurrentUserCreator && memorial?.creator ? (
                  <AvatarUploadDialog
                    userId={memorial.creator.id || memorial.created_by}
                    avatarUrl={memorial.creator.avatar_url}
                    username={memorial.creator.username}
                  >
                    <div className="relative group cursor-pointer">
                      <div className="h-6 w-6 rounded-full overflow-hidden">
                        <CustomAvatar
                          user={{
                            id: memorial.creator.id || memorial.created_by,
                            username: memorial.creator.username,
                            avatar_url: memorial.creator.avatar_url,
                            email: "",
                            bio: null,
                            created_at: "",
                          }}
                          size={24}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </AvatarUploadDialog>
                ) : (
                  <div className="h-6 w-6 rounded-full overflow-hidden">
                    <CustomAvatar
                      user={{
                        id: memorial?.creator?.id || memorial?.created_by || "",
                        username: memorial?.creator?.username || "Anonymous",
                        avatar_url: memorial?.creator?.avatar_url || null,
                        email: "",
                        bio: null,
                        created_at: "",
                      }}
                      size={24}
                    />
                  </div>
                )}
                <span className="font-medium">{memorial?.creator?.username || "Anonymous"}</span>
              </div>
            </div>

            {/* Divider with flower */}
            <div className="flex items-center justify-center my-6 px-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <div className={`mx-4 ${currentTheme.textColor}`}>
                <Flower className="h-5 w-5" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>

            {/* Biography */}
            <div className="px-8 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-serif text-gray-700">Biography</h2>
                {isCurrentUserCreator && !isEditingBio && (
                  <button
                    onClick={handleEditBio}
                    className={`flex items-center gap-1 ${currentTheme.textColor} hover:opacity-80 text-sm`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <div>
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    rows={5}
                    className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-${currentTheme.name}-500 text-sm`}
                    placeholder="Write a biography..."
                  ></textarea>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      onClick={handleCancelEditBio}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-gray-300 text-gray-700"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                      size="sm"
                      className={`h-8 px-3 text-xs ${currentTheme.color} ${currentTheme.hoverColor} text-white`}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {isSavingBio ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <p className="whitespace-pre-wrap">{memorial?.bio}</p>
                </div>
              )}
            </div>

            {/* Divider with heart */}
            <div className="flex items-center justify-center my-6 px-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <div className={`mx-4 ${currentTheme.textColor}`}>
                <Heart className="h-5 w-5" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>

            {/* Virtual Flowers Section */}
            <div className="px-8 mb-8">
              <h2 className="text-xl font-serif text-gray-700 mb-4">Virtual Flowers</h2>

              {user && (
                <Button
                  onClick={handleSendVirtualFlower}
                  disabled={isSendingFlower}
                  className={`w-full mb-4 ${currentTheme.color} ${currentTheme.hoverColor} text-white`}
                >
                  <Flower className="h-4 w-4 mr-2" />
                  {isSendingFlower ? "Sending..." : "Send Virtual Flower"}
                </Button>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {virtualFlowers.length > 0 ? (
                  virtualFlowers.map((flower) => (
                    <div
                      key={flower.id}
                      className={`flex flex-col items-center p-3 ${currentTheme.superLightColor} rounded-lg border border-${currentTheme.name}-100`}
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden mb-2">
                        <CustomAvatar
                          user={{
                            id: flower.sender_id || "",
                            username: flower.sender_name,
                            avatar_url: flower.sender_avatar,
                            email: "",
                            bio: null,
                            created_at: "",
                          }}
                          size={40}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-800 truncate max-w-full">
                          {flower.sender_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(flower.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500 text-sm py-6">
                    <p>No virtual flowers yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider with message */}
            <div className="flex items-center justify-center my-6 px-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <div className={`mx-4 ${currentTheme.textColor}`}>
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>

            {/* Add Memory Form */}
            {memorial && (
              <div className="px-8 mb-6">
                <h2 className="text-xl font-serif text-gray-700 mb-4">Share a Memory</h2>
                <AddMemoryForm memorialId={memorial.id} onMemoryAdded={handleNewMemory} themeColor={currentTheme} />
              </div>
            )}

            {/* Memories Feed */}
            <div className="px-8 pb-12">
              <h2 className="text-xl font-serif text-gray-700 mb-4">Memories</h2>

              {memories.length > 0 ? (
                <div className="space-y-6">
                  {memories.map((memory, index) => (
                    <MemoryCard
                      key={index}
                      memoryId={index.toString()}
                      memorialId={memorial?.id || ""}
                      memory={memory}
                      pageName={memorial?.name || pageName}
                      currentUser={currentUserForMemoryCard}
                      isCreator={isCurrentUserCreator}
                      themeColor={currentTheme}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                  <p>No memories have been shared yet.</p>
                  <p className="text-sm mt-1">Be the first to share a memory.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - can be used for additional information */}
          <div className="w-full md:w-1/4 p-4">
            <div className="sticky top-4 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-serif text-gray-700 mb-3">About This Memorial</h3>
              <p className="text-sm text-gray-600 mb-4">
                This memorial page was created to honor and remember {memorial?.name}. Share your memories, photos, and
                pay tribute by sending virtual flowers.
              </p>

              {memorial?.anniversary && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Anniversary</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className={`h-4 w-4 ${currentTheme.textColor}`} />
                    <span>
                      {new Date(memorial.anniversary).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  className={`w-full border-${currentTheme.name}-200 ${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: `Memorial for ${memorial?.name}`,
                        text: `Visit the memorial page for ${memorial?.name}`,
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert("Link copied to clipboard")
                    }
                  }}
                >
                  Share This Memorial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
