"use server";

import { put } from "@vercel/blob";
import { createClient } from "@/utils/server";

export async function uploadProfilePicture(formData: FormData, userId: string) {
  const supabase = await createClient();
  
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Upload to Vercel Blob
  const blob = await put(`profile-pictures/${userId}/${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN, // Add this to your .env
  });

  // Update user's avatar_url in Supabase
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: blob.url })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update avatar URL: " + error.message);
  }

  return { url: blob.url };
}