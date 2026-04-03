'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

export function useGlobalNotifications() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get('conversationId');

  useEffect(() => {
    // Listen to ALL new messages in the system for this user's accounts
    // Since we don't have a broad 'all messages' channel easily filtered by user in realtime 
    // without complex setup, we'll listen to the 'messages' table.
    // Note: RLS will ensure we only see messages we have access to.
    
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // 1. Skip if it's the active conversation (ChatWindow handles this)
          if (newMessage.conversation_id === activeConversationId) return;

          // 2. Fetch conversation details to show a nice toast
          const { data: conv } = await supabase
            .from('conversations')
            .select('platform_conversation_id, platform_accounts(platform_user_name)')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conv) return;
          
          // 3. Skip if it's from us (sent from another device/tab)
          const platformUserId = (conv as any).platform_accounts?.platform_user_id;
          if (newMessage.sender_id === platformUserId) return;

          const senderName = (conv as any).platform_accounts?.platform_user_name || 'Customer';

          // 4. Show toast
          toast.message(`New message from ${senderName}`, {
            description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
            action: {
              label: 'View',
              onClick: () => router.push(`/inbox?conversationId=${newMessage.conversation_id}`),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, router, supabase]);
}
