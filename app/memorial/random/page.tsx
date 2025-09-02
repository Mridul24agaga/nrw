import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

function chooseRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}

export default async function RandomMemorialRedirect() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data, error } = await supabase
    .from("memorialpages212515")
    .select("page_name")
    .order("id", { ascending: false })
    .limit(200)

  const rows = (data || []) as { page_name: string }[]
  const pick = chooseRandom(rows)

  if (!pick) {
    redirect("/")
  }

  redirect(`/memorial/${encodeURIComponent(pick.page_name)}?preview=1`)
}


