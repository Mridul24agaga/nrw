"use client"

import type React from "react"
import { useState, useRef } from "react"
import { ImageIcon, X, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button" // Assuming Button is available
import { Textarea } from "@/components/ui/textarea" // Assuming Textarea is available
import { useActionState } from "react" // Import useActionState
import { addMemoryToMemorial } from "@/actions/memorial" // Import the server action

interface ThemeColor {
  name: string
  color: string
  hoverColor: string
  lightColor: string
  superLightColor: string
  textColor: string
}

interface AddMemoryFormProps {
  memorialId: string
  onMemoryAdded: (newMemory: string, imageUrl?: string) => void
  themeColor?: ThemeColor
  currentUser: {
    // Add currentUser prop
    id: string
    username: string
    avatar_url: string | null
  } | null
}

export function AddMemoryForm({
  memorialId,
  onMemoryAdded,
  themeColor = {
    name: "purple",
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
    lightColor: "bg-purple-100",
    superLightColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  currentUser, // Destructure currentUser
}: AddMemoryFormProps) {
  const [memoryContent, setMemoryContent] = useState("") // Renamed from 'content' for clarity
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // useActionState for server action
  const [state, formAction, isSubmitting] = useActionState(async (prevState: any, formData: FormData) => {
    if (!currentUser) {
      return { error: "You must be logged in to share a memory." }
    }

    const content = formData.get("memoryContent") as string
    const imageFile = formData.get("imageFile") as File | null // Assuming file input name is 'imageFile'

    if (!content.trim() && !imageUrl && (!imageFile || imageFile.size === 0)) {
      return { error: "Memory cannot be empty. Please write something or upload an image." }
    }

    let uploadedImageUrl: string | null = imageUrl // Start with already uploaded image if any

    // Handle new image upload if a file is provided
    if (imageFile && imageFile.size > 0) {
      // Validate file type
      if (!imageFile.type.startsWith("image/")) {
        return { error: "Please upload an image file." }
      }
      // Validate file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        return { error: "File size must be less than 10MB." }
      }

      setIsUploading(true) // Set uploading state for UI feedback
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)

        const response = await fetch("/api/blob-memory-upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Image upload failed" }))
          throw new Error(errorData.error || `Image upload failed with status: ${response.status}`)
        }

        const result = await response.json()
        uploadedImageUrl = result.imageUrl
      } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError)
        return { error: uploadError.message || "Failed to upload image. Please try again." }
      } finally {
        setIsUploading(false) // Reset uploading state
      }
    }

    // Call the new server action to add the memory
    const result = await addMemoryToMemorial(
      memorialId,
      content,
      uploadedImageUrl,
      currentUser, // Pass the current user as author
    )

    if (result.error) {
      return { error: result.error }
    } else {
      setMemoryContent("")
      setImageUrl(null) // Clear image preview
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Clear file input
      }
      onMemoryAdded(content, uploadedImageUrl || undefined) // Notify parent
      return { success: true, message: "Memory shared successfully!" }
    }
  }, null) // Initial state for useActionState

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Set the file to the input so it's included in FormData
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(e.dataTransfer.files[0])
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
      }
      // No need to call handleImageUpload here, formAction will handle it
      setImageUrl(URL.createObjectURL(e.dataTransfer.files[0])) // Show preview immediately
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageUrl(URL.createObjectURL(e.target.files[0])) // Show preview immediately
    } else {
      setImageUrl(null)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="mt-8 mb-6">
      {/* Success Alert */}
      {state?.success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {state?.error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{state.error}</AlertDescription>
        </Alert>
      )}

      <form
        action={formAction} // Use formAction from useActionState
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
        onDragEnter={handleDrag}
      >
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-4">
            <div className={`w-10 h-10 rounded-full ${themeColor.lightColor} flex items-center justify-center`}>
              <ImageIcon className={`w-5 h-5 ${themeColor.textColor}`} />
            </div>
          </div>
          <div className="flex-grow">
            <Textarea
              name="memoryContent" // Name for FormData
              placeholder="Share a special memory, story, or tribute..."
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              rows={4}
              className={`resize-none focus:ring-2 focus:ring-${themeColor.name}-500 focus:border-transparent`}
              disabled={isSubmitting || !currentUser}
            />

            {/* Image preview area */}
            {imageUrl && (
              <div className="mt-3 relative">
                <div className="relative rounded-lg overflow-hidden w-full h-48 bg-gray-100">
                  <Image
                    src={imageUrl || "/placeholder.svg?height=192&width=400&text=Memory+Image"}
                    alt="Memory image"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Enhanced Drag and drop area */}
            {!imageUrl && (
              <div
                className={`mt-3 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  dragActive
                    ? `border-${themeColor.name}-500 bg-${themeColor.name}-50`
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  name="imageFile" // Name for FormData
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="memory-image-upload"
                />
                <label
                  htmlFor="memory-image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className={`w-8 h-8 mb-3 ${dragActive ? themeColor.textColor : "text-gray-400"}`} />
                  <span className="text-sm text-gray-600 mb-1">
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`animate-spin rounded-full h-4 w-4 border-b-2 border-${themeColor.name}-600`}
                        ></div>
                        Uploading to Vercel Blob...
                      </div>
                    ) : (
                      <>
                        <span className={`font-medium ${themeColor.textColor}`}>Click to upload</span> or drag and drop
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Open for all to share
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || (!memoryContent.trim() && !imageUrl) || isUploading || !currentUser}
            className={`
              inline-flex items-center px-6 py-2 rounded-full font-medium transition-all
              ${
                isSubmitting || (!memoryContent.trim() && !imageUrl) || isUploading || !currentUser
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : `${themeColor.color} ${themeColor.hoverColor} text-white shadow-sm hover:shadow-md`
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sharing Memory...
              </span>
            ) : (
              <span>Share Memory</span>
            )}
          </Button>
        </div>
      </form>

      {/* Helper text for new users */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Your memory will be visible to everyone visiting this memorial page. Please keep content respectful and
        appropriate.
      </div>
    </div>
  )
}
