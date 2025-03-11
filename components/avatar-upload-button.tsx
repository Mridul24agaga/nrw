"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"

interface AvatarUploadButtonProps {
  userId: string
  username: string
}

export function AvatarUploadButton({ userId, username }: AvatarUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Generate a clean filename with timestamp to avoid collisions
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`

      // Create a custom XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
          console.log(`Upload progress: ${progress}%`)
        }
      })

      // Convert the object to a JSON string for clientPayload
      const clientPayloadString = JSON.stringify({ userId, type: "avatar" })

      // Upload to Vercel Blob
      const result = await upload(fileName, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: clientPayloadString, // Now it's a string as required
      })

      console.log("Avatar upload successful:", result)

      // Update user profile with the new avatar URL
      const response = await fetch("/api/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: result.url,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      // Refresh the page to show the new avatar
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        id="avatar-upload"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
      <label
        htmlFor="avatar-upload"
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full 
          ${isUploading ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-gray-100 cursor-pointer"}
          text-gray-800 font-medium shadow-sm transition-colors
        `}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{uploadProgress}%</span>
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            <span>Change Photo</span>
          </>
        )}
      </label>
    </div>
  )
}

