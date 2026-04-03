'use client';

import React, { useState, useRef, useTransition, useCallback } from 'react';
import { sendMessageAction } from '@/app/actions/inbox.action';
import type { MessageDTO } from '@/domain/types/inbox';
import { Send, Loader2, AlertCircle } from 'lucide-react';

type ReplyBoxProps = {
  conversationId: string;
  onMessageSent: (message: MessageDTO) => void;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const MAX_LENGTH = 2000;

export function ReplyBox({ 
  conversationId, 
  onMessageSent, 
  value, 
  onValueChange,
  disabled = false
}: ReplyBoxProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedLength = value.trim().length;
  const isOverLimit = trimmedLength > MAX_LENGTH;
  const canSend = trimmedLength > 0 && !isOverLimit && !isPending && !disabled;

  // Auto-resize textarea when value changes from outside
  React.useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const messageContent = value.trim();
    setError(null);

    startTransition(async () => {
      const { data, error: sendError } = await sendMessageAction(conversationId, messageContent);

      if (sendError || !data) {
        setError(sendError || 'Failed to send message');
        return;
      }

      // Clear input and notify parent
      onValueChange('');
      onMessageSent(data.message);
    });
  }, [canSend, value, conversationId, onMessageSent, onValueChange, startTransition]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(e.target.value);
    setError(null);
  }, [onValueChange]);

  return (
    <div className="border-t border-slate-200 bg-white shrink-0">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-red-600 text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-3 p-3 md:p-4">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            id="reply-box-input"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a reply..."
            disabled={isPending}
            rows={1}
            className={`
              w-full resize-none rounded-xl border px-4 py-2.5 text-sm
              bg-slate-50 text-slate-800 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${isOverLimit ? 'border-red-300 focus:ring-red-500/40' : 'border-slate-200'}
            `}
            style={{ maxHeight: '120px' }}
          />
          {/* Character count — only show when > 80% of limit */}
          {trimmedLength > MAX_LENGTH * 0.8 && (
            <span
              className={`absolute bottom-1.5 right-3 text-[10px] font-medium ${
                isOverLimit ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              {trimmedLength}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          id="reply-send-button"
          onClick={handleSend}
          disabled={!canSend}
          className={`
            h-10 w-10 rounded-xl flex items-center justify-center shrink-0
            transition-all duration-200 shadow-sm
            ${
              canSend
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }
          `}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
