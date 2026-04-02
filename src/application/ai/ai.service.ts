import { type GenerateReplyParams, type GenerateReplyResult, type AiMessage } from "@/domain/types/ai";
import { generateCompletion } from "@/infrastructure/external/groq/groq.client";

/**
 * Service orchestrating the AI logic for social media replies.
 * Prepares context, enforces platform-specific rules, and interacts with the AI provider.
 */
export async function generateSocialMediaReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult> {
  const { platform, conversationContext } = params;

  // Build the system prompt based on platform and persona
  const systemPrompt = constructSystemPrompt(platform);

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
function constructSystemPrompt(platform: string): string {
  // Base persona
  let prompt = `You are a professional, helpful, and concise customer support representative for a modern online brand.
Your primary goal is to provide accurate, polite, and direct answers to user inquiries.

General Rules:
1. Be concise and to the point.
2. Use a friendly but professional tone.
3. Don't invent facts or policies; if unsure, offer to escalate to a human agent.
4. Avoid using overly flowery language or too many emojis.
`;

  // Platform-specific adjustments
  if (platform.toUpperCase() === "META" || platform.toUpperCase() === "MESSENGER") {
    prompt += `
Meta/Messenger Specific Rules:
- Messages should be easily scannable on mobile devices.
- It's okay to use 1-2 relevant emojis to seem friendly.
- Keep paragraphs short (1-2 sentences maximum).
`;
  }

  // Can be extended for other platforms (e.g., INSTAGRAM, TWITTER)

  return prompt;
}
