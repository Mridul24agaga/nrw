"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { User, Search } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SearchUser {
  id: string
  username: string
  email: string
}

interface UserSearchProps {
  currentUserId: string
  onSelectUser: (user: SearchUser) => void
  onClose: () => void
}

export default function UserSearch({ currentUserId, onSelectUser, onClose }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const searchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email")
      .neq("id", currentUserId)
      .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
    } else {
      setSearchResults(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Search Users</h3>
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or email"
            className="w-full p-2 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        {searchResults.length > 0 ? (
          <ul className="space-y-2">
            {searchResults.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user.username || user.email}</p>
                    {user.username && <p className="text-sm text-gray-500">{user.email}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : searchTerm.length > 2 ? (
          <p className="text-gray-500 text-center py-4">No users found</p>
        ) : null}
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

