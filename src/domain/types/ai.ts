export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateReplyParams {
  platform: string;
  conversationContext: AiMessage[];
  isComment?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateReplyResult {
  reply: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string; // e.g., "groq"
  model: string;
}
