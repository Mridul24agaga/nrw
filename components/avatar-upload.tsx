"use client"

import { useState, useTransition } from "react"
import { Camera } from "lucide-react"
import Image from "next/image"
import { updateProfile } from "@/actions/update-profile"
import { getAvatarUrl } from "@/lib/supabase-client"
import type { User } from "@/lib/types"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  username: string
  onAvatarUpdate: (user: User) => void
}

export function AvatarUpload({ currentAvatarUrl, username, onAvatarUpdate }: AvatarUploadProps) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Create FormData and upload
    const formData = new FormData()
    formData.append("avatar", file)

    setError(null)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        console.error(result.error)
        setError(result.error)
        setPreview(null)
      } else if (result.user) {
        onAvatarUpdate(result.user)
      }
    })
  }

  const avatarSrc = preview || (currentAvatarUrl ? getAvatarUrl(currentAvatarUrl) : "/placeholder.svg")

  return (
    <div className="relative group">
      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 overflow-hidden">
        <Image
          src={avatarSrc || "/placeholder.svg"}
          alt={username}
          width={96}
          height={96}
          className="h-full w-full object-cover"
        />
      </div>

      <label
        htmlFor="avatar-upload"
        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
      >
        <Camera className="w-6 h-6" />
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={isPending}
        />
      </label>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}

      {error && <div className="absolute -bottom-8 left-0 right-0 text-red-500 text-xs text-center">{error}</div>}
    </div>
  )
}

