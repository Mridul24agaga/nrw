import VirtualCompanion from "@/components/virtual-companion"
import Sidebar from "@/components/sidebar"

export default function CompanionPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-black">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Hidden on mobile, visible on large screens */}
          <div className="hidden lg:block lg:w-[240px] lg:shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <VirtualCompanion />
          </div>

          {/* Right Sidebar - Removed as per previous request */}
        </div>
      </div>
    </div>
  )
}

