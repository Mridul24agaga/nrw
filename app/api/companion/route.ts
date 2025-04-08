import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { GoogleGenerativeAI } from "@google/generative-ai"

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
      .select("uses_left, last_reset_time, name")
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
      // Calculate time until reset
      const lastResetTime = companionData.last_reset_time || Date.now()
      const resetTime = new Date(lastResetTime + 24 * 60 * 60 * 1000)
      const timeUntilReset = Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / (60 * 60 * 1000)))

      return NextResponse.json(
        {
          error: "No uses left",
          resetTime: resetTime.toISOString(),
          resetInHours: timeUntilReset,
          message: `You've used all your daily messages. Usage will reset in ${timeUntilReset} hours.`,
        },
        { status: 403 },
      )
    }

    // Parse the request body
    const body = await request.json()
    const { prompt, description, mood } = body

    if (!prompt || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Create a system prompt that describes the companion's personality and current mood
    const systemPrompt = `
      You are a virtual companion named ${companionData.name}. 
      Your personality: ${description}
      Current mood: ${mood}
      
      Respond in a natural, conversational way that reflects your personality and current mood.
      Keep responses concise (1-3 sentences) and engaging.
      Don't introduce yourself in every message or use formal language like "I'm here to assist you."
      Respond as if you're texting with a friend.
    `

    // Generate response using Gemini
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I'll respond naturally as this character." }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    })

    const response = result.response.text()

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
