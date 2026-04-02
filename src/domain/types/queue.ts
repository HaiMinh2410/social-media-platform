export enum QueueName {
  AI_PROCESSING = "ai-processing",
  TOKEN_REFRESH = "token-refresh",
}

export enum JobType {
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  GENERATE_REPLY = "GENERATE_REPLY",
  REFRESH_META_TOKEN = "REFRESH_META_TOKEN",
}

export interface MessagePayload {
  messageId: string;
  conversationId: string;
  platform: "META" | "OTHER";
  content: string;
  metadata?: Record<string, any>;
}

export interface JobPayloadMap {
  [JobType.MESSAGE_RECEIVED]: MessagePayload;
  [JobType.GENERATE_REPLY]: { messageId: string; conversationId: string };
  [JobType.REFRESH_META_TOKEN]: { accountId: string };
}
