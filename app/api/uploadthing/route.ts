import { put } from "@vercel/blob";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Handle POST requests for file uploads
export async function POST(request: Request) {
  try {
    // Get the user session
    const cookieStore = await cookies();
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
  );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`avatars/${userId}/${file.name}`, file, {
      access: "public", // Makes the file publicly accessible
      token: process.env.BLOB_READ_WRITE_TOKEN, // Optional if deployed in same Vercel project
    });

    // Update Supabase with the new avatar URL
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: blob.url })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return NextResponse.json(
        { error: `Failed to update user profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadedBy: userId, url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Handle GET requests (optional, for debugging)
export async function GET() {
  return NextResponse.json({ message: "Use POST to upload files" });
}