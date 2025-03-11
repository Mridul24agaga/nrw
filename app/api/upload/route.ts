import { handleUpload } from "@vercel/blob/client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Define the expected payload type
interface ClientPayload {
  userId?: string
  type?: string
  [key: string]: any
}

export async function POST(request: Request) {
  try {
    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Type guard to ensure clientPayload is an object and not a string
        if (typeof clientPayload === "string" || !clientPayload) {
          throw new Error("Invalid client payload")
        }

        // Now TypeScript knows clientPayload is an object
        const payload = clientPayload as ClientPayload

        // Verify user is authorized to upload
        if (payload.type === "avatar" && payload.userId !== session.user.id) {
          throw new Error("Unauthorized: Cannot upload avatar for another user")
        }

        // Set upload constraints
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Log the upload
        console.log(`Upload completed: ${blob.url}`)

        // If this is an avatar upload and we have tokenPayload, we can process it
        if (tokenPayload && typeof tokenPayload !== "string") {
          const payload = tokenPayload as ClientPayload
          if (payload.type === "avatar") {
            // Handle avatar-specific logic here
            console.log(`Avatar uploaded for user: ${payload.userId}`)
          }
        }
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in upload handler:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

// Required for streaming responses
export const dynamic = "force-dynamic"

