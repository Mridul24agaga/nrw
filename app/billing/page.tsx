"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

export default function BillingPage() {
  const [amount, setAmount] = useState(5) // Default amount for a virtual flower
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // Here you would integrate with a payment provider like Stripe
      // For this example, we'll simulate a successful payment
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // After successful payment, send the virtual flower
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error("User not found")

      const memorialId = localStorage.getItem("currentMemorialId")
      if (!memorialId) throw new Error("Memorial ID not found")

      const { error } = await supabase.from("virtual_flowers").insert({
        memorial_id: memorialId,
        sender_id: userData.user.id,
        sender_name: userData.user.email,
        amount: amount,
      })

      if (error) throw error

      alert("Payment successful and virtual flower sent!")
      router.push(`/memorial/${memorialId}`)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Error processing payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Send a Virtual Flower</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount ($)
              </label>
              <Input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Pay and Send Flower"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

