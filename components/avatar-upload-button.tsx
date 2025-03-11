"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadAvatar } from "@/actions/avatar-actions"
import { useRouter } from "next/navigation"

interface AvatarUploadButtonProps {
  userId: string
}

export function AvatarUploadButton({ userId }: AvatarUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const result = await uploadAvatar(formData)

      if (result.error) {
        alert(result.error)
      } else {
        // Force a refresh to show the new avatar
        router.refresh()
      }
    } catch (error) {
      alert("Failed to upload image")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md transition-colors"
        aria-label="Upload profile picture"
        title="Upload profile picture"
      >
        {isUploading ? (
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <h1>
        hello
      </h1>
    </>
  )
}

