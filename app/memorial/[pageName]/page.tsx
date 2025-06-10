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
import {
  Pencil,
  Calendar,
  Flower,
  Heart,
  Save,
  X,
  MessageCircle,
  Share2,
  Clock,
  Users,
  Camera,
  Palette,
  Settings,
  UserPlus,
  Unlock,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  memory_message?: any[]
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

  // Bio editing state
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

  // Delete functionality state
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

        // Parse memories to handle various formats
        let parsedMemories = []
        if (memoriesData?.memory_message) {
          try {
            if (Array.isArray(memoriesData.memory_message)) {
              parsedMemories = memoriesData.memory_message.map((memory: any) => {
                // Handle string memories (legacy format)
                if (typeof memory === "string") {
                  try {
                    // Try to parse as JSON first
                    const parsed = JSON.parse(memory)
                    return parsed
                  } catch {
                    // If not JSON, treat as plain text
                    return {
                      content: memory,
                      imageUrl: null,
                      createdAt: new Date().toISOString(),
                      author: null,
                    }
                  }
                }

                // Handle object memories
                if (typeof memory === "object" && memory !== null) {
                  // Check for double-encoded JSON in content field
                  if (memory.content && typeof memory.content === "string") {
                    try {
                      // If content looks like JSON, try to parse it
                      if (memory.content.startsWith("{") || memory.content.includes('\\"')) {
                        let parsedContent = memory.content

                        // Keep parsing until we get clean content
                        while (
                          typeof parsedContent === "string" &&
                          (parsedContent.startsWith("{") || parsedContent.includes('\\"'))
                        ) {
                          try {
                            parsedContent = JSON.parse(parsedContent)
                          } catch {
                            break
                          }
                        }

                        // If we got a proper object, use it
                        if (typeof parsedContent === "object" && parsedContent.content) {
                          return {
                            content: parsedContent.content,
                            imageUrl: parsedContent.imageUrl || null,
                            createdAt: parsedContent.createdAt || memory.createdAt || new Date().toISOString(),
                            author: parsedContent.author || memory.author || null,
                          }
                        }
                      }
                    } catch (e) {
                      console.error("Error parsing memory content:", e)
                    }
                  }

                  // Return the memory as-is if it's already properly formatted
                  return {
                    content: memory.content || "",
                    imageUrl: memory.imageUrl || null,
                    createdAt: memory.createdAt || new Date().toISOString(),
                    author: memory.author || null,
                  }
                }

                // Fallback for unexpected formats
                return {
                  content: String(memory),
                  imageUrl: null,
                  createdAt: new Date().toISOString(),
                  author: null,
                }
              })
            } else {
              parsedMemories = []
            }
          } catch (e) {
            console.error("Error parsing memories:", e)
            parsedMemories = []
          }
        }

        setMemories(parsedMemories)

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
          setVirtualFlowers([])
        }
      } catch (err) {
        console.error("Error in MemorialPage:", err)
        setError("Failed to load memorial page. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Check for payment success from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get("payment_success")
    const flowerData = urlParams.get("flower_data")

    if (paymentSuccess === "true" && flowerData) {
      handlePaymentSuccess(flowerData)
    }
  }, [pageName, supabase])

  // Handle payment success and add flower to database
  const handlePaymentSuccess = async (flowerDataString: string) => {
    try {
      const flowerData = JSON.parse(decodeURIComponent(flowerDataString))

      // Now add the flower to the database after successful payment
      const { data, error } = await supabase
        .from("virtual_flowers")
        .insert({
          memorial_id: flowerData.memorial_id,
          sender_name: flowerData.sender_name,
          sender_id: flowerData.sender_id,
        })
        .select()

      if (error) {
        console.error("Error adding flower after payment:", error)
        return
      }

      if (data && data.length > 0) {
        // Add the new flower to the UI
        const newFlower: VirtualFlower = {
          ...data[0],
          sender_avatar: flowerData.sender_avatar || null,
          sender_id: flowerData.sender_id,
        }

        setVirtualFlowers((prev) => [newFlower, ...prev])

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } catch (err) {
      console.error("Error processing payment success:", err)
    }
  }

  // Modified to redirect to PayPal FIRST, then handle payment confirmation
  const handleSendVirtualFlower = async () => {
    if (!user || !memorial) {
      console.error("Cannot send flower: User or memorial is null")
      return
    }

    setIsSendingFlower(true)
    try {
      const senderName = user.profile?.full_name || user.profile?.username || user.email || "Anonymous"

      // Prepare flower data for after payment
      const flowerData = {
        memorial_id: memorial.id,
        sender_name: senderName,
        sender_id: user.id,
        sender_avatar: user.profile?.avatar_url || null,
      }

      // Encode flower data to pass through PayPal redirect
      const encodedFlowerData = encodeURIComponent(JSON.stringify(flowerData))

      // Create return URL with flower data
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment_success=true&flower_data=${encodedFlowerData}`

      // Redirect to PayPal FIRST - NO database operation yet
      console.log("Redirecting to PayPal for payment...")
      window.location.href = `https://www.paypal.com/ncp/payment/5L53UJ7NSJ6VA?return=${encodeURIComponent(returnUrl)}`
    } catch (err) {
      console.error("Error preparing flower payment:", err)
      setError("Failed to process payment. Please try again.")
    } finally {
      setIsSendingFlower(false)
    }
  }

  const handleNewMemory = (newContent: string, imageUrl?: string) => {
    // Refresh the page to show the new memory with all functionality
    router.refresh()
  }

  // Handle editing bio
  const handleEditBio = () => {
    if (!memorial) return
    setEditedBio(memorial.bio)
    setIsEditingBio(true)
  }

  // Handle canceling bio edit
  const handleCancelEditBio = () => {
    setIsEditingBio(false)
    setEditedBio("")
  }

  // Handle saving bio
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

  // Handle memorial deletion - only for creators
  const handleDeleteMemorial = async () => {
    if (!memorial || !isCurrentUserCreator) {
      setError("You don't have permission to delete this memorial.")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      // Delete in order: memories, flowers, then memorial
      // First delete virtual flowers
      const { error: flowersError } = await supabase.from("virtual_flowers").delete().eq("memorial_id", memorial.id)

      if (flowersError) {
        console.error("Error deleting flowers:", flowersError)
        // Continue anyway - don't fail the whole deletion
      }

      // Delete the memorial page (this should cascade to related data)
      const { error: memorialError } = await supabase
        .from("memorialpages212515")
        .delete()
        .eq("id", memorial.id)
        .eq("created_by", user?.id) // Extra security check

      if (memorialError) {
        throw memorialError
      }

      // Redirect to home or dashboard after successful deletion
      router.push("/")
    } catch (err) {
      console.error("Error deleting memorial:", err)
      setError(
        err instanceof Error
          ? `Failed to delete memorial: ${err.message}`
          : "Failed to delete memorial. Please try again.",
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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

  // Calculate years lived
  const getYearsLived = () => {
    if (!memorial?.date_of_birth || !memorial?.date_of_passing) return null
    const birth = new Date(memorial.date_of_birth)
    const passing = new Date(memorial.date_of_passing)
    const years = passing.getFullYear() - birth.getFullYear()
    return years
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentTheme.textColor.replace("text", "border")} mx-auto mb-4`}
          ></div>
          <p className="text-black">Loading memorial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <Button
            onClick={() => router.refresh()}
            variant="outline"
            className={`border-${currentTheme.name}-500 ${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
          >
            Try Again
          </Button>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 p-4">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="sticky top-4">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              <Card className="overflow-visible shadow-xl border-0">
                {/* Enhanced Header with FIXED avatar positioning */}
                <div
                  className={`relative h-64 ${getHeaderClasses()}`}
                  style={
                    currentHeaderStyle.name === "image" && headerImageUrl
                      ? { backgroundImage: `url(${headerImageUrl})` }
                      : {}
                  }
                >
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                  {/* Settings button for creators */}
                  {isCurrentUserCreator && (
                    <div className="absolute top-4 right-4 z-20">
                      <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                    </div>
                  )}

                  {/* FIXED Memorial Avatar - Proper positioning and sizing */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-30">
                    {isCurrentUserCreator && memorial ? (
                      <MemorialAvatarDialog
                        memorialId={memorial.id}
                        avatarUrl={memorial.memorial_avatar_url || null}
                        memorialName={memorial.name}
                      >
                        <div className="relative group cursor-pointer">
                          <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
                            {memorial.memorial_avatar_url ? (
                              <Image
                                src={memorial.memorial_avatar_url || "/placeholder.svg"}
                                alt={memorial.name}
                                width={128}
                                height={128}
                                className="object-cover w-full h-full rounded-full"
                                priority
                              />
                            ) : (
                              <div
                                className={`h-full w-full flex items-center justify-center ${currentTheme.superLightColor} rounded-full`}
                              >
                                <span className={`text-4xl ${currentTheme.textColor} font-serif`}>
                                  {memorial.name[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </MemorialAvatarDialog>
                    ) : memorial?.memorial_avatar_url ? (
                      <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
                        <Image
                          src={memorial.memorial_avatar_url || "/placeholder.svg"}
                          alt={memorial.name}
                          width={128}
                          height={128}
                          className="object-cover w-full h-full rounded-full"
                          priority
                        />
                      </div>
                    ) : (
                      <div
                        className={`h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center ${currentTheme.superLightColor}`}
                      >
                        <span className={`text-4xl ${currentTheme.textColor} font-serif`}>
                          {memorial?.name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="pt-24 pb-8">
                  {/* Memorial Name and Dates - Enhanced */}
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif text-black mb-3">{memorial?.name}</h1>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-black">
                      {memorial?.date_of_birth && memorial?.date_of_passing && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(memorial.date_of_birth).getFullYear()} -{" "}
                          {new Date(memorial.date_of_passing).getFullYear()}
                          {getYearsLived() && ` (${getYearsLived()} years)`}
                        </Badge>
                      )}

                      {memorial?.anniversary && (
                        <Badge
                          variant="outline"
                          className={`text-sm px-3 py-1 border-${currentTheme.name}-200 ${currentTheme.textColor}`}
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          Anniversary: {new Date(memorial.anniversary).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* FIXED Creator info - Proper avatar sizing and positioning */}
                  <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-black">Memorial created by</span>
                    <div className="flex items-center gap-2">
                      {isCurrentUserCreator && memorial?.creator ? (
                        <AvatarUploadDialog
                          userId={memorial.creator.id || memorial.created_by}
                          avatarUrl={memorial.creator.avatar_url}
                          username={memorial.creator.username}
                        >
                          <div className="relative group cursor-pointer">
                            <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                              <CustomAvatar
                                user={{
                                  id: memorial.creator.id || memorial.created_by,
                                  username: memorial.creator.username,
                                  avatar_url: memorial.creator.avatar_url,
                                  email: "",
                                  bio: null,
                                  created_at: "",
                                }}
                                size={32}
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Pencil className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </AvatarUploadDialog>
                      ) : (
                        <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                          <CustomAvatar
                            user={{
                              id: memorial?.creator?.id || memorial?.created_by || "",
                              username: memorial?.creator?.username || "Anonymous",
                              avatar_url: memorial?.creator?.avatar_url || null,
                              email: "",
                              bio: null,
                              created_at: "",
                            }}
                            size={32}
                          />
                        </div>
                      )}
                      <span className="font-medium text-black">{memorial?.creator?.username || "Anonymous"}</span>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Biography Section - Enhanced */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-serif text-black flex items-center gap-2">
                        <Heart className={`h-5 w-5 ${currentTheme.textColor}`} />
                        Life Story
                      </h2>
                      {isCurrentUserCreator && !isEditingBio && (
                        <Button
                          onClick={handleEditBio}
                          variant="ghost"
                          size="sm"
                          className={`${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {isEditingBio ? (
                      <div className="space-y-4">
                        <textarea
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          rows={6}
                          className={`w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentTheme.name}-500 focus:border-transparent resize-none`}
                          placeholder="Share the story of their life..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button onClick={handleCancelEditBio} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            size="sm"
                            className={`${currentTheme.color} ${currentTheme.hoverColor} text-white`}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isSavingBio ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-gray max-w-none">
                        <p className="text-black leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                          {memorial?.bio || "No biography has been written yet."}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-8" />

                  {/* Virtual Flowers Section - Enhanced */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif text-black flex items-center gap-2">
                        <Flower className={`h-5 w-5 ${currentTheme.textColor}`} />
                        Virtual Flowers
                        <Badge variant="secondary" className="ml-2">
                          {virtualFlowers.length}
                        </Badge>
                      </h2>
                    </div>

                    {user && (
                      <Button
                        onClick={handleSendVirtualFlower}
                        disabled={isSendingFlower}
                        className={`w-full mb-6 ${currentTheme.color} ${currentTheme.hoverColor} text-white h-12 text-lg`}
                      >
                        <Flower className="h-5 w-5 mr-2" />
                        {isSendingFlower ? "Redirecting to Payment..." : "Send Virtual Flower ($5)"}
                      </Button>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {virtualFlowers.length > 0 ? (
                        virtualFlowers.map((flower) => (
                          <Card
                            key={flower.id}
                            className={`p-4 text-center hover:shadow-md transition-shadow border-${currentTheme.name}-100`}
                          >
                            <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-gray-100">
                              <CustomAvatar
                                user={{
                                  id: flower.sender_id || "",
                                  username: flower.sender_name,
                                  avatar_url: flower.sender_avatar,
                                  email: "",
                                  bio: null,
                                  created_at: "",
                                }}
                                size={48}
                              />
                            </div>
                            <div className="text-sm font-medium text-black truncate">{flower.sender_name}</div>
                            <div className="text-xs text-black mt-1">
                              {new Date(flower.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-black">
                          <Flower className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg mb-2">No flowers yet</p>
                          <p className="text-sm">Be the first to send a virtual flower</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Enhanced Memory Sharing Section */}
                  {memorial && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif text-black flex items-center gap-2">
                          <MessageCircle className={`h-5 w-5 ${currentTheme.textColor}`} />
                          Share a Memory
                        </h2>
                        {user && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" />
                            Open to All
                          </Badge>
                        )}
                      </div>

                      {/* User Status Alert */}
                      {!user ? (
                        <Alert className="mb-6">
                          <UserPlus className="h-4 w-4" />
                          <AlertDescription>
                            Please{" "}
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium"
                              onClick={() => router.push("/login")}
                            >
                              sign in
                            </Button>{" "}
                            to share memories and send virtual flowers on this memorial page.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="mb-6 border-green-200 bg-green-50">
                          <Unlock className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>You can share memories!</strong> This memorial is open for anyone to contribute
                            memories, photos, and tributes.
                          </AlertDescription>
                        </Alert>
                      )}

                      {user && (
                        <AddMemoryForm
                          memorialId={memorial.id}
                          onMemoryAdded={handleNewMemory}
                          themeColor={currentTheme}
                        />
                      )}
                    </div>
                  )}

                  {/* Memories Feed - Enhanced */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif text-black flex items-center gap-2">
                        <Users className={`h-5 w-5 ${currentTheme.textColor}`} />
                        Memories
                        <Badge variant="secondary" className="ml-2">
                          {memories.length}
                        </Badge>
                      </h2>
                    </div>

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
                      <Card className="p-12 text-center bg-gray-50 border-dashed border-2 border-gray-200">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-black mb-2">No memories shared yet</h3>
                        <p className="text-black mb-4 leading-relaxed">
                          {user
                            ? "Be the first to share a cherished memory"
                            : "Sign in to be the first to share a memory"}
                        </p>
                        {user ? (
                          <Button
                            onClick={() => document.querySelector("textarea")?.focus()}
                            variant="outline"
                            className={`w-full border-${currentTheme.name}-200 ${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
                          >
                            Share First Memory
                          </Button>
                        ) : (
                          <Button
                            onClick={() => router.push("/login")}
                            variant="outline"
                            className={`w-full border-${currentTheme.name}-200 ${currentTheme.textColor} hover:bg-${currentTheme.name}-50`}
                          >
                            Sign In to Share
                          </Button>
                        )}
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Enhanced */}
          <div className="w-full lg:w-1/4">
            <div className="sticky top-4 space-y-6">
              {/* Memorial Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className={`h-5 w-5 ${currentTheme.textColor}`} />
                    Memorial Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black">Memories</span>
                    <Badge variant="secondary">{memories.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black">Virtual Flowers</span>
                    <Badge variant="secondary">{virtualFlowers.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black">Date Of Passing</span>
                    <span className="text-sm text-black">
                      {memorial && new Date(memorial.date_of_passing).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black">Sharing</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Unlock className="h-3 w-3 mr-1" />
                      Open
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* About Memorial Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About This Memorial</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-black mb-4 leading-relaxed">
                    This memorial page was created to honor and remember {memorial?.name}.
                    {user
                      ? " Share your memories, photos, and pay tribute by sending virtual flowers."
                      : " Sign in to share memories, photos, and send virtual flowers."}
                  </p>

                  <div className="space-y-3">
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
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Memorial
                    </Button>

                    {!user && (
                      <Button
                        onClick={() => router.push("/login")}
                        className={`w-full ${currentTheme.color} ${currentTheme.hoverColor} text-white`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign In to Contribute
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions for Creators */}
              {isCurrentUserCreator && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className={`h-5 w-5 ${currentTheme.textColor}`} />
                      Creator Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleEditBio}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Biography
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Palette className="h-4 w-4 mr-2" />
                      Change Theme
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Camera className="h-4 w-4 mr-2" />
                      Update Photos
                    </Button>

                    {/* Add delete button */}
                    <Separator className="my-2" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Memorial"}
                    </Button>

                    {/* Delete confirmation dialog */}
                    {showDeleteConfirm && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white">
                          <CardHeader>
                            <CardTitle className="text-red-600 flex items-center gap-2">
                              <Trash2 className="h-5 w-5" />
                              Delete Memorial
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <Alert className="border-red-200 bg-red-50">
                                <AlertDescription className="text-red-800">
                                  <strong>Warning:</strong> This action cannot be undone. All memories, photos, and
                                  virtual flowers will be permanently deleted.
                                </AlertDescription>
                              </Alert>

                              <p className="text-black">
                                Are you sure you want to delete the memorial for <strong>{memorial?.name}</strong>?
                              </p>

                              <div className="flex gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowDeleteConfirm(false)}
                                  disabled={isDeleting}
                                >
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteMemorial} disabled={isDeleting}>
                                  {isDeleting ? "Deleting..." : "Delete Forever"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Community Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-black space-y-2">
                    <p>• Share respectful memories and tributes</p>
                    <p>• Keep content appropriate and family-friendly</p>
                    <p>• Upload meaningful photos and stories</p>
                    <p>• Be kind and supportive to other contributors</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
