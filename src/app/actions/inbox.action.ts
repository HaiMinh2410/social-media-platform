'use server';

import { createClient } from '@/lib/supabase/server';
import { getConversationsByUserId } from '@/application/inbox/inbox.service';
import type { ConversationPreview } from '@/domain/types/inbox';

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
