"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

type MemorialCard = {
  id: string
  page_name: string
  name: string
  bio: string | null
  header_image_url?: string | null
}

export default function MemorialSwiper({ items }: { items: MemorialCard[] }) {
  const [index, setIndex] = useState(0)

  const current = items[index]

  const hasNext = index < items.length - 1
  const hasPrev = index > 0

  const next = () => {
    if (hasNext) setIndex((i) => i + 1)
  }

  const prev = () => {
    if (hasPrev) setIndex((i) => i - 1)
  }

  if (!current) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
        No more pages. Try again later.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="relative h-56 sm:h-72 md:h-80 bg-gray-100">
        <Image
          src={current.header_image_url || "/memories.png"}
          alt={current.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{current.name}</h2>
            {current.bio && <p className="text-sm text-gray-600 line-clamp-2">{current.bio}</p>}
          </div>
          <Link
            href={`/memorial/${current.page_name}`}
            className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            View
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={!hasPrev}
            className={`px-3 py-2 rounded-md text-sm border ${
              hasPrev ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Prev
          </button>
          <div className="text-xs text-gray-500">
            {index + 1} / {items.length}
          </div>
          <button
            onClick={next}
            disabled={!hasNext}
            className={`px-3 py-2 rounded-md text-sm border ${
              hasNext ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}


