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
  PenTool,
  Users,
  MessageCircle,
  Info,
  Scale,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

interface MemorialPage {
  id: string
  name: string
  page_name: string
}

interface Profile {
  username: string
  display_name: string
  avatar_url?: string
}

interface SearchResult {
  id: string
  username: string
  avatar_url: string | null
  follower_count: number
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [memorialPages, setMemorialPages] = useState<MemorialPage[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [noResultsFound, setNoResultsFound] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasUser, setHasUser] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchRef = useRef<HTMLFormElement>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const fetchUserAndPages = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setHasUser(true)
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }

          const { data: pagesData, error: pagesError } = await supabase
            .from("memorialpages212515")
            .select("id, name, page_name")
            .eq("created_by", user.id)

          if (pagesError) {
            console.error("Error fetching memorial pages:", pagesError.message)
          } else {
            setMemorialPages(pagesData || [])
          }
        } else {
          setHasUser(false)
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserAndPages:", error)
        setHasUser(false)
      }
    }

    fetchUserAndPages()
  }, [supabase])

  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedSearchQuery) {
        setIsSearching(true)
        setNoResultsFound(false)
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, follower_count")
          .ilike("username", `${debouncedSearchQuery}`)
          .single()

        if (error) {
          console.error("Error searching users:", error)
          setSearchResult(null)
          setNoResultsFound(true)
        } else {
          setSearchResult(data)
          setNoResultsFound(false)
        }
        setIsSearching(false)
      } else {
        setSearchResult(null)
        setNoResultsFound(false)
      }
    }

    handleSearch()
  }, [debouncedSearchQuery, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResult(null)
        setNoResultsFound(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSwitchAccount = (username: string, isMemorial = false) => {
    setIsDropdownOpen(false)
    if (isMemorial) {
      router.push(`/memorial/${username}`)
    } else {
      router.push(`/profile/${username}`)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking inside dropdown or toggle button
      if (isDropdownOpen && !target.closest(".account-dropdown") && !target.closest(".account-toggle")) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <header className="z-50 bg-white shadow-sm">
      <div className="bg-green-500 text-white text-center py-2 text-sm">
        Mobile app coming soon! Stay tuned for updates.
      </div>
      <div className="mx-auto flex flex-col sm:flex-row h-auto sm:h-16 max-w-[1200px] items-center justify-between gap-4 px-4 py-2 sm:py-0">
        <Link href="/" className="flex items-center gap-2 mb-2 sm:mb-0">
          <Image src="/memories.png" alt="Logo" width={100} height={100} className="w-auto h-8 sm:h-10" />
        </Link>

        <button
          className="sm:hidden absolute right-4 top-4"
          onClick={(e) => {
            e.stopPropagation()
            setIsMobileMenuOpen(!isMobileMenuOpen)
          }}
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
          className={`${isMobileMenuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row items-center w-full sm:w-auto`}
          onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
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

          <div className="relative w-full sm:w-auto account-dropdown">
            {hasUser && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Prevent event from bubbling up
                    setIsDropdownOpen(!isDropdownOpen)
                  }}
                  className="flex items-center justify-center w-full sm:w-auto gap-2 rounded-lg p-2 hover:bg-gray-100 account-toggle"
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
                  <div
                    className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50"
                    onClick={(e) => e.stopPropagation()} // Prevent clicks from closing mobile menu
                  >
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
              </>
            )}
          </div>

          {/* Mobile Navigation Menu - Only visible on mobile when user is authenticated */}
          {hasUser && (
            <div className="w-full mt-4 border-t pt-4 sm:hidden">
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
          )}
        </div>
      </div>
    </header>
  )
}

