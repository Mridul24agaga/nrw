"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Upload, X, Camera } from "lucide-react"

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

      // Upload to new Vercel Blob API route
      const response = await fetch("/api/blob-memorial-avatar", {
        method: "POST",
        body: formData,
      })

      // Check if response is OK
      if (!response.ok) {
        let errorMessage = "Failed to upload avatar"

        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            const errorText = await response.text()
            console.error("Non-JSON error response:", errorText)
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Unexpected response type:", contentType, "Response:", textResponse)
        throw new Error("Server returned an invalid response format")
      }

      const result = await response.json()

      // Update preview with the new URL
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
        <div className="relative inline-block cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Update Memorial Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview section */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                {previewUrl ? (
                  <Image
                    src={previewUrl || "/placeholder.svg"}
                    alt={memorialName}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    priority
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                    <span className="text-4xl text-purple-600 font-serif">{memorialName[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              {/* Upload indicator overlay */}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <Camera className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          </div>

          {/* File input section */}
          <div className="space-y-4">
            <input
              type="file"
              ref={inputFileRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="memorial-avatar-upload"
            />

            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputFileRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 max-w-xs"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? "Change Image" : "Select Image"}
                </Button>

                {selectedFile && (
                  <Button type="button" variant="outline" onClick={handleRemoveFile} disabled={isUploading} size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {selectedFile && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(selectedFile.size / 1024)} KB</p>
                </div>
              )}
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Vercel Blob Storage:</strong> Upload a square image for best results. Maximum file size: 5MB.
                Supported formats: JPG, PNG, GIF.
              </p>
            </div>
          </div>

          {/* Error and success messages */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 text-center">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 text-center flex items-center justify-center gap-2">
                <span className="text-green-500">✓</span>
                Avatar uploaded to Vercel Blob successfully!
              </p>
            </div>
          )}

          {/* Upload button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading to Blob...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to Blob
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
