"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

const UserProfile = () => {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from("users").select("email, is_premium").eq("id", user.id).single()

        if (error) throw error
        setUser(data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return (
    <div className="bg-white shadow-md rounded-lg p-6 text-black">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Status:</strong> {user.is_premium ? "Premium" : "Free"}
      </p>
      {!user.is_premium && (
        <div className="mt-4">
          <Link href="/pricing" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  )
}

export default UserProfile

