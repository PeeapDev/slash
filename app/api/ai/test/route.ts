import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, apiKey: rawKey } = body as { providerId: ProviderId; apiKey?: string }

    if (!providerId) {
      return NextResponse.json({ success: false, error: "Missing providerId" }, { status: 400 })
    }

    const apiKey = rawKey?.trim()
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "No API key provided. Please enter your key and click Save first."
      }, { status: 400 })
    }

    // Diagnostic info for debugging
    const keyPrefix = apiKey.substring(0, 6)
    const keyLength = apiKey.length
    const diag = `[key: ${keyPrefix}...${apiKey.substring(apiKey.length - 4)}, len: ${keyLength}]`

    if (providerId === "claude") {
      if (!apiKey.startsWith("sk-ant-")) {
        return NextResponse.json({
          success: false,
          error: `Key doesn't start with 'sk-ant-'. Got prefix: "${keyPrefix}". Make sure you're using a Claude/Anthropic key.`
        }, { status: 400 })
      }

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }],
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          let parsed: any = null
          try { parsed = JSON.parse(errText) } catch {}
          const msg = parsed?.error?.message || errText
          return NextResponse.json({
            success: false,
            error: `Anthropic returned ${res.status}: ${msg} ${diag}`
          }, { status: res.status })
        }

        return NextResponse.json({
          success: true,
          message: `Claude connection successful ${diag}`,
          provider: "claude"
        })
      } catch (fetchErr) {
        return NextResponse.json({
          success: false,
          error: `Network error calling Anthropic: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)} ${diag}`
        }, { status: 502 })
      }
    }

    // OpenAI-compatible providers (OpenAI, DeepSeek, Groq)
    const config: Record<string, { url: string; model: string; prefix?: string }> = {
      openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", prefix: "sk-" },
      deepseek: { url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
      groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant", prefix: "gsk_" },
    }

    const providerConfig = config[providerId]
    if (!providerConfig) {
      return NextResponse.json({ success: false, error: `Unknown provider: ${providerId}` }, { status: 400 })
    }

    if (providerConfig.prefix && !apiKey.startsWith(providerConfig.prefix)) {
      return NextResponse.json({
        success: false,
        error: `Key doesn't start with '${providerConfig.prefix}'. Got prefix: "${keyPrefix}". Make sure you're using the correct key for ${providerId}.`
      }, { status: 400 })
    }

    try {
      const res = await fetch(providerConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 10,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        let parsed: any = null
        try { parsed = JSON.parse(errText) } catch {}
        const msg = parsed?.error?.message || errText
        return NextResponse.json({
          success: false,
          error: `${providerId} returned ${res.status}: ${msg} ${diag}`
        }, { status: res.status })
      }

      return NextResponse.json({
        success: true,
        message: `${providerId} connection successful ${diag}`,
        provider: providerId
      })
    } catch (fetchErr) {
      return NextResponse.json({
        success: false,
        error: `Network error calling ${providerId}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)} ${diag}`
      }, { status: 502 })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
