"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface User {
  id: string
  email: string
  username?: string
  is_premium: boolean
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, username, is_premium, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to fetch users. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  async function togglePremiumStatus(userId: string, currentStatus: boolean) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ is_premium: !currentStatus })
        .eq("id", userId)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, is_premium: !currentStatus } : user)))
        console.log("Updated user:", data[0])
      } else {
        console.warn("No data returned after update, but assuming it was successful")
        setUsers(users.map((user) => (user.id === userId ? { ...user, is_premium: !currentStatus } : user)))
      }
    } catch (error) {
      console.error("Error updating premium status:", error)
      setError("Failed to update premium status. Please try again.")
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.username || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_premium ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.is_premium ? "Premium" : "Free"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => togglePremiumStatus(user.id, user.is_premium)}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                  >
                    {user.is_premium ? "Remove Premium" : "Make Premium"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

