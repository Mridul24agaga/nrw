"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadAvatar } from "@/actions/avatar-actions"

export function AvatarUploadOverlay() {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const result = await uploadAvatar(formData)

      if (result.error) {
        setMessage({ text: result.error, type: "error" })
      } else {
        setMessage({ text: "Profile picture updated successfully", type: "success" })
        // Clear the message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ text: "Failed to upload image", type: "error" })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="relative">
      <button
        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Change Photo"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {message && (
        <div
          className={`mt-2 px-3 py-1 text-sm rounded ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

