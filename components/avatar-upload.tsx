"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  username: string
}

export function AvatarUpload({ userId, avatarUrl, username }: AvatarUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Get the first letter of username for avatar fallback
  const avatarFallback = (username || "?").charAt(0).toUpperCase()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // 1. Upload the file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // 3. Update the user's avatar_url in the database
      const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId)

      if (updateError) throw updateError

      toast.success("Avatar updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Failed to update avatar")
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group">
      <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
        {avatarUrl ? (
          <Image
            src={avatarUrl || "/placeholder.svg"}
            alt={username || "User avatar"}
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
        ) : (
          <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
        )}
      </Avatar>

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}

      <div
        className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={handleAvatarClick}
      >
        <Pencil className="h-5 w-5 text-white" />
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

