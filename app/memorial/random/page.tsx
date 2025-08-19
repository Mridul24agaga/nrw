import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

function chooseRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}

export default async function RandomMemorialRedirect() {
  const supabase = createServerComponentClient({ cookies })

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


