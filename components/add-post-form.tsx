"use client"

import { useState } from "react"
import { addPost } from "@/actions/memorial"
import { useRouter } from "next/navigation"

interface AddPostFormProps {
  memorialId: string
  onPostAdded: (newPost: any) => void
}

export default function AddPostForm({ memorialId, onPostAdded }: AddPostFormProps) {
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const newPost = await addPost(memorialId, content)
      setContent("")
      onPostAdded(newPost)
      router.refresh()
    } catch (error) {
      console.error("Error adding post:", error)
      setError(error instanceof Error ? error.message : "An error occurred while adding the post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Add a Memory</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share a memory..."
        className="w-full p-2 border rounded-md mb-4"
        rows={4}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
      >
        {isSubmitting ? "Posting..." : "Post Memory"}
      </button>
    </form>
  )
}

