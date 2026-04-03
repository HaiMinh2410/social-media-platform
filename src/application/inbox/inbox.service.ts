import { db } from '@/lib/db';
import type { ConversationPreview, MessageDTO } from '@/domain/types/inbox';

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
    }));

    return { data: mapped, error: null };
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return { data: null, error: error.message || 'Failed to fetch messages' };
  }
}
