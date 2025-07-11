import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, currentUser } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>
      currentUser?: { username?: string; level?: number; gold?: number }
    }

    // Compose system prompt with user context
    const userName = currentUser?.username || "adventurer"
    const userLevel = currentUser?.level || 1
    const userGold = currentUser?.gold || 0
    const systemPrompt = `You are the Tavern Keeper's AI assistant in PeerQuest Tavern, a medieval-themed quest and guild platform. User: ${userName} (Level ${userLevel}, ${userGold} gold)`

    // Use only user/assistant messages, just like your curl example
    const groqMessages = messages && messages.length > 0
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [{ role: "system", content: systemPrompt }];

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 400,
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set in environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      return new Response(
        JSON.stringify({ error: "Groq API error", details: errText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const data = await groqRes.json()
    const reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "Sorry, I couldn't process your request."
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
