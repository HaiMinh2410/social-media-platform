'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './message-bubble';
import { ReplyBox } from './reply-box';
import { SuggestionPanel } from './suggestion-panel';
import { useInboxRealtime } from '@/hooks/use-inbox-realtime';
import { markAsReadAction } from '@/app/actions/inbox.action';
import type { MessageDTO } from '@/domain/types/inbox';
import { Sparkles, MoreVertical, Search, ArrowLeft, Info } from 'lucide-react';

type ChatWindowClientProps = {
  initialMessages: MessageDTO[];
  conversationId: string;
  customerName?: string;
  platform?: string;
  lastUserMessageAt?: Date | null;
};

export function ChatWindowClient({ 
  initialMessages, 
  conversationId, 
  customerName = 'Customer',
  platform = 'META',
  lastUserMessageAt = null
}: ChatWindowClientProps) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [replyValue, setReplyValue] = useState('');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiRefreshKey, setAiRefreshKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TikTok Window Checks
  const isTikTok = platform === 'TIKTOK';
  const getWindowStatus = () => {
    if (!isTikTok || !lastUserMessageAt) return { expired: false, hoursLeft: 48 };
    const diffMs = Date.now() - new Date(lastUserMessageAt).getTime();
    const hoursLeft = 48 - (diffMs / (1000 * 60 * 60));
    return { expired: hoursLeft <= 0, hoursLeft };
  };

  const { expired, hoursLeft } = getWindowStatus();

  // Sync state when initialMessages change (new conversation selected)
  useEffect(() => {
    setMessages(initialMessages);
    setIsAiPanelOpen(false);
    setReplyValue('');
    
    // Mark as read when entering a conversation
    if (conversationId) {
      markAsReadAction(conversationId);
    }
  }, [initialMessages, conversationId]);

  const handleApplyMessage = useCallback((newMessage: MessageDTO) => {
    setMessages((prev) => {
      // Prevent duplicates from Realtime vs Optimistic vs Manual
      const exists = prev.some(m => m.id === newMessage.id || m.platformMessageId === newMessage.platformMessageId);
      if (exists) return prev;
      return [...prev, newMessage];
    });

    // If message is for THIS conversation and NOT from us, mark as read
    if (newMessage.conversationId === conversationId && !newMessage.isFromUs) {
       markAsReadAction(conversationId);
    }
  }, [conversationId]);


  // Subscribe to Realtime events
  useInboxRealtime({
    conversationId,
    onNewMessage: handleApplyMessage,
    onSuggestionGenerated: () => setAiRefreshKey(prev => prev + 1),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageSent = (newMessage: MessageDTO) => {
    handleApplyMessage(newMessage);
    setIsAiPanelOpen(false); // Close AI panel after sending custom reply
  };

  const handleUseSuggestion = useCallback((content: string) => {
    setReplyValue(content);
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
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                {platform}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg hidden sm:block">
              <Search className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              disabled={!canShowAi || expired}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${(!canShowAi || expired)
                  ? 'text-slate-300 opacity-50 cursor-not-allowed' 
                  : isAiPanelOpen 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm border border-blue-200'}
              `}
            >
              <Sparkles className={`h-4 w-4 ${canShowAi && !isAiPanelOpen && !expired ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">AI Suggestions</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* TikTok Window Warning Banner */}
        {isTikTok && lastUserMessageAt && (
          <div className={`px-4 py-2 text-xs font-medium border-b flex items-center gap-2 ${
            expired 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : hoursLeft < 6 
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            <Info className="h-3.5 w-3.5 shrink-0" />
            {expired ? (
              <span>TikTok 48-hour messaging window has expired. You can no longer reply until the customer sends a new message.</span>
            ) : (
              <span>TikTok messaging window: <strong>{Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m</strong> remaining to reply.</span>
            )}
          </div>
        )}

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
            disabled={expired}
          />
        </div>
      </div>

      {/* AI Suggestion Panel (Collapsible) */}
      {isAiPanelOpen && canShowAi && lastMessage && !expired && (
        <SuggestionPanel 
          key={`ai-${lastMessage.id}-${aiRefreshKey}`}
          messageId={lastMessage.id}
          onUseSuggestion={handleUseSuggestion}
          onClose={() => setIsAiPanelOpen(false)}
        />
      )}
    </div>
  );
}
