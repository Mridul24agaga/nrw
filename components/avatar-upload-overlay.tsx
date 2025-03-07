"use client";
import type { PutBlobResult } from "@vercel/blob";
import { useState, useRef } from "react";

export function AvatarUploadOverlay() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inputFileRef.current?.files) {
      setUploadError("No file selected");
      return;
    }

    const file = inputFileRef.current.files[0];

    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const newBlob = (await response.json()) as PutBlobResult;
      setBlob(newBlob);
      setUploadError(null);
      window.location.reload(); // Refresh to show new avatar
    } catch (error) {
      console.error("Client-side upload error:", error);
      setUploadError((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      <form onSubmit={handleUpload} className="flex flex-col items-center gap-2">
        <input
          name="file"
          ref={inputFileRef}
          type="file"
          accept="image/*"
          required
          className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 w-full sm:w-auto"
        >
          Upload
        </button>
      </form>
      {uploadError && (
        <p className="text-red-500 text-sm mt-2 text-center">{uploadError}</p>
      )}
      {blob && (
        <div className="mt-4 text-center">
          <p className="text-gray-700 text-sm">
            Uploaded: <a href={blob.url} className="underline hover:text-blue-300">{blob.url}</a>
          </p>
        </div>
      )}
    </div>
  );
}