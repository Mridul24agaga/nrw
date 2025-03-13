import { put } from "@vercel/blob";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the current user session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const response = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
      access: "public",
    });

    const newAvatarUrl = response.url;

    // Update user avatar in Supabase
    await supabase.from("users").update({ avatar_url: newAvatarUrl }).eq("id", session.user.id);

    return NextResponse.json({ success: true, avatar_url: newAvatarUrl });
  } catch (error) {
    console.error("Error in upload handler:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

// Required for streaming responses
export const dynamic = "force-dynamic";
