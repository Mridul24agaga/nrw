"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { MemorialPage, Post as PostType } from "@/lib/types"
import { Post } from "./post"

interface MemorialPageContentProps {
  memorialPage: MemorialPage & {
    posts: PostType[]
  }
}

export default function MemorialPageContent({ memorialPage }: MemorialPageContentProps) {
  // Transform posts to match the expected shape for the Post component
  const transformedPosts = (memorialPage.posts || []).map(post => ({
    id: post.id,
    content: post.content,
    user_id: post.user_id,
    created_at: post.created_at,
    user: {
      id: post.user?.id || post.user_id,
      username: post.user?.username || "Anonymous",
      avatar_url: post.user?.avatar_url || null,
    }
  }))
  
  const [posts, setPosts] = useState(transformedPosts)
  const supabase = createClientComponentClient()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No memories have been shared yet. Be the first to share a memory.
          </div>
        )}
      </div>
    </div>
  )
}