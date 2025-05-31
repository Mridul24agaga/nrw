"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ImageIcon, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
}

interface MemoryObject {
  content: string
  imageUrl: string | null
  createdAt: string
  author?: {
    id: string
    username: string
    avatar_url: string | null
  }
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
}: AddMemoryFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
      await handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleImageUpload(e.target.files[0])
    }
  }

  const handleImageUpload = async (file: File) => {
    if (isUploading) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Use the new Vercel Blob API route
      const response = await fetch("/api/blob-memory-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
      }

      const result = await response.json()
      setImageUrl(result.imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      setError(error instanceof Error ? error.message : "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageUrl) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Get user profile data for author information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userData.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError)
      }

      // Create memory object with content, image, and author information
      const memoryObject: MemoryObject = {
        content,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        author: {
          id: userData.user.id,
          username: profileData?.username || userData.user.email?.split("@")[0] || "Anonymous",
          avatar_url: profileData?.avatar_url || null,
        },
      }

      // Get current memories
      const { data: currentData, error: fetchError } = await supabase
        .from("memorialpages212515")
        .select("memory_message")
        .eq("id", memorialId)
        .single()

      if (fetchError) throw fetchError

      // Parse existing memories if they exist
      let existingMemories: MemoryObject[] = []

      try {
        if (currentData?.memory_message) {
          // Ensure we're working with an array
          const memoryArray = Array.isArray(currentData.memory_message)
            ? currentData.memory_message
            : [currentData.memory_message]

          existingMemories = memoryArray.map((memory: any) => {
            // If memory is a string, it's an old format memory
            if (typeof memory === "string") {
              return {
                content: memory,
                imageUrl: null,
                createdAt: new Date().toISOString(),
              }
            }

            // If memory is already an object but might be stringified JSON
            if (typeof memory === "object") {
              // Check if it's a nested JSON structure that needs parsing
              if (
                memory.content &&
                typeof memory.content === "string" &&
                (memory.content.startsWith("{") || memory.content.includes('\\"'))
              ) {
                try {
                  // Try to parse potentially nested JSON
                  let parsedContent = memory.content

                  // Keep parsing until we get a clean object
                  while (
                    typeof parsedContent === "string" &&
                    (parsedContent.startsWith("{") || parsedContent.includes('\\"'))
                  ) {
                    parsedContent = JSON.parse(parsedContent)
                  }

                  // If we ended up with an object with the right structure, use it
                  if (typeof parsedContent === "object" && parsedContent.content) {
                    return {
                      content: parsedContent.content,
                      imageUrl: parsedContent.imageUrl || null,
                      createdAt: parsedContent.createdAt || new Date().toISOString(),
                      author: parsedContent.author || memory.author,
                    }
                  }
                } catch (e) {
                  console.error("Error parsing nested memory:", e)
                }
              }

              // Return the memory object with defaults for missing fields
              return {
                content: typeof memory.content === "string" ? memory.content : "",
                imageUrl: memory.imageUrl || null,
                createdAt: memory.createdAt || new Date().toISOString(),
                author: memory.author,
              }
            }

            // Fallback for unexpected formats
            return {
              content: String(memory),
              imageUrl: null,
              createdAt: new Date().toISOString(),
            }
          })
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
      onMemoryAdded(content, imageUrl || undefined)

      // Reset form
      setContent("")
      setImageUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error adding memory:", error)
      setError("Failed to add memory. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 mb-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200" onDragEnter={handleDrag}>
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-4">
            <div className={`w-10 h-10 rounded-full ${themeColor.lightColor} flex items-center justify-center`}>
              <ImageIcon className={`w-5 h-5 ${themeColor.textColor}`} />
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
            {imageUrl && (
              <div className="mt-3 relative">
                <div className="relative rounded-lg overflow-hidden w-full h-48">
                  <Image src={imageUrl || "/placeholder.svg"} alt="Memory image" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Drag and drop area */}
            {!imageUrl && (
              <div
                className={`mt-3 border-2 border-dashed rounded-lg p-4 text-center ${
                  dragActive ? `border-${themeColor.name}-500 bg-${themeColor.name}-50` : "border-gray-300"
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
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        Uploading to Vercel Blob...
                      </div>
                    ) : (
                      <>
                        <span className={`font-medium ${themeColor.textColor}`}>Click to upload</span> or drag and drop
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
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
            disabled={isSubmitting || (!content.trim() && !imageUrl) || isUploading}
            className={`
              inline-flex items-center px-4 py-2 rounded-full
              ${
                isSubmitting || (!content.trim() && !imageUrl) || isUploading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : `${themeColor.color} ${themeColor.hoverColor} text-white transition-colors`
              }
            `}
          >
            {isSubmitting ? (
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
                Posting...
              </span>
            ) : (
              <span>Post Memory</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
