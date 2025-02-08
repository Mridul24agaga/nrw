"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import NotificationList from "./notification-list"

export default function Notifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  const fetchUnreadCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Error fetching unread notifications count:", error)
    } else {
      setUnreadCount(count || 0)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500"></span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-10">
          <div className="py-2 px-4 bg-gray-100 text-gray-800 font-semibold flex justify-between items-center">
            <span>Notifications</span>
            <Link href="/notifications" className="text-sm text-blue-500 hover:underline">
              See all
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <NotificationList />
          </div>
        </div>
      )}
    </div>
  )
}

