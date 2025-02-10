"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "./ui/button"
import { PricingPopup } from "./pricing-popup"
import type React from "react"

interface FlowerOptionsProps {
  memorialId: string
}

interface VirtualFlower {
  id: string
  sender_name: string
  created_at: string
  flower_type: string
}

export function FlowerOptions({ memorialId }: FlowerOptionsProps) {
  const [showVirtualFlowerAnimation, setShowVirtualFlowerAnimation] = useState(false)
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([])
  const [showPhysicalFlowerForm, setShowPhysicalFlowerForm] = useState(false)
  const [flowerType, setFlowerType] = useState("delivery")
  const [user, setUser] = useState<any>(null)
  const [showPricingPopup, setShowPricingPopup] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchVirtualFlowers()
    fetchUser()
  }, [])

  const fetchVirtualFlowers = async () => {
    const { data, error } = await supabase.from("virtual_flowers").select("*").eq("memorial_id", memorialId)
    if (error) {
      console.error("Error fetching virtual flowers:", error)
    } else {
      setVirtualFlowers(data)
    }
  }

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleVirtualFlower = async (flowerType: string) => {
    setShowVirtualFlowerAnimation(true)
    setTimeout(() => setShowVirtualFlowerAnimation(false), 2000)

    const senderName = user ? user.user_metadata.full_name || user.email : "Anonymous"

    const { data, error } = await supabase
      .from("virtual_flowers")
      .insert([{ memorial_id: memorialId, sender_name: senderName, flower_type: flowerType }])
      .select()

    if (error) {
      console.error("Error sending virtual flower:", error)
    } else {
      setVirtualFlowers([...virtualFlowers, data[0]])
    }
  }

  const handlePhysicalFlowerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Here you would handle the physical flower order submission
    console.log("Physical flower order submitted")
    setShowPhysicalFlowerForm(false)
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold mb-2">Send Flowers</h3>
      <div className="flex space-x-2">
        <Button onClick={() => handleVirtualFlower("rose")}>🌹 Rose</Button>
        <Button onClick={() => handleVirtualFlower("lily")}>🌷 Lily</Button>
        <Button onClick={() => handleVirtualFlower("sunflower")}>🌻 Sunflower</Button>
        <Button onClick={() => setShowPricingPopup(true)} variant="outline">
          Want to give super memorial flowers? Click here
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <span>{virtualFlowers.length} virtual flowers sent</span>
      </div>

      {showVirtualFlowerAnimation && (
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 50,
          }}
        >
          <span role="img" aria-label="Flower" style={{ fontSize: "6rem" }}>
            🌹
          </span>
        </motion.div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Recent Virtual Flowers:</h3>
        <ul className="space-y-2">
          {virtualFlowers
            .slice(-5)
            .reverse()
            .map((flower) => (
              <li key={flower.id} className="text-sm">
                {flower.sender_name} sent a {flower.flower_type}
              </li>
            ))}
        </ul>
      </div>

      {showPricingPopup && <PricingPopup onClose={() => setShowPricingPopup(false)} />}

      {showPhysicalFlowerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Send Physical Flowers</h2>
            <div className="mb-4">
              <button
                onClick={() => setFlowerType("delivery")}
                className={`mr-2 px-3 py-1 rounded ${
                  flowerType === "delivery" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setFlowerType("pickup")}
                className={`px-3 py-1 rounded ${flowerType === "pickup" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              >
                Pickup
              </button>
            </div>
            <form onSubmit={handlePhysicalFlowerSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1">
                  Name
                </label>
                <input id="name" type="text" required className="w-full px-3 py-2 border rounded" />
              </div>
              {flowerType === "delivery" ? (
                <div>
                  <label htmlFor="address" className="block mb-1">
                    Delivery Address
                  </label>
                  <textarea id="address" required className="w-full px-3 py-2 border rounded"></textarea>
                </div>
              ) : (
                <div>
                  <label htmlFor="pickup-date" className="block mb-1">
                    Pickup Date
                  </label>
                  <input id="pickup-date" type="date" required className="w-full px-3 py-2 border rounded" />
                </div>
              )}
              <div>
                <label htmlFor="message" className="block mb-1">
                  Message (Optional)
                </label>
                <textarea id="message" className="w-full px-3 py-2 border rounded"></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPhysicalFlowerForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

