import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  // Create a Supabase client that only reads cookies but doesn't write them
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      // These functions are intentionally no-ops when called from server components
      set() {
        // This is intentionally a no-op when not in a Server Action or Route Handler
        // We can't set cookies in a server component
      },
      remove() {
        // This is intentionally a no-op when not in a Server Action or Route Handler
        // We can't remove cookies in a server component
      },
    },
  })
}

// Use this version in Server Actions or Route Handlers where cookie modification is allowed
export async function createMutableClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

