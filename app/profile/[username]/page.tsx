import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Sidebar from "@/components/sidebar"
import WhoToFollow from "@/components/who-to-follow"
import { Post } from "@/components/post"
import { FollowButton } from "@/components/follow-button"
import { getFollowerCount, getFollowingCount, getFollowingStatus } from "@/actions/user-actions"
import type { Post as PostType, User } from "@/lib/types"

type Props = {
  params: { username: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = params

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
  const posts = (user.posts || []) as PostType[]

  // Fetch follower and following counts using the new actions
  const [followersCount, followingCount, followingStatus] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
    session?.user ? getFollowingStatus(user.id) : Promise.resolve({ isFollowing: false }),
  ])

  // Get the first letter of username for avatar fallback
  const avatarFallback = (user.username || "?").charAt(0).toUpperCase()

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.username || "User avatar"}
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
                    )}
                  </Avatar>
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
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:w-[280px] lg:shrink-0">
            <div className="sticky top-20">
              <WhoToFollow />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

