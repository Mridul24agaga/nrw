"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Upload, X } from "lucide-react"

interface MemorialAvatarDialogProps {
  children: React.ReactNode
  memorialId: string
  avatarUrl: string | null
  memorialName: string
}

export function MemorialAvatarDialog({ children, memorialId, avatarUrl, memorialName }: MemorialAvatarDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states
    setUploadError(null)
    setUploadSuccess(false)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleUpload = async () => {
    if (!selectedFile || !memorialId) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("memorialId", memorialId)

      // Upload to API route
      const response = await fetch("/api/memorial-avatar", {
        method: "POST",
        body: formData,
      })

      // Check if response is OK
      if (!response.ok) {
        // Try to get error as JSON first
        let errorMessage = "Failed to upload avatar"

        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // If not JSON, get text
            const errorText = await response.text()
            console.error("Non-JSON error response:", errorText)
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      // Check content type before parsing as JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Unexpected response type:", contentType, "Response:", textResponse)
        throw new Error("Server returned an invalid response format")
      }

      const result = await response.json()

      // Update preview with the new URL from Vercel Blob
      setPreviewUrl(result.url)
      setUploadSuccess(true)

      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false)
        // Force page refresh to show the new avatar
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error uploading memorial avatar:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(avatarUrl)
    if (inputFileRef.current) {
      inputFileRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer z-10 relative">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Memorial Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-gray-200 z-10">
              {previewUrl ? (
                <Image src={previewUrl || "/placeholder.svg"} alt={memorialName} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <span className="text-4xl text-gray-400">{memorialName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* File input */}
          <div className="flex flex-col items-center gap-2">
            <input
              type="file"
              ref={inputFileRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="memorial-avatar-upload"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputFileRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Image
              </Button>

              {selectedFile && (
                <Button type="button" variant="outline" onClick={handleRemoveFile} disabled={isUploading}>
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>

            {selectedFile && (
              <p className="text-sm text-gray-500">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>

          {/* Error message */}
          {uploadError && <div className="text-sm text-red-500 text-center">{uploadError}</div>}

          {/* Success message */}
          {uploadSuccess && <div className="text-sm text-green-500 text-center">Avatar uploaded successfully!</div>}

          {/* Upload button */}
          <div className="flex justify-end">
            <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
