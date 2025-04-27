"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { PostActions } from "./post-actions"
import { FollowButton } from "./follow-button"
import { formatDistanceToNow } from "date-fns"
import { CustomAvatar } from "./custom-avatar"
import type { User } from "@/lib/types" // Import the actual User type

interface PostProps {
  post: {
    id: string
    content: string
    user_id: string
    created_at: string
    image_url?: string | null
    user: {
      id?: string
      username: string | null
      avatar_url: string | null
    }
  }
}

export function Post({ post }: PostProps) {
  const supabase = createClientComponentClient()

  const [user, setUser] = useState<any>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)

  // Function to fetch like and bookmark status
  const fetchUserInteractions = async (userId: string) => {
    if (!userId) return

    const [userLike, userBookmark] = await Promise.all([
      supabase.from("post_likes").select().eq("post_id", post.id).eq("user_id", userId).single(),
      supabase.from("post_bookmarks").select().eq("post_id", post.id).eq("user_id", userId).single(),
    ])

    setIsLiked(!!userLike.data)
    setIsBookmarked(!!userBookmark.data)
  }

  // Function to fetch counts
  const fetchCounts = async () => {
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from("post_likes").select("*", { count: "exact" }).eq("post_id", post.id),
      supabase.from("post_comments").select("*", { count: "exact" }).eq("post_id", post.id),
    ])

    setLikeCount(likesResult.count ?? 0)
    setCommentCount(commentsResult.count ?? 0)
  }

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchUserInteractions(user.id)
      }

      await fetchCounts()
    }

    fetchData()

    // Set up real-time subscriptions for likes and comments
    const likesSubscription = supabase
      .channel("post-likes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes", filter: `post_id=eq.${post.id}` },
        (payload) => {
          // Refresh counts and user interaction status when likes change
          fetchCounts()
          if (user?.id) {
            fetchUserInteractions(user.id)
          }
        },
      )
      .subscribe()

    const commentsSubscription = supabase
      .channel("post-comments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${post.id}` },
        () => {
          fetchCounts()
        },
      )
      .subscribe()

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(likesSubscription)
      supabase.removeChannel(commentsSubscription)
    }
  }, [supabase, post.id])

  const username = post.user.username || "Anonymous"

  // Create a properly typed user object for CustomAvatar
  const avatarUser = {
    id: post.user.id || "",
    username: post.user.username,
    avatar_url: post.user.avatar_url,
    bio: null,
    created_at: post.created_at,
    email: "",
  } as User

  // Handle like state changes from PostActions
  const handleLikeChange = (newIsLiked: boolean) => {
    setIsLiked(newIsLiked)
    // Update count immediately for better UX
    setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)))
  }

  // Handle bookmark state changes
  const handleBookmarkChange = (newIsBookmarked: boolean) => {
    setIsBookmarked(newIsBookmarked)
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-sm hover:bg-slate-50/50 transition-colors px-4 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-3 sm:p-4 px-0">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 border-2 border-primary rounded-full overflow-hidden">
              <CustomAvatar user={avatarUser} size={40} className="border-none" />
            </div>
            <div className="flex flex-col">
              <p className="font-semibold text-sm text-black">{username}</p>
              <p className="text-xs text-black">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {user?.id !== post.user_id && <FollowButton userId={post.user_id} initialIsFollowing={isFollowing} />}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 px-0">
        <p className="text-sm leading-relaxed text-black whitespace-pre-wrap break-words">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <Image
              src={post.image_url || "/placeholder.svg"}
              alt="Post image"
              width={600}
              height={400}
              className="object-cover w-full max-h-[500px]"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 pt-0 px-0 flex flex-col items-start space-y-4">
        <hr className="w-full border-t border-gray-200" />
        <PostActions
          postId={post.id}
          initialLikeCount={likeCount}
          initialCommentCount={commentCount}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          postUserId={post.user_id}
          currentUserId={user?.id}
          onLikeChange={handleLikeChange}
          onBookmarkChange={handleBookmarkChange}
        />
      </div>
    </div>
  )
}
