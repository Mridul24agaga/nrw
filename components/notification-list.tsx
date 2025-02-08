"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"

type Notification = {
  id: string
  actor: {
    username: string
    display_name: string
    avatar_url: string
  }
  type: "like" | "comment"
  content: string
  post_id: string
  comment_id?: string
  created_at: string
  is_read: boolean
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:actor_id(username, display_name, avatar_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notifications:", error)
    } else {
      setNotifications(data as Notification[])
    }
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
    } else {
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    }
  }

  const renderNotification = (notification: Notification) => {
    const { actor, type, content, post_id, comment_id, created_at, is_read } = notification
    return (
      <div
        key={notification.id}
        className={`p-4 ${is_read ? "bg-white" : "bg-blue-50"} hover:bg-gray-100 border-b border-gray-200`}
      >
        <div className="flex items-start space-x-3">
          <Image
            src={actor.avatar_url || "/placeholder.svg"}
            alt={actor.display_name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="flex-1">
            <p className="text-sm">
              <Link href={`/profile/${actor.username}`} className="font-semibold hover:underline">
                {actor.display_name}
              </Link>{" "}
              {type === "like" ? "liked your post" : "commented on your post"}
            </p>
            {content && <p className="text-sm text-gray-600 mt-1">{content}</p>}
            <p className="text-xs text-gray-500 mt-1">{new Date(created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-2 flex justify-end space-x-2">
          <Link
            href={`/post/${post_id}${comment_id ? `#comment-${comment_id}` : ""}`}
            className="text-sm text-blue-500 hover:underline"
            onClick={() => markAsRead(notification.id)}
          >
            View {type === "like" ? "post" : "comment"}
          </Link>
          {!is_read && (
            <button onClick={() => markAsRead(notification.id)} className="text-sm text-gray-500 hover:underline">
              Mark as read
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {notifications.length > 0 ? (
        notifications.map(renderNotification)
      ) : (
        <p className="p-4 text-center text-gray-500">No notifications</p>
      )}
    </div>
  )
}

