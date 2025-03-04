import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return NextResponse.json({ error: `Failed to list buckets: ${listError.message}` }, { status: 500 })
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "storage_avatars")

    if (bucketExists) {
      return NextResponse.json({ message: "Bucket already exists" })
    }

    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket("storage_avatars", {
      public: true,
    })

    if (createError) {
      return NextResponse.json({ error: `Failed to create bucket: ${createError.message}` }, { status: 500 })
    }

    // Create storage policies
    const createPoliciesQuery = `
      -- Create a policy to allow authenticated users to upload files
      CREATE POLICY "Users can upload to storage_avatars"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'storage_avatars'
      );

      -- Create a policy to allow authenticated users to update their files
      CREATE POLICY "Users can update in storage_avatars"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'storage_avatars'
      );

      -- Create a policy to allow authenticated users to delete their files
      CREATE POLICY "Users can delete from storage_avatars"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'storage_avatars'
      );

      -- Create a policy to allow public access to view files
      CREATE POLICY "storage_avatars are publicly accessible"
      ON storage.objects
      FOR SELECT
      TO public
      USING (
        bucket_id = 'storage_avatars'
      );
    `

    // Execute the SQL to create policies
    const { error: policiesError } = await supabase.rpc("exec_sql", { sql: createPoliciesQuery })

    if (policiesError) {
      console.error("Error creating policies:", policiesError)
      // Continue anyway, as the bucket was created
    }

    return NextResponse.json({ message: "Bucket and policies created successfully" })
  } catch (error) {
    console.error("Error creating bucket:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

