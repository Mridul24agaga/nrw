"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import Sidebar from "@/components/sidebar"
import { Post } from "@/components/post"
import { FollowButton } from "@/components/follow-button"

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const username = params?.username as string

  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState<boolean>(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchUser() {
      const { data: sessionData } = await supabase.auth.getSession()
      setSession(sessionData?.session)

      const { data: userData, error } = await supabase.from("users").select("*").eq("username", username).single()

      if (error || !userData) {
        console.error("Error fetching user:", error)
        notFound()
        return
      }

      setUser(userData)
      setAvatarUrl(userData.avatar_url)

      // Check if current user is following this profile
      if (sessionData?.session?.user) {
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", sessionData.session.user.id)
          .eq("following_id", userData.id)
          .single()

        if (followError && followError.code !== "PGRST116") {
          console.error("Error checking follow status:", followError)
        }

        setIsFollowing(!!followData)
        setIsLoadingFollow(false)
      } else {
        setIsLoadingFollow(false)
      }
    }

    if (username) {
      fetchUser()
    }
  }, [supabase, username])

  if (!user) return <p>Loading...</p>

  const isOwnProfile = session?.user?.id === user.id

  async function handleAvatarUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!fileInputRef.current?.files) return
    const file = fileInputRef.current.files[0]

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await res.json()
      const url = data.avatar_url || data.url

      await supabase.from("users").update({ avatar_url: url }).eq("id", user.id)
      setAvatarUrl(url)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="relative">
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600" />

                <div className="relative px-8 pb-6">
                  <div className="absolute -top-12 left-0">
                    <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white bg-gray-200">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl || "/placeholder.svg"}
                          alt={`${user.username}'s avatar`}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 text-2xl font-bold">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    {isOwnProfile && (
                      <form onSubmit={handleAvatarUpload} className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          required
                          className="hidden"
                          onChange={(e) => {
                            // Auto-submit when file is selected
                            if (e.target.files && e.target.files.length > 0) {
                              handleAvatarUpload(e)
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Avatar
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="absolute -top-12 right-0">
                    {!isOwnProfile && session?.user && !isLoadingFollow && (
                      <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
                    )}
                  </div>

                  <div className="pt-16">
                    <h1 className="text-2xl font-bold">{user.username}</h1>
                    <p className="text-gray-600 mt-1">{user.bio || "No bio available"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Posts</h2>
              <div className="space-y-6">
                {user.posts?.length ? (
                  user.posts.map((post: any) => <Post key={post.id} post={post} />)
                ) : (
                  <p>No posts yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

