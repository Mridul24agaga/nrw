"use client"

import { useState, useRef, useEffect } from "react"
import { X, User } from "lucide-react"
import Image from "next/image"
import { addComment } from "@/actions/post-actions"
import { getAvatarUrl } from "@/lib/supabase-client"
import type { User as UserType, Comment as CommentType } from "@/lib/types"

interface CommentDialogProps {
  postId: string
  isOpen: boolean
  onClose: () => void
  currentUser: UserType
  comments: CommentType[]
}

export function CommentDialog({ postId, isOpen, onClose, currentUser, comments }: CommentDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState(comments)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const result = await addComment(postId, content)
    setIsSubmitting(false)

    if (result.success) {
      const now = new Date().toISOString()
      const newComment: CommentType = {
        id: result.commentId,
        content,
        created_at: now,
        updated_at: now,
        user: currentUser,
        post_id: postId,
        user_id: currentUser.id,
      }
      setLocalComments((prevComments) => [newComment, ...prevComments])
      setContent("")
    } else {
      console.error("Error adding comment:", result.error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
          {localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {comment.user.avatar_url ? (
                  <Image
                    src={getAvatarUrl(comment.user.avatar_url) || "/placeholder.svg"}
                    alt={comment.user.username || "User avatar"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">{comment.user.username}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

