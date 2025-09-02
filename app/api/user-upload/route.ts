import { put } from "@vercel/blob";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Ensure correct Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Must be multipart/form-data." },
        { status: 400 }
      );
    }

    // Authenticate user via Supabase
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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse file from request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const filename = `${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { url } = await put(`avatars/${filename}`, file, { access: "public" });

    // Update user's avatar URL in Supabase
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: url })
      .eq("id", session.user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_url: url });
  } catch (error) {
    console.error("Error in upload handler:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
