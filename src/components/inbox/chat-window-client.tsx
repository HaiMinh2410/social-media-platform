'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './message-bubble';
import { ReplyBox } from './reply-box';
import { SuggestionPanel } from './suggestion-panel';
import type { MessageDTO } from '@/domain/types/inbox';
import { Sparkles, MoreVertical, Search, ArrowLeft } from 'lucide-react';

type ChatWindowClientProps = {
  initialMessages: MessageDTO[];
  conversationId: string;
  customerName?: string;
};

export function ChatWindowClient({ initialMessages, conversationId, customerName = 'Customer' }: ChatWindowClientProps) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [replyValue, setReplyValue] = useState('');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageSent = (newMessage: MessageDTO) => {
    setMessages((prev) => [...prev, newMessage]);
    setIsAiPanelOpen(false); // Close AI panel after sending custom reply
  };

  const handleUseSuggestion = useCallback((content: string) => {
    setReplyValue(content);
    // Panel remains open so they can see alternatives or just close it
  }, []);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const canShowAi = lastMessage && !lastMessage.isFromUs;

  return (
    <div className="flex flex-row h-full overflow-hidden bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              {customerName.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm leading-none mb-1">{customerName}</h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Messenger</span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg hidden sm:block">
              <Search className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              disabled={!canShowAi}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${!canShowAi 
                  ? 'text-slate-300 opacity-50 cursor-not-allowed' 
                  : isAiPanelOpen 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm border border-blue-200'}
              `}
            >
              <Sparkles className={`h-4 w-4 ${canShowAi && !isAiPanelOpen ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">AI Suggestions</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
          {messages.length > 0 ? (
            <div className="flex flex-col justify-end min-h-full">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              No messages found. Let&apos;s start the conversation!
            </div>
          )}
        </div>

        {/* Reply Box area */}
        <div className="p-0 border-t border-slate-100">
           <ReplyBox
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
            value={replyValue}
            onValueChange={setReplyValue}
          />
        </div>
      </div>

      {/* AI Suggestion Panel (Collapsible) */}
      {isAiPanelOpen && canShowAi && lastMessage && (
        <SuggestionPanel 
          messageId={lastMessage.id}
          onUseSuggestion={handleUseSuggestion}
          onClose={() => setIsAiPanelOpen(false)}
        />
      )}
    </div>
  );
}
