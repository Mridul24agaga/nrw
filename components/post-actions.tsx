"use client"

import { useState } from "react"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import { toggleLike, toggleBookmark } from "../actions/post-actions"
import { CommentSection } from "./comment-section"

interface PostActionsProps {
  postId: string
  initialLikeCount: number
  initialCommentCount: number
  isLiked: boolean
  isBookmarked: boolean
}

export function PostActions({
  postId,
  initialLikeCount,
  initialCommentCount,
  isLiked,
  isBookmarked,
}: PostActionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [liked, setLiked] = useState(isLiked)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false)

  const handleLike = async () => {
    const result = await toggleLike(postId)
    if (result.success) {
      setLiked(!liked)
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    }
  }

  const handleBookmark = async () => {
    const result = await toggleBookmark(postId)
    if (result.success) {
      setBookmarked(!bookmarked)
    }
  }

  const toggleCommentSection = () => {
    setIsCommentSectionOpen(!isCommentSectionOpen)
  }

  const updateCommentCount = (newCount: number) => {
    setCommentCount(newCount)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={handleLike} className="flex items-center gap-1 text-black">
          <Heart className={liked ? "fill-current text-red-500" : ""} />
          <span>{likeCount}</span>
        </button>
        <button onClick={toggleCommentSection} className="flex items-center gap-1 text-black">
          <MessageCircle className={isCommentSectionOpen ? "text-blue-500" : ""} />
          <span>{commentCount}</span>
        </button>
        <button onClick={handleBookmark} className="flex items-center gap-1 text-black">
          <Bookmark className={bookmarked ? "fill-current text-yellow-500" : ""} />
        </button>
      </div>
      {isCommentSectionOpen && (
        <CommentSection postId={postId} initialCommentCount={commentCount} updateCommentCount={updateCommentCount} />
      )}
    </div>
  )
}

