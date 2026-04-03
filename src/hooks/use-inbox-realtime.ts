'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageDTO } from '@/domain/types/inbox';

type UseInboxRealtimeProps = {
  conversationId: string;
  onNewMessage: (message: MessageDTO) => void;
  onSuggestionGenerated?: () => void;
};

export function useInboxRealtime({ 
  conversationId, 
  onNewMessage,
  onSuggestionGenerated 
}: UseInboxRealtimeProps) {
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    // 1. Subscribe to 'messages' INSERT for current conversation
    const messagesChannel = supabase
      .channel(`inbox-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new;
          
          // We need to determine if it's from us or customer
          // Fetch some more details (like platform userId) if needed, 
          // or assume we'll just check senderId in the component.
          
          // Fetch the platform account to determine isFromUs
          const { data: convData } = await supabase
            .from('conversations')
            .select('platform_accounts(platform_user_id)')
            .eq('id', conversationId)
            .single();

          const platformUserId = (convData as any)?.platform_accounts?.platform_user_id;

          const dto: MessageDTO = {
            id: raw.id,
            conversationId: raw.conversation_id,
            senderId: raw.sender_id,
            content: raw.content,
            createdAt: new Date(raw.created_at),
            isFromUs: raw.sender_id === platformUserId,
            platformMessageId: raw.platform_message_id,
            isRead: raw.is_read || false,
          };

          onNewMessage(dto);
        }
      )
      .subscribe();

    // 2. Subscribe to 'ai_reply_logs' for suggestion UI updates
    const aiChannel = supabase
      .channel(`inbox-ai-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_reply_logs',
        },
        () => {
          // If we want detailed filtering, we'd need messageId.
          // For now, just trigger a refresh call in SuggestionsPanel.
          onSuggestionGenerated?.();
        }
      )
      .subscribe();

    channelRef.current = { messagesChannel, aiChannel };

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current.messagesChannel);
        supabase.removeChannel(channelRef.current.aiChannel);
      }
    };
  }, [conversationId, onNewMessage, onSuggestionGenerated, supabase]);
}
