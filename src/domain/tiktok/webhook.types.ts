/**
 * TikTok Webhook Payload Types
 */

export type TikTokWebhookPayload = {
  event: 'message' | 'comment' | string;
  timestamp: number;
  // TikTok sends data in a flattened or nested structure depending on version
  // This is a common shape for Messaging (Business API)
  data: {
    message_id?: string;
    conversation_id?: string;
    sender_id?: string;
    receiver_id?: string;
    content?: string;
    create_time?: number;
    // For Comments
    comment_id?: string;
    video_id?: string;
  };
};

export type TikTokVerificationRequest = {
  challenge: string;
};
