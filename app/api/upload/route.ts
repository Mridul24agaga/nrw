import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
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

    const body = (await request.json()) as HandleUploadBody

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Set default upload constraints that will apply even if clientPayload is missing
        const constraints = {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
        }

        // If clientPayload exists and is an object, perform additional validation
        if (clientPayload && typeof clientPayload === "object") {
          const payload = clientPayload as ClientPayload

          // Verify user is authorized to upload
          if (payload.type === "avatar" && payload.userId && payload.userId !== session.user.id) {
            throw new Error("Unauthorized: Cannot upload avatar for another user")
          }
        }

        // Return constraints regardless of clientPayload
        return constraints
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Log the upload
        console.log(`Upload completed: ${blob.url}`)

        // Handle tokenPayload safely
        if (tokenPayload && typeof tokenPayload === "object") {
          const payload = tokenPayload as ClientPayload
          if (payload.type === "avatar" && payload.userId) {
            // Handle avatar-specific logic here
            console.log(`Avatar uploaded for user: ${payload.userId}`)

            // Here you could update the user's avatar URL in your database
            // await supabase.from('profiles').update({ avatar_url: blob.url }).eq('id', payload.userId)
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

