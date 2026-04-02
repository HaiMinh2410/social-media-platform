import Groq from "groq-sdk";
import { env } from "@/infrastructure/config/env-registry";
import { type AiMessage, type GenerateReplyResult } from "@/domain/types/ai";

// Initialize Groq client
const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

const DEFAULT_MODEL = "llama-3.1-8b-instant"; // Adjust based on Groq's available models

/**
 * Encapsulates external calls to the Groq API.
 * Keeps our application logic decoupled from the specific AI provider.
 */
export async function generateCompletion(
  messages: AiMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GenerateReplyResult> {
  const model = options?.model || DEFAULT_MODEL;
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any[], // Casting to match Groq SDK's exact message type
      model: model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const choice = chatCompletion.choices[0];
    const reply = choice?.message?.content || "";

    return {
      reply,
      usage: chatCompletion.usage
        ? {
            promptTokens: chatCompletion.usage.prompt_tokens ?? 0,
            completionTokens: chatCompletion.usage.completion_tokens ?? 0,
            totalTokens: chatCompletion.usage.total_tokens ?? 0,
          }
        : undefined,
      provider: "groq",
      model: model,
    };
  } catch (error) {
    console.error("❌ [GROQ_CLIENT] Error generating completion:", error);
    throw new Error(`Groq API Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
