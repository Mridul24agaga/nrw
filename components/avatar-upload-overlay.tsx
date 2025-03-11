"use client"

import type React from "react"

import type { PutBlobResult } from "@vercel/blob"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, Check } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function AvatarUploadOverlay({ children }: { children?: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<PutBlobResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states
    setUploadError(null)
    setBlob(null)

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

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!inputFileRef.current?.files || inputFileRef.current.files.length === 0) {
      setUploadError("No file selected")
      return
    }

    const file = inputFileRef.current.files[0]
    setIsUploading(true)
    setUploadError(null)

    try {
      // Upload file directly to API route
      const response = await fetch(`/api/profile/avatar?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to upload avatar")
      }

      const newBlob = (await response.json()) as PutBlobResult
      setBlob(newBlob)

      // Close dialog after a short delay
      setTimeout(() => {
        setShowOverlay(false)
        // Refresh the page to show the new avatar
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setBlob(null)
    setShowOverlay(false)
    setUploadError(null)
    if (inputFileRef.current) {
      inputFileRef.current.value = ""
    }
  }

  return (
    <>
      {children ? (
        <div onClick={() => setShowOverlay(true)} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowOverlay(true)} className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span>Update Avatar</span>
        </Button>
      )}

      {showOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-gray-200">
                {previewUrl ? (
                  <Image src={previewUrl || "/placeholder.svg"} alt="Avatar preview" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <Camera className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload form */}
            <form onSubmit={handleUpload} className="flex flex-col items-center gap-4 mb-6">
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                id="avatar-upload"
              />

              <div className="flex flex-col items-center gap-2 w-full">
                {!previewUrl ? (
                  <Button type="button" onClick={() => inputFileRef.current?.click()} disabled={isUploading}>
                    Select Image
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500 text-center">Ready to upload</div>
                )}
              </div>

              {/* Error message */}
              {uploadError && <div className="text-sm text-red-500 text-center w-full">{uploadError}</div>}

              {/* Success message */}
              {blob && <div className="text-sm text-green-500 text-center w-full">Avatar uploaded successfully!</div>}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 w-full mt-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isUploading}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>

                <Button type="submit" disabled={!previewUrl || isUploading}>
                  {isUploading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      Upload
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

