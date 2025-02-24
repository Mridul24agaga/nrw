import Link from "next/link"
import { Menu, Home, Bookmark, Clock, Users, MessageSquare, Bell, Mail, Info, Scale, User, PenTool, MessageCircle } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-[280px] rounded-xl bg-white p-4 shadow mr-8">
      <nav className="flex flex-col">
        <div className="flex flex-col space-y-4">
          {/* Primary Navigation Group */}
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link
              href="/bookmarks"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Bookmark size={18} />
              <span>Bookmarks</span>
            </Link>

            <Link
              href="/create-memorial"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Clock size={18} />
              <span>Memories</span>
            </Link>

            <Link
              href="/moneymaker"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <PenTool size={18} />
              <span>Collage Maker</span>
            </Link>

            <Link
              href="/companion"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Users size={18} />
              <span>Diary/ Virtual Companion</span>
            </Link>

            <Link
              href="/chat"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <MessageCircle size={18} />
              <span>Chat</span>
            </Link>
          </div>

          {/* Footer Navigation Group */}
          <div className="flex flex-col gap-1 pt-4">
            <Link
              href="/about"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Info size={18} />
              <span>About Us</span>
            </Link>

            <Link
              href="/legal"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
            >
              <Scale size={18} />
              <span>Legal</span>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  )
}