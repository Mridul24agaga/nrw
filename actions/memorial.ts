"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

type MemorialPage = {
  id: string
  page_name: string
  name: string
  date_of_passing: string
  date_of_birth?: string | undefined
  anniversary?: string | undefined
  bio: string
  posts: any[]
  created_by: string | null
  creator?: {
    username: string
    avatar_url: string | null
  }
}

async function generateUniqueName(supabase: any, baseName: string): Promise<string> {
  let pageName = baseName
  let counter = 0
  let isUnique = false

  while (!isUnique) {
    const { data } = await supabase.from("memorialpages212515").select("page_name").eq("page_name", pageName).single()

    if (!data) {
      isUnique = true
    } else {
      counter++
      pageName = `${baseName}-${counter}`
    }
  }

  return pageName
}

export async function createMemorial(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("You must be logged in to create a memorial page")

    // Check existing pages count
    const { data: existingPages, error: countError } = await supabase
      .from("memorialpages212515")
      .select("id")
      .eq("created_by", user.id)

    if (countError) throw new Error("Error checking memorial pages count")

    // Check premium status
    const { data: userData, error: userDataError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    if (userDataError) {
      console.error("Error checking premium status:", userDataError)
      throw new Error("Error checking premium status")
    }

    const isPremium = userData?.is_premium ?? false

    if (!isPremium && existingPages && existingPages.length >= 2) {
      throw new Error(
        "You've reached the limit for free accounts. Please upgrade to premium to create more memorial pages.",
      )
    }

    const name = formData.get("name") as string | null
    const dateOfPassing = formData.get("dateOfDeath") as string | null
    const dateOfBirth = formData.get("dateOfBirth") as string | null
    const anniversary = formData.get("anniversary") as string | null
    const bio = formData.get("bio") as string | null

    // Validate required fields
    if (!name || !dateOfPassing) {
      const missingFields = []
      if (!name) missingFields.push("name")
      if (!dateOfPassing) missingFields.push("date of passing")
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
    }

    // Generate base page name
    const baseName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Generate unique page name
    const page_name = await generateUniqueName(supabase, baseName)

    // Prepare the insert object
    const insertObject: Omit<MemorialPage, "id" | "posts"> = {
      name,
      page_name,
      date_of_passing: dateOfPassing,
      date_of_birth: dateOfBirth || undefined,
      anniversary: anniversary || undefined,
      bio: bio || "",
      created_by: user.id,
    }

    // Attempt to insert the new memorial page
    const { data: newPage, error: insertError } = await supabase
      .from("memorialpages212515")
      .insert(insertObject)
      .select()
      .single()

    if (insertError) {
      console.error("Error creating memorial page:", insertError)
      if (insertError.code === "23505") {
        throw new Error("A memorial page with this name already exists. Please try a different name.")
      }
      throw new Error(`Error creating memorial page: ${insertError.message}`)
    }

    if (!newPage) {
      throw new Error("Failed to create memorial page: No data returned")
    }

    return newPage
  } catch (error: unknown) {
    console.error("Memorial creation error:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unknown error occurred while creating the memorial page")
  } finally {
    revalidatePath("/")
  }
}

export async function getMemorial(pageName: string): Promise<MemorialPage | null> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { data: memorial, error: memorialError } = await supabase
      .from("memorialpages212515")
      .select("*")
      .eq("page_name", pageName)
      .single()

    if (memorialError) {
      console.error("Error fetching memorial:", memorialError)
      return null
    }

    if (!memorial) {
      console.error("No memorial found for page_name:", pageName)
      return null
    }

    if (memorial.created_by) {
      const { data: creator, error: creatorError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", memorial.created_by)
        .single()

      if (creatorError) {
        console.error("Error fetching creator profile:", creatorError)
      } else {
        memorial.creator = creator
      }
    }

    return memorial as MemorialPage
  } catch (error) {
    console.error("Unexpected error in getMemorial:", error)
    return null
  }
}

export async function getPost(postId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      user:profiles!user_id (
        username,
        avatar_url
      ),
      likes (count),
      comments (count)
    `)
    .eq("id", postId)
    .single()

  if (error) {
    console.error("Error fetching post:", error)
    return null
  }

  return post
}

export async function addPost(memorialId: string, content: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("You must be logged in to add a post")

  const { data: memorial, error: memorialError } = await supabase
    .from("memorialpages212515")
    .select("id, created_by")
    .eq("id", memorialId)
    .single()

  if (memorialError || !memorial) {
    console.error("Error fetching memorial:", memorialError)
    throw new Error("Memorial page not found or you don't have permission to add a post")
  }

  if (memorial.created_by !== user.id) {
    throw new Error("You don't have permission to add a post to this memorial page")
  }

  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      memorial_id: memorialId,
      user_id: user.id,
      content: content,
    })
    .select()
    .single()

  if (insertError) {
    console.error("Error inserting post:", insertError)
    throw new Error(`Error adding post to memorial page: ${insertError.message}`)
  }

  revalidatePath(`/memorial/[pageName]`)

  return newPost
}

export async function addComment(postId: string, content: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("You must be logged in to add a comment")

  const { data: newComment, error: insertError } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content,
    })
    .select()
    .single()

  if (insertError) {
    console.error("Error inserting comment:", insertError)
    throw new Error(`Error adding comment to post: ${insertError.message}`)
  }

  revalidatePath(`/memorial/[pageName]`)

  return newComment
}

export async function getPostsWithComments(memorialId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Get posts first
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      user:profiles!user_id (username, avatar_url)
    `)
    .eq("memorial_id", memorialId)
    .order("created_at", { ascending: false })

  if (postsError) {
    console.error("Error fetching posts:", postsError)
    return null
  }

  // Get comments and likes separately for each post
  const postsWithData = await Promise.all(
    posts.map(async (post) => {
      // Get comments for this specific post
      const { data: comments } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          user:profiles!user_id (username, avatar_url)
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })

      // Get likes for this specific post
      const { data: likes } = await supabase
        .from("likes")
        .select("id, user_id")
        .eq("post_id", post.id)

      return {
        ...post,
        comments: comments || [],
        likes: {
          count: likes ? likes.length : 0,
          data: likes || []
        }
      }
    })
  )

  return postsWithData
}