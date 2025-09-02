import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayoutWrapper from "@/components/client-layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
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
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}

