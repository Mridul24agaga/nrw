import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user data to check remaining uses
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("companion_uses_left")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (userData.companion_uses_left <= 0) {
      return NextResponse.json({ error: "No uses left" }, { status: 403 })
    }

    // Parse the request body
    const body = await request.json()
    const { prompt, description, mood } = body

    if (!prompt || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Here you would typically call an AI service like OpenAI
    // For this example, we'll simulate a response
    const response = generateResponse(prompt, description, mood)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Simple response generator function (replace with actual AI integration)
function generateResponse(prompt: string, description: string, mood: string): string {
  const moods: Record<string, string[]> = {
    happy: ["😊", "🙂", "Great!", "Wonderful!", "I'm so happy to hear that!"],
    sad: ["😔", "🙁", "I understand...", "That's tough...", "I'm here for you"],
    excited: ["🎉", "😃", "That's amazing!", "Wow!", "I'm so excited!"],
    tired: ["😴", "🥱", "I see...", "Hmm...", "Interesting..."],
    neutral: ["🤔", "👍", "I understand", "Makes sense", "I see what you mean"],
  }

  const moodPhrases = moods[mood] || moods.neutral
  const randomMoodPhrase = moodPhrases[Math.floor(Math.random() * moodPhrases.length)]

  // Simple response based on prompt keywords
  if (prompt.toLowerCase().includes("hello") || prompt.toLowerCase().includes("hi")) {
    return `${randomMoodPhrase} Hello there! How can I help you today?`
  } else if (prompt.toLowerCase().includes("how are you")) {
    return `${randomMoodPhrase} I'm ${mood}! Thanks for asking. How about you?`
  } else if (prompt.toLowerCase().includes("help")) {
    return `${randomMoodPhrase} I'd be happy to help! What do you need assistance with?`
  } else {
    return `${randomMoodPhrase} I'm here to chat with you based on my description: "${description.substring(0, 50)}${description.length > 50 ? "..." : ""}". What would you like to talk about?`
  }
}

