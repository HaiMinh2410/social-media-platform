'use server';

import { createClient } from '@/lib/supabase/server';
import { getConversationsByUserId, getAISuggestionsByMessageId, generateNewSuggestions, markConversationAsRead } from '@/application/inbox/inbox.service';
import type { ConversationPreview, SendMessageResult, ConversationDetail } from '@/domain/types/inbox';
import { IdSchema, MessageContentSchema } from '@/domain/validation/schemas';

async function verifySession() {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: 'Unauthorized' };
  }
  return { data: authData.user, error: null };
}

export async function getConversationsAction(): Promise<{ data: ConversationPreview[] | null; error: string | null }> {
  try {
    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await getConversationsByUserId(auth.data!.id);
  } catch (error: any) {
    console.error('getConversationsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function getMessagesAction(conversationId: string): Promise<{ data: ConversationDetail | null; error: string | null }> {
  try {
    const parsedId = IdSchema.safeParse(conversationId);
    if (!parsedId.success) return { data: null, error: 'Invalid conversation ID' };

    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    const { getMessagesByConversationId } = await import('@/application/inbox/inbox.service');
    return await getMessagesByConversationId(auth.data!.id, parsedId.data);
  } catch (error: any) {
    console.error('getMessagesAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function sendMessageAction(
  conversationId: string,
  content: string
): Promise<{ data: SendMessageResult | null; error: string | null }> {
  try {
    // Input validation
    const parsedId = IdSchema.safeParse(conversationId);
    if (!parsedId.success) return { data: null, error: 'Invalid conversation ID' };

    const parsedContent = MessageContentSchema.safeParse(content);
    if (!parsedContent.success) {
      return { data: null, error: parsedContent.error.errors[0].message };
    }

    // Auth guard
    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    const { sendMessage } = await import('@/application/inbox/inbox.service');
    return await sendMessage(auth.data!.id, parsedId.data, parsedContent.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('sendMessageAction error:', message);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function getAISuggestionsAction(messageId: string) {
  try {
    const parsedId = IdSchema.safeParse(messageId);
    if (!parsedId.success) return { data: null, error: 'Invalid message ID' };

    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await getAISuggestionsByMessageId(parsedId.data);
  } catch (error: any) {
    console.error('getAISuggestionsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function regenerateSuggestionsAction(messageId: string) {
  try {
    const parsedId = IdSchema.safeParse(messageId);
    if (!parsedId.success) return { data: null, error: 'Invalid message ID' };

    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await generateNewSuggestions(auth.data!.id, parsedId.data);
  } catch (error: any) {
    console.error('regenerateSuggestionsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function markAsReadAction(conversationId: string) {
  try {
    const parsedId = IdSchema.safeParse(conversationId);
    if (!parsedId.success) return { data: null, error: 'Invalid conversation ID' };

    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await markConversationAsRead(auth.data!.id, parsedId.data);
  } catch (error: any) {
    console.error('markAsReadAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

