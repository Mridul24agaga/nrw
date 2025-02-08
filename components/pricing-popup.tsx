"use client"

import { useState } from "react"
import { Button } from "./ui/button"

export function PricingPopup({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement payment and email logic here
    console.log(`Processing payment and sending email to ${email}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Super Memorial Flowers</h2>
        <p className="mb-4">Send a beautiful animated flower bouquet for $9.99</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Pay and Send</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

