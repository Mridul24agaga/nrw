"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    try {
      await supabase.from("posts").insert({
        content,
        user_id: user.id,
      })

      setContent("")
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="border-b p-6">
      <div className="flex gap-4">
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Please share your memories with us!"
            className="w-full resize-none border-none bg-transparent p-2 outline-none"
            rows={3}
          />
          <div className="flex items-center justify-between border-t pt-3">
            <button type="button" className="rounded-full p-2 hover:bg-gray-100">
            </button>
            <button
              type="submit"
              className="rounded-full bg-green-500 px-6 py-1.5 text-white hover:bg-green-600"
              disabled={!content.trim()}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

