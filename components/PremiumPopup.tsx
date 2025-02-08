import type React from "react"
import { useRouter } from "next/navigation"

interface PremiumPopupProps {
  onClose: () => void
}

const PremiumPopup: React.FC<PremiumPopupProps> = ({ onClose }) => {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
        <p className="mb-6">
          You've reached the limit for free accounts. Upgrade to premium to create unlimited memorial pages.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            View Pricing
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumPopup

