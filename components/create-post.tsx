"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, RefreshCw, X } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { uploadPostImage } from "@/actions/upload-actions"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("users").select("username, avatar_url").eq("id", user.id).single()
        setUser({ ...user, ...data })
      }
    }
    fetchUser()
  }, [supabase])

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

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleSelectedFile(file)
    }
  }

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Upload image using server action
  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true)
    setUploadError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)

      // Call the server action
      const result = await uploadPostImage(formData)

      if (result.error) {
        setUploadError(result.error)
        return null
      }

      // Ensure url is not undefined
      return result.url || null
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadError("Failed to upload image. Please try again.")
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

      // Create post with or without image
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          user_id: user.id,
          image_url: imageUrl,
        })
        .select()

      if (error) throw error

      // Reset form
      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      setIsPosting(false)
      setIsRefreshing(true)

      // Simulate a short delay before refreshing
      setTimeout(() => {
        router.refresh()
        setIsRefreshing(false)
      }, 1000)
    } catch (error) {
      console.error("Error creating post:", error)
      setIsPosting(false)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="border-b p-6 relative">
      {isRefreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div className="flex gap-4">
        <div className="h-10 w-10 border-2 border-primary rounded-full overflow-hidden flex-shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url || "/placeholder.svg"}
              alt={user.username || "User avatar"}
              width={40}
              height={40}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 font-semibold">
              {(user.username || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Please share your memories with us!"
            className="w-full resize-none border-none bg-transparent p-2 outline-none"
            rows={3}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-2 mb-4">
              <div className="relative rounded-lg overflow-hidden max-h-80">
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="object-contain max-w-full"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadError && <div className="mt-2 text-red-500 text-sm">{uploadError}</div>}

          {/* Drag and drop area */}
          {!imagePreview && (
            <div
              className={`mt-2 mb-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Drag and drop an image here, or click to select</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <button
              type="button"
              className="rounded-full p-2 hover:bg-gray-100"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              type="submit"
              disabled={(!content.trim() && !selectedImage) || isPosting || isRefreshing || isUploading}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                (!content.trim() && !selectedImage) || isPosting || isRefreshing || isUploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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
        </div>
      </div>
    </form>
  )
}

