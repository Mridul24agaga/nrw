import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import NotificationList from "@/components/notification-list"
export default async function NotificationsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex gap-8">
          <div className="w-[240px] shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="mb-6 text-2xl font-bold">Notifications</h1>
            <NotificationList />
          </div>
        </div>
      </div>
    </div>
  )
}

