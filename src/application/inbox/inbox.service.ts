import { db } from '@/lib/db';
import type { ConversationPreview, MessageDTO, SendMessageResult } from '@/domain/types/inbox';
import { decryptToken } from '@/infrastructure/security/token-encryption';
import { sendMetaMessage } from '@/infrastructure/external/meta/meta-messaging.service';
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

    const mapped: ConversationPreview[] = conversations.map((c) => ({
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
      unreadCount: 0,
    }));

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
          },
        },
      },
    });

    if (!conversation || conversation.platformAccount.profileId !== userId) {
      return { data: null, error: 'Conversation not found or unauthorized' };
    }

    const metaToken = conversation.platformAccount.metaTokens[0];
    if (!metaToken) {
      return { data: null, error: 'No Meta access token found for this account' };
    }

    // 2. Decrypt the stored access token
    const accessToken = decryptToken(metaToken.encryptedAccessToken);

    // 3. Send via Meta Graph API
    const recipientId = conversation.platformConversationId;
    const { data: metaResult, error: metaError } = await sendMetaMessage({
      recipientId,
      messageText: content,
      accessToken,
    });

    if (metaError || !metaResult) {
      return { data: null, error: metaError || 'Failed to send message via Meta' };
    }

    // 4. Persist the sent message to DB
    const platformUserId = conversation.platformAccount.platformUserId;
    const newMessage = await db.message.create({
      data: {
        conversationId,
        senderId: platformUserId,
        content,
        platformMessageId: metaResult.messageId,
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
    };

    return {
      data: {
        message: messageDTO,
        platformMessageId: metaResult.messageId,
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
