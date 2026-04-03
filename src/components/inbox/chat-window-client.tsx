'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './message-bubble';
import { ReplyBox } from './reply-box';
import type { MessageDTO } from '@/domain/types/inbox';

type ChatWindowClientProps = {
  initialMessages: MessageDTO[];
  conversationId: string;
};

export function ChatWindowClient({ initialMessages, conversationId }: ChatWindowClientProps) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageSent = (newMessage: MessageDTO) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {messages.length > 0 ? (
          <div className="flex flex-col justify-end min-h-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No messages found. Let&apos;s say hi!
          </div>
        )}
      </div>

      {/* Reply Box */}
      <ReplyBox
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
      />
    </>
  );
}
