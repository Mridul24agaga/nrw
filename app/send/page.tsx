"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface VirtualFlower {
  id: string
  memorial_id: string
  sender_name: string
  created_at: string
}

interface Memorial {
  id: string
  page_name: string
}

export default function SendVirtualFlowerPage() {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([])
  const [memorials, setMemorials] = useState<Memorial[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMemorial, setSelectedMemorial] = useState<Memorial | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchVirtualFlowers()
    fetchMemorials()
  }, [])

  const fetchVirtualFlowers = async () => {
    const { data, error } = await supabase.from("virtual_flowers").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching virtual flowers:", error)
      setError("Failed to load virtual flowers.")
    } else {
      setVirtualFlowers(data)
    }
  }

  const fetchMemorials = async () => {
    const { data, error } = await supabase.from("memorialpages212515").select("id, page_name")

    if (error) {
      console.error("Error fetching memorials:", error)
      setError("Failed to load memorials.")
    } else {
      setMemorials(data)
    }
  }

  const handleSendVirtualFlower = async () => {
    if (!selectedMemorial) {
      setError("Please select a memorial first.")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        console.error("Error getting user:", userError)
        throw userError
      }

      if (!user) {
        throw new Error("User not authenticated")
      }

      const senderName = user.user_metadata?.full_name || user.email || "Anonymous"

      console.log("Attempting to insert virtual flower with data:", {
        memorial_id: selectedMemorial.id,
        sender_name: senderName,
      })

      const { data, error } = await supabase
        .from("virtual_flowers")
        .insert({
          memorial_id: selectedMemorial.id,
          sender_name: senderName,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error details:", error)
        throw error
      }

      if (!data) {
        throw new Error("No data returned from insert operation")
      }

      console.log("Virtual flower sent successfully:", data)
      alert("Virtual flower sent successfully!")
      router.push(`/memorial/${selectedMemorial.page_name}`)
    } catch (err: unknown) {
      console.error("Detailed error in sending virtual flower:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to send virtual flower. Error: ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  const filteredMemorials = memorials.filter((memorial) =>
    memorial.page_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Search and Send Virtual Flower</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search memorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 bg-white text-black border-gray-300"
            />
            <div className="max-h-40 overflow-y-auto mb-4">
              {filteredMemorials.map((memorial) => (
                <Button
                  key={memorial.id}
                  onClick={() => setSelectedMemorial(memorial)}
                  variant={selectedMemorial?.id === memorial.id ? "default" : "outline"}
                  className="mr-2 mb-2 bg-white text-black border border-gray-300 hover:bg-gray-100"
                >
                  {memorial.page_name}
                </Button>
              ))}
            </div>
            {selectedMemorial && <p className="mb-4 text-black">Selected Memorial: {selectedMemorial.page_name}</p>}
            <Button
              onClick={handleSendVirtualFlower}
              disabled={isSending || !selectedMemorial}
              className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              {isSending ? "Sending..." : "Send Virtual Flower"}
            </Button>
            {error && <p className="mt-4 text-black text-center">{error}</p>}
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4 text-black">Virtual Flowers</h2>
        {virtualFlowers.map((flower) => (
          <Card key={flower.id} className="mb-4 bg-white border border-gray-200">
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-black">{flower.sender_name}</p>
                <p className="text-sm text-black">{new Date(flower.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

