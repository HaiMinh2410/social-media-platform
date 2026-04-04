export enum QueueName {
  AI_PROCESSING = "ai-processing",
  TOKEN_REFRESH = "token-refresh",
  POST_SCHEDULER = "post-scheduler",
  MAINTENANCE = "maintenance",
}

export enum JobType {
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  GENERATE_REPLY = "GENERATE_REPLY",
  REFRESH_META_TOKEN = "REFRESH_META_TOKEN",
  REFRESH_TIKTOK_TOKEN = "REFRESH_TIKTOK_TOKEN",
  PUBLISH_POST = "PUBLISH_POST",
  DATABASE_BACKUP = "DATABASE_BACKUP",
}

export interface MessagePayload {
  messageId: string;
  conversationId: string;
  platform: "META" | "TIKTOK" | "OTHER";
  content: string;
  metadata?: Record<string, any>;
}

export interface JobPayloadMap {
  [JobType.MESSAGE_RECEIVED]: MessagePayload;
  [JobType.GENERATE_REPLY]: { messageId: string; conversationId: string; metadata?: Record<string, any> };
  [JobType.REFRESH_META_TOKEN]: { accountId: string };
  [JobType.REFRESH_TIKTOK_TOKEN]: { accountId: string };
  [JobType.PUBLISH_POST]: { postId: string; accountId: string };
  [JobType.DATABASE_BACKUP]: { timestamp: number };
}
