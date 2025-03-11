"use client";

import { useState, useRef } from "react";
import { uploadProfilePicture } from "@/actions/profile-picture";
import { useRouter } from "next/navigation";

interface ProfilePictureUploaderProps {
  userId: string;
  children: React.ReactNode;
}

export function ProfilePictureUploader({ userId, children }: ProfilePictureUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (formData: FormData) => {
    setUploading(true);
    try {
      await uploadProfilePicture(formData, userId);
      router.refresh(); // Refresh the page to show the new avatar
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = ""; // Reset file input
      }
    }
  };

  return (
    <div className="relative">
      <form action={handleUpload}>
        <input
          type="file"
          name="file"
          ref={inputRef}
          accept="image/*"
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const formData = new FormData();
              formData.append("file", e.target.files[0]);
              handleUpload(formData);
            }
          }}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer ${uploading ? "opacity-50" : "hover:opacity-80"} transition-opacity`}
        >
          {children}
        </div>
      </form>
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
          <span className="text-white text-sm">Uploading...</span>
        </div>
      )}
    </div>
  );
}