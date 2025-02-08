"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleFollow } from "../actions/user-actions"

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleToggleFollow = async (event: React.MouseEvent) => {
    event.stopPropagation() // Prevent event bubbling

    if (isPending) return

    startTransition(async () => {
      try {
        console.log("Toggling follow for user:", userId) // Debug log
        const result = await toggleFollow(userId)
        if (result.success && result.following !== undefined) {
          console.log("Toggle result:", result) // Debug log
          setIsFollowing(result.following)
        }
      } catch (error) {
        console.error("Error toggling follow for user:", userId, error)
      }
    })
  }

  return (
    <Button
      type="button"
      data-user-id={userId}
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`h-8 text-xs ${
        isFollowing
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-white text-black border-gray-300 hover:bg-gray-100"
      }`}
    >
      {isPending ? "..." : isFollowing ? "Following" : "Follow"}
    </Button>
  )
}

