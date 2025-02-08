import Image from "next/image"
import { getAvatarUrl } from "@/lib/supabase-client"
import type { MemorialPage } from "@/lib/types"

interface MemorialPageHeaderProps {
  memorialPage: MemorialPage
}

export default function MemorialPageHeader({ memorialPage }: MemorialPageHeaderProps) {
  return (
    <div className="bg-white shadow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <Image
            src={getAvatarUrl(memorialPage.avatar_url) || "/placeholder.svg"}
            alt={memorialPage.name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{memorialPage.name}</h1>
            <p className="text-gray-600">In memory of {memorialPage.deceased_name}</p>
            <p className="text-sm text-gray-500">
              {memorialPage.birth_date && `${new Date(memorialPage.birth_date).getFullYear()} - `}
              {memorialPage.death_date && new Date(memorialPage.death_date).getFullYear()}
            </p>
            {memorialPage.description && <p className="text-gray-600 mt-2">{memorialPage.description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

