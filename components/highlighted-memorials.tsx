import Link from "next/link"
import Image from "next/image"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

type HighlightedMemorial = {
  id: string
  page_name: string
  name: string
  bio: string | null
  header_image_url?: string | null
}

export default async function HighlightedMemorials() {
  const supabase = createServerComponentClient({ cookies })

  // Try to fetch highlighted memorials first (if column exists). Fallback to most recent.
  let highlighted: HighlightedMemorial[] = []
  try {
    const { data, error } = await supabase
      .from("memorialpages212515")
      .select("id, page_name, name, bio, header_image_url, is_highlighted")
      .eq("is_highlighted", true)
      .order("id", { ascending: false })
      .limit(5)

    if (!error && data) {
      highlighted = data as any
    }
  } catch (_) {
    // ignore; likely column doesn't exist yet
  }

  if (!highlighted || highlighted.length === 0) {
    const { data } = await supabase
      .from("memorialpages212515")
      .select("id, page_name, name, bio, header_image_url")
      .order("id", { ascending: false })
      .limit(5)
    highlighted = (data || []) as any
  }

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Highlighted memorials</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {highlighted.map((m) => (
            <li key={m.id} className="p-3 hover:bg-gray-50">
              <Link href={`/memorial/${m.page_name}`} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={m.header_image_url || "/memories.png"}
                    alt={m.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  {m.bio && (
                    <p className="text-xs text-gray-500 truncate">{m.bio}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {highlighted.length === 0 && (
            <li className="p-3 text-sm text-gray-500">No memorials yet</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
        <div className="p-4">
          <h4 className="text-sm font-semibold text-purple-800">Want your page highlighted?</h4>
          <p className="text-sm text-purple-700 mt-1">Boost visibility and help more people find and remember.</p>
          <Link
            href="/pricing"
            className="inline-block mt-3 px-3 py-2 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
          >
            Get highlighted
          </Link>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Link
              href="/discover"
              className="inline-block px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
            >
              Discover random pages
            </Link>
            <Link
              href="/memorial/random"
              className="inline-block px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
            >
              Surprise me
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}


