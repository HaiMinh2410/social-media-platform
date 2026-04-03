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
    <div className="flex flex-col flex-1 h-full bg-slate-50 relative">
      {/* Header Area */}
      <div className="h-[60px] border-b border-slate-200 bg-white shadow-sm z-10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
            #
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-base leading-tight">Conversation</h2>
            <p className="text-xs text-slate-500 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Active
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
          <Info className="h-5 w-5" />
        </button>
      </div>

      {/* Client-side interactive area: Messages + Reply Box */}
      <ChatWindowClient
        initialMessages={messages || []}
        conversationId={conversationId}
      />
    </div>
  );
}
