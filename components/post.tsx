"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { PostActions } from "./post-actions"
import { FollowButton } from "./follow-button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/seperator"
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

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      // Use Promise.all to fetch all data concurrently
      const [likesResult, commentsResult, userLike, userBookmark] = await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact" }).eq("post_id", post.id),
        supabase.from("post_comments").select("*", { count: "exact" }).eq("post_id", post.id),
        supabase.from("post_likes").select().eq("post_id", post.id).eq("user_id", user?.id).single(),
        supabase.from("post_bookmarks").select().eq("post_id", post.id).eq("user_id", user?.id).single(),
      ])

      // Handle the count safely, ensuring we always set a number
      setLikeCount(likesResult.count ?? 0)
      setCommentCount(commentsResult.count ?? 0)
      setIsLiked(!!userLike?.data)
      setIsBookmarked(!!userBookmark?.data)
    }

    fetchData()
  }, [supabase, post.id])

  const username = post.user.username || "Anonymous"

  // Create a properly typed user object for CustomAvatar
  // Using type assertion to handle the missing required fields
  const avatarUser = {
    id: post.user.id || "",
    username: post.user.username,
    avatar_url: post.user.avatar_url,
    bio: null,
    created_at: post.created_at, // Use the post's created_at as a fallback
    email: "",
  } as User

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-sm hover:bg-slate-50/50 transition-colors px-4">
      <CardHeader className="p-3 sm:p-4 px-0">
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
      </CardHeader>
      <CardContent className="p-3 sm:p-4 px-0">
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
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 px-0 flex flex-col items-start space-y-4">
        <Separator className="w-full" />
        <PostActions
          postId={post.id}
          initialLikeCount={likeCount}
          initialCommentCount={commentCount}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          postUserId={post.user_id}
          currentUserId={user?.id}
        />
      </CardFooter>
    </Card>
  )
}

