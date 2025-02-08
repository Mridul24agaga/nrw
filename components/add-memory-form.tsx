"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Image, Send } from "lucide-react"
import { useRouter } from "next/navigation"

interface AddMemoryFormProps {
  memorialId: string
  onMemoryAdded: (newMemory: string) => void
}

export function AddMemoryForm({ memorialId, onMemoryAdded }: AddMemoryFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data, error } = await supabase
        .from("memorialpages212515")
        .update({
          memory_message: [
            ...(await supabase
              .from("memorialpages212515")
              .select("memory_message")
              .eq("id", memorialId)
              .single()
              .then((res) => res.data?.memory_message || [])),
            content,
          ],
        })
        .eq("id", memorialId)
        .select("memory_message")

      if (error) throw error

      onMemoryAdded(content)
      setContent("")
    } catch (error) {
      console.error("Error adding memory:", error)
      setError("Failed to add memory. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 mb-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="flex-grow">
            <textarea
              placeholder="Please share your memories with us!"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[100px] bg-gray-50 rounded-lg p-3 text-gray-700 placeholder-gray-500 border-0 resize-none focus:ring-0 focus:outline-none"
            />
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">Share a special memory</div>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`
              inline-flex items-center px-4 py-2 rounded-full
              ${
                isSubmitting || !content.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#86efac] text-white hover:bg-[#6ee7a1] transition-colors"
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Posting...
              </span>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

