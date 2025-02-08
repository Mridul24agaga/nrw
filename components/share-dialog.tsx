"use client"

import { useState, useRef, useEffect } from "react"
import { X, Facebook, Twitter, Linkedin, LinkIcon, Check } from "lucide-react"

interface ShareDialogProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareDialog({ postId, isOpen, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/posts/${postId}`

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareToSocial = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    }
    window.open(urls[platform as keyof typeof urls], "_blank")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        className="bg-white rounded-xl w-full max-w-md overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share this post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Copy link"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => shareToSocial("facebook")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-6 h-6" />
            </button>
            <button
              onClick={() => shareToSocial("twitter")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-6 h-6" />
            </button>
            <button
              onClick={() => shareToSocial("linkedin")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

