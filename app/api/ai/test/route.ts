import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

const jsonError = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, apiKey: bodyKey } = body as { providerId: ProviderId; apiKey?: string }

    if (!providerId) return jsonError(400, "Missing providerId")

    // Check env var first, then body
    const envKeys: Record<ProviderId, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      groq: process.env.GROQ_API_KEY,
    }
    const apiKey = envKeys[providerId] || bodyKey
    if (!apiKey) return jsonError(400, "Missing API key for provider")

    // Test directly — don't route through /api/ai/analyze
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
        return jsonError(res.status, `Claude API: ${text}`)
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
      openai: "gpt-3.5-turbo",
      deepseek: "deepseek-chat",
      groq: "llama3-70b-8192",
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
      return jsonError(res.status, `${providerId} API: ${text}`)
    }

    return NextResponse.json({ success: true, message: "Connection successful", provider: providerId })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Test failed" },
      { status: 500 }
    )
  }
}
