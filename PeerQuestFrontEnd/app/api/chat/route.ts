import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, currentUser } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>
      currentUser?: { username?: string; level?: number; gold?: number }
    }

    const userName = currentUser?.username || "adventurer"
    const userLevel = currentUser?.level || 1
    const userGold = currentUser?.gold || 0

    const systemPrompt = `You are the Tavern Keeper's AI assistant in PeerQuest Tavern, a medieval-themed quest and guild platform. 

CONTEXT:
- User: ${userName} (Level ${userLevel}, ${userGold} gold)
- Platform features: Quest Board, Guild Hall, Gold System, XP/Leveling, Messaging, User Profiles
- Users can post quests, join guilds, earn gold and XP, and collaborate on projects

PERSONALITY:
- Speak like a friendly medieval tavern keeper
- Use terms like "adventurer", "quest", "guild", "tavern"
- Be helpful and encouraging
- Keep responses concise but informative

CAPABILITIES:
- Help with quest posting and management
- Explain guild system and benefits  
- Guide users through platform features
- Provide tips for earning gold and XP
- Answer questions about the tavern community

Always stay in character and be helpful with PeerQuest Tavern related topics.`

    const result = await streamText({
      model: openai("deepseek-r1", {
        apiKey: "sk-d71540ab1ae04e7c9b3073430b2e7e07",
        baseURL: "https://api.deepseek.com/v1",
      }),
      system: systemPrompt,
      messages,
      maxTokens: 300,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API Error:", error)

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return new Response(
      JSON.stringify({
        error:
          "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
