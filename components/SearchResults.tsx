import Image from "next/image"
import Link from "next/link"
import { FollowButton } from "@/components/follow-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SearchResult {
  id: string
  username: string
  avatar_url: string | null
  follower_count: number
}

interface SearchResultsProps {
  results: SearchResult[]
  onClose: () => void
}

export function SearchResults({ results, onClose }: SearchResultsProps) {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
      {results.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No results found</div>
      ) : (
        results.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
            onClick={onClose}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-500">{user.follower_count} followers</p>
              </div>
            </div>
            <FollowButton userId={user.id} initialIsFollowing={false} />
          </Link>
        ))
      )}
    </div>
  )
}

