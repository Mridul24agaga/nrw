import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Image from "next/image"
import { PostActions } from "./post-actions"
import { FollowButton } from "./follow-button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/seperator"
import { formatDistanceToNow } from "date-fns"
import { getFollowingStatus, getFollowerCount } from "../actions/user-actions"
import { CustomAvatar } from "./custom-avatar"

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

export async function Post({ post }: PostProps) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all data in parallel for better performance
  const [likeData, userLikeData, userBookmarkData, commentData, followingStatus, followerCount] = await Promise.all([
    supabase.from("post_likes").select("*", { count: "exact" }).eq("post_id", post.id),
    supabase.from("post_likes").select().eq("post_id", post.id).eq("user_id", user?.id).single(),
    supabase.from("post_bookmarks").select().eq("post_id", post.id).eq("user_id", user?.id).single(),
    supabase.from("post_comments").select("*", { count: "exact" }).eq("post_id", post.id),
    getFollowingStatus(post.user_id),
    getFollowerCount(post.user_id),
  ])

  const username = post.user.username || "Anonymous"

  // Make sure post.user has all required fields for the CustomAvatar component
  const postUser = {
    ...post.user,
    id: post.user.id || post.user_id,
    bio: null,
    created_at: post.created_at,
    email: "",
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-sm hover:bg-slate-50/50 transition-colors px-4">
      <CardHeader className="p-3 sm:p-4 px-0">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 border-2 border-primary rounded-full overflow-hidden">
              <CustomAvatar user={postUser} size={40} className="border-none" />
            </div>
            <div className="flex flex-col">
              <p className="font-semibold text-sm text-black">{username}</p>
              <div className="flex items-center space-x-2 flex-wrap">
                <p className="text-xs text-black">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
                <span className="text-xs text-black">•</span>
                <p className="text-xs text-black">{followerCount} followers</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2">
            {user?.id !== post.user_id && (
              <div key={`follow-button-${post.user_id}`}>
                <FollowButton userId={post.user_id} initialIsFollowing={followingStatus.isFollowing} />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 px-0">
        {/* Post content */}
        <p className="text-sm leading-relaxed text-black whitespace-pre-wrap break-words">{post.content}</p>

        {/* Post image */}
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
          initialLikeCount={likeData.count || 0}
          initialCommentCount={commentData.count || 0}
          isLiked={!!userLikeData.data}
          isBookmarked={!!userBookmarkData.data}
          postUserId={post.user_id}
          currentUserId={user?.id}
        />
      </CardFooter>
    </Card>
  )
}

