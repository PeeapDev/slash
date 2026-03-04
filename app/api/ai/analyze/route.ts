import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

type AnalyzeBody = {
  providerId: ProviderId
  apiKey?: string
  model?: string
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  max_tokens?: number
  temperature?: number
}

const getEnvKey = (providerId: ProviderId) => {
  switch (providerId) {
    case "openai":
      return process.env.OPENAI_API_KEY
    case "claude":
      return process.env.ANTHROPIC_API_KEY
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY
    case "groq":
      return process.env.GROQ_API_KEY
  }
}

const jsonError = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeBody

    if (!body?.providerId) return jsonError(400, "Missing providerId")
    if (!Array.isArray(body.messages) || body.messages.length === 0) return jsonError(400, "Missing messages")

    const providerKey = getEnvKey(body.providerId)
    const apiKey = providerKey || body.apiKey

    if (!apiKey) return jsonError(400, "Missing API key for provider")

    const temperature = typeof body.temperature === "number" ? body.temperature : 0.1
    const max_tokens = typeof body.max_tokens === "number" ? body.max_tokens : 1000

    if (body.providerId === "claude") {
      const model = body.model || "claude-haiku-4-5-20251001"
      const userMessages = body.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens,
          messages: userMessages,
          temperature,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return jsonError(response.status, `Claude API Error: ${text}`)
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        provider: "claude",
        data: data?.content?.[0]?.text || "No response",
        raw: data,
      })
    }

    const isGroq = body.providerId === "groq"
    const url = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : body.providerId === "deepseek"
        ? "https://api.deepseek.com/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions"

    const model = body.model || (isGroq ? "llama3-70b-8192" : body.providerId === "deepseek" ? "deepseek-chat" : "gpt-3.5-turbo")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens,
        temperature,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return jsonError(response.status, `${body.providerId} API Error: ${text}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      provider: body.providerId,
      data: data?.choices?.[0]?.message?.content || "No response",
      raw: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AI request failed",
      },
      { status: 500 },
    )
  }
}
