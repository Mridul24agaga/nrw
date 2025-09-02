import Image from "next/image"
import type { MemorialPage, User } from "@/lib/types"
import { getAvatarUrl } from "@/utils/supabase-client"

interface MemorialPageProfileProps {
  memorialPage: MemorialPage
  currentUser: User
}

export default function MemorialPageProfile({ memorialPage, currentUser }: MemorialPageProfileProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 overflow-hidden mb-3">
          <Image
            src={getAvatarUrl(memorialPage.avatar_url) || "/placeholder.svg"}
            alt={memorialPage.name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="text-xl font-semibold mb-1">{memorialPage.name}</h1>
        <p className="text-gray-600 mb-2">In memory of {memorialPage.deceased_name}</p>
        {memorialPage.birth_date && memorialPage.death_date && (
          <p className="text-gray-600 mb-2">
            {new Date(memorialPage.birth_date).getFullYear()} - {new Date(memorialPage.death_date).getFullYear()}
          </p>
        )}
        {memorialPage.description && <p className="text-gray-600 mb-4">{memorialPage.description}</p>}
        <p className="text-sm text-gray-500">
          Created by {currentUser.username} • {memorialPage.relationship_to_deceased}
        </p>
        <p className="text-sm text-gray-500 mt-2">Memorial ID: {memorialPage.unique_identifier}</p>
      </div>
    </div>
  )
}

