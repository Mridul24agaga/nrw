"use server"

import { createServerClient } from "@supabase/ssr"
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
  memory_message?: any[] // Ensure this is included for updates
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
      const { data: likes } = await supabase.from("likes").select("id, user_id").eq("post_id", post.id)

      return {
        ...post,
        comments: comments || [],
        likes: {
          count: likes ? likes.length : 0,
          data: likes || [],
        },
      }
    }),
  )

  return postsWithData
}

export async function likeMemory(memoryId: string) {
  const cookieStore = cookies()
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
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated to like memories." }
  }

  // Check if already liked
  const { data: existingLike, error: fetchError } = await supabase
    .from("memory_likes")
    .select("id")
    .eq("memory_id", memoryId)
    .eq("user_id", user.id)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 means no rows found
    console.error("Error checking existing like:", fetchError)
    return { error: `Failed to check like status: ${fetchError.message}` }
  }

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from("memory_likes")
      .delete()
      .eq("memory_id", memoryId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error unliking memory:", deleteError)
      return { error: `Failed to unlike memory: ${deleteError.message}` }
    }
    return { success: true, liked: false }
  } else {
    // Like
    const { error: insertError } = await supabase.from("memory_likes").insert({ memory_id: memoryId, user_id: user.id })

    if (insertError) {
      console.error("Error liking memory:", insertError)
      return { error: `Failed to like memory: ${insertError.message}` }
    }
    return { success: true, liked: true }
  }
}

export async function addMemoryComment(memoryId: string, content: string) {
  const cookieStore = cookies()
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
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated to add comments." }
  }

  const { data: comment, error } = await supabase
    .from("memory_comments")
    .insert({ memory_id: memoryId, user_id: user.id, content })
    .select()
    .single()

  if (error) {
    console.error("Error adding comment:", error)
    return { error: `Failed to add comment: ${error.message}` }
  }

  return { success: true, comment }
}

// New server action to add a memory to the memorial page's memory_message array
export async function addMemoryToMemorial(
  memorialId: string,
  newMemoryContent: string,
  imageUrl: string | null,
  author: { id: string; username: string; avatar_url: string | null } | null,
) {
  const cookieStore = cookies()
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
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated to add memories." }
  }

  // Fetch the current memorial page to get the memory_message array and page_name
  const { data: memorialPage, error: fetchError } = await supabase
    .from("memorialpages212515")
    .select("memory_message, page_name") // FIX: Added page_name to the select query
    .eq("id", memorialId)
    .single()

  if (fetchError) {
    console.error("Error fetching memorial page for adding memory:", fetchError)
    return { error: `Failed to fetch memorial page: ${fetchError.message}` }
  }

  if (!memorialPage) {
    return { error: "Memorial page not found." }
  }

  // Ensure memory_message is an array
  const currentMemories = Array.isArray(memorialPage.memory_message) ? memorialPage.memory_message : []

  // Create the new memory object with a unique ID and author info
  const newMemory = {
    id: crypto.randomUUID(), // Generate a unique ID here
    content: newMemoryContent,
    imageUrl: imageUrl,
    createdAt: new Date().toISOString(),
    author: author, // Include author details
  }

  const updatedMemories = [...currentMemories, newMemory]

  // Update the memorial page with the new memories array
  const { error: updateError } = await supabase
    .from("memorialpages212515")
    .update({ memory_message: updatedMemories })
    .eq("id", memorialId)

  if (updateError) {
    console.error("Error updating memorial page with new memory:", updateError)
    return { error: `Failed to add memory: ${updateError.message}` }
  }

  revalidatePath(`/memorial/${memorialPage.page_name}`) // Revalidate the specific memorial page

  return { success: true, newMemory }
}

export async function deleteMemory(memorialId: string, memoryToDeleteId: string) {
  const cookieStore = cookies()
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
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated." }
  }

  console.log("deleteMemory: Attempting to delete memory.")
  console.log(`  memorialId: ${memorialId}`)
  console.log(`  memoryToDeleteId (from frontend): ${memoryToDeleteId}`)
  console.log(`  Current user ID: ${user.id}`)

  // Fetch the current memorial page to get the memory_message array and creator ID
  const { data: memorialPage, error: fetchError } = await supabase
    .from("memorialpages212515")
    .select("memory_message, created_by, page_name")
    .eq("id", memorialId)
    .single()

  if (fetchError) {
    console.error("Error fetching memorial page:", fetchError)
    return { error: `Failed to fetch memorial page: ${fetchError.message}` }
  }

  if (!memorialPage) {
    console.log("deleteMemory: Memorial page not found for ID:", memorialId)
    return { error: "Memorial page not found." }
  }

  console.log(`  Memorial creator ID: ${memorialPage.created_by}`)

  const currentMemories = Array.isArray(memorialPage.memory_message) ? memorialPage.memory_message : []
  console.log(`  Total memories in DB: ${currentMemories.length}`)

  // Find the memory to delete
  // Trim IDs for robust comparison to handle potential whitespace issues
  const memoryIndex = currentMemories.findIndex((memory: any) => {
    console.log(
      `  Comparing stored ID: '${String(memory.id).trim()}' with target ID: '${String(memoryToDeleteId).trim()}'`,
    )
    return String(memory.id).trim() === String(memoryToDeleteId).trim()
  })

  if (memoryIndex === -1) {
    console.log("deleteMemory: Memory not found with matching ID in the array.")
    return { error: "Memory not found." } // More specific error
  }

  const memoryToDelete = currentMemories[memoryIndex]
  console.log(`  Found memory to delete: ID=${memoryToDelete.id}, Author ID=${memoryToDelete.author?.id}`)

  // Check authorization
  const isAuthor = memoryToDelete.author?.id === user.id
  const isMemorialCreator = memorialPage.created_by === user.id

  if (!isAuthor && !isMemorialCreator) {
    console.log("deleteMemory: User not authorized to delete this memory.")
    return { error: "You are not authorized to delete this memory." } // More specific error
  }

  // If authorized, proceed with deletion
  const updatedMemories = currentMemories.filter((_, index) => index !== memoryIndex)

  // Update the memorial page with the filtered memories
  const { error: updateError } = await supabase
    .from("memorialpages212515")
    .update({ memory_message: updatedMemories })
    .eq("id", memorialId)

  if (updateError) {
    console.error("Error updating memorial page with deleted memory:", updateError)
    return { error: `Failed to delete memory: ${updateError.message}` }
  }

  console.log("deleteMemory: Memory successfully deleted and memorial page updated.")
  revalidatePath(`/memorial/${memorialPage.page_name}`)

  return { success: true }
}

// NEW SERVER ACTION: deletePost
export async function deletePost(postId: string, memorialId: string) {
  const cookieStore = cookies()
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
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated." }
  }

  console.log("deletePost: Attempting to delete post.")
  console.log(`  postId: ${postId}`)
  console.log(`  memorialId: ${memorialId}`)
  console.log(`  Current user ID: ${user.id}`)

  try {
    // 1. Fetch the post to verify existence and get its author
    const { data: post, error: postFetchError } = await supabase
      .from("posts")
      .select("id, user_id, memorial_id")
      .eq("id", postId)
      .eq("memorial_id", memorialId) // Ensure post belongs to this memorial
      .single()

    if (postFetchError || !post) {
      console.error("Post not found or access denied:", postFetchError?.message || "Post does not exist.")
      return { error: "Post not found or you don't have permission to delete it." }
    }

    // 2. Fetch the memorial to get its creator for authorization
    const { data: memorial, error: memorialFetchError } = await supabase
      .from("memorialpages212515")
      .select("created_by, page_name")
      .eq("id", memorialId)
      .single()

    if (memorialFetchError || !memorial) {
      console.error("Memorial not found:", memorialFetchError?.message)
      return { error: "Memorial not found." }
    }

    // 3. Authorization Check: Is current user the post author OR the memorial creator?
    const isPostAuthor = user.id === post.user_id
    const isMemorialCreator = user.id === memorial.created_by

    if (!isPostAuthor && !isMemorialCreator) {
      console.log("deletePost: User not authorized to delete this post.")
      return { error: "You are not authorized to delete this post." }
    }

    // 4. Proceed with deletion
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId).eq("memorial_id", memorialId) // Double-check memorial_id for safety

    if (deleteError) {
      console.error("Error deleting post:", deleteError.message)
      return { error: "Failed to delete post: " + deleteError.message }
    }

    console.log("deletePost: Post successfully deleted.")
    // Revalidate the path where posts are displayed
    revalidatePath(`/memorial/${memorial.page_name}`)

    return { success: true }
  } catch (e: any) {
    console.error("Unexpected error in deletePost:", e.message)
    return { error: "An unexpected error occurred: " + e.message }
  }
}