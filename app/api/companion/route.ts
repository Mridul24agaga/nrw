import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    const { prompt, description, mood } = await req.json()

    // Create a context for the AI based on the description and mood
    const context = `You are a virtual companion with the following description: ${description}. Your current mood is ${mood}. Please respond accordingly, and occasionally make spelling mistakes to seem more human-like.`

    // Use the Gemini API to generate a response
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent([context, prompt])
    const response = result.response.text()

    // Introduce spelling mistakes (simple implementation)
    const responseWithMistakes = response
      .split(" ")
      .map((word) => {
        if (Math.random() < 0.1) {
          // 10% chance of a spelling mistake
          return word
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("")
        }
        return word
      })
      .join(" ")

    return NextResponse.json({ response: responseWithMistakes })
  } catch (error) {
    console.error("Error in companion API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

