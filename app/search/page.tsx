import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { getFollowingStatus } from "@/actions/user-actions"
import { BookOpen } from "lucide-react"

interface SearchPageProps {
  searchParams: Promise<{ q: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = createServerComponentClient({ cookies })
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q

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

  // Get matching memorial pages - only using page_name
  const { data: memorialPages, error: memorialError } = await supabase
    .from("memorialpages212515")
    .select("id, page_name")
    .ilike("page_name", `%${query}%`)
    .limit(10)

  if (memorialError) {
    console.error("Error fetching memorial pages:", memorialError.message)
    return <div className="container mx-auto px-4 py-8">Error fetching memorial pages. Please try again.</div>
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
    <div className="container mx-auto px-4 py-8 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-black border-b pb-4">Search Results for "{query}"</h1>

      {/* Memorial Pages Section */}
      {memorialPages && memorialPages.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-black">Memorial Pages</h2>
          <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {memorialPages.map((page) => (
              <Card key={page.id} className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Link href={`/memorial/${page.page_name}`} className="block p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-gray-100 rounded-full">
                        <BookOpen className="h-7 w-7 text-black" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-lg text-black truncate">{page.page_name}</p>
                        <p className="text-sm text-black">Memorial Page</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-5 text-black">Users</h2>
        {usersWithData.length === 0 ? (
          <p className="text-black text-lg">No users found matching "{query}"</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {usersWithData.map((user) => (
              <Card key={user.id} className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center p-5">
                    <Link href={`/profile/${user.username}`} className="flex items-center gap-4 flex-grow min-w-0">
                      <Avatar className="h-14 w-14 shrink-0 border-2 border-gray-200">
                        <AvatarFallback className="bg-gray-100 text-black font-bold">
                          {(user.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-lg text-black truncate">{user.username}</p>
                        <p className="text-sm text-black">{user.follower_count} followers</p>
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

      {/* Show message if no results found at all */}
      {usersWithData.length === 0 && (!memorialPages || memorialPages.length === 0) && (
        <p className="text-lg text-black">No results found matching "{query}"</p>
      )}
    </div>
  )
}
