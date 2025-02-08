"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export default function TabGroup() {
  const [activeTab, setActiveTab] = useState("for-you")

  return (
    <div className="border-b">
      <div className="flex px-4">
        <button
          onClick={() => setActiveTab("for-you")}
          className={cn(
            "border-b-2 px-6 py-4 font-medium",
            activeTab === "for-you" ? "border-black text-black" : "border-transparent text-gray-500",
          )}
        >
          For you
        </button>
        
      </div>
    </div>
  )
}

