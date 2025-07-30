import { Calendar, MapPin, Heart, Flower, MessageCircle } from "lucide-react"

interface MemorialPreviewProps {
  data: {
    name: string
    dateOfBirth: string
    dateOfDeath: string
    anniversary: string
    bio: string
    location: string
    coverPhoto: string
  }
}

export default function MemorialPreview({ data }: MemorialPreviewProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDateString = (dateString: string) => {
    if (!dateString) return ""
    try {
      // Handle date string in YYYY-MM-DD format properly
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed in Date constructor
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return ""
    }
  }

  const calculateAge = () => {
    if (!data.dateOfBirth || !data.dateOfDeath) return null

    const birth = new Date(data.dateOfBirth)
    const death = new Date(data.dateOfDeath)

    let age = death.getFullYear() - birth.getFullYear()
    const m = death.getMonth() - birth.getMonth()

    if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const age = calculateAge()

  // Theme color settings
  const themeColor = {
    name: "green",
    color: "bg-[#22C55E]",
    hoverColor: "hover:bg-[#1EA750]",
    lightColor: "bg-green-100",
    superLightColor: "bg-green-50",
    textColor: "text-[#22C55E]",
  }

  return (
    <div className="memorial-preview bg-white">
      {/* Header with gradient styling */}
      <div className="relative h-48 bg-gradient-to-r from-green-100 to-green-300 overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

        {/* Memorial Avatar - positioned with high z-index to come forward */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-30">
          <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white p-1">
            <div
              className={`h-full w-full rounded-full flex items-center justify-center ${themeColor.superLightColor}`}
            >
              <span className={`text-3xl ${themeColor.textColor} font-serif`}>
                {data.name ? data.name[0]?.toUpperCase() : "?"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Memorial Name and Dates */}
      <div className="mt-16 text-center px-6">
        <h1 className="text-3xl font-serif text-gray-800 mb-2">{data.name || "Memorial Name"}</h1>
        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
          {data.dateOfBirth && <span>{formatDateString(data.dateOfBirth)}</span>}
          {data.dateOfBirth && data.dateOfDeath && <span>-</span>}
          {data.dateOfDeath && <span>{formatDateString(data.dateOfDeath)}</span>}
        </div>
      </div>

      {/* Creator info */}
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
        <span>Created by</span>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-[#22C55E] flex items-center justify-center">
            <span className="text-xs text-white font-bold">U</span>
          </div>
          <span className="font-medium">You</span>
        </div>
      </div>

      {/* Divider with flower */}
      <div className="flex items-center justify-center my-6 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className={`mx-4 ${themeColor.color} rounded-full p-2 flex items-center justify-center`}>
          <Flower className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      {/* Biography */}
      <div className="px-8 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-serif text-gray-700">Biography</h2>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <p className="whitespace-pre-wrap break-words">{data.bio || "No biography provided yet."}</p>
        </div>
      </div>

      {/* Divider with heart */}
      <div className="flex items-center justify-center my-6 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className={`mx-4 ${themeColor.color} rounded-full p-2 flex items-center justify-center`}>
          <Heart className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      {/* Virtual Flowers Section */}
      <div className="px-8 mb-8">
        <h2 className="text-xl font-serif text-gray-700 mb-4">Virtual Flowers</h2>
        <div className="flex flex-wrap justify-center gap-4 py-6">
          <div className={`${themeColor.color} w-12 h-12 rounded-full flex items-center justify-center shadow-md`}>
            <Flower className="h-6 w-6 text-white" />
          </div>
          <div className={`${themeColor.lightColor} w-12 h-12 rounded-full flex items-center justify-center shadow-md`}>
            <Flower className="h-6 w-6 text-[#22C55E]" />
          </div>
          <div className={`bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center shadow-md`}>
            <span className="text-gray-400 text-xs">+</span>
          </div>
        </div>
      </div>

      {/* Divider with message */}
      <div className="flex items-center justify-center my-6 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className={`mx-4 ${themeColor.color} rounded-full p-2 flex items-center justify-center`}>
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      {/* Memories Section */}
      <div className="px-8 pb-12">
        <h2 className="text-xl font-serif text-gray-700 mb-4">Memories</h2>
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
          <p>No memories have been shared yet.</p>
          <p className="text-sm mt-1">Be the first to share a memory.</p>
        </div>
      </div>

      {/* About This Memorial - Side info */}
      <div className="px-8 pb-8 border-t border-gray-100 pt-6 mt-4">
        <h3 className="text-lg font-serif text-gray-700 mb-3">About This Memorial</h3>
        <p className="text-sm text-gray-600 mb-4">
          This memorial page was created to honor and remember {data.name || "your loved one"}. Share memories, photos,
          and pay tribute by sending virtual flowers.
        </p>

        {data.anniversary && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Anniversary</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className={`h-4 w-4 ${themeColor.textColor}`} />
              <span>{formatDateString(data.anniversary)}</span>
            </div>
          </div>
        )}

        {data.location && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className={`h-4 w-4 ${themeColor.textColor}`} />
              <span>{data.location}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
