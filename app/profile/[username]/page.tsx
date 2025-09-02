"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import Sidebar from "@/components/sidebar"
import {
  Camera,
  Edit,
  Save,
  X,
  MapPin,
  Calendar,
  MessageCircle,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ChevronDown,
  Heart,
  MessageSquare,
  Clock,
} from "lucide-react"

// Post Component (integrated in the same file)
function Post({ post, currentUser }: { post: any; currentUser?: any }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  useEffect(() => {
    // Parse likes and comments from jsonb
    const likes = post.likes ? (typeof post.likes === "string" ? JSON.parse(post.likes) : post.likes) : []
    const comments = post.comments
      ? typeof post.comments === "string"
        ? JSON.parse(post.comments)
        : post.comments
      : []

    setLikesCount(Array.isArray(likes) ? likes.length : 0)
    setCommentsCount(Array.isArray(comments) ? comments.length : 0)

    // Check if current user has liked the post
    if (currentUser && Array.isArray(likes)) {
      setIsLiked(likes.includes(currentUser.id))
    }
  }, [post, currentUser])

  const handleLike = async () => {
    if (!currentUser) return

    try {
      // Get current likes
      const { data: postData } = await supabase.from("posts").select("likes").eq("id", post.id).single()

      if (!postData) return

      // Parse likes
      const likes = postData.likes
        ? typeof postData.likes === "string"
          ? JSON.parse(postData.likes)
          : postData.likes
        : []

      // Update likes
      let newLikes
      if (isLiked) {
        newLikes = Array.isArray(likes) ? likes.filter((id: string) => id !== currentUser.id) : []
      } else {
        newLikes = Array.isArray(likes) ? [...likes, currentUser.id] : [currentUser.id]
      }

      // Update post
      await supabase.from("posts").update({ likes: newLikes }).eq("id", post.id)

      // Update UI
      setIsLiked(!isLiked)
      setLikesCount(newLikes.length)
    } catch (error) {
      console.error("Error updating like:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white">
      <div className="flex items-center mb-4">
        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
          <Image
            src={post.user?.avatar_url || "/placeholder.svg"}
            alt={`${post.user?.username || "User"}'s avatar`}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <p className="font-semibold text-black">{post.user?.username || "Anonymous"}</p>
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(post.created_at)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-black whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="flex items-center justify-between text-gray-500 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center ${isLiked ? "text-red-500" : "hover:text-gray-700"}`}
        >
          <Heart className={`w-5 h-5 mr-1 ${isLiked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </button>

        <button className="flex items-center hover:text-gray-700">
          <MessageSquare className="w-5 h-5 mr-1" />
          <span>{commentsCount}</span>
        </button>
      </div>
    </div>
  )
}

// Relationship Button Component (integrated in the same file)
function RelationshipButton({
  userId,
  initialRelationship,
  onRelationshipChange,
}: {
  userId: string
  initialRelationship: string | null
  onRelationshipChange?: (relationship: string | null) => void
}) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const [relationship, setRelationship] = useState<string | null>(initialRelationship)
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  async function handleRelationshipChange(newRelationship: string | null) {
    if (isLoading) return
    setIsLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) {
        alert("You must be logged in to perform this action")
        return
      }

      const currentUserId = sessionData.session.user.id

      // If removing relationship
      if (newRelationship === null && relationship !== null) {
        await supabase.from("user_relationships").delete().eq("user_id", currentUserId).eq("related_user_id", userId)
      }
      // If changing relationship
      else if (relationship !== null && newRelationship !== null && relationship !== newRelationship) {
        await supabase
          .from("user_relationships")
          .update({ relationship_type: newRelationship })
          .eq("user_id", currentUserId)
          .eq("related_user_id", userId)
      }
      // If creating new relationship
      else if (newRelationship !== null) {
        await supabase.from("user_relationships").insert({
          user_id: currentUserId,
          related_user_id: userId,
          relationship_type: newRelationship,
        })
      }

      setRelationship(newRelationship)
      if (onRelationshipChange) {
        onRelationshipChange(newRelationship)
      }
    } catch (error) {
      console.error("Error updating relationship:", error)
      alert("Failed to update relationship. Please try again.")
    } finally {
      setIsLoading(false)
      setIsMenuOpen(false)
    }
  }

  // Determine button appearance based on relationship
  let buttonContent
  let buttonClass = "px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors"

  if (relationship === "follow") {
    buttonContent = (
      <>
        <UserCheck className="w-4 h-4 mr-2" />
        Following
      </>
    )
    buttonClass += " bg-purple-100 text-purple-700 hover:bg-purple-200"
  } else if (relationship === "block") {
    buttonContent = (
      <>
        <UserX className="w-4 h-4 mr-2" />
        Blocked
      </>
    )
    buttonClass += " bg-red-100 text-red-700 hover:bg-red-200"
  } else {
    buttonContent = (
      <>
        <UserPlus className="w-4 h-4 mr-2" />
        Follow
      </>
    )
    buttonClass += " bg-purple-600 text-white hover:bg-purple-700"
  }

  return (
    <div className="relative">
      <div className="flex">
        <button
          onClick={() => {
            if (relationship === null) {
              handleRelationshipChange("follow")
            } else if (relationship === "follow") {
              handleRelationshipChange(null)
            } else {
              setIsMenuOpen(!isMenuOpen)
            }
          }}
          disabled={isLoading}
          className={buttonClass}
        >
          {isLoading ? "Loading..." : buttonContent}
        </button>

        {relationship !== null && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="ml-1 px-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1 border border-gray-200">
          {relationship !== "follow" && (
            <button
              onClick={() => handleRelationshipChange("follow")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </button>
          )}
          {relationship !== "block" && (
            <button
              onClick={() => handleRelationshipChange("block")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <UserX className="w-4 h-4 mr-2" />
              Block
            </button>
          )}
          <button
            onClick={() => handleRelationshipChange(null)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center border-t border-gray-100"
          >
            Remove relationship
          </button>
        </div>
      )}
    </div>
  )
}

// Main Profile Page Component
export default function ProfilePage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const params = useParams()
  const username = params?.username as string

  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [relationship, setRelationship] = useState<string | null>(null)
  const [isLoadingRelationship, setIsLoadingRelationship] = useState<boolean>(true)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false)
  const [editedBio, setEditedBio] = useState<string>("")
  const [isSavingBio, setIsSavingBio] = useState<boolean>(false)

  // Stats
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
  })

  useEffect(() => {
    async function fetchUser() {
      const { data: sessionData } = await supabase.auth.getSession()
      setSession(sessionData?.session)

      const { data: userData, error } = await supabase.from("users").select("*").eq("username", username).single()

      if (error || !userData) {
        console.error("Error fetching user:", error)
        notFound()
        return
      }

      setUser(userData)
      setAvatarUrl(userData.avatar_url)

      // If viewing own profile and no avatar yet, try syncing from Google metadata
      const googleAvatarUrl = (sessionData?.session?.user as any)?.user_metadata?.avatar_url || (sessionData?.session?.user as any)?.user_metadata?.picture || null
      if (sessionData?.session?.user?.id === userData.id && !userData.avatar_url && googleAvatarUrl) {
        try {
          await supabase.from("users").update({ avatar_url: googleAvatarUrl }).eq("id", userData.id)
          setAvatarUrl(googleAvatarUrl)
        } catch (syncErr) {
          console.error("Profile page avatar sync error:", syncErr)
        }
      }
      setEditedBio(userData.bio || "")

      // Fetch relationship stats using the user_relationships table
      const { count: followersCount } = await supabase
        .from("user_relationships")
        .select("*", { count: "exact", head: true })
        .eq("related_user_id", userData.id)
        .eq("relationship_type", "follow")

      const { count: followingCount } = await supabase
        .from("user_relationships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id)
        .eq("relationship_type", "follow")

      // Fetch posts from the posts table
      const {
        data: postsData,
        error: postsError,
        count: postsCount,
      } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          created_at,
          updated_at,
          likes,
          comments,
          user:user_id (
            id,
            username,
            avatar_url
          )
        `,
          { count: "exact" },
        )
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })

      if (postsError) {
        console.error("Error fetching posts:", postsError)
      } else {
        setPosts(postsData || [])
      }

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0,
      })

      setIsLoadingPosts(false)

      // Check current user's relationship with this profile
      if (sessionData?.session?.user) {
        const { data: relationshipData, error: relationshipError } = await supabase
          .from("user_relationships")
          .select("relationship_type")
          .eq("user_id", sessionData.session.user.id)
          .eq("related_user_id", userData.id)
          .single()

        if (relationshipError && relationshipError.code !== "PGRST116") {
          console.error("Error checking relationship status:", relationshipError)
        }

        setRelationship(relationshipData?.relationship_type || null)
        setIsLoadingRelationship(false)
      } else {
        setIsLoadingRelationship(false)
      }
    }

    if (username) {
      fetchUser()
    }
  }, [supabase, username])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-300 h-24 w-24 mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-64"></div>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.id === user.id

  async function handleAvatarUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!fileInputRef.current?.files) return
    const file = fileInputRef.current.files[0]

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/user-upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await res.json()
      const url = data.avatar_url || data.url

      await supabase.from("users").update({ avatar_url: url }).eq("id", user.id)
      setAvatarUrl(url)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
    }
  }

  const handleEditBio = () => {
    setIsEditingBio(true)
    setEditedBio(user.bio || "")
  }

  const handleSaveBio = async () => {
    if (!isOwnProfile) return

    setIsSavingBio(true)

    try {
      const { error } = await supabase.from("users").update({ bio: editedBio }).eq("id", user.id)

      if (error) throw error

      // Update local state
      setUser({
        ...user,
        bio: editedBio,
      })

      setIsEditingBio(false)
    } catch (error) {
      console.error("Error updating bio:", error)
      alert("Failed to update bio. Please try again.")
    } finally {
      setIsSavingBio(false)
    }
  }

  const handleCancelEditBio = () => {
    setIsEditingBio(false)
    setEditedBio(user.bio || "")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          <div className="flex-1 max-w-4xl">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
              {/* Cover Photo */}
              <div className="relative h-60 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500">
                {/* Avatar */}
                <div className="absolute -bottom-16 left-8 md:left-12">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl || "/placeholder.svg"}
                          alt={`${user.username}'s avatar`}
                          width={128}
                          height={128}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-400 to-indigo-600 text-white text-3xl font-bold">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    {isOwnProfile && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full"></div>
                        <button
                          type="button"
                          className="relative z-10 p-2 bg-white rounded-full shadow-md"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-5 h-5 text-gray-700" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          required
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleAvatarUpload(e)
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Relationship Button */}
                <div className="absolute bottom-6 right-6">
                  {!isOwnProfile && session?.user && !isLoadingRelationship && (
                    <RelationshipButton
                      userId={user.id}
                      initialRelationship={relationship}
                      onRelationshipChange={(newRelationship) => {
                        setRelationship(newRelationship)
                        // Update follower count if relationship changed
                        if (newRelationship === "follow" && relationship !== "follow") {
                          setStats((prev) => ({ ...prev, followers: prev.followers + 1 }))
                        } else if (newRelationship === null && relationship === "follow") {
                          setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }))
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-20 px-8 pb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-black">{user.username}</h1>
                    <p className="text-gray-500 mt-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.location || "No location set"}
                    </p>
                    <p className="text-gray-500 mt-1 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined{" "}
                      {new Date(user.created_at || Date.now()).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black">{stats.posts}</p>
                      <p className="text-sm text-gray-500">Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black">{stats.followers}</p>
                      <p className="text-sm text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black">{stats.following}</p>
                      <p className="text-sm text-gray-500">Following</p>
                    </div>
                  </div>
                </div>

                {/* Bio section */}
                <div className="mt-6 bg-gray-50 rounded-xl p-6">
                  {isEditingBio ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="Write something about yourself..."
                        maxLength={280}
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">{editedBio.length}/280 characters</div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isSavingBio ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEditBio}
                            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <h3 className="text-lg font-semibold mb-2 text-black">About</h3>
                      <p className="text-black leading-relaxed">{user.bio || "No bio available"}</p>
                      {isOwnProfile && (
                        <button
                          onClick={handleEditBio}
                          className="absolute top-0 right-0 text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {user.bio ? "Edit" : "Add Bio"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-black flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-purple-600" />
                Posts
              </h2>

              {isLoadingPosts ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-5 animate-pulse">
                      <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} currentUser={session?.user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-black mb-2">No posts yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {isOwnProfile
                      ? "Share your thoughts with the world by creating your first post!"
                      : `${user.username} hasn't posted anything yet.`}
                  </p>
                  {isOwnProfile && (
                    <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Create Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
