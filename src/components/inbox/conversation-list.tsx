'use client';

import { useState } from 'react';
import type { ConversationPreview } from '@/domain/types/inbox';
import { ConversationItem } from './conversation-item';
import { Search } from 'lucide-react';

type Props = {
  initialConversations: ConversationPreview[];
};

export function ConversationList({ initialConversations }: Props) {
  // We manage the conversations list in state to allow future realtime updates.
  const [conversations, setConversations] = useState<ConversationPreview[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.platformAccount.platformUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.latestMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              isActive={activeId === conv.id}
              onClick={(id) => setActiveId(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
