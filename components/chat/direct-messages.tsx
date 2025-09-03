"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { getUsers, getChannels, createChannel } from "@/actions/chat"
import { MessageSquarePlus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string | null
}

interface ChannelPreview {
  id: string
  name: string
  avatar_url?: string | null
  updatedAt?: string
  otherUserId: string
}

export default function DirectMessages() {
  const [users, setUsers] = useState<User[]>([])
  const [channels, setChannels] = useState<ChannelPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUserList, setShowUserList] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
    
    fetchUsers()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchChannels(currentUser.id)
      const channelsSubscription = supabase
        .channel("public:channel_members")
        .on("postgres_changes", { event: "*", schema: "public", table: "channel_members" }, () => {
          fetchChannels(currentUser.id)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channelsSubscription)
      }
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const { users, error } = await getUsers()
      if (error) throw new Error(error)
      if (!users) throw new Error("No users found")

      setUsers(users.filter((user) => user.id !== currentUser?.id))
      setIsLoading(false)
    } catch (error) {
      console.error("Error in fetchUsers:", error)
      setError(error instanceof Error ? error.message : "Failed to load users")
      setIsLoading(false)
    }
  }

  const fetchChannels = async (userId: string) => {
    try {
      const { channels, error } = await getChannels(userId)
      if (error) throw new Error(error)

      const channelArray = channels || []

      const formattedChannels: ChannelPreview[] = channelArray.map((channel: any) => ({
        id: channel.id,
        name: channel.name || "Unknown",
        avatar_url: channel.avatar_url,
        updatedAt: channel.updatedAt,
        otherUserId: channel.otherUserId,
      }))

      console.log("Formatted channels:", formattedChannels)
      setChannels(formattedChannels)
    } catch (error) {
      console.error("Error fetching channels:", error)
      setError("Failed to fetch channels. Please try again.")
    }
  }

  const startOrOpenChat = async (otherUser: User) => {
    if (!currentUser) return

    console.log("Starting chat with user:", otherUser)
    setShowUserList(false)

    try {
      const existingChannel = channels.find((channel) => channel.otherUserId === otherUser.id)

      if (existingChannel) {
        console.log("Found existing channel:", existingChannel)
        router.push(`/chat/${existingChannel.id}`)
      } else {
        // Create a new channel and then navigate to it
        const { channelId, error } = await createChannel(currentUser.id, otherUser.id)
        if (error) throw new Error(error)
        if (!channelId) throw new Error("No channel ID returned")

        console.log("Created new channel:", channelId)
        router.push(`/chat/${channelId}`)
      }
    } catch (error) {
      console.error("Error starting/opening chat:", error)
      setError("Failed to start/open chat. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl font-semibold">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-2xl font-semibold text-red-500">{error}</div>
        <button
          onClick={() => {
            setError(null)
            setIsLoading(true)
            fetchUsers()
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Users and Channels list */}
      <div className="w-64 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Chats</h2>
          {currentUser && <div className="mt-2 text-sm text-gray-500">Logged in as: {currentUser.email}</div>}
        </div>
        <div className="space-y-2 p-2">
          <h3 className="font-medium text-sm text-gray-500 px-4 py-2">Recent Chats</h3>
          {channels.length > 0 ? (
            channels.map((channel) => (
              <Link
                href={`/chat/${channel.id}`}
                key={channel.id}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={channel.avatar_url || "/placeholder.svg?height=32&width=32"}
                    alt={channel.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="truncate">{channel.name}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-gray-500 px-4 py-2">No recent chats</div>
          )}
          <h3 className="font-medium text-sm text-gray-500 px-4 py-2 mt-4">All Users</h3>
          {users.map((user) => (
            <button
              key={user.id}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => startOrOpenChat(user)}
            >
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatar_url || "/placeholder.svg?height=32&width=32"}
                  alt={user.username || user.email}
                  className="w-8 h-8 rounded-full"
                />
                <span className="truncate">{user.username || user.email}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-[#0b141a] items-center justify-center text-center p-4">
        <div className="mb-4">
          <MessageSquarePlus className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select a chat or start a new conversation</h3>
        <p className="text-gray-500 mb-4">Choose a user from the list or click the button below to start a new chat</p>
        <button
          onClick={() => setShowUserList(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Start New Chat</span>
        </button>

        {/* User selection overlay */}
        {showUserList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Select a user to chat with</h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center space-x-3"
                    onClick={() => startOrOpenChat(user)}
                  >
                    <img
                      src={user.avatar_url || "/placeholder.svg?height=40&width=40"}
                      alt={user.username || user.email}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.username || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowUserList(false)}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

