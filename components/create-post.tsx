"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setIsPosting(true)

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          user_id: user.id,
        })
        .select()

      if (error) throw error

      setContent("")
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
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border-2 border-primary">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url || "/placeholder.svg"}
              alt={user.username || "User avatar"}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <AvatarFallback>{(user.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
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
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </button>
            <Button type="submit" disabled={!content.trim() || isPosting || isRefreshing}>
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

