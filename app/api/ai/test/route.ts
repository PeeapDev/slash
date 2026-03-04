import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

const jsonError = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, apiKey: rawBodyKey } = body as { providerId: ProviderId; apiKey?: string }
    const bodyKey = rawBodyKey?.trim()

    if (!providerId) return jsonError(400, "Missing providerId")

    // ONLY use the key provided in the request body
    // Env vars are NOT used for test — this ensures the user's entered key is tested
    const apiKey = bodyKey
    if (!apiKey) return jsonError(400, "No API key provided. Please enter and save your key first.")

    // Validate key format
    if (providerId === "claude" && !apiKey.startsWith("sk-ant-")) {
      return jsonError(400, "Invalid Claude key format. Anthropic keys start with 'sk-ant-'. Check that you entered the correct key for Claude.")
    }
    if (providerId === "groq" && !apiKey.startsWith("gsk_")) {
      return jsonError(400, "Invalid Groq key format. Groq keys start with 'gsk_'. Check that you entered the correct key.")
    }
    if (providerId === "openai" && !apiKey.startsWith("sk-")) {
      return jsonError(400, "Invalid OpenAI key format. OpenAI keys start with 'sk-'. Check that you entered the correct key.")
    }

    if (providerId === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 30,
          messages: [{ role: "user", content: "Say 'test ok'" }],
          temperature: 0,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return jsonError(res.status, `Claude API error: ${text}`)
      }
      return NextResponse.json({ success: true, message: "Connection successful", provider: "claude" })
    }

    // OpenAI-compatible providers
    const urls: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      deepseek: "https://api.deepseek.com/v1/chat/completions",
      groq: "https://api.groq.com/openai/v1/chat/completions",
    }
    const models: Record<string, string> = {
      openai: "gpt-4o-mini",
      deepseek: "deepseek-chat",
      groq: "llama-3.1-8b-instant",
    }

    const res = await fetch(urls[providerId], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: models[providerId],
        messages: [{ role: "user", content: "Say 'test ok'" }],
        max_tokens: 30,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return jsonError(res.status, `${providerId} API error: ${text}`)
    }

    return NextResponse.json({ success: true, message: "Connection successful", provider: providerId })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Test failed" },
      { status: 500 }
    )
  }
}
