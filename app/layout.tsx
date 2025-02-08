import { Inter } from "next/font/google"
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
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {session && <Header />}
          <div className="mx-auto max-w-[1400px] px-8 py-6">{children}</div>
        </div>
      </body>
    </html>
  )
}

