import { db } from '@/lib/db';
import type { TikTokWebhookPayload } from '@/domain/tiktok/webhook.types';

/**
 * TikTok Webhook Handler Service
 * 
 * Handles parsing, persistence and enqueuing of TikTok events.
 * Supports both direct messages (DMs) and public comments.
 */
export class TikTokWebhookHandlerService {
  async handlePayload(payload: TikTokWebhookPayload) {
    if (payload.event === 'message') {
      await this.handleMessage(payload);
    } else if (payload.event === 'comment') {
      await this.handleComment(payload);
    }
  }

  private async handleMessage(payload: TikTokWebhookPayload) {
    const { 
      message_id, 
      conversation_id, 
      sender_id, 
      receiver_id, 
      content, 
      create_time 
    } = payload.data;

    if (!message_id || !sender_id || !receiver_id) {
      console.warn('⚠️ [TIKTOK_WEBHOOK] Invalid message payload:', payload.data);
      return;
    }

    const account = await db.platformAccount.findUnique({
      where: {
        platform_platformUserId: {
          platform: 'TIKTOK',
          platformUserId: receiver_id,
        },
      },
      select: { id: true },
    });

    if (!account) return;

    const platformConversationId = conversation_id || sender_id;
    const timestamp = create_time ? new Date(create_time * 1000) : new Date();

    const conversation = await db.conversation.upsert({
      where: {
        accountId_platformConversationId: {
          accountId: account.id,
          platformConversationId: platformConversationId,
        },
      },
      update: { lastMessageAt: timestamp },
      create: {
        accountId: account.id,
        platformConversationId: platformConversationId,
        lastMessageAt: timestamp,
      },
    });

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

    await this.enqueueJob(dbMsg.id, conversation.id, 'TIKTOK', dbMsg.content, false);
  }

  private async handleComment(payload: TikTokWebhookPayload) {
    const { 
      comment_id, 
      video_id, 
      sender_id, 
      receiver_id, 
      content, 
      create_time 
    } = payload.data;

    if (!comment_id || !video_id || !receiver_id) {
      console.warn('⚠️ [TIKTOK_WEBHOOK] Invalid comment payload:', payload.data);
      return;
    }

    const account = await db.platformAccount.findUnique({
      where: {
        platform_platformUserId: {
          platform: 'TIKTOK',
          platformUserId: receiver_id,
        },
      },
      select: { id: true },
    });

    if (!account) return;

    // For comments, we treat the video_id as the conversation thread
    const platformConversationId = video_id;
    const timestamp = create_time ? new Date(create_time * 1000) : new Date();

    const conversation = await db.conversation.upsert({
      where: {
        accountId_platformConversationId: {
          accountId: account.id,
          platformConversationId,
        },
      },
      update: { lastMessageAt: timestamp },
      create: {
        accountId: account.id,
        platformConversationId,
        lastMessageAt: timestamp,
      },
    });

    const dbMsg = await db.message.upsert({
      where: { platformMessageId: comment_id },
      update: {},
      create: {
        conversationId: conversation.id,
        senderId: sender_id || 'anonymous',
        content: content || '',
        platformMessageId: comment_id,
        createdAt: timestamp,
      },
    });

    await this.enqueueJob(dbMsg.id, conversation.id, 'TIKTOK', dbMsg.content, true);
  }

  private async enqueueJob(messageId: string, conversationId: string, platform: string, content: string, isComment: boolean) {
    const { pushJob } = require('@/infrastructure/queue/bullmq-producer');
    const { QueueName, JobType } = require('@/domain/types/queue');

    await pushJob(QueueName.AI_PROCESSING, JobType.MESSAGE_RECEIVED, {
      messageId,
      conversationId,
      platform,
      content,
      metadata: { isComment }
    });
  }
}

export const tiktokWebhookHandler = new TikTokWebhookHandlerService();
