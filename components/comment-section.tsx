"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { addComment, deleteComment } from "../actions/post-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
}

interface CommentSectionProps {
  postId: string
  initialCommentCount: number
  updateCommentCount: (newCount: number) => void
}

export function CommentSection({ postId, initialCommentCount, updateCommentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchComments()
  }, [])

  async function fetchComments() {
    try {
      const { data } = await supabase
        .from("post_comments")
        .select("id, content, user_id, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })

      setComments(data || [])
      updateCommentCount(data?.length || initialCommentCount)
    } catch (err) {
      console.error("Error fetching comments:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (newComment.trim() === "") return

    setIsSubmitting(true)
    try {
      const result = await addComment(postId, newComment)
      if (result.success) {
        setNewComment("")
        fetchComments()
      }
    } catch (err) {
      console.error("Error adding comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const result = await deleteComment(commentId)
      if (result.success) {
        fetchComments()
      }
    } catch (err) {
      console.error("Error deleting comment:", err)
    }
  }

  return (
    <div className="space-y-4 text-black">
      <form onSubmit={handleAddComment} className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <p className="text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group rounded-lg border p-4 space-y-1 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 break-words">
                  <p className="leading-relaxed">{comment.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 hover:text-red-500" />
                </Button>
              </div>
              <p className="text-xs">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}

