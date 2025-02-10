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
  const [posts, setPosts] = useState(memorialPage.posts || [])
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

