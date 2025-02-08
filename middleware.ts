import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session and the user is trying to access protected routes
  if (!session && request.nextUrl.pathname === "/") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/", "/protected/:path*"],
}

