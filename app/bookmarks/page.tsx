import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { Post } from "@/components/post"

// Define types for our data structure
type User = {
  username: string | null
  avatar_url: string | null
}

type BookmarkedPost = {
  id: string
  content: string
  user_id: string
  created_at: string
  user: User
}

export default async function BookmarkPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch bookmarked posts
  const { data: bookmarks, error } = await supabase
    .from("post_bookmarks")
    .select(`
      post:posts (
        id,
        content,
        created_at,
        user_id,
        user:users (
          username,
          avatar_url
        )
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookmarks:", error)
  }

  // Process the bookmarks data
  const bookmarkedPosts = ((bookmarks as any[]) || [])
    .map((bookmark) => {
      const post = bookmark.post
      if (Array.isArray(post) && post.length > 0) {
        // If post is an array, take the first item
        return post[0]
      }
      return post
    })
    .filter(
      (post): post is BookmarkedPost =>
        post != null &&
        typeof post.id === "string" &&
        typeof post.content === "string" &&
        typeof post.user_id === "string" &&
        typeof post.created_at === "string" &&
        post.user != null &&
        typeof post.user.username === "string" &&
        (post.user.avatar_url == null || typeof post.user.avatar_url === "string"),
    )

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-black">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Hidden on mobile, visible on large screens */}
          <div className="hidden lg:block lg:w-[240px] lg:shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full max-w-2xl mx-auto lg:max-w-none">
            {bookmarkedPosts.length > 0 ? (
              <div className="space-y-4">
                {bookmarkedPosts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center py-8">You haven&apos;t bookmarked any posts yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

