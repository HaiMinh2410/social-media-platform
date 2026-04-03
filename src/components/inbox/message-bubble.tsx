import React from 'react';
import type { MessageDTO } from '@/domain/types/inbox';

type MessageBubbleProps = {
  message: MessageDTO;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromUs = message.isFromUs;

  return (
    <div className={`flex w-full mb-4 ${isFromUs ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isFromUs 
            ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' 
            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm'
        }`}
      >
        <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>
        <div 
          className={`text-[10px] mt-1 ${isFromUs ? 'text-blue-200 text-right' : 'text-slate-400'}`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
