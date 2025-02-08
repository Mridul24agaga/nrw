import Link from "next/link"
import { Home, Bookmark, Clock, Users, User2, Bell, Mail, HelpCircle, Scale } from "lucide-react"

export function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-white rounded-r-2xl p-4 overflow-y-auto">
      <div className="px-4 py-2 mb-2 font-semibold">Menu</div>
      <nav className="space-y-1">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link href="/bookmarks" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
          <Bookmark className="w-5 h-5" />
          <span>Bookmarks</span>
        </Link>

        <Link href="/memories" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
          <Clock className="w-5 h-5" />
          <span>Memories</span>
        </Link>

        <Link href="/forum" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
          <Users className="w-5 h-5" />
          <span>Forum</span>
        </Link>

        <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
          <User2 className="w-5 h-5" />
          <span>Your Profile</span>
        </Link>

        <div className="pt-4 mt-4 border-t border-gray-100">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </Link>

          <Link
            href="/messages"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            <Mail className="w-5 h-5" />
            <span>Messages</span>
          </Link>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-100">
          <Link href="/about" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
            <HelpCircle className="w-5 h-5" />
            <span>About Us</span>
          </Link>

          <Link href="/legal" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl">
            <Scale className="w-5 h-5" />
            <span>Legal</span>
          </Link>
        </div>
      </nav>
    </aside>
  )
}

