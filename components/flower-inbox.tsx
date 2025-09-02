"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "./ui/button"

interface FlowerDelivery {
  id: string
  sender_name: string
  flower_type: string
  message: string
  created_at: string
  opened: boolean
}

interface FlowerInboxProps {
  memorialId: string
  onFlowerDelivery: (sender: string) => void
}

export function FlowerInbox({ memorialId, onFlowerDelivery }: FlowerInboxProps) {
  const [deliveries, setDeliveries] = useState<FlowerDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  useEffect(() => {
    fetchDeliveries()
  }, []) // Removed memorialId from dependencies

  const fetchDeliveries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("flower_deliveries")
        .select("*")
        .eq("memorial_id", memorialId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDeliveries(data || [])
    } catch (err) {
      console.error("Error fetching flower deliveries:", err)
      setError("Failed to fetch flower deliveries. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDelivery = async (id: string, sender: string) => {
    try {
      const { error } = await supabase.from("flower_deliveries").update({ opened: true }).eq("id", id)

      if (error) throw error

      setDeliveries(deliveries.map((d) => (d.id === id ? { ...d, opened: true } : d)))
      onFlowerDelivery(sender)
    } catch (err) {
      console.error("Error opening flower delivery:", err)
      alert("Failed to open flower delivery. Please try again.")
    }
  }

  if (isLoading) return <div>Loading flower deliveries...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Flower Inbox</h2>
        <Button onClick={fetchDeliveries}>Refresh</Button>
      </div>
      {deliveries.length === 0 ? (
        <p>No flower deliveries yet.</p>
      ) : (
        deliveries.map((delivery) => (
          <div key={delivery.id} className="border p-4 rounded-lg">
            <p className="font-semibold">From: {delivery.sender_name}</p>
            <p>Flower: {delivery.flower_type}</p>
            <p>Message: {delivery.message}</p>
            {!delivery.opened && (
              <Button onClick={() => handleOpenDelivery(delivery.id, delivery.sender_name)}>Open Delivery</Button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

