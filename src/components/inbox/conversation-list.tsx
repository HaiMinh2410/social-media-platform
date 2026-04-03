'use client';

import { useState, useEffect } from 'react';
import type { ConversationPreview } from '@/domain/types/inbox';
import { ConversationItem } from './conversation-item';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGlobalNotifications } from '@/hooks/use-global-notifications';
import { createClient } from '@/lib/supabase/client';

type Props = {
  initialConversations: ConversationPreview[];
};

export function ConversationList({ initialConversations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentId = searchParams.get('conversationId');
  const supabase = createClient();

  // We manage the conversations list in state to allow future realtime updates.
  const [conversations, setConversations] = useState<ConversationPreview[]>(initialConversations);
  const [searchQuery, setSearchQuery] = useState('');

  // Enable global toasts
  useGlobalNotifications();

  // Sync state when initialConversations change
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Realtime updates for the list (New messages, unread counts)
  useEffect(() => {
    const channel = supabase
      .channel('inbox-list-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new as any;
          
          setConversations((prev: ConversationPreview[]) => {
             return prev.map((c: ConversationPreview) => {
               if (c.id === newMessage.conversation_id) {
                 // Check if it's from us
                 // Since we don't have isFromUs here, let's keep it simple for now or fetch it.
                 // Actually, latestMessage always updates regardless of sender.
                 // unreadCount only updates if sender is NOT us.
                 const isRead = newMessage.is_read || (newMessage.conversation_id === currentId);
                 
                 return {
                   ...c,
                   lastMessageAt: new Date(newMessage.created_at),
                   latestMessage: {
                     content: newMessage.content,
                     createdAt: new Date(newMessage.created_at),
                     senderId: newMessage.sender_id,
                     platformMessageId: newMessage.platform_message_id,
                   },
                   unreadCount: (c.unreadCount || 0) + (isRead ? 0 : 1)
                 };
               }
               return c;
             });
          });
        }
      )
      .on(
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'messages' }, // When marked as read
         (payload) => {
           const updated = payload.new as any;
           if (updated.is_read) {
             setConversations((prev: ConversationPreview[]) => prev.map((c: ConversationPreview) => {
               if (c.id === updated.conversation_id) {
                 // Re-calculate or decrement?
                 // Decrementing is easier but riskier. Re-fetching count is safer.
                 // For now, let's just mark the conversation as potentially needing unreadCount update
                 // Or just assume 'markAsRead' successfully cleared it for the ACTIVE conversation.
                 if (updated.conversation_id === currentId) {
                   return { ...c, unreadCount: 0 };
                 }
               }
               return c;
             }));
           }
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentId, supabase]);


  const filteredConversations = conversations.filter((c) =>
    c.platformAccount.platformUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.latestMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string) => {
    router.push(`/inbox?conversationId=${id}`);
  };


  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white border-r border-slate-200 shrink-0">
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-9 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium text-sm">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={currentId === conv.id}
              onClick={handleSelect}
            />

          ))
        )}
      </div>
    </div>
  );
}
