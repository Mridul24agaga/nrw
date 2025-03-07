import { put } from "@vercel/blob";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Check if request.body is null
    if (!request.body) {
      return NextResponse.json({ error: "Request body is missing" }, { status: 400 });
    }

    // Now TypeScript knows request.body is not null
    const blob = await put(`avatars/${userId}/${filename}`, request.body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
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

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}