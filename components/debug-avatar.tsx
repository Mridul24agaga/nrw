"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"

export function DebugAvatar({ userId }: { userId: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("users").select("avatar_url").eq("id", userId).single()

        if (error) {
          throw error
        }

        setAvatarUrl(data.avatar_url)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, supabase])

  const handleRefreshImage = () => {
    window.location.reload()
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md mt-4">
      <h3 className="font-medium mb-2">Avatar Debug Info</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <p className="mb-2">
            <strong>Avatar URL in database:</strong>{" "}
            {avatarUrl ? (
              <a href={avatarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                {avatarUrl.substring(0, 50)}...
              </a>
            ) : (
              "No avatar URL set"
            )}
          </p>
          <Button onClick={handleRefreshImage} size="sm">
            Force Refresh
          </Button>
        </div>
      )}
    </div>
  )
}

