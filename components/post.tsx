"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase-client"
import Image from "next/image"
import { PostActions } from "./post-actions"
import { FollowButton } from "./follow-button"
import { formatDistanceToNow } from "date-fns"
import { CustomAvatar } from "./custom-avatar"
import type { User } from "@/lib/types"

interface PostProps {
  post: {
    id: string
    content: string
    user_id: string
    created_at: string
    image_url?: string | null
    repost_of?: string | null
    user: {
      id?: string
      username: string | null
      avatar_url: string | null
    }
    reposted_by?: {
      username: string | null
    } | null
  }
}

export function Post({ post }: PostProps) {
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [originalPost, setOriginalPost] = useState<any | null>(null)
  const [repostCount, setRepostCount] = useState(0)
  const [isReposted, setIsReposted] = useState(false)

  const targetPostId = post.repost_of || post.id

  // Function to fetch like and bookmark status
  const fetchUserInteractions = async (userId: string) => {
    if (!userId) return

    try {
      // Fix: Use maybeSingle() instead of single() to handle cases where no record exists
      const [userLikeResult, userBookmarkResult] = await Promise.all([
        supabase.from("post_likes").select("*").eq("post_id", targetPostId).eq("user_id", userId).maybeSingle(),
        supabase.from("post_bookmarks").select("*").eq("post_id", targetPostId).eq("user_id", userId).maybeSingle(),
      ])

      // Check for errors
      if (userLikeResult.error && userLikeResult.error.code !== "PGRST116") {
        console.error("Error fetching user likes:", userLikeResult.error)
      }
      if (userBookmarkResult.error && userBookmarkResult.error.code !== "PGRST116") {
        console.error("Error fetching user bookmarks:", userBookmarkResult.error)
      }

      setIsLiked(!!userLikeResult.data)
      setIsBookmarked(!!userBookmarkResult.data)
    } catch (error) {
      console.error("Error in fetchUserInteractions:", error)
    }
  }

  // Function to fetch counts
  const fetchCounts = async () => {
    try {
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", targetPostId),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("post_id", targetPostId),
      ])

      // Check for errors
      if (likesResult.error) {
        console.error("Error fetching like count:", likesResult.error)
      }
      if (commentsResult.error) {
        console.error("Error fetching comment count:", commentsResult.error)
      }

      setLikeCount(likesResult.count ?? 0)
      setCommentCount(commentsResult.count ?? 0)
    } catch (error) {
      console.error("Error in fetchCounts:", error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error fetching user:", userError)
          return
        }

        setUser(user)

        if (user) {
          await fetchUserInteractions(user.id)
        }

        await fetchCounts()

        // If this is a repost, fetch original post and counts
        if (post.repost_of) {
          const [{ data: orig }, { count: repostsCount }, userRepost] = await Promise.all([
            supabase
              .from("posts")
              .select(
                `*, user:user_id (username, avatar_url)`
              )
              .eq("id", post.repost_of)
              .maybeSingle(),
            supabase.from("posts").select("id", { count: "exact", head: true }).eq("repost_of", post.repost_of),
            user ? supabase.from("posts").select("id").eq("repost_of", post.repost_of).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null })
          ])

          if (orig) setOriginalPost(orig)
          setRepostCount(repostsCount ?? 0)
          // @ts-ignore safe access if provided
          setIsReposted(!!userRepost?.data)
        } else {
          // Not a repost; compute repost count for this post as original
          const { count } = await supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("repost_of", post.id)
          setRepostCount(count ?? 0)
          if (user) {
            const { data: userRepost } = await supabase
              .from("posts")
              .select("id")
              .eq("repost_of", post.id)
              .eq("user_id", user.id)
              .maybeSingle()
            setIsReposted(!!userRepost)
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
      }
    }

    fetchData()

    // Set up real-time subscriptions for likes and comments
    const likesSubscription = supabase
      .channel(`post-likes-${targetPostId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
          filter: `post_id=eq.${targetPostId}`,
        },
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
      .channel(`post-comments-${targetPostId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${targetPostId}`,
        },
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
  }, [supabase, targetPostId, user?.id])

  const username = post.user.username || "Anonymous"
  const isRepost = !!post.repost_of
  const contentPost = isRepost && originalPost ? originalPost : post
  const headerUser = isRepost && originalPost ? originalPost.user : post.user

  // Create a properly typed user object for CustomAvatar
  const avatarUser = {
    id: (post.user.id as string) || "",
    username: headerUser?.username,
    avatar_url: headerUser?.avatar_url,
    bio: null,
    created_at: contentPost.created_at,
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

  // Format timestamp for better mobile display
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      // For recent posts, show hours or minutes
      return formatDistanceToNow(date, { addSuffix: false })
    } else {
      // For older posts, show date in MMM D format
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  return (
    <article className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="px-3 py-3 sm:px-4">
        <div className="flex">
          {/* Left column - Avatar */}
          <div className="flex-shrink-0 mr-2 sm:mr-3">
            <CustomAvatar user={avatarUser} size={40} className="rounded-full" />
          </div>

          {/* Right column - Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with username and follow button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center text-sm">
                <span className="font-bold text-gray-900 hover:underline truncate max-w-[120px] sm:max-w-none">
                  {headerUser?.username || username}
                </span>
                {/* Only show date on desktop */}
                <div className="hidden sm:flex items-center">
                  <span className="text-gray-500 mx-1">·</span>
                  <span className="text-gray-500 hover:underline text-sm">
                    {formatTimestamp(new Date(contentPost.created_at))}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Follow button - only show if not the current user */}
                {user?.id !== post.user_id && <FollowButton userId={post.user_id} initialIsFollowing={isFollowing} />}
              </div>
            </div>

            {isRepost && (
              <div className="text-xs text-gray-500">Reposted by {post.user.username || "Anonymous"}</div>
            )}

            {/* Post content */}
            <div className="mt-1 text-gray-900 text-sm sm:text-base">
              {isRepost && !originalPost ? (
                <p className="whitespace-pre-wrap break-words leading-normal text-gray-500">Original post is unavailable</p>
              ) : (
                <p className="whitespace-pre-wrap break-words leading-normal">{contentPost.content}</p>
              )}
            </div>

            {/* Post image if any */}
            {contentPost.image_url && (
              <div className="mt-2 sm:mt-3 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200">
                <Image
                  src={contentPost.image_url || "/placeholder.svg"}
                  alt="Post image"
                  width={600}
                  height={400}
                  className="object-cover w-full max-h-[300px] sm:max-h-[500px]"
                  priority={true}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-2 sm:mt-3 flex justify-between">
              <PostActions
                postId={isRepost ? post.repost_of || post.id : post.id}
                initialLikeCount={likeCount}
                initialCommentCount={commentCount}
                initialRepostCount={repostCount}
                isLiked={isLiked}
                isBookmarked={isBookmarked}
                isReposted={isReposted}
                postUserId={contentPost.user_id}
                currentUserId={user?.id}
                ownPostId={post.id}
                ownPostUserId={post.user_id}
                onLikeChange={handleLikeChange}
                onBookmarkChange={handleBookmarkChange}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
