"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, Bookmark, Trash2, MoreHorizontal, Repeat2 } from "lucide-react"
import { toggleLike, toggleBookmark, deletePost, toggleRepost } from "../actions/post-actions"
import { CommentSection } from "./comment-section"
import { useRouter } from "next/navigation"

interface PostActionsProps {
  postId: string
  initialLikeCount: number
  initialCommentCount: number
  initialRepostCount?: number
  isLiked: boolean
  isBookmarked: boolean
  isReposted?: boolean
  postUserId: string
  currentUserId: string | undefined
  ownPostId?: string
  ownPostUserId?: string
  // Add new callback props
  onLikeChange?: (isLiked: boolean) => void
  onBookmarkChange?: (isBookmarked: boolean) => void
  onRepostChange?: (isReposted: boolean) => void
}

export function PostActions({
  postId,
  initialLikeCount,
  initialCommentCount,
  initialRepostCount = 0,
  isLiked,
  isBookmarked,
  isReposted = false,
  postUserId,
  currentUserId,
  ownPostId,
  ownPostUserId,
  onLikeChange,
  onBookmarkChange,
  onRepostChange,
}: PostActionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [repostCount, setRepostCount] = useState(initialRepostCount)
  const [liked, setLiked] = useState(isLiked)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [reposted, setReposted] = useState(isReposted)
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Update local state when props change
  useEffect(() => {
    setLiked(isLiked)
    setBookmarked(isBookmarked)
    setLikeCount(initialLikeCount)
    setCommentCount(initialCommentCount)
  }, [isLiked, isBookmarked, isReposted, initialLikeCount, initialCommentCount, initialRepostCount])

  // Check if current user is the post author
  const isAuthor = currentUserId === (ownPostUserId ?? postUserId)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLike = async () => {
    if (!currentUserId) return // Prevent action if not logged in

    try {
      const result = await toggleLike(postId)
      if (result.success) {
        const newLikedState = !liked
        setLiked(newLikedState)
        setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)))

        // Call the callback to update parent component
        if (onLikeChange) {
          onLikeChange(newLikedState)
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleBookmark = async () => {
    if (!currentUserId) return // Prevent action if not logged in

    try {
      const result = await toggleBookmark(postId)
      if (result.success) {
        const newBookmarkedState = !bookmarked
        setBookmarked(newBookmarkedState)

        // Call the callback to update parent component
        if (onBookmarkChange) {
          onBookmarkChange(newBookmarkedState)
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  const handleRepost = async () => {
    if (!currentUserId) return
    try {
      const result = await toggleRepost(postId)
      if (result.success) {
        const newRepostedState = !reposted
        setReposted(newRepostedState)
        setRepostCount((prev) => (newRepostedState ? prev + 1 : Math.max(0, prev - 1)))
        if (onRepostChange) onRepostChange(newRepostedState)
      }
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  const toggleCommentSection = () => {
    setIsCommentSectionOpen(!isCommentSectionOpen)
  }

  const updateCommentCount = (newCount: number) => {
    setCommentCount(newCount)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deletePost(ownPostId ?? postId)
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting post:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={handleLike} className="flex items-center gap-1 text-black" disabled={!currentUserId}>
          <Heart className={liked ? "fill-current text-red-500" : ""} />
          <span>{likeCount}</span>
        </button>
        <button onClick={handleRepost} className="flex items-center gap-1 text-black" disabled={!currentUserId}>
          <Repeat2 className={reposted ? "text-green-600" : ""} />
          <span>{repostCount}</span>
        </button>
        <button onClick={toggleCommentSection} className="flex items-center gap-1 text-black">
          <MessageCircle className={isCommentSectionOpen ? "text-blue-500" : ""} />
          <span>{commentCount}</span>
        </button>
        <button onClick={handleBookmark} className="flex items-center gap-1 text-black" disabled={!currentUserId}>
          <Bookmark className={bookmarked ? "fill-current text-yellow-500" : ""} />
        </button>

        {/* Delete post option (only for post author) - Now positioned inline with other actions */}
        {isAuthor && (
          <div className="relative ml-auto" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-gray-100">
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Are you sure?</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">
                This action cannot be undone. This will permanently delete your post.
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCommentSectionOpen && (
        <CommentSection postId={postId} initialCommentCount={commentCount} updateCommentCount={updateCommentCount} />
      )}
    </div>
  )
}
