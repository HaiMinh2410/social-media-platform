'use client';

import { useState, useTransition } from 'react';
import { X, Calendar, Send, AlertCircle, Loader2 } from 'lucide-react';
import { schedulePostAction } from '@/app/actions/post.action';
import type { PostDTO } from '@/domain/types/posts';

// ─── Types ───────────────────────────────────────────────────────────────────

type ComposeModalProps = {
  accountId: string;
  accountName: string;
  isOpen: boolean;
  defaultDate?: string; // YYYY-MM-DD — pre-fill from calendar click
  onClose: () => void;
  onScheduled: (post: PostDTO) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns datetime-local string (YYYY-MM-DDTHH:mm) for <input type="datetime-local"> */
function toDatetimeLocalString(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  }
  return `${dateStr}T09:00`;
}

/** Minimum datetime for scheduling — 5 minutes from now */
function getMinDatetime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComposeModal({
  accountId,
  accountName,
  isOpen,
  defaultDate,
  onClose,
  onScheduled,
}: ComposeModalProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalString(defaultDate));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const CHAR_LIMIT = 2000;
  const remaining = CHAR_LIMIT - content.length;

  function handleAddMedia() {
    const url = mediaInput.trim();
    if (!url) return;
    try {
      new URL(url); // validate URL format
      setMediaUrls((prev) => [...prev, url]);
      setMediaInput('');
    } catch {
      setError('Invalid URL. Please enter a valid media URL.');
    }
  }

  function handleRemoveMedia(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!content.trim() && mediaUrls.length === 0) {
      setError('Add text content or at least one media URL.');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate.getTime() <= Date.now()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    startTransition(async () => {
      const result = await schedulePostAction({
        accountId,
        content: content.trim(),
        mediaUrls,
        scheduledAt: scheduledDate.toISOString(),
      });

      if (result.error || !result.data) {
        setError(result.error ?? 'Failed to schedule post.');
        return;
      }

      onScheduled(result.data);
      // Reset form
      setContent('');
      setMediaUrls([]);
      setScheduledAt(toDatetimeLocalString());
      onClose();
    });
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Compose post modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Compose Post</h2>
            <p className="text-xs text-slate-400 mt-0.5">Posting as <span className="text-blue-400">{accountName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Content textarea */}
          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-slate-300 mb-1.5">
              Content
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to post?"
              rows={5}
              maxLength={CHAR_LIMIT}
              className="w-full resize-none rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
            <div className={`text-right text-xs mt-1 ${remaining < 100 ? 'text-amber-400' : 'text-slate-600'}`}>
              {remaining} characters remaining
            </div>
          </div>

          {/* Media URLs */}
          <div>
            <label htmlFor="media-url-input" className="block text-sm font-medium text-slate-300 mb-1.5">
              Media URLs <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="media-url-input"
                type="url"
                value={mediaInput}
                onChange={(e) => setMediaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMedia(); } }}
                placeholder="https://your-media-url.com/image.jpg"
                className="flex-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddMedia}
                className="px-3 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm font-medium transition-colors shrink-0"
              >
                Add
              </button>
            </div>

            {mediaUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300">
                    <span className="max-w-[180px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                      aria-label="Remove media"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled date/time */}
          <div>
            <label htmlFor="scheduled-at" className="block text-sm font-medium text-slate-300 mb-1.5">
              <Calendar className="inline h-3.5 w-3.5 mr-1" />
              Schedule for
            </label>
            <input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              min={getMinDatetime()}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="schedule-post-btn"
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isPending ? 'Scheduling…' : 'Schedule Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
