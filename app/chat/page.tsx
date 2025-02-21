"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Send, ArrowLeft, User, Search } from "lucide-react"

const supabase = createClientComponentClient()

interface ChatUser {
  id: string
  username: string | null
  avatar_url: string | null
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  seen: boolean
  sender?: ChatUser
}

interface NewMessage {
  content: string
  sender_id: string
  receiver_id: string
  seen: boolean
}

export default function ChatApp() {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [isChatListOpen, setIsChatListOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.error("User is not authenticated")
        // Handle unauthenticated user (e.g., redirect to login page)
      } else {
        fetchCurrentUser(user.id)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
      subscribeToMessages()
    }
  }, [currentUser])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchCurrentUser = async (userId: string) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching current user:", error)
    } else if (data) {
      setCurrentUser(data)
    }
  }

  const fetchUsers = async () => {
    try {
      if (!currentUser) return

      const { data: usersData, error: usersError } = await supabase.from("users").select("*").neq("id", currentUser.id)

      if (usersError) throw usersError

      if (usersData) {
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false })

        if (messagesError) throw messagesError

        const processedUsers: ChatUser[] = usersData
          .map((user) => {
            const userMessages =
              messagesData?.filter((msg) => msg.sender_id === user.id || msg.receiver_id === user.id) || []
            const unreadCount = userMessages.filter((msg) => msg.receiver_id === currentUser.id && !msg.seen).length
            const lastMessage = userMessages[0]

            return {
              ...user,
              unreadCount,
              lastMessage: lastMessage?.content,
              lastMessageTime: lastMessage?.created_at,
            }
          })
          .sort((a, b) => {
            if (!a.lastMessageTime) return 1
            if (!b.lastMessageTime) return -1
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          })

        setUsers(processedUsers)
        setFilteredUsers(processedUsers)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("public:chat_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, handleNewMessage)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, handleUpdatedMessage)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleNewMessage = async (payload: any) => {
    const newMsg = payload.new

    if (selectedUser && (newMsg.sender_id === selectedUser.id || newMsg.receiver_id === selectedUser.id)) {
      const { data: senderData } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .eq("id", newMsg.sender_id)
        .single()

      if (senderData) {
        setMessages((prev) => [...prev, { ...newMsg, sender: senderData }])
        if (newMsg.receiver_id === currentUser?.id) {
          await markMessageAsSeen(newMsg.id)
        }
      }
    }

    setUsers((prev) => {
      const updatedUsers = [...prev]
      const userIndex = updatedUsers.findIndex(
        (u) => u.id === (newMsg.sender_id === currentUser?.id ? newMsg.receiver_id : newMsg.sender_id),
      )

      if (userIndex !== -1) {
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          lastMessage: newMsg.content,
          lastMessageTime: newMsg.created_at,
          unreadCount:
            newMsg.receiver_id === currentUser?.id && !newMsg.seen
              ? (updatedUsers[userIndex].unreadCount || 0) + 1
              : updatedUsers[userIndex].unreadCount,
        }
      }

      return updatedUsers.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })
    })
  }

  const handleUpdatedMessage = (payload: any) => {
    const updatedMsg = payload.new
    setMessages((prev) => prev.map((msg) => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg)))
  }

  const selectUser = async (user: ChatUser) => {
    setSelectedUser(user)
    setIsChatListOpen(false)

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, sender:users!sender_id(id, username, avatar_url)")
        .or(
          `and(sender_id.eq.${currentUser?.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser?.id})`,
        )
        .order("created_at", { ascending: true })

      if (error) throw error

      setMessages(data || [])

      const unseenMessages = data?.filter((msg) => msg.receiver_id === currentUser?.id && !msg.seen) || []

      for (const msg of unseenMessages) {
        await markMessageAsSeen(msg.id)
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, unreadCount: 0 } : u)))
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || !currentUser) return

    try {
      const message: NewMessage = {
        content: newMessage.trim(),
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        seen: false,
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert(message)
        .select("*, sender:users!sender_id(id, username, avatar_url)")
        .single()

      if (error) {
        console.error("Supabase error:", error.message, error.details, error.hint)
        throw error
      }

      if (data) {
        setMessages((prev) => [...prev, data])
        setNewMessage("")
      } else {
        console.error("No data returned from insert operation")
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending message:", error.message, error.stack)
      } else {
        console.error("Unknown error sending message:", error)
      }
    }
  }

  const markMessageAsSeen = async (messageId: string) => {
    try {
      const { error } = await supabase.from("chat_messages").update({ seen: true }).eq("id", messageId)

      if (error) throw error
    } catch (error) {
      console.error("Error marking message as seen:", error)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Chat List */}
        <div
          className={`${
            isChatListOpen ? "translate-x-0" : "-translate-x-full"
          } transform transition-transform duration-300 ease-in-out fixed md:relative md:translate-x-0 z-30 w-full md:w-80 bg-white h-full border-r`}
        >
          <div className="bg-teal-600 text-white p-2">
            <h2 className="text-lg font-bold">Chats</h2>
            {currentUser && (
              <p className="text-sm opacity-90">Logged in as: {currentUser.username || "Anonymous User"}</p>
            )}
          </div>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-8rem)]">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`w-full text-left p-3 hover:bg-gray-100 transition-colors flex items-center space-x-3 border-b border-gray-200 ${
                    selectedUser?.id === user.id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.username || ""}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900 truncate">{user.username || "Anonymous User"}</div>
                      {user.lastMessageTime && (
                        <span className="text-xs text-gray-500">{formatTime(user.lastMessageTime)}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 truncate">{user.lastMessage || "Start chatting"}</p>
                      {(user.unreadCount ?? 0) > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 mt-4">No users found</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-teal-600 text-white p-3 flex items-center space-x-3">
                <button onClick={() => setIsChatListOpen(true)} className="md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url || "/placeholder.svg"}
                      alt={selectedUser.username || ""}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedUser.username || "Anonymous User"}</h2>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-200">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.sender_id === currentUser?.id ? "bg-green-500 text-white" : "bg-white text-gray-800"
                        } shadow`}
                      >
                        <p className="text-xs font-semibold mb-1">
                          {message.sender_id === currentUser?.id ? "You" : message.sender?.username || "Anonymous User"}
                        </p>
                        <p className="mb-1">{message.content}</p>
                        <div className="text-xs opacity-75 flex items-center justify-end">
                          <span>{formatTime(message.created_at)}</span>
                          {message.sender_id === currentUser?.id && (
                            <span className="ml-1" aria-label={message.seen ? "Seen" : "Sent"}>
                              {message.seen ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 p-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

