import React from 'react';
import { getMessagesAction } from '@/app/actions/inbox.action';
import { MessageBubble } from './message-bubble';
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {messages && messages.length > 0 ? (
          <div className="flex flex-col justify-end min-h-full">
            {messages.map((msg: any) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No messages found. Let's say hi!
          </div>
        )}
      </div>

      {/* Reply Box Placeholder for T017 */}
      <div className="h-[80px] border-t border-slate-200 bg-white shrink-0 p-4 flex items-center">
        <div className="w-full h-10 bg-slate-100 rounded-full flex items-center px-4 text-slate-400 text-sm border border-slate-200">
          Reply module will be implemented here...
        </div>
      </div>
    </div>
  );
}
