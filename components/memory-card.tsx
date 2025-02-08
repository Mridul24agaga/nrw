import { MessageCircle, Share2, ThumbsUp, Bookmark, Globe, Sparkles } from "lucide-react"
import Image from "next/image"

interface MemoryCardProps {
  content: string
  createdAt: string
  pageName: string
}

export function MemoryCard({ content, createdAt, pageName }: MemoryCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-3">
          
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">{pageName}</h3>
            <span className="mx-2 text-gray-500">·</span>
            <span className="text-gray-500">{formattedDate}</span>
          </div>
          <p className="mt-1 text-gray-900">{content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <Globe className="w-4 h-4 mr-1" />
            <span>Translate</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <Sparkles className="w-4 h-4 mr-1" />
            <span>Ask AI</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <ThumbsUp className="w-4 h-4 mr-1" />
            <span>0 likes</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span>0 comments</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

