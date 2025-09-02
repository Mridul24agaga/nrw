"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpgrade = async () => {
    setIsLoading(true)
    // Here you would typically integrate with your backend to process the upgrade
    // For now, we'll just simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push("/upgrade-success")
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Upgrade to Premium</h2>
          <p className="mt-4 text-lg text-gray-600">Get unlimited memorial pages and support our beta platform.</p>
        </div>
        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-semibold text-gray-900 text-center">Premium Plan</h3>
            <p className="mt-4 text-5xl font-extrabold text-gray-900 text-center">$5</p>
            <p className="mt-4 text-gray-600 text-center">One-time payment</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="ml-3 text-gray-700">Unlimited memorial pages</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="ml-3 text-gray-700">Early access to new features</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="ml-3 text-gray-700">Support beta development</span>
              </li>
            </ul>
          </div>
          <div className="px-6 py-8 bg-gray-50">
            <div className="text-center">
              <p className="text-gray-700 mb-4">To upgrade, please send $5 via PayPal to:</p>
              <p className="text-lg font-semibold text-blue-600 mb-6">payments@memorialpages.com</p>
              <p className="text-sm text-gray-600 mb-4">
                After payment, click the button below and we&apos;ll upgrade your account within 24 hours.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white rounded-md px-4 py-2 font-medium ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Processing..." : "I've Paid - Upgrade My Account"}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-gray-600">
          Thank you for supporting our beta platform. We&apos;re constantly improving and your feedback is valuable to us.
        </p>
      </div>
    </div>
  )
}

