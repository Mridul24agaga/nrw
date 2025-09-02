import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import OpenAI from "openai"

// Initialize Azure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY as string,
  baseURL: process.env.AZURE_OPENAI_API_BASE_PATH_GPT4O_MINI,
  defaultQuery: { "api-version": "2024-02-15-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
})

// ULTRA-SECURE logging - NEVER logs any identifiable data
function secureLog(message: string, level: "info" | "warn" | "error" = "info") {
  // Only log in development, never in production
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`

    if (level === "error") {
      console.error(logMessage)
    } else if (level === "warn") {
      console.warn(logMessage)
    } else {
      console.log(logMessage)
    }
  }
}

// MAXIMUM data sanitization
function sanitizeForAI(text: string): string {
  if (!text || typeof text !== "string") return ""

  return text
    .replace(/user_id|email|password|token|key|secret|api|uuid|id/gi, "")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
    .replace(/Bearer\s+[^\s]+/gi, "")
    .replace(/sk-[a-zA-Z0-9]+/g, "")
    .replace(/my name is\s+[A-Za-z\s]+/gi, "my name is [NAME]")
    .replace(/i'm\s+[A-Za-z]+/gi, "I'm [NAME]")
    .replace(/call me\s+[A-Za-z]+/gi, "call me [NAME]")
    .slice(0, 1000)
    .trim()
}

// Call Azure OpenAI with MAXIMUM security
async function callAzureOpenAI(prompt: string, maxTokens: number, temperature = 0.8): Promise<string> {
  try {
    const sanitizedPrompt = sanitizeForAI(prompt)

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: sanitizedPrompt }],
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      temperature: temperature,
      n: 1,
    })

    const result = completion.choices[0]?.message?.content || ""

    // ULTRA-SECURE response sanitization
    const sanitizedResult = result
      .replace(/\$1/g, "")
      .replace(/user_id|email|password|token|key|secret|api/gi, "")
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "")
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
      .trim()

    return sanitizedResult
  } catch (error: any) {
    secureLog("AI API call failed", "error")
    return "I'm having trouble thinking right now. Could you try asking me something else?"
  }
}

// Check and reset usage without exposing user data
async function checkAndResetDailyUsage(supabase: any, userId: string, companionData: any) {
  const now = Date.now()
  const lastResetTime = companionData.last_reset_time || now
  const twentyFourHours = 24 * 60 * 60 * 1000

  if (now - lastResetTime >= twentyFourHours) {
    const { error: resetError } = await supabase
      .from("virtual_companion")
      .update({
        uses_left: 5,
        last_reset_time: now,
      })
      .eq("user_id", userId)

    if (resetError) {
      return companionData
    }

    return {
      ...companionData,
      uses_left: 5,
      last_reset_time: now,
    }
  }

  return companionData
}

// Track usage without logging personal data
async function trackUserUsage(supabase: any, userId: string, action: string) {
  try {
    await supabase.from("user_usage_log").insert({
      user_id: userId,
      action: action,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Silently fail to prevent any data exposure
  }
}

// Create secure prompt without any personal data
function createSecurePrompt(description: string, mood: string, companionName: string): string {
  const safeDescription = sanitizeForAI(description).slice(0, 200)
  const safeMood = sanitizeForAI(mood).slice(0, 20)
  const safeName = sanitizeForAI(companionName).slice(0, 30)

  return `
You are a virtual companion named ${safeName}. 
Your personality: ${safeDescription}
Current mood: ${safeMood}

Guidelines:
1. Respond naturally and conversationally
2. Keep responses concise (1-3 sentences)
3. Stay in character based on your personality
4. Keep responses appropriate and friendly
5. NEVER mention any personal data, IDs, or technical information

Respond naturally while staying true to your personality.
`
}

// ULTRA-SECURE response validation
async function validateAndCleanResponse(response: string): Promise<string> {
  try {
    let cleanResponse = response
      .replace(/user_id|email|password|token|key|secret|api|uuid|id/gi, "")
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "")
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
      .replace(/Bearer\s+[^\s]+/gi, "")
      .replace(/sk-[a-zA-Z0-9]+/g, "")
      .replace(/["""'']/g, "")
      .replace(/\$1/g, "")
      .trim()

    if (cleanResponse.length > 300) {
      cleanResponse = cleanResponse.slice(0, 300).trim()
      const lastPeriod = cleanResponse.lastIndexOf(".")
      const lastQuestion = cleanResponse.lastIndexOf("?")
      const lastExclamation = cleanResponse.lastIndexOf("!")
      const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation)

      if (lastSentence > 100) {
        cleanResponse = cleanResponse.slice(0, lastSentence + 1)
      }
    }

    if (!cleanResponse || cleanResponse.length < 10) {
      return "I'd love to chat about that! What's on your mind?"
    }

    return cleanResponse
  } catch (error) {
    return "I'm having trouble with my thoughts right now. Could we talk about something else?"
  }
}

export async function POST(request: Request) {
  try {
    // FIXED: Proper authentication with correct cookies handling
    const cookieStore = await cookies()
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
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get companion data without exposing user info
    const { data: companionData, error: companionError } = await supabase
      .from("virtual_companion")
      .select("id, name, description, messages, uses_left, last_reset_time, user_id")
      .eq("user_id", user.id)
      .single()

    if (companionError) {
      if (companionError.code === "PGRST116") {
        return NextResponse.json({ error: "No companion found. Please create one first." }, { status: 404 })
      }
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 500 })
    }

    if (!companionData || companionData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    // Check and reset usage
    const updatedCompanionData = await checkAndResetDailyUsage(supabase, user.id, companionData)

    // Check usage limits
    if (updatedCompanionData.uses_left < 1) {
      const lastResetTime = updatedCompanionData.last_reset_time || Date.now()
      const resetTime = new Date(lastResetTime + 24 * 60 * 60 * 1000)
      const timeUntilReset = Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / (60 * 60 * 1000)))

      await trackUserUsage(supabase, user.id, "usage_limit_reached")

      return NextResponse.json(
        {
          error: "Usage limit reached",
          resetInHours: timeUntilReset,
          message: `You've used all your daily messages. Usage will reset in ${timeUntilReset} hours.`,
        },
        { status: 403 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { prompt, description, mood } = body

    // Validate inputs
    if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    if (!description || typeof description !== "string" || description.length > 500) {
      return NextResponse.json({ error: "Invalid companion configuration" }, { status: 400 })
    }

    // ULTRA-SECURE input sanitization
    const sanitizedPrompt = sanitizeForAI(prompt.trim()).slice(0, 1000)
    const sanitizedDescription = sanitizeForAI(description.trim()).slice(0, 500)
    const sanitizedMood = sanitizeForAI(mood && typeof mood === "string" ? mood.trim() : "neutral").slice(0, 50)

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: "Service configuration error" }, { status: 500 })
    }

    // Track the request
    await trackUserUsage(supabase, user.id, "companion_request")

    // Create secure prompt
    const adaptivePrompt = createSecurePrompt(sanitizedDescription, sanitizedMood, updatedCompanionData.name)

    // Generate response
    const fullPrompt = `${adaptivePrompt}\n\nUser message: ${sanitizedPrompt}\n\nIMPORTANT: Keep responses appropriate, friendly, and safe. NEVER mention personal data, IDs, or technical information.`
    let response = await callAzureOpenAI(fullPrompt, 200, 0.8)

    // Validate response
    response = await validateAndCleanResponse(response)

    // Update usage count
    const newUsesLeft = updatedCompanionData.uses_left - 1

    const { error: updateError } = await supabase
      .from("virtual_companion")
      .update({
        uses_left: newUsesLeft,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", updatedCompanionData.id)

    if (updateError) {
      await trackUserUsage(supabase, user.id, "usage_update_failed")
    } else {
      await trackUserUsage(supabase, user.id, "companion_response_generated")
    }

    // Return ONLY the response and usage count - NO OTHER DATA
    return NextResponse.json(
      {
        response,
        usesLeft: newUsesLeft,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    // Return generic error without any details
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 500 })
  }
}
