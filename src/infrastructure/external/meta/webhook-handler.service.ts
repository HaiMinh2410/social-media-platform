import { db } from '@/lib/db';
import type { MetaWebhookPayload, MetaMessagingEvent } from '@/domain/meta/webhook.types';

export class MetaWebhookHandlerService {
  /**
   * Processes a Meta Webhook payload and persists messages.
   */
  async handlePayload(payload: MetaWebhookPayload) {
    if (payload.object !== 'page' && payload.object !== 'instagram') {
      return;
    }

    for (const entry of payload.entry) {
      if (!entry.messaging) continue;

      for (const event of entry.messaging) {
        if (event.message) {
          await this.handleMessage(event);
        }
      }
    }
  }

  /**
   * Handles an individual messaging event.
   */
  private async handleMessage(event: MetaMessagingEvent) {
    const { sender, recipient, message, timestamp } = event;
    if (!message) return;

    // 1. Find the platform account (either sender or recipient)
    const account = await db.platformAccount.findUnique({
      where: { 
        platform_platformUserId: { 
          platform: 'META', 
          platformUserId: recipient.id 
        } 
      },
      select: { id: true, profileId: true }
    });

    if (!account) {
      console.warn('⚠️ [WEBHOOK_HANDLER] Received message for unknown platform account:', recipient.id);
      return;
    }

    // 2. Find or create conversation
    const platformConversationId = sender.id;
    const conversation = await db.conversation.upsert({
      where: {
        accountId_platformConversationId: {
          accountId: account.id,
          platformConversationId: platformConversationId,
        }
      },
      update: {
        lastMessageAt: new Date(timestamp),
      },
      create: {
        accountId: account.id,
        platformConversationId: platformConversationId,
        lastMessageAt: new Date(timestamp),
      }
    });

    // 3. Persist the message
    const dbMsg = await db.message.upsert({
      where: { platformMessageId: message.mid },
      update: {},
      create: {
        conversationId: conversation.id,
        senderId: sender.id,
        content: message.text,
        platformMessageId: message.mid,
        createdAt: new Date(timestamp),
      }
    });

    console.log('✅ [WEBHOOK_HANDLER] Message persisted:', message.mid);
      
    // Dynamic import to avoid circular dependency
    const { pushJob } = require('@/infrastructure/queue/bullmq-producer');
    const { QueueName, JobType } = require('@/domain/types/queue');

    await pushJob(QueueName.AI_PROCESSING, JobType.MESSAGE_RECEIVED, {
      messageId: dbMsg.id,
      conversationId: conversation.id,
      platform: 'META',
      content: dbMsg.content,
    });
  }
}



export const metaWebhookHandler = new MetaWebhookHandlerService();
