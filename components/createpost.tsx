"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface CreatePostProps {
  memorialPageId?: string
}

export default function CreatePost({ memorialPageId }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      const { error } = await supabase.from("posts").insert({
        content,
        user_id: userData.user.id,
        memorial_page_id: memorialPageId,
      })

      if (error) {
        console.error("Error creating post:", error)
      } else {
        setContent("")
        router.refresh()
      }
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share a memory..."
        className="w-full p-2 border rounded-md"
        rows={4}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isSubmitting ? "Posting..." : "Post"}
      </button>
    </form>
  )
}

