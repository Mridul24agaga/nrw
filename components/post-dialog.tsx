"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import CreatePost from "./create-post"
import { cn } from "@/lib/utils"

interface PostDialogProps {
  trigger: React.ReactNode
}

export default function PostDialog({ trigger }: PostDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus trap inside dialog
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )

      if (focusableElements.length > 0) {
        ;(focusableElements[0] as HTMLElement).focus()
      }
    }
  }, [isOpen])

  const handlePostComplete = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        ref={dialogRef}
        className={cn(
          "sm:max-w-[600px] p-0 border-none shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "rounded-2xl overflow-hidden",
        )}
      >
        <div className="relative bg-white rounded-2xl">
          {/* Header with close button */}
          <div className="flex items-center h-14 px-4 border-b">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-700" />
            </button>
            <div className="flex-1"></div>
          </div>

          {/* Post creation form */}
          <div className="max-h-[80vh] overflow-y-auto">
            <CreatePostWithCharCounter onPostComplete={handlePostComplete} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced CreatePost with character counter
function CreatePostWithCharCounter({ onPostComplete }: { onPostComplete?: () => void }) {
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 280 // Twitter's character limit

  // Handle content changes to update character count
  const handleContentChange = (content: string) => {
    setCharCount(content.length)
  }

  return (
    <div className="relative">
      <CreatePost onPostComplete={onPostComplete} onContentChange={handleContentChange} />

      {/* Character counter */}
      <div className="absolute bottom-4 right-20 flex items-center gap-2">
        {charCount > 0 && (
          <>
            <div
              className={cn(
                "text-sm",
                charCount > MAX_CHARS
                  ? "text-red-500 font-bold"
                  : charCount > MAX_CHARS * 0.8
                    ? "text-amber-500"
                    : "text-gray-500",
              )}
            >
              {charCount}/{MAX_CHARS}
            </div>

            {/* Circle progress indicator */}
            {charCount > MAX_CHARS * 0.8 && (
              <div className="relative h-6 w-6">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <circle
                    className="text-gray-200"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                  />
                  <circle
                    className={cn(
                      "transition-all duration-300",
                      charCount > MAX_CHARS ? "text-red-500" : "text-blue-500",
                    )}
                    strokeWidth="2"
                    strokeDasharray={63}
                    strokeDashoffset={63 - (charCount / MAX_CHARS) * 63}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                  />
                </svg>
                {charCount > MAX_CHARS && (
                  <span className="absolute text-[10px] font-bold text-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {MAX_CHARS - charCount}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
