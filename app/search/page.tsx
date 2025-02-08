import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { getFollowingStatus } from "@/actions/user-actions"

interface SearchPageProps {
  searchParams: { q: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = createServerComponentClient({ cookies })
  const query = searchParams.q

  if (!query) {
    notFound()
  }

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // First get matching users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, username")
    .ilike("username", `%${query}%`)
    .limit(10)

  if (usersError) {
    console.error("Error fetching users:", usersError.message)
    return <div className="container mx-auto px-4 py-8">Error fetching users. Please try again.</div>
  }

  // For each user, get their follower count and following status
  const usersWithData = await Promise.all(
    users.map(async (user) => {
      const [{ count }, followingStatus] = await Promise.all([
        supabase
          .from("user_relationships")
          .select("*", { count: "exact" })
          .eq("related_user_id", user.id)
          .eq("relationship_type", "follow"),
        currentUser ? getFollowingStatus(user.id) : { isFollowing: false },
      ])

      return {
        ...user,
        follower_count: count || 0,
        isFollowing: followingStatus.isFollowing,
      }
    }),
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 px-2">Search Results for "{query}"</h1>
      {usersWithData.length === 0 ? (
        <p className="px-2">No users found matching "{query}"</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {usersWithData.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-4 flex-grow min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback>{(user.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold truncate">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.follower_count} followers</p>
                    </div>
                  </Link>
                  {currentUser && currentUser.id !== user.id && (
                    <div className="shrink-0">
                      <FollowButton userId={user.id} initialIsFollowing={user.isFollowing} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

