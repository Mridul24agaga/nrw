"use client"

import { useState } from "react"
import Image from "next/image"
import type { User } from "@/lib/types"

interface CustomAvatarProps {
  user: User | null
  size?: number
  className?: string
  onClick?: () => void
}

export function CustomAvatar({ user, size = 40, className = "", onClick }: CustomAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Get initials from username or email
  const getInitials = () => {
    if (!user) return "?"

    if (user.username) {
      return user.username.charAt(0).toUpperCase()
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }

    return "?"
  }

  // Generate a consistent color based on the user's ID
  const getBackgroundColor = () => {
    if (!user?.id) return "#4F46E5" // Default indigo color

    // Simple hash function to generate a color from user ID
    let hash = 0
    for (let i = 0; i < user.id.length; i++) {
      hash = user.id.charCodeAt(i) + ((hash << 5) - hash)
    }

    // Convert to hex color
    let color = "#"
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += ("00" + value.toString(16)).substr(-2)
    }

    return color
  }

  // If we have an avatar URL and no error loading it, show the image
  if (user?.avatar_url && !imageError) {
    // Handle both local and remote URLs
    const imageSrc = user.avatar_url.startsWith("/")
      ? user.avatar_url // Local path starting with /
      : user.avatar_url // Remote URL

    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={user.username || "User avatar"}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => {
            console.log("Image failed to load:", imageSrc)
            setImageError(true)
          }}
        />
      </div>
    )
  }

  // Otherwise, show initials
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: getBackgroundColor(),
        color: "#FFFFFF",
        fontSize: `${size / 2.5}px`,
        fontWeight: "bold",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {getInitials()}
    </div>
  )
}
