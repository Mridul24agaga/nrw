"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { Loader2, Upload, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CustomAvatar } from "@/components/custom-avatar"
import type { User } from "@/lib/types"

interface AvatarUploadDialogProps {
  userId: string
  avatarUrl: string | null
  username: string
  children: React.ReactNode
}

export function AvatarUploadDialog({ userId, avatarUrl, username, children }: AvatarUploadDialogProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const supabase = createClientComponentClient()

  // Simple direct upload without canvas manipulation
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setSelectedFile(file)

    // Reset the file input
    e.target.value = ""
  }

  // Use the API route for uploading instead of direct storage access
  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first")
      return
    }

    try {
      setIsUploading(true)
      toast.info("Uploading avatar...")

      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("userId", userId)

      // Use the API route to handle the upload
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload avatar")
      }

      const data = await response.json()

      toast.success("Avatar updated successfully")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true)
      toast.info("Removing avatar...")

      // Use the API route to handle avatar removal
      const response = await fetch("/api/remove-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove avatar")
      }

      setPreviewUrl(null)
      setSelectedFile(null)
      toast.success("Avatar removed")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error removing avatar:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset preview to current avatar when dialog closes without saving
      setPreviewUrl(avatarUrl)
      setSelectedFile(null)
      imageRef.current = null
    }
  }

  // Create a mock user object for the avatar component
  const mockUser: User = {
    id: userId,
    username: username,
    avatar_url: previewUrl,
    email: "",
    bio: null,
    created_at: "",
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-6 py-4">
          <div className="relative">
            {selectedFile && previewUrl ? (
              <div className="h-32 w-32 relative">
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 w-32">
                <CustomAvatar user={mockUser} size={128} />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={handleFileSelect} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>

            {avatarUrl && (
              <Button type="button" variant="destructive" onClick={handleRemoveAvatar} disabled={isUploading}>
                <Trash className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSaveAvatar}
            disabled={isUploading || !selectedFile}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

