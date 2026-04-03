'use server';

import { createClient } from '@/lib/supabase/server';
import { getConversationsByUserId, getAISuggestionsByMessageId, generateNewSuggestions } from '@/application/inbox/inbox.service';
import type { ConversationPreview, SendMessageResult } from '@/domain/types/inbox';

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
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { data: null, error: 'Unauthorized' };
    }

    return await getConversationsByUserId(authData.user.id);
  } catch (error: any) {
    console.error('getConversationsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function getMessagesAction(conversationId: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { data: null, error: 'Unauthorized' };
    }

    // Dynamic import to avoid type leaking issues or keep simple
    const { getMessagesByConversationId } = await import('@/application/inbox/inbox.service');
    return await getMessagesByConversationId(authData.user.id, conversationId);
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
    if (!conversationId || typeof conversationId !== 'string') {
      return { data: null, error: 'Invalid conversation ID' };
    }

    const trimmedContent = content?.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      return { data: null, error: 'Message content is required' };
    }

    if (trimmedContent.length > 2000) {
      return { data: null, error: 'Message exceeds maximum length of 2000 characters' };
    }

    // Auth guard
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { data: null, error: 'Unauthorized' };
    }

    const { sendMessage } = await import('@/application/inbox/inbox.service');
    return await sendMessage(authData.user.id, conversationId, trimmedContent);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('sendMessageAction error:', message);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function getAISuggestionsAction(messageId: string) {
  try {
    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await getAISuggestionsByMessageId(messageId);
  } catch (error: any) {
    console.error('getAISuggestionsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}

export async function regenerateSuggestionsAction(messageId: string) {
  try {
    const auth = await verifySession();
    if (auth.error) return { data: null, error: auth.error };

    return await generateNewSuggestions(auth.data!.id, messageId);
  } catch (error: any) {
    console.error('regenerateSuggestionsAction error:', error);
    return { data: null, error: 'Internal Server Error' };
  }
}
