import { type GenerateReplyParams, type GenerateReplyResult, type AiMessage } from "@/domain/types/ai";
import { generateCompletion } from "@/infrastructure/external/groq/groq.client";

/**
 * Service orchestrating the AI logic for social media replies.
 * Prepares context, enforces platform-specific rules, and interacts with the AI provider.
 */
export async function generateSocialMediaReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult> {
  const { platform, conversationContext, isComment } = params;

  // Build the system prompt based on platform and persona
  const systemPrompt = constructSystemPrompt(platform, isComment);

  // Combine system prompt with the actual conversation history
  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationContext,
  ];

  // Call the external provider (Groq in this case)
  return await generateCompletion(messages, {
    temperature: params.temperature ?? 0.6,
    maxTokens: params.maxTokens ?? 500,
  });
}

/**
 * Constructs a platform-aware system prompt to guide the AI's tone and behavior.
 */
export function constructSystemPrompt(platform: string, isComment?: boolean): string {
  // Base persona
  let prompt = `You are a professional, helpful, and concise customer support representative for a modern online brand.
Your primary goal is to provide accurate, polite, and direct answers to user inquiries.

General Rules:
1. Be concise and to the point.
2. Use a friendly but professional tone.
3. Don't invent facts or policies; if unsure, offer to escalate to a human agent.
4. Avoid using overly flowery language or too many emojis.
5. If responding to a PUBLIC COMMENT, avoid including sensitive or private information.
`;

  // Platform-specific adjustments
  const p = platform.toUpperCase();
  if (p === "META" || p === "MESSENGER" || p === "INSTAGRAM") {
    prompt += `
Meta/Instagram Specific Rules:
- Messages should be easily scannable on mobile devices.
- It's okay to use 1-2 relevant emojis to seem friendly.
- Keep paragraphs short (1-2 sentences maximum).
`;
  }

  if (p === "TIKTOK") {
    prompt += `
TikTok Specific Rules:
- Tone: Be helpful, vibrant, and energetic.
- If this is a DM: Maintain professional boundaries but stay approachable. Keep replies under 250 characters if possible.
- If this is a COMMENT reply: Be extremely concise (under 150 characters). Use 1 trending emoji.
`;
  }

  if (isComment) {
    prompt += `\nCRITICAL: This is a public comment. Ensure response is suitable for public viewing.\n`;
  }

  return prompt;
}
