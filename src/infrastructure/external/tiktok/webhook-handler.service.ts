import { db } from '@/lib/db';
import type { TikTokWebhookPayload } from '@/domain/tiktok/webhook.types';

/**
 * TikTok Webhook Handler Service
 * 
 * Handles parsing, persistence and enqueuing of TikTok events.
 */
export class TikTokWebhookHandlerService {
  async handlePayload(payload: TikTokWebhookPayload) {
    // Only handle direct messages (chat) for now
    if (payload.event !== 'message') {
      return;
    }

    const { 
      message_id, 
      conversation_id, 
      sender_id, 
      receiver_id, 
      content, 
      create_time 
    } = payload.data;

    // Guard: basic validation of payload
    if (!message_id || !sender_id || !receiver_id) {
      console.warn('⚠️ [TIKTOK_WEBHOOK] Received invalid message payload:', payload.data);
      return;
    }

    // 1. Resolve Platform Account (The recipient is the brand/brand_id in TikTok API)
    const account = await db.platformAccount.findUnique({
      where: {
        platform_platformUserId: {
          platform: 'TIKTOK',
          platformUserId: receiver_id,
        },
      },
      select: { id: true },
    });

    if (!account) {
      console.warn('⚠️ [TIKTOK_WEBHOOK] Unknown platform account linked for receiver:', receiver_id);
      return;
    }

    // 2. Upsert Conversation
    // In TikTok, a messaging thread identifies a conversation. 
    // We use conversation_id from payload, falling back to sender_id (peer-to-peer).
    const platformConversationId = conversation_id || sender_id;
    const timestamp = create_time ? new Date(create_time * 1000) : new Date();

    const conversation = await db.conversation.upsert({
      where: {
        accountId_platformConversationId: {
          accountId: account.id,
          platformConversationId: platformConversationId,
        },
      },
      update: {
        lastMessageAt: timestamp,
      },
      create: {
        accountId: account.id,
        platformConversationId: platformConversationId,
        lastMessageAt: timestamp,
      },
    });

    // 3. Persist Message
    const dbMsg = await db.message.upsert({
      where: { platformMessageId: message_id },
      update: {},
      create: {
        conversationId: conversation.id,
        senderId: sender_id,
        content: content || '',
        platformMessageId: message_id,
        createdAt: timestamp,
      },
    });

    console.log('✅ [TIKTOK_WEBHOOK] Persisted TikTok message:', message_id);

    // 4. Enqueue Job for AI Processing
    const { pushJob } = require('@/infrastructure/queue/bullmq-producer');
    const { QueueName, JobType } = require('@/domain/types/queue');

    await pushJob(QueueName.AI_PROCESSING, JobType.MESSAGE_RECEIVED, {
      messageId: dbMsg.id,
      conversationId: conversation.id,
      platform: 'TIKTOK',
      content: dbMsg.content,
    });
  }
}

export const tiktokWebhookHandler = new TikTokWebhookHandlerService();
