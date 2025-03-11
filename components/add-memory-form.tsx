"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ImageIcon, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { upload } from "@vercel/blob/client"

interface AddMemoryFormProps {
  memorialId: string
  onMemoryAdded: (newMemory: string, imageUrl?: string) => void
}

export function AddMemoryForm({ memorialId, onMemoryAdded }: AddMemoryFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

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
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed")
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async () => {
    if (!selectedFile) return null

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Generate a clean filename with timestamp to avoid collisions
      const filename = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "-")
      const timestamp = Date.now()
      const pathname = `memories/${memorialId}/${timestamp}-${filename}`

      // Create a custom XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
          console.log(`Upload progress: ${progress}%`)
        }
      })

      // Upload to Vercel Blob
      const result = await upload(pathname, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: selectedFile.size > 1024 * 1024, // Use multipart for files larger than 1MB
      })

      console.log("Memory image upload successful:", result)
      return result.url
    } catch (error) {
      console.error("Error uploading memory image:", error)
      setError(typeof error === "string" ? error : "Failed to upload image")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !selectedFile) return

    setIsSubmitting(true)
    setError(null)

    try {
      // First, upload the image if there is one
      let uploadedImageUrl = null
      if (selectedFile) {
        uploadedImageUrl = await uploadImage()
        if (!uploadedImageUrl) {
          throw new Error("Failed to upload image")
        }
      }

      // Now add the memory with the image URL
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Create memory object with content and optional image
      const memoryObject = {
        content,
        imageUrl: uploadedImageUrl,
        createdAt: new Date().toISOString(),
      }

      // Get current memories
      const { data: currentData, error: fetchError } = await supabase
        .from("memorialpages212515")
        .select("memory_message")
        .eq("id", memorialId)
        .single()

      if (fetchError) throw fetchError

      // Parse existing memories
      let existingMemories = []
      try {
        if (currentData?.memory_message) {
          // Check if memory_message is already an array of objects
          if (typeof currentData.memory_message[0] === "object") {
            existingMemories = currentData.memory_message
          } else {
            // Convert string memories to objects for backward compatibility
            existingMemories = currentData.memory_message.map((memory: string) => ({
              content: memory,
              imageUrl: null,
              createdAt: new Date().toISOString(),
            }))
          }
        }
      } catch (parseError) {
        console.error("Error parsing existing memories:", parseError)
        existingMemories = []
      }

      // Update with new memory
      const { error: updateError } = await supabase
        .from("memorialpages212515")
        .update({
          memory_message: [...existingMemories, memoryObject],
        })
        .eq("id", memorialId)

      if (updateError) throw updateError

      // Call the callback with the new memory
      onMemoryAdded(content, uploadedImageUrl || undefined)

      // Reset form
      setContent("")
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(null)
      setPreviewUrl(null)
      setUploadProgress(0)
    } catch (error) {
      console.error("Error adding memory:", error)
      setError(error instanceof Error ? error.message : "Failed to add memory")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 mb-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200" onDragEnter={handleDrag}>
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="flex-grow">
            <textarea
              placeholder="Please share your memories with us!"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[100px] bg-gray-50 rounded-lg p-3 text-gray-700 placeholder-gray-500 border-0 resize-none focus:ring-0 focus:outline-none"
            />

            {/* Image preview area */}
            {previewUrl && (
              <div className="mt-3 relative">
                <div className="relative rounded-lg overflow-hidden w-full h-48">
                  <Image
                    src={previewUrl || "/placeholder.svg"}
                    alt="Memory image preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Upload progress indicator */}
                {isUploading && uploadProgress > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-75 p-2 rounded">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-right">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Drag and drop area */}
            {!previewUrl && (
              <div
                className={`mt-3 border-2 border-dashed rounded-lg p-4 text-center ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="memory-image-upload"
                />
                <label
                  htmlFor="memory-image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    <span className="font-medium text-blue-500">Click to upload</span> or drag and drop
                  </span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
            )}

            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">Share a special memory</div>
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !selectedFile) || isUploading}
            className={`
              inline-flex items-center px-4 py-2 rounded-full
              ${
                isSubmitting || (!content.trim() && !selectedFile) || isUploading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#86efac] text-white hover:bg-[#6ee7a1] transition-colors"
              }
            `}
          >
            {isSubmitting || isUploading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isUploading ? "Uploading..." : "Posting..."}
              </span>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

