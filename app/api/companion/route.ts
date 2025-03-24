import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, description, mood } = await request.json()

    if (!prompt || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const systemPrompt = `
      You are a virtual companion with the following description: ${description}
      Your current mood is: ${mood}
      Respond in a way that reflects your personality and current mood.
      Keep responses concise (under 150 words) and conversational.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in companion API:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

