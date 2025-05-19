"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Mail, Bookmark, Users, User, Clock, MessageCircle, Info, Scale, PenTool } from "lucide-react"
import PostDialog from "./post-dialog"

export default function Sidebar() {
  const pathname = usePathname()

  // Function to determine if a link is active
  const isActive = (path: string) => pathname === path

  // Navigation items
  const navigationItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { href: "/create-memorial", icon: Clock, label: "Create Memorial" },
    { href: "/moneymaker", icon: PenTool, label: "Collage Maker" },
    { href: "/companion", icon: Users, label: "Virtual Companion" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
  ]

  const footerItems = [
    { href: "/about", icon: Info, label: "About Us" },
    { href: "/legal", icon: Scale, label: "Legal" },
  ]

  return (
    <div className="rounded-xl bg-white shadow overflow-hidden">
      {/* Navigation */}
      <nav className="p-2">
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-base
                  transition-colors duration-200 hover:bg-gray-50
                  ${active ? "font-bold bg-gray-50" : "text-gray-700"}
                `}
              >
                <Icon size={20} className="mr-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Post Button with Dialog */}
      <div className="p-4 border-t border-gray-100">
        <PostDialog
          trigger={
            <button className="w-full bg-[#22C55E] hover:bg-[#1a8cd8] text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
              Post
            </button>
          }
        />
      </div>

      {/* Footer Navigation */}
      <div className="p-2 border-t border-gray-100">
        <div className="space-y-1">
          {footerItems.map((item, index) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm
                  transition-colors duration-200 hover:bg-gray-50
                  ${active ? "font-bold bg-gray-50" : "text-gray-500"}
                `}
              >
                <Icon size={18} className="mr-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
