"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MessageSquare, Book } from "lucide-react"

interface Message {
  role: "user" | "bot" | "diary"
  content: string
  timestamp: number
  id?: string
}

interface CompanionData {
  name: string
  description: string
  messages: Message[]
  uses_left: number
  diary_mode: boolean
}

interface DiaryEntry {
  id: string
  user_id: string
  content: string
  timestamp: number
  created_at: string
}

export default function VirtualCompanion() {
  const [companionData, setCompanionData] = useState<CompanionData | null>(null)
  const [isCreating, setIsCreating] = useState(true)
  const [mood, setMood] = useState("neutral")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState("")
  const [currentMode, setCurrentMode] = useState<"chat" | "diary">("chat")
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [activeTab, setActiveTab] = useState<"diary" | "chat">("chat")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCompanionData()
    if (currentMode === "diary") {
      fetchDiaryEntries()
    }
  }, [currentMode])

  const fetchCompanionData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("users")
      .select("companion_name, companion_description, companion_messages, companion_uses_left, companion_diary_mode")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching companion data:", error)
      setError("Failed to load companion data. Please try again.")
      return
    }

    if (data?.companion_name) {
      setCompanionData({
        name: data.companion_name,
        description: data.companion_description,
        messages: data.companion_messages || [],
        uses_left: data.companion_uses_left,
        diary_mode: data.companion_diary_mode,
      })
      setIsCreating(false)
    }
  }

  const fetchDiaryEntries = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("virtualcompanionsave")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })

      if (error) throw error

      setDiaryEntries(data || [])
    } catch (error) {
      console.error("Error fetching diary entries:", error)
      setError("Failed to load diary entries. Please try again.")
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to create a chatbot.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          companion_name: name,
          companion_description: description,
          companion_messages: [],
          companion_uses_left: 5,
          companion_diary_mode: false,
        })
        .eq("id", user.id)

      if (error) throw error

      setCompanionData({
        name,
        description,
        messages: [],
        uses_left: 5,
        diary_mode: false,
      })
      setIsCreating(false)
    } catch (error) {
      console.error("Error creating chatbot:", error)
      setError("Failed to create chatbot. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companionData || (currentMode === "chat" && companionData.uses_left <= 0) || !message.trim()) return

    setIsLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to send messages.")
      setIsLoading(false)
      return
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const newMessage: Message = {
      role: currentMode === "chat" ? "user" : "diary",
      content: message,
      timestamp: Date.now(),
      id: messageId,
    }

    // Store the message text in case we need to restore it after an error
    const currentMessage = message

    setCompanionData((prev) => ({
      ...prev!,
      messages: [...prev!.messages, newMessage],
      uses_left: currentMode === "chat" ? prev!.uses_left - 1 : prev!.uses_left,
    }))
    setMessage("")

    try {
      // If it's a diary entry, save it to the virtualcompanionsave table
      if (currentMode === "diary") {
        const { error: diaryError } = await supabase.from("virtualcompanionsave").insert({
          id: messageId,
          user_id: user.id,
          content: currentMessage,
          timestamp: Date.now(),
        })

        if (diaryError) throw diaryError

        // Refresh diary entries
        fetchDiaryEntries()
      }

      if (currentMode === "chat") {
        const response = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: currentMessage,
            description: companionData.description,
            mood,
          }),
        })

        // Better error handling
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error")
          throw new Error(`Failed to get response: ${response.status} ${errorText}`)
        }

        try {
          const result = await response.json()
          const botMessage: Message = {
            role: "bot",
            content: result.response || "Sorry, I couldn't generate a response.",
            timestamp: Date.now(),
            id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          }

          setCompanionData((prev) => ({
            ...prev!,
            messages: [...prev!.messages, botMessage],
          }))
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          throw new Error("Received invalid response from server. Please try again.")
        }
      }

      // Update the user's companion_messages in the database
      await supabase
        .from("users")
        .update({
          companion_messages: companionData.messages,
          companion_uses_left: companionData.uses_left,
        })
        .eq("id", user.id)

      if (currentMode === "chat") {
        const moods = ["happy", "sad", "excited", "tired", "neutral"]
        setMood(moods[Math.floor(Math.random() * moods.length)])
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Failed to send message. Please try again.")

      // Restore the message so the user doesn't lose their input
      setMessage(currentMessage)

      // Revert the uses_left counter since the message failed
      setCompanionData((prev) => ({
        ...prev!,
        uses_left: currentMode === "chat" ? prev!.uses_left + 1 : prev!.uses_left,
        // Remove the failed message from the list
        messages: prev!.messages.slice(0, -1),
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSetting = async (setting: "diary_mode") => {
    if (!companionData) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const newValue = !companionData[setting]
    const updateData = { companion_diary_mode: newValue }

    try {
      const { error } = await supabase.from("users").update(updateData).eq("id", user.id)

      if (error) throw error

      setCompanionData((prev) => ({
        ...prev!,
        [setting]: newValue,
      }))
    } catch (error) {
      console.error("Error updating setting:", error)
      setError("Failed to update setting. Please try again.")
    }
  }

  const toggleMode = () => {
    setCurrentMode(currentMode === "chat" ? "diary" : "chat")
  }

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Create Your Virtual Companion</h2>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Companion Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter chatbot name"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Companion Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter chatbot description (50 words max)"
            ></textarea>
            <p className="mt-2 text-sm text-gray-500">Words: {description.trim().split(/\s+/).length} / 50</p>
          </div>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Note</p>
            <p>
              In the description, express how you want the chatbot to be. This chatbot can act as a real human if you
              add emotions and human-like behavior. It will respond accordingly.
            </p>
          </div>
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
            <p className="font-bold">Beta Version</p>
            <p>Please note that the chatbot is in beta version and can make mistakes. It is not fully live yet.</p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Companion"}
          </button>
        </form>
      </div>
    )
  }

  if (!companionData) return null

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-semibold">{companionData.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">{companionData.name}</h2>
            {currentMode === "chat" && <p className="text-sm text-gray-500">Mood: {mood}</p>}
          </div>
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isSettingsOpen && (
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-2">Chatbot Settings</h3>
          <div className="flex items-center justify-between">
            <span>Enable Diary Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={companionData.diary_mode}
                onChange={() => toggleSetting("diary_mode")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      )}

      {currentMode === "diary" && (
        <div className="border-b">
          <div className="flex">
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === "diary" ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("diary")}
            >
              My Diary
            </button>
          </div>
        </div>
      )}

      <div className="h-[calc(100vh-400px)] overflow-y-auto p-4 space-y-4">
        {currentMode === "chat"
          ? // Chat mode - show chat messages
            companionData.messages
              .filter((message) => message.role !== "diary")
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className="h-8 w-8 rounded-full flex-shrink-0">
                    {message.role === "bot" ? (
                      <div className="h-full w-full rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {companionData.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="h-full w-full rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">U</span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.role === "user" ? "bg-indigo-500 text-white" : "bg-gray-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
          : // Diary mode - show diary entries from the dedicated table
            diaryEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <p>{entry.content}</p>
              </div>
            ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0">
              <div className="h-full w-full rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{companionData.name.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="rounded-lg p-3 max-w-[80%] bg-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleMode}
            className="px-4 py-2 rounded-md bg-indigo-500 text-white flex items-center gap-2 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {currentMode === "chat" ? (
              <>
                <MessageSquare size={20} />
                Diary Mode
              </>
            ) : (
              <>
                <Book size={20} />
                Chat Mode
              </>
            )}
          </button>
          <p className="text-sm text-gray-500">
            {currentMode === "chat" ? `${companionData.uses_left}/5 uses left` : "Diary entries are saved permanently"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={currentMode === "chat" ? "Type your message..." : "Write in your diary..."}
            disabled={(currentMode === "chat" && companionData.uses_left <= 0) || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={(currentMode === "chat" && companionData.uses_left <= 0) || isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

