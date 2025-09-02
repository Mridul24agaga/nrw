import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import MemorialSwiper from "@/components/memorial-swiper"

type MemorialCard = {
  id: string
  page_name: string
  name: string
  bio: string | null
  header_image_url?: string | null
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default async function DiscoverPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("memorialpages212515")
    .select("id, page_name, name, bio, header_image_url")
    .order("id", { ascending: false })
    .limit(50)

  const items: MemorialCard[] = shuffle((data || []) as MemorialCard[])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-2 sm:px-3 md:px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Discover memorial pages</h1>
            <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Home</Link>
          </div>
          <MemorialSwiper items={items} />
        </div>
      </div>
    </div>
  )
}


