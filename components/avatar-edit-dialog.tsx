"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Upload, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AvatarEditDialogProps {
  userId: string
  avatarUrl: string | null
  username: string
  children: React.ReactNode
}

export function AvatarEditDialog({ userId, avatarUrl, username, children }: AvatarEditDialogProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Get the first letter of username for avatar fallback
  const avatarFallback = (username || "?").charAt(0).toUpperCase()

  // Check if the storage_avatars bucket exists, create if it doesn't
  useEffect(() => {
    const checkAndCreateBucket = async () => {
      try {
        // Check if the bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets()

        if (listError) {
          console.error("Error listing buckets:", listError)
          return
        }

        const bucketExists = buckets?.some((bucket) => bucket.name === "storage_avatars")

        if (!bucketExists) {
          console.log("Creating storage_avatars bucket...")
          const { error: createError } = await supabase.storage.createBucket("storage_avatars", {
            public: true,
          })

          if (createError) {
            console.error("Error creating bucket:", createError)
          } else {
            console.log("storage_avatars bucket created successfully")
          }
        }
      } catch (error) {
        console.error("Error checking/creating bucket:", error)
      }
    }

    checkAndCreateBucket()
  }, [supabase])

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

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true)

      // First, get the current profile picture record
      const { data: profilePicture, error: fetchError } = await supabase
        .from("profile_pictures")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching profile picture:", fetchError)
        throw new Error(`Failed to fetch profile picture: ${fetchError.message}`)
      }

      // If there's an existing profile picture, delete the file from storage
      if (profilePicture) {
        // Delete the file from storage
        const { error: storageError } = await supabase.storage
          .from(profilePicture.bucket_id)
          .remove([profilePicture.file_path])

        if (storageError) {
          console.error("Error removing file from storage:", storageError)
          // Continue anyway to update the database
        }

        // Delete the profile picture record
        const { error: deleteError } = await supabase.from("profile_pictures").delete().eq("id", profilePicture.id)

        if (deleteError) {
          console.error("Error deleting profile picture record:", deleteError)
          throw new Error(`Failed to delete profile picture record: ${deleteError.message}`)
        }
      }

      // Update the user's avatar_url to null
      const { error: updateError } = await supabase.from("users").update({ avatar_url: null }).eq("id", userId)

      if (updateError) {
        console.error("Error updating user:", updateError)
        throw new Error(`Failed to update user: ${updateError.message}`)
      }

      setPreviewUrl(null)
      setSelectedFile(null)
      console.log("Avatar removed")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error removing avatar:", error)
      console.error(error instanceof Error ? error.message : "Failed to remove avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveAvatar = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)

      // 1. Upload the file to storage_avatars bucket
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("storage_avatars")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Error uploading file:", uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      console.log("Upload successful:", uploadData)

      // 2. Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("storage_avatars").getPublicUrl(filePath)

      console.log("Public URL:", publicUrl)

      // 3. Check if there's an existing profile picture for this user
      const { data: existingPicture, error: fetchError } = await supabase
        .from("profile_pictures")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching existing profile picture:", fetchError)
        throw new Error(`Failed to check existing profile picture: ${fetchError.message}`)
      }

      // 4. If there's an existing picture, update it. Otherwise, insert a new record.
      if (existingPicture) {
        // Delete the old file if it exists and is different
        if (existingPicture.bucket_id === "storage_avatars" && existingPicture.file_path !== filePath) {
          const { error: deleteError } = await supabase.storage
            .from("storage_avatars")
            .remove([existingPicture.file_path])

          if (deleteError) {
            console.error("Error deleting old file:", deleteError)
            // Continue anyway
          }
        }

        // Update the profile_pictures record
        const { error: updateError } = await supabase
          .from("profile_pictures")
          .update({
            bucket_id: "storage_avatars",
            file_path: filePath,
            public_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPicture.id)

        if (updateError) {
          console.error("Error updating profile picture record:", updateError)
          throw new Error(`Failed to update profile picture record: ${updateError.message}`)
        }
      } else {
        // Insert a new profile_pictures record
        const { error: insertError } = await supabase.from("profile_pictures").insert({
          user_id: userId,
          bucket_id: "storage_avatars",
          file_path: filePath,
          public_url: publicUrl,
        })

        if (insertError) {
          console.error("Error inserting profile picture record:", insertError)
          throw new Error(`Failed to create profile picture record: ${insertError.message}`)
        }
      }

      // 5. Update the user's avatar_url in the users table
      const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId)

      if (updateError) {
        console.error("Error updating user:", updateError)
        throw new Error(`Failed to update user profile: ${updateError.message}`)
      }

      console.log("Avatar updated successfully")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      console.error(error instanceof Error ? error.message : "Failed to update avatar")
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
    }
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
            <Avatar className="h-32 w-32">
              {previewUrl ? (
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt={username || "User avatar"}
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-4xl">{avatarFallback}</AvatarFallback>
              )}
            </Avatar>

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

            {previewUrl && (
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

          <Button type="button" onClick={handleSaveAvatar} disabled={isUploading || !selectedFile}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

