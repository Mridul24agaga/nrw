"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadAvatar } from "@/actions/avatar-actions"
import { Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  username: string
}

export function AvatarUpload({ currentAvatarUrl, username }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string | null }>({
    type: null,
    message: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Reset feedback
    setFeedback({ type: null, message: null })

    // Upload the file
    setIsUploading(true)

    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadAvatar(formData)

    setIsUploading(false)

    if (result.error) {
      setFeedback({
        type: "error",
        message: result.error,
      })
      // Revert to previous avatar if there was an error
      setPreviewUrl(currentAvatarUrl)
    } else {
      setFeedback({
        type: "success",
        message: "Avatar updated successfully",
      })

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback({ type: null, message: null })
      }, 3000)
    }
  }

  // This function directly opens the file dialog
  const triggerFileInput = () => {
    console.log("Upload button clicked")
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error("File input reference is null")
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Avatar container */}
        <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white bg-gray-200">
          {previewUrl ? (
            <Image src={previewUrl || "/placeholder.svg"} alt={`${username}'s avatar`} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 text-2xl font-bold">
              {username?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload button - made larger and more prominent */}
        <button
          onClick={triggerFileInput}
          className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-10"
          disabled={isUploading}
          type="button"
        >
          <Camera className="h-5 w-5" />
        </button>

        {/* File input - hidden but accessible */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-upload"
        />
      </div>

      {/* Clickable overlay for the entire avatar */}
      <div className="absolute inset-0 cursor-pointer" onClick={triggerFileInput} aria-hidden="true" />

      {/* Explicit upload text link */}
      <button onClick={triggerFileInput} className="mt-2 text-sm text-primary hover:underline" type="button">
        Change avatar
      </button>

      {feedback.type && (
        <div
          className={`mt-2 text-sm flex items-center gap-1 ${
            feedback.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  )
}

