import Image from "next/image"

export default function WhoToFollow() {
  const suggestedUsers = [
    { username: "sagh", name: "ash" },
    { username: "ash", name: "ash" },
    { username: "sdh", name: "sdh" },
    { username: "ahs", name: "ash" },
    { username: "12t", name: "awsag" },
  ]

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-4 text-xl font-bold">Who to follow</h2>
      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.username} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/placeholder.svg" alt={user.name} width={40} height={40} className="rounded-full" />
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </div>
            </div>
            <button className="rounded-full bg-green-500 px-4 py-1 text-sm font-medium text-white hover:bg-green-600">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

