"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export function AvatarUploadButton() {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      // Refresh the page to show the new avatar
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Update Avatar"}
      </Button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </>
  )
}

