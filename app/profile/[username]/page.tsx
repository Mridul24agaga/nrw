import { createClient } from "@/utils/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Sidebar from "@/components/sidebar"
import { Post } from "@/components/post"
import { FollowButton } from "@/components/follow-button"
import { getFollowerCount, getFollowingCount, getFollowingStatus } from "@/actions/user-actions"
import type { User } from "@/lib/types"
import { AvatarUploadButton } from "@/components/avatar-upload-button"
import { Calendar } from "lucide-react"

interface PageProps {
  params: Promise<{ username: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  // Resolve params
  const resolvedParams = await params
  const username = resolvedParams.username

  // Resolve searchParams if needed
  if (searchParams) await searchParams

  // Initialize Supabase client
  const supabase = await createClient()

  // Get current user session
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      posts (
        id,
        content,
        user_id,
        created_at,
        last_updated,
        user:users!posts_user_id_fkey (id, username, avatar_url)
      )
    `)
    .eq("username", username)
    .single()

  // Handle user not found
  if (userError || !userData) {
    console.error("Error fetching user:", userError)
    notFound()
  }

  // Cast to User type and check if profile belongs to current user
  const user = userData as User
  const isOwnProfile = session?.user?.id === user.id

  // Format posts data
  const posts = (user.posts || []).map((post) => ({
    id: post.id,
    content: post.content,
    user_id: post.user_id,
    created_at: post.created_at,
    user: {
      id: post.user?.id || post.user_id,
      username: post.user?.username || user.username,
      avatar_url: post.user?.avatar_url || user.avatar_url,
    },
  }))

  // Fetch follower and following counts
  const [followersCount, followingCount, followingStatus] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
    session?.user ? getFollowingStatus(user.id) : Promise.resolve({ isFollowing: false }),
  ])

  // Add cache-busting parameter to avatar URL
  const timestamp = Date.now()
  const avatarUrlWithCache = user.avatar_url ? `${user.avatar_url}?t=${timestamp}` : null

  // Format join date
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {/* Avatar */}
                <div className="absolute -bottom-12 left-8">
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden">
                    {avatarUrlWithCache ? (
                      <Image
                        src={avatarUrlWithCache || "/placeholder.svg"}
                        alt={`${user.username}'s profile`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200">
                        <span className="text-3xl font-bold text-gray-500">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button or Follow Button */}
                <div className="absolute bottom-4 right-4">
                  {isOwnProfile ? (
                    <AvatarUploadButton />
                  ) : (
                    session?.user && <FollowButton userId={user.id} initialIsFollowing={followingStatus.isFollowing} />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-16 pb-6 px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{user.username || "Anonymous"}</h1>
                    <p className="text-gray-600 mt-1">{user.bio || "No bio available"}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {joinDate || "Unknown"}</span>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex flex-wrap gap-6 mt-6 border-t pt-6">
                  <div className="text-center">
                    <div className="font-bold text-lg">{posts.length}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{followersCount}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{followingCount}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Posts</h2>

              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post) => <Post key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No posts yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

