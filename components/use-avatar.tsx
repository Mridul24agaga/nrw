"use client"
import Avatar from "react-avatar"
import type { User } from "@/lib/types"

interface UserAvatarProps {
  user: User | null
  size?: number
  className?: string
  round?: boolean | string
  onClick?: () => void
}

export function UserAvatar({ user, size = 40, className = "", round = true, onClick }: UserAvatarProps) {
  const name = user?.username || user?.email?.split("@")[0] || "User"
  const src = user?.avatar_url || undefined

  return (
    <Avatar
      name={name}
      src={src}
      size={`${size}px`} // Convert number to string with "px"
      round={round}
      className={className}
      onClick={onClick}
      color="#4F46E5" // Indigo color for fallback
      fgColor="#FFFFFF" // White text for fallback
      maxInitials={2}
      textSizeRatio={2}
    />
  )
}