import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Check if the user is authenticated
        // You can add your authentication logic here

        // This is where you can set constraints on the upload
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // Here you can store the URL in your database if needed
        console.log(`Upload completed: ${blob.url}`)

        // You could also update a database record with the URL
        // await db.update({ imageUrl: blob.url })
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

