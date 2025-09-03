"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/header"

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password"

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1400px] px-8 py-6">{children}</div>
    </div>
  )
}



