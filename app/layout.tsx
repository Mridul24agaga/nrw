import type React from "react"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Header from "@/components/header"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="e5416626e66c8f003aa1d638e442a57d2f7a6b8a" content="e5416626e66c8f003aa1d638e442a57d2f7a6b8a" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="mx-auto max-w-[1400px] px-8 py-6">{children}</div>
        </div>

       
      </body>
    </html>
  )
}

