"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageCircle, ThumbsUp, Trash2, X, Send } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { likeMemory, addMemoryComment, deleteMemory } from "@/actions/memory-actions"
import { CustomAvatar } from "./custom-avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface MemoryContent {
  content: string
  imageUrl: string | null
  createdAt: string
}

interface MemoryCardProps {
  memoryId: string // Index in the array
  memorialId: string
  memory: string | MemoryContent // Support both string and object format
  pageName: string
  currentUser?: {
    id: string
    username: string
    avatar_url: string | null
  } | null
  isCreator: boolean
}

export function MemoryCard({ memoryId, memorialId, memory, pageName, currentUser, isCreator }: MemoryCardProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Parse memory content
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState(new Date().toISOString())

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Parse memory content on mount
  useEffect(() => {
    // Function to recursively parse potentially nested JSON
    const parseNestedJson = (data: any): MemoryContent => {
      // If it's a string, try to parse it as JSON
      if (typeof data === "string") {
        try {
          // Check if it looks like JSON
          if (data.trim().startsWith("{") || data.includes('\\"')) {
            const parsed = JSON.parse(data)
            // Recursively parse the result if it's still a string that looks like JSON
            if (typeof parsed === "string" && (parsed.trim().startsWith("{") || parsed.includes('\\"'))) {
              return parseNestedJson(parsed)
            }
            // If it's an object with the expected structure, use it
            if (typeof parsed === "object" && parsed !== null) {
              if (parsed.content !== undefined) {
                return {
                  content: parsed.content || "",
                  imageUrl: parsed.imageUrl || null,
                  createdAt: parsed.createdAt || new Date().toISOString(),
                }
              } else if (parsed.imageUrl !== undefined) {
                // Handle case where the object has imageUrl but not content
                return {
                  content: "",
                  imageUrl: parsed.imageUrl,
                  createdAt: parsed.createdAt || new Date().toISOString(),
                }
              }
            }
            // If we got here, the parsed result doesn't match our expected structure
            return {
              content: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
              imageUrl: null,
              createdAt: new Date().toISOString(),
            }
          }
        } catch (e) {
          // If parsing fails, treat it as plain text
          console.log("Failed to parse memory JSON:", e)
        }
        // Default for strings that aren't JSON
        return {
          content: data,
          imageUrl: null,
          createdAt: new Date().toISOString(),
        }
      }

      // If it's already an object with content property
      if (typeof data === "object" && data !== null) {
        // Check if content might be nested JSON
        if (typeof data.content === "string" && (data.content.trim().startsWith("{") || data.content.includes('\\"'))) {
          try {
            const parsedContent = JSON.parse(data.content)
            // If parsedContent is an object with the right structure, use it
            if (
              typeof parsedContent === "object" &&
              parsedContent !== null &&
              (parsedContent.content !== undefined || parsedContent.imageUrl !== undefined)
            ) {
              return {
                content: parsedContent.content || "",
                imageUrl: parsedContent.imageUrl || data.imageUrl || null,
                createdAt: parsedContent.createdAt || data.createdAt || new Date().toISOString(),
              }
            }
          } catch (e) {
            // If parsing fails, use the original content
            console.log("Failed to parse nested content:", e)
          }
        }

        // Use the object as is
        return {
          content: data.content || "",
          imageUrl: data.imageUrl || null,
          createdAt: data.createdAt || new Date().toISOString(),
        }
      }

      // Default fallback
      return {
        content: String(data),
        imageUrl: null,
        createdAt: new Date().toISOString(),
      }
    }

    // Parse the memory data
    const parsedMemory = parseNestedJson(memory)

    setContent(parsedMemory.content)
    setImageUrl(parsedMemory.imageUrl)
    setCreatedAt(parsedMemory.createdAt)
  }, [memory])

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  // Check if user has liked this memory and get counts on component mount
  useEffect(() => {
    async function fetchLikeStatus() {
      if (!currentUser) return

      try {
        const { data } = await supabase
          .from("memory_likes")
          .select()
          .eq("memory_id", memoryId)
          .eq("user_id", currentUser.id)
          .single()

        setIsLiked(!!data)
      } catch (error) {
        // Not liked
        setIsLiked(false)
      }
    }

    async function fetchCounts() {
      try {
        // Get like count
        const { count: likeCountData } = await supabase
          .from("memory_likes")
          .select("*", { count: "exact" })
          .eq("memory_id", memoryId)

        setLikeCount(likeCountData || 0)

        // Get comment count
        const { count: commentCountData } = await supabase
          .from("memory_comments")
          .select("*", { count: "exact" })
          .eq("memory_id", memoryId)

        setCommentCount(commentCountData || 0)
      } catch (error) {
        console.error("Error fetching counts:", error)
      }
    }

    fetchLikeStatus()
    fetchCounts()
  }, [memoryId, currentUser, supabase])

  const handleLike = async () => {
    if (!currentUser) {
      // Prompt to login
      alert("Please log in to like this memory")
      return
    }

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))

    try {
      const result = await likeMemory(memoryId)

      if (result.error) {
        // Revert optimistic update on error
        setIsLiked(isLiked)
        setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1))
        console.error(result.error)
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked)
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1))
      console.error("Error liking memory:", error)
    }
  }

  const toggleComments = async () => {
    setShowComments(!showComments)

    // Fetch comments if opening comments section
    if (!showComments && comments.length === 0) {
      try {
        const { data, error } = await supabase
          .from("memory_comments")
          .select(`
            id,
            content,
            created_at,
            user:user_id (id, username, avatar_url)
          `)
          .eq("memory_id", memoryId)
          .order("created_at", { ascending: true })

        if (error) throw error

        setComments(data || [])
      } catch (error) {
        console.error("Error fetching comments:", error)
      }
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      // Prompt to login
      alert("Please log in to comment")
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const result = await addMemoryComment(memoryId, newComment)

      if (result.error) {
        console.error(result.error)
        return
      }

      // Add new comment to list
      const newCommentObj = {
        id: result.comment.id,
        content: newComment,
        created_at: new Date().toISOString(),
        user: {
          id: currentUser.id,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
        },
      }

      setComments((prev) => [...prev, newCommentObj])
      setCommentCount((prev) => prev + 1)
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isCreator) return

    setIsDeleting(true)

    try {
      const result = await deleteMemory(memoryId, memorialId)

      if (result.error) {
        console.error(result.error)
        return
      }

      // Refresh the page to show updated memories
      router.refresh()
    } catch (error) {
      console.error("Error deleting memory:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-3">{/* Placeholder for avatar if needed */}</div>
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900">{pageName}</h3>
              <span className="mx-2 text-gray-500">·</span>
              <span className="text-gray-500">{formattedDate}</span>
            </div>

            {isCreator && (
              <div className="relative">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {showDeleteConfirm && (
                  <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 w-64">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Delete Memory?</h4>
                      <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{content}</p>

          {/* Display image if available */}
          {imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <div className="relative w-full h-64">
                <Image src={imageUrl || "/placeholder.svg"} alt="Memory image" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex space-x-4"></div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center ${isLiked ? "text-blue-500" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ThumbsUp className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            <span>{likeCount} likes</span>
          </button>
          <button onClick={toggleComments} className="flex items-center text-gray-500 hover:text-gray-700">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span>{commentCount} comments</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {comments.length > 0 ? (
            <div className="space-y-3 mb-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      <CustomAvatar
                        user={{
                          id: comment.user.id,
                          username: comment.user.username,
                          avatar_url: comment.user.avatar_url,
                          email: "",
                          bio: null,
                          created_at: "",
                        }}
                        size={32}
                      />
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg p-2">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">{comment.user.username}</span>
                      <span className="mx-1 text-gray-500 text-xs">·</span>
                      <span className="text-gray-500 text-xs">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-3">No comments yet. Be the first to comment!</p>
          )}

          {currentUser && (
            <form onSubmit={handleAddComment} className="flex items-center">
              <div className="flex-shrink-0 mr-2">
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <CustomAvatar
                    user={{
                      id: currentUser.id,
                      username: currentUser.username,
                      avatar_url: currentUser.avatar_url,
                      email: "",
                      bio: null,
                      created_at: "",
                    }}
                    size={32}
                  />
                </div>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-gray-400"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

