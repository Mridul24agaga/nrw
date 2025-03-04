import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { Post } from "@/components/post"
import { FollowButton } from "@/components/follow-button"
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog"
import { CustomAvatar } from "@/components/custom-avatar"
import { getFollowerCount, getFollowingCount, getFollowingStatus } from "@/actions/user-actions"
import type { User } from "@/lib/types"
import { Pencil } from 'lucide-react'
import { DebugAvatar } from "@/components/debug-avatar"

// Define the params type correctly for Next.js App Router
type PageProps = {
  params: Promise<{ username: string }>
}

// Generate static params for known usernames (optional)
export async function generateStaticParams() {
  // You can fetch known usernames here if needed
  return []
}

export default async function ProfilePage({ params }: PageProps) {
  // Resolve the params Promise to get the username
  const resolvedParams = await params
  const username = resolvedParams.username

  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

  // Fetch the user data
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

  if (userError || !userData) {
    console.error("Error fetching user:", userError)
    notFound()
  }

  const user = userData as User
  const isOwnProfile = session?.user?.id === user.id

  // Transform posts to match the expected shape for the Post component
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

  // Fetch follower and following counts using the new actions
  const [followersCount, followingCount, followingStatus] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
    session?.user ? getFollowingStatus(user.id) : Promise.resolve({ isFollowing: false }),
  ])

  // Force the component to be dynamic to prevent caching
  const timestamp = Date.now()
  const avatarUrlWithCache = user.avatar_url ? `${user.avatar_url}?t=${timestamp}` : null

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:w-[300px] lg:shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="rounded-xl bg-white shadow p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:jusify-between gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {isOwnProfile ? (
                    <AvatarUploadDialog userId={user.id} avatarUrl={user.avatar_url} username={user.username || ""}>
                      <div className="relative group cursor-pointer">
                        <div className="h-20 w-20 rounded-full overflow-hidden">
                          <CustomAvatar user={{ ...user, avatar_url: avatarUrlWithCache }} size={80} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </AvatarUploadDialog>
                  ) : (
                    <div className="h-20 w-20 rounded-full overflow-hidden">
                      <CustomAvatar user={{ ...user, avatar_url: avatarUrlWithCache }} size={80} />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{user.username || "Anonymous"}</h1>
                    <p className="text-black text-sm sm:text-base">{user.bio || "No bio available"}</p>
                  </div>
                </div>
                {!isOwnProfile && session?.user && (
                  <FollowButton userId={user.id} initialIsFollowing={followingStatus.isFollowing} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm sm:text-base text-black">
                <span>
                  {posts.length} post{posts.length !== 1 ? "s" : ""}
                </span>
                <span>
                  {followersCount} follower{followersCount !== 1 ? "s" : ""}
                </span>
                <span>{followingCount} following</span>
              </div>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
            {isOwnProfile && (
              <div className="mt-8">
                <DebugAvatar userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}