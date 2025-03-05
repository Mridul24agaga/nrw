"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Upload, Trash, X } from "lucide-react"

interface MemorialAvatarDialogProps {
  memorialId: string
  avatarUrl: string | null
  memorialName: string
  children: React.ReactNode
}

export function MemorialAvatarDialog({ memorialId, avatarUrl, memorialName, children }: MemorialAvatarDialogProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setErrorMessage(null)

    // Reset the file input
    e.target.value = ""
  }

  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select an image first")
      return
    }

    try {
      setIsUploading(true)
      setErrorMessage(null)

      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("memorialId", memorialId)

      // Use the API route to handle the upload
      const response = await fetch("/api/upload-memorial-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload memorial avatar")
      }

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error uploading memorial avatar:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to update memorial avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true)
      setErrorMessage(null)

      // Use the API route to handle avatar removal
      const response = await fetch("/api/remove-memorial-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memorialId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove memorial avatar")
      }

      setPreviewUrl(null)
      setSelectedFile(null)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error removing memorial avatar:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove memorial avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => {
    setIsOpen(false)
    // Reset preview to current avatar when dialog closes without saving
    setPreviewUrl(avatarUrl)
    setSelectedFile(null)
    setErrorMessage(null)
  }

  // If dialog is not open, just render the children (trigger)
  if (!isOpen) {
    return <div onClick={openDialog}>{children}</div>
  }

  // Render the dialog when open
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={closeDialog}>
        {/* Dialog */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Edit Memorial Picture</h2>
            <button onClick={closeDialog} className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center justify-center gap-6 p-6">
            <div className="relative">
              {selectedFile && previewUrl ? (
                <div className="h-32 w-32 relative">
                  <Image
                    src={previewUrl || "/placeholder.svg"}
                    alt="Memorial Preview"
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {previewUrl ? (
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt={memorialName}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">{memorialName[0]?.toUpperCase()}</span>
                  )}
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>

            {errorMessage && <div className="text-red-500 text-sm text-center">{errorMessage}</div>}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleFileSelect}
                disabled={isUploading}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Memorial Image
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAvatar}
              disabled={isUploading || !selectedFile}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Uploading...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

