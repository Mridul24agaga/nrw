"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface DeletePostButtonProps {
  postId: string
  onDeleteStart: () => void
  onDeleteComplete: () => void
}

export function DeletePostButton({ postId, onDeleteStart, onDeleteComplete }: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    onDeleteStart()

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId)

      if (error) throw error

      onDeleteComplete()
    } catch (error) {
      console.error("Error deleting post:", error)
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 focus:outline-none focus:bg-red-100"
      disabled={isDeleting}
    >
      {isDeleting ? (
        <svg
          className="animate-spin h-5 w-5 mr-2 inline"
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
      ) : (
        <svg className="h-5 w-5 mr-2 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      Delete Post
    </button>
  )
}

