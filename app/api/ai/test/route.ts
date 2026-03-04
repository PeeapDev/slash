import { NextRequest, NextResponse } from "next/server"

type ProviderId = "openai" | "claude" | "deepseek" | "groq"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, apiKey: rawKey } = body as { providerId: ProviderId; apiKey?: string }

    if (!providerId) {
      return NextResponse.json({ success: false, error: "Missing providerId" }, { status: 400 })
    }

    // Aggressively sanitize API key: strip ALL non-printable/invisible characters
    // This fixes copy-paste issues with zero-width spaces, BOM, control chars, etc.
    const apiKey = rawKey
      ? rawKey
          .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, '') // zero-width spaces, BOM, NBSP
          .replace(/[^\x20-\x7E]/g, '') // keep only printable ASCII (space through tilde)
          .trim()
      : ''

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "No API key provided. Please enter your key and click Save first."
      }, { status: 400 })
    }

    const rawLen = rawKey?.length || 0
    const cleanLen = apiKey.length
    const stripped = rawLen - cleanLen

    // Diagnostic info
    const keyPrefix = apiKey.substring(0, 8)
    const keyEnd = apiKey.substring(apiKey.length - 4)
    const diag = `[key: ${keyPrefix}...${keyEnd}, len: ${cleanLen}${stripped > 0 ? `, stripped ${stripped} invisible chars` : ''}]`

    // ─── Claude / Anthropic ───
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
            max_tokens: 5,
            messages: [{ role: "user", content: "test" }],
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

        return NextResponse.json({ success: true, message: `Claude connected successfully ${diag}`, provider: "claude" })
      } catch (fetchErr) {
        return NextResponse.json({
          success: false,
          error: `Network error calling Anthropic: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)} ${diag}`
        }, { status: 502 })
      }
    }

    // ─── OpenAI-compatible providers (OpenAI, DeepSeek, Groq) ───
    const config: Record<string, { baseUrl: string; model: string; prefix?: string }> = {
      openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", prefix: "sk-" },
      deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
      groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.1-8b-instant", prefix: "gsk_" },
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

    // Step 1: Try the models endpoint (GET) — simplest auth check
    try {
      const modelsRes = await fetch(`${providerConfig.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      })

      if (modelsRes.ok) {
        return NextResponse.json({
          success: true,
          message: `${providerId} connected successfully ${diag}`,
          provider: providerId,
        })
      }

      // Models endpoint failed — try chat completions as fallback
      const modelsErr = await modelsRes.text()
      let modelsParsed: any = null
      try { modelsParsed = JSON.parse(modelsErr) } catch {}

      // If auth error (401/403), don't bother with chat completions
      if (modelsRes.status === 401 || modelsRes.status === 403) {
        const msg = modelsParsed?.error?.message || modelsErr
        return NextResponse.json({
          success: false,
          error: `${providerId} rejected the API key (${modelsRes.status}): ${msg} ${diag}`
        }, { status: modelsRes.status })
      }

      // Non-auth error — try chat completions
      const chatRes = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 5,
        }),
      })

      if (chatRes.ok) {
        return NextResponse.json({
          success: true,
          message: `${providerId} connected successfully ${diag}`,
          provider: providerId,
        })
      }

      const chatErr = await chatRes.text()
      let chatParsed: any = null
      try { chatParsed = JSON.parse(chatErr) } catch {}
      const chatMsg = chatParsed?.error?.message || chatErr

      return NextResponse.json({
        success: false,
        error: `${providerId} returned ${chatRes.status}: ${chatMsg} ${diag}`
      }, { status: chatRes.status })
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
