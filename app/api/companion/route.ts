import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    console.log("API: Verifying user authentication")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("API: Authentication error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.log("API: No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("API: User authenticated, fetching companion data")
    // Get companion data to check remaining uses
    const { data: companionData, error: companionError } = await supabase
      .from("virtual_companion")
      .select("uses_left")
      .eq("user_id", user.id)
      .single()

    if (companionError) {
      console.error("API: Error fetching companion data:", companionError)
      console.error("API: Error details:", JSON.stringify(companionError))
      return NextResponse.json(
        {
          error: `Failed to fetch companion data: ${companionError.message || "Unknown error"}`,
        },
        { status: 500 },
      )
    }

    if (!companionData) {
      console.log("API: No companion data found")
      return NextResponse.json({ error: "Companion not found" }, { status: 404 })
    }

    if (companionData.uses_left <= 0) {
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

    // Update the companion's remaining uses
    const { error: updateError } = await supabase
      .from("virtual_companion")
      .update({ uses_left: companionData.uses_left - 1 })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating companion's remaining uses:", updateError)
      // We'll still return the response even if updating uses fails
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
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

