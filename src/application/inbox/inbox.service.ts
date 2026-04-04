import { db } from '@/lib/db';
import type { ConversationPreview, MessageDTO, SendMessageResult } from '@/domain/types/inbox';
import { decryptToken } from '@/infrastructure/security/token-encryption';
import { sendMetaMessage } from '@/infrastructure/external/meta/meta-messaging.service';
import { sendTikTokMessage } from '@/infrastructure/external/tiktok/tiktok-messaging.service';
import { env } from '@/infrastructure/config/env-registry';
import { generateSocialMediaReply } from '../ai/ai.service';
import type { AISuggestionDTO } from '@/domain/types/inbox';
import type { AiMessage } from '@/domain/types/ai';

export async function getConversationsByUserId(userId: string): Promise<{ data: ConversationPreview[] | null; error: string | null }> {
  try {
    const conversations = await db.conversation.findMany({
      where: {
        platformAccount: {
          profileId: userId,
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        platformAccount: {
          select: {
            platform: true,
            platformUserName: true,
            platformUserId: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    const mapped: ConversationPreview[] = conversations.map((c) => {
      // Calculate unreadCount: messages where isRead is false and senderId is NOT our platform user id
      const platformUserId = c.platformAccount.platformUserId;
      // Note: In a real scenario with many messages, we'd use a dedicated aggregate query,
      // but for this implementation we use the included messages or a separate count if needed.
      // Since we only 'take: 1' for latest message, we need a separate count for unread.
      return {
        id: c.id,
        platformConversationId: c.platformConversationId,
        lastMessageAt: c.lastMessageAt,
        platformAccount: {
          platform: c.platformAccount.platform,
          platformUserName: c.platformAccount.platformUserName,
        },
        latestMessage: c.messages.length > 0 ? {
          content: c.messages[0].content,
          createdAt: c.messages[0].createdAt,
          senderId: c.messages[0].senderId,
          platformMessageId: c.messages[0].platformMessageId,
        } : null,
        unreadCount: 0, // Placeholder, will update with real count below
      };
    });

    // Fetch unread counts for each conversation
    for (const conv of mapped) {
       const account = conversations.find(c => c.id === conv.id)?.platformAccount;
       if (account) {
         conv.unreadCount = await db.message.count({
           where: {
             conversationId: conv.id,
             isRead: false,
             senderId: { not: account.platformUserId }
           }
         });
       }
    }


    return { data: mapped, error: null };
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return { data: null, error: error.message || 'Failed to fetch conversations' };
  }
}


export async function getMessagesByConversationId(userId: string, conversationId: string): Promise<{ data: MessageDTO[] | null; error: string | null }> {
  try {
    // Prevent unauthorized access by checking profileId
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        platformAccount: true,
        messages: {
          orderBy: { createdAt: 'asc' }, // Chronological order
        }
      }
    });

    if (!conversation || conversation.platformAccount.profileId !== userId) {
      return { data: null, error: 'Conversation not found or unauthorized' };
    }

    const mapped: MessageDTO[] = conversation.messages.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      isFromUs: m.senderId === conversation.platformAccount.platformUserId,
      platformMessageId: m.platformMessageId,
      isRead: m.isRead,
    }));


    return { data: mapped, error: null };
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return { data: null, error: error.message || 'Failed to fetch messages' };
  }
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<{ data: SendMessageResult | null; error: string | null }> {
  try {
    // 1. Validate conversation ownership & get platform account details
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        platformAccount: {
          include: {
            metaTokens: {
              orderBy: { updatedAt: 'desc' },
              take: 1,
            },
            tiktokTokens: {
              orderBy: { updatedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!conversation || conversation.platformAccount.profileId !== userId) {
      return { data: null, error: 'Conversation not found or unauthorized' };
    }

    const platform = conversation.platformAccount.platform;
    const platformUserId = conversation.platformAccount.platformUserId;
    const recipientId = conversation.platformConversationId;
    let platformMessageId = '';

    if (platform === 'META') {
      // --- META FLOW ---
      const metaToken = conversation.platformAccount.metaTokens[0];
      if (!metaToken) {
        return { data: null, error: 'No Meta access token found for this account' };
      }

      const accessToken = decryptToken(metaToken.encryptedAccessToken, env.META_TOKEN_ENCRYPTION_KEY);
      const { data: metaResult, error: metaError } = await sendMetaMessage({
        recipientId,
        messageText: content,
        accessToken,
      });

      if (metaError || !metaResult) {
        return { data: null, error: metaError || 'Failed to send message via Meta' };
      }
      platformMessageId = metaResult.messageId;
    } else if (platform === 'TIKTOK') {
      // --- TIKTOK FLOW ---
      const tiktokToken = conversation.platformAccount.tiktokTokens[0];
      if (!tiktokToken) {
        return { data: null, error: 'No TikTok access token found for this account' };
      }

      // 48h Window Check
      const lastUserMessage = await db.message.findFirst({
        where: {
          conversationId,
          senderId: { not: platformUserId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastUserMessage) {
        const lastMessageTime = new Date(lastUserMessage.createdAt).getTime();
        const DIFF_48H = 48 * 60 * 60 * 1000;
        if (Date.now() - lastMessageTime > DIFF_48H) {
          return { data: null, error: 'Messaging window expired (48h). User must contact you first.' };
        }
      }

      const accessToken = decryptToken(tiktokToken.accessToken, env.TIKTOK_TOKEN_ENCRYPTION_KEY);
      const { data: tiktokResult, error: tiktokError } = await sendTikTokMessage({
        brandId: platformUserId,
        receiverId: recipientId,
        text: content,
        accessToken,
        advertiserId: '', // Added dummy for type compliance, if needed
      });

      if (tiktokError || !tiktokResult) {
        return { data: null, error: tiktokError || 'Failed to send message via TikTok' };
      }
      platformMessageId = tiktokResult.messageId;
    } else {
      return { data: null, error: `Platform ${platform} not supported for sending messages.` };
    }

    // 4. Persist the sent message to DB
    const newMessage = await db.message.create({
      data: {
        conversationId,
        senderId: platformUserId,
        content,
        platformMessageId: platformMessageId,
      },
    });

    // 5. Update conversation last_message_at
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const messageDTO: MessageDTO = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      content: newMessage.content,
      createdAt: newMessage.createdAt,
      isFromUs: true,
      platformMessageId: newMessage.platformMessageId,
      isRead: newMessage.isRead,
    };

    return {
      data: {
        message: messageDTO,
        platformMessageId,
      },
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    console.error('Error sending message:', message);
    return { data: null, error: message };
  }
}

export async function getAISuggestionsByMessageId(messageId: string): Promise<{ data: AISuggestionDTO[] | null; error: string | null }> {
  try {
    const logs = await db.aIReplyLog.findMany({
      where: { messageId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped: AISuggestionDTO[] = logs.map(l => ({
      id: l.id,
      content: l.response,
      createdAt: l.createdAt,
    }));

    return { data: mapped, error: null };
  } catch (error: any) {
    console.error('Error fetching AI suggestions:', error);
    return { data: null, error: error.message || 'Failed to fetch suggestions' };
  }
}

export async function generateNewSuggestions(userId: string, messageId: string): Promise<{ data: AISuggestionDTO[] | null; error: string | null }> {
  try {
    // 1. Get message and conversation context
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            platformAccount: true,
            messages: {
              where: { createdAt: { lt: (await db.message.findUnique({ where: { id: messageId } }))?.createdAt } },
              orderBy: { createdAt: 'desc' },
              take: 5,
            }
          }
        }
      }
    });

    if (!message || message.conversation.platformAccount.profileId !== userId) {
      return { data: null, error: 'Message not found or unauthorized' };
    }

    // 2. Prepare context for AI
    const history: AiMessage[] = message.conversation.messages
      .reverse()
      .map(m => ({
        role: m.senderId === message.conversation.platformAccount.platformUserId ? 'assistant' : 'user',
        content: m.content
      }));

    // Add current message as the final user message
    history.push({ role: 'user', content: message.content });

    // 3. Generate 3 suggestions (serially for simplicity, or with high temp for variety)
    const suggestions: string[] = [];
    for (let i = 0; i < 3; i++) {
        const result = await generateSocialMediaReply({
            platform: message.conversation.platformAccount.platform,
            conversationContext: history,
            temperature: 0.7 + (i * 0.1), // Varying temperature for diversity
        });
        if (result.reply) {
            suggestions.push(result.reply);
        }
    }

    // 4. Persist to ai_reply_logs
    const createdLogs = await Promise.all(suggestions.map(content =>
        db.aIReplyLog.create({
            data: {
                messageId,
                prompt: JSON.stringify(history),
                response: content,
                model: 'groq-llama3-70b', // Hardcoded for now as per stack
            }
        })
    ));

    const mapped: AISuggestionDTO[] = createdLogs.map(l => ({
      id: l.id,
      content: l.response,
      createdAt: l.createdAt,
    }));

    return { data: mapped, error: null };
  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);
    return { data: null, error: error.message || 'Failed to generate suggestions' };
  }
}

export async function markConversationAsRead(userId: string, conversationId: string): Promise<{ data: boolean | null; error: string | null }> {
  try {
    // 1. Verify ownership
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { platformAccount: true }
    });

    if (!conversation || conversation.platformAccount.profileId !== userId) {
      return { data: null, error: 'Conversation not found or unauthorized' };
    }

    // 2. Mark all messages as read for this conversation
    // We only care about messages NOT from us
    await db.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        senderId: { not: conversation.platformAccount.platformUserId }
      },
      data: { isRead: true }
    });

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error marking as read:', error);
    return { data: null, error: error.message || 'Failed to mark as read' };
  }
}

