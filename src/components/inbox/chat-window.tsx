import React from 'react';
import { getMessagesAction } from '@/app/actions/inbox.action';
import { ChatWindowClient } from './chat-window-client';
import { Info } from 'lucide-react';

export async function ChatWindow({ conversationId }: { conversationId: string }) {
  const { data: messages, error } = await getMessagesAction(conversationId);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="text-red-500 text-center">
          <p className="font-bold">Error loading conversation</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ChatWindowClient
      initialMessages={messages || []}
      conversationId={conversationId}
    />
  );
}
