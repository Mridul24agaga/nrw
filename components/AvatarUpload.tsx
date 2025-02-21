"use client"

import { useState } from "react"
import { useUploadThing } from "@/lib/uploadthing"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AvatarUploadClientProps {
  currentAvatarUrl: string | null
  username: string
  userId: string
}

export function AvatarUploadClient({ currentAvatarUrl, username, userId }: AvatarUploadClientProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const { startUpload } = useUploadThing("imageUploader")
  const supabase = createClientComponentClient()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const uploadedFiles = await startUpload([file])
      if (uploadedFiles && uploadedFiles[0]) {
        const newAvatarUrl = uploadedFiles[0].url
        const { error } = await supabase
          .from("users")
          .update({ avatar_url: newAvatarUrl })
          .eq("id", userId)

        if (error) {
          console.error("Error updating avatar:", error)
          alert("Failed to update avatar in the database.")
        } else {
          setAvatarUrl(newAvatarUrl)
          alert("Avatar updated successfully!")
        }
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("There was an error uploading your avatar. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative w-20 h-20 rounded-full overflow-hidden">
        <Image
          src={avatarUrl || "/placeholder.svg"}
          alt={username}
          width={80}
          height={80}
          objectFit="cover"
        />
      </div>
      <div>
        <label htmlFor="avatar-upload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          {isUploading ? "Uploading..." : "Change Avatar"}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={isUploading}
        />
      </div>
    </div>
  )
}