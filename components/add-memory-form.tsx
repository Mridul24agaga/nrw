"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { ImageIcon, X, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [success, setSuccess] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
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
      setSuccess("Image uploaded successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
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
    if ((!content || !content.trim()) && !imageUrl) {
      setError("Please add some content or upload an image to share a memory.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw new Error("You must be signed in to share memories. Please sign in and try again.")
      }

      if (!userData.user) {
        throw new Error("Authentication required. Please sign in to share memories.")
      }

      console.log("User authenticated:", userData.user.id)

      // Get user profile data for author information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userData.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError)
      }

      // Create new memory object with enhanced author info
      const newMemory: MemoryObject = {
        content: content.trim(),
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        author: {
          id: userData.user.id,
          username: profileData?.username || userData.user.email?.split("@")[0] || "Anonymous",
          avatar_url: profileData?.avatar_url || null,
        },
      }

      console.log("New memory object:", newMemory)
      console.log("Memorial ID:", memorialId)

      // Get current memories from database with better error handling
      const { data: currentData, error: fetchError } = await supabase
        .from("memorialpages212515")
        .select("memory_message")
        .eq("id", memorialId)
        .single()

      if (fetchError) {
        console.error("Error fetching current memories:", fetchError)
        // If the memorial doesn't exist or we can't access it, throw an error
        if (fetchError.code === "PGRST116") {
          throw new Error("Memorial not found. Please check if the memorial page exists.")
        }
        throw new Error(`Failed to access memorial data: ${fetchError.message}`)
      }

      console.log("Current memorial data:", currentData)

      // Initialize existing memories array
      let existingMemories: MemoryObject[] = []

      // Parse existing memories safely
      if (currentData?.memory_message) {
        try {
          // If it's already an array, use it directly
          if (Array.isArray(currentData.memory_message)) {
            existingMemories = currentData.memory_message.filter((memory) => memory !== null && memory !== undefined)
          }
          // If it's a single object, wrap it in an array
          else if (typeof currentData.memory_message === "object" && currentData.memory_message !== null) {
            existingMemories = [currentData.memory_message]
          }
          // If it's a string (old format), try to parse it
          else if (typeof currentData.memory_message === "string") {
            try {
              const parsed = JSON.parse(currentData.memory_message)
              existingMemories = Array.isArray(parsed) ? parsed : [parsed]
            } catch {
              // If parsing fails, treat as a simple string memory
              existingMemories = [
                {
                  content: currentData.memory_message,
                  imageUrl: null,
                  createdAt: new Date().toISOString(),
                },
              ]
            }
          }
        } catch (error) {
          console.error("Error parsing existing memories:", error)
          existingMemories = []
        }
      }

      console.log("Existing memories:", existingMemories)

      // Add new memory to existing memories
      const updatedMemories = [...existingMemories, newMemory]

      console.log("Updated memories array:", updatedMemories)

      // Update database with all memories - CRITICAL: Use RLS bypass or ensure proper permissions
      const { data: updateData, error: updateError } = await supabase
        .from("memorialpages212515")
        .update({
          memory_message: updatedMemories,
        })
        .eq("id", memorialId)
        .select()

      if (updateError) {
        console.error("Database update error:", updateError)

        // Check if it's a permission error
        if (updateError.code === "42501" || updateError.message.includes("permission")) {
          throw new Error(
            "You don't have permission to add memories to this memorial. Please contact the memorial creator.",
          )
        }

        // Check if it's a policy violation
        if (updateError.code === "23506" || updateError.message.includes("policy")) {
          throw new Error("Unable to add memory due to security policy. Please try again or contact support.")
        }

        throw new Error(`Failed to save your memory: ${updateError.message}`)
      }

      console.log("Memory saved successfully:", updateData)

      // Show success message
      setSuccess("Your memory has been shared successfully!")

      // Call the callback with the new memory
      onMemoryAdded(content || "", imageUrl || undefined)

      // Reset form
      setContent("")
      setImageUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      console.log("Memory added successfully. Total memories:", updatedMemories.length)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error("Error adding memory:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to add memory. Please try again."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 mb-6">
      {/* Success Alert */}
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
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
            <textarea
              placeholder="Share a special memory, story, or tribute... Anyone can contribute to honor this person's memory."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] bg-gray-50 rounded-lg p-4 text-gray-700 placeholder-gray-500 border-0 resize-none focus:ring-0 focus:outline-none focus:bg-white transition-colors"
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
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !imageUrl) || isUploading}
            className={`
              inline-flex items-center px-6 py-2 rounded-full font-medium transition-all
              ${
                isSubmitting || (!content.trim() && !imageUrl) || isUploading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : `${themeColor.color} ${themeColor.hoverColor} text-white shadow-sm hover:shadow-md`
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
                Sharing Memory...
              </span>
            ) : (
              <span>Share Memory</span>
            )}
          </button>
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