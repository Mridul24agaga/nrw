"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"

interface MemorialPage {
  id: string
  name: string
}

export default function FlowerPortalPage() {
  const [memorialPages, setMemorialPages] = useState<MemorialPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingFlowers, setSendingFlowers] = useState<{ [key: string]: boolean }>({})
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  useEffect(() => {
    fetchMemorialPages()
  }, [])

  const fetchMemorialPages = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from("memorialpages212515").select("id, name")

      if (error) throw error
      setMemorialPages(data || [])
    } catch (err) {
      console.error("Error fetching memorial pages:", err)
      setError("Failed to fetch memorial pages. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendFlowers = async (memorialId: string) => {
    setSendingFlowers((prev) => ({ ...prev, [memorialId]: true }))
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const senderName = userData.user?.user_metadata?.full_name || userData.user?.email || "Anonymous"

      const { data, error } = await supabase
        .from("flower_deliveries")
        .insert([
          {
            memorial_id: memorialId,
            sender_name: senderName,
            flower_type: "Super Memorial Flower",
            message: "Sent from the admin portal",
          },
        ])
        .select()

      if (error) throw error

      console.log("Flower delivery data:", data)
      alert("Flowers sent successfully!")
    } catch (err) {
      console.error("Error sending flowers:", err)
      alert("Failed to send flowers. Please try again.")
    } finally {
      setSendingFlowers((prev) => ({ ...prev, [memorialId]: false }))
    }
  }

  if (isLoading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Flower Delivery Portal</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memorialPages.map((page) => (
          <div key={page.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">{page.name}</h2>
            <Button onClick={() => handleSendFlowers(page.id)} disabled={sendingFlowers[page.id]}>
              {sendingFlowers[page.id] ? "Sending..." : "Send Flowers"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

