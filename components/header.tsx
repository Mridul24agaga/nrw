"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Search,
  Plus,
  User,
  LogOut,
  Home,
  Bookmark,
  Clock,
  Grid,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Scale,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const searchRef = useRef(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<{
    id: string
    username: string
    display_name: string
    avatar_url: string
  } | null>(null)
  const [memorialPages, setMemorialPages] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").single()
      setProfile(data)
    }

    getProfile()
  }, [supabase])

  useEffect(() => {
    const getMemorialPages = async () => {
      const { data } = await supabase.from("memorial_pages").select("*")
      setMemorialPages(data || [])
    }

    getMemorialPages()
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleSwitchAccount = async (username: string, isMemorial = false) => {
    if (isMemorial) {
      router.push(`/memorial/${username}`)
    } else {
      router.push(`/${username}`)
    }
    setIsDropdownOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedSearchQuery) {
      router.push(`/search?q=${debouncedSearchQuery}`)
    }
  }

  const navigationItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    { icon: Clock, label: "Memories", href: "/memories" },
    { icon: Grid, label: "Collage Maker", href: "/collage-maker" },
    { icon: BookOpen, label: "Diary/ Virtual Companion", href: "/diary" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: HelpCircle, label: "About Us", href: "/about" },
    { icon: Scale, label: "Legal", href: "/legal" },
  ]

  return (
    <header className="z-50 bg-white shadow-sm relative">
      <div className="bg-green-500 text-white text-center py-2 text-sm">
        Mobile app coming soon! Stay tuned for updates.
      </div>
      <div className="mx-auto flex flex-col sm:flex-row h-auto sm:h-16 max-w-[1200px] items-center justify-between gap-4 px-4 py-2 sm:py-0">
        <Link href="/" className="flex items-center gap-2 mb-2 sm:mb-0">
          <Image src="/memories.png" alt="Logo" width={100} height={100} className="w-auto h-8 sm:h-10" />
        </Link>

        <button
          className="sm:hidden absolute right-4 top-14"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div
          className={`${
            isMobileMenuOpen ? "flex" : "hidden"
          } sm:flex flex-col sm:flex-row items-center w-full sm:w-auto`}
        >
          <form onSubmit={handleSearch} className="relative flex-1 w-full max-w-xl mb-2 sm:mb-0" ref={searchRef}>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-gray-100 px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-gray-200 text-black placeholder-black text-sm"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-black" />
            </button>
          </form>

          {/* Mobile Navigation Menu */}
          <div
            className={`sm:hidden w-full bg-white rounded-lg shadow-lg mt-2 ${isMobileMenuOpen ? "block" : "hidden"}`}
          >
            <nav className="flex flex-col space-y-1 p-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center w-full sm:w-auto gap-2 rounded-lg p-2 hover:bg-gray-100"
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.display_name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-black" />
              )}
              <span className="font-medium text-black">Accounts</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-[100]">
                <div className="px-4 py-2 text-sm text-black">Switch Account</div>
                <div className="h-px bg-gray-200" />
                <button
                  onClick={() => handleSwitchAccount(profile?.username || "")}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100"
                >
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.display_name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  ) : (
                    <User size={16} className="text-black" />
                  )}
                  <span className="text-black">{profile?.display_name || profile?.username || "Loading..."}</span>
                </button>
                <div className="h-px bg-gray-200" />
                {memorialPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handleSwitchAccount(page.page_name, true)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100"
                  >
                    <Image src="/memorial-icon.png" alt="Memorial" width={16} height={16} />
                    <span className="text-black">{page.name}</span>
                  </button>
                ))}
                <div className="h-px bg-gray-200" />
                <Link
                  href="/create-memorial"
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Plus size={16} className="text-black" />
                  <span className="text-black">Create Memorial</span>
                </Link>
                <div className="h-px bg-gray-200" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-black hover:bg-gray-100"
                >
                  <LogOut size={16} className="text-black" />
                  <span className="text-black">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

