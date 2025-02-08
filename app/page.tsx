import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import CreatePost from "@/components/create-post"
import { Post } from "@/components/post"
import TabGroup from "@/components/tab-group"
import WelcomePost from "@/components/welcome-post"
import Sidebar from "@/components/sidebar"

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      user:user_id (
        username,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:w-[280px] lg:shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="rounded-lg bg-white shadow">
              <TabGroup />
              <CreatePost />
              <WelcomePost />
              <div className="divide-y divide-gray-100">
                {posts?.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:w-[280px] lg:shrink-0">
            <div className="sticky top-20">
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

