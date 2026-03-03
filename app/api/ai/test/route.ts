import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

type TestBody = {
  providerId: ProviderId
  apiKey?: string
  model?: string
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
    const body = (await request.json()) as TestBody

    if (!body?.providerId) return jsonError(400, "Missing providerId")

    const providerKey = getEnvKey(body.providerId)
    const apiKey = providerKey || body.apiKey

    if (!apiKey) return jsonError(400, "Missing API key for provider")

    const testPrompt = "Hello, this is a connectivity test. Reply with: Test successful"

    const analyzeResponse = await fetch(new URL("/api/ai/analyze", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: body.providerId,
        apiKey: body.apiKey,
        model: body.model,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: 50,
        temperature: 0,
      }),
    })

    const data = await analyzeResponse.json().catch(() => null)

    if (!analyzeResponse.ok || !data?.success) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || `Provider test failed (${analyzeResponse.status})`,
        },
        { status: analyzeResponse.status || 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      provider: body.providerId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Provider test failed",
      },
      { status: 500 },
    )
  }
}
