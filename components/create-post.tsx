"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { cn } from "@/lib/utils"

interface CreatePostProps {
  onPostComplete?: () => void
  onContentChange?: (content: string) => void
}

export default function CreatePost({ onPostComplete, onContentChange }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [postError, setPostError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error("Auth error:", authError)
          setPostError(`Authentication error: ${authError.message}`)
          return
        }

        if (user) {
          try {
            const { data, error: profileError } = await supabase
              .from("users")
              .select("username, avatar_url")
              .eq("id", user.id)
              .single()

            if (profileError) {
              console.error("Profile fetch error:", profileError)
              setPostError(`Profile error: ${profileError.message}`)
              return
            }

            setUser({ ...user, ...data })
          } catch (error) {
            console.error("Error fetching user profile:", error)
            setPostError("Failed to load user profile")
          }
        }
      } catch (error) {
        console.error("Error in fetchUser:", error)
        setPostError("Failed to authenticate user")
      }
    }

    fetchUser()
  }, [supabase])

  // Handle content change and notify parent
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    if (onContentChange) {
      onContentChange(newContent)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSelectedFile(file)
    }
  }

  // Process the selected file
  const handleSelectedFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    setSelectedImage(file)
    setUploadError(null)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Upload image using Vercel Blob
  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Generate a clean filename with timestamp to avoid collisions
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "-")
      const timestamp = Date.now()
      const pathname = `posts/${timestamp}-${filename}`

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
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: user?.id, // Optional: Send user ID to track who uploaded
        multipart: file.size > 1024 * 1024, // Use multipart for files larger than 1MB
      })

      console.log("Upload successful:", result)
      return result.url
    } catch (error) {
      console.error("Error uploading image:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again."
      setUploadError(errorMessage)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !selectedImage) || !user) return

    setIsPosting(true)
    setUploadError(null)
    setPostError(null)

    try {
      let imageUrl = null

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
        if (!imageUrl) {
          setIsPosting(false)
          return // Don't proceed if image upload failed
        }
      }

      // Check if the posts table exists
      try {
        const { error: tableCheckError } = await supabase.from("posts").select("id").limit(1)

        if (tableCheckError) {
          console.error("Table check error:", tableCheckError)
          setPostError(`Database error: ${tableCheckError.message}. Make sure the 'posts' table exists.`)
          setIsPosting(false)
          return
        }
      } catch (checkError) {
        console.error("Error checking table:", checkError)
        setPostError("Failed to verify database structure")
        setIsPosting(false)
        return
      }

      // Create post with or without image
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          user_id: user.id,
          image_url: imageUrl,
        })
        .select()

      if (error) {
        console.error("Supabase insert error:", error)
        setPostError(`Error creating post: ${error.message}`)
        setIsPosting(false)
        return
      }

      console.log("Post created successfully:", data)

      // Reset form
      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
      setIsPosting(false)
      setIsRefreshing(true)

      // Simulate a short delay before refreshing
      setTimeout(() => {
        router.refresh()
        setIsRefreshing(false)

        // Call the onPostComplete callback if provided
        if (onPostComplete) {
          onPostComplete()
        }

        // Reset character count
        if (onContentChange) {
          onContentChange("")
        }
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Error creating post:", error)
      setPostError(`Error creating post: ${errorMessage}`)
      setIsPosting(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-lg shadow-sm w-full max-w-[680px]">
      

      {/* Create Post Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-bold text-gray-800">Create Post</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 relative">
        {isRefreshing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url || "/placeholder.svg?height=40&width=40&query=avatar"}
                alt={user.username || "User avatar"}
                width={40}
                height={40}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 font-semibold rounded-full">
                {(user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="font-medium text-gray-800">{user.username || "User"}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-sm text-gray-500">Now</span>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Please share your memories with us!"
              className="w-full resize-none border-none bg-transparent p-0 outline-none text-gray-700 text-lg"
              rows={3}
            />

            {/* Post error message */}
            {postError && (
              <div className="mt-2 text-red-500 text-sm p-2 bg-red-50 rounded-lg border border-red-100">
                {postError}
              </div>
            )}

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-3 mb-3">
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    width={600}
                    height={400}
                    className="object-contain max-w-full"
                  />
                </div>

                {/* Upload progress indicator */}
                {isUploading && uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <div className="mt-2 text-red-500 text-sm p-2 bg-red-50 rounded-lg border border-red-100">
                {uploadError}
              </div>
            )}

            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-600"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Photo</span>
          </button>

          <button
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isPosting || isRefreshing || isUploading}
            className={cn(
              "px-4 py-2 rounded-md text-white font-medium",
              (!content.trim() && !selectedImage) || isPosting || isRefreshing || isUploading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            {isPosting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                {isUploading ? "Uploading..." : "Posting..."}
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
