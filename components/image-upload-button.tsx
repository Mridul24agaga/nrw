"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadButtonProps {
  onImageSelected: (file: File) => void
  className?: string
}

export default function ImageUploadButton({ onImageSelected, className }: ImageUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelected(file)
    }
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
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file)
    }
  }

  return (
    <div
      className={cn(
        "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center justify-center py-4">
        <div className="bg-gray-100 p-2 rounded mb-2">
          <ImageIcon className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-sm text-gray-700">Drag and drop an image here</p>
        <p className="text-xs text-gray-500 mt-1">or click to browse</p>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
    </div>
  )
}
