'use client';

import { useState, useCallback } from 'react';
import { Plus, LayoutList, Calendar as CalendarIcon } from 'lucide-react';
import type { PostDTO } from '@/domain/types/posts';
import { PostCalendar } from './post-calendar';
import { PostCard } from './post-card';
import { ComposeModal } from './compose-modal';

// ─── Types ───────────────────────────────────────────────────────────────────

type Account = {
  id: string;
  platformUserName: string;
  platform: string;
};

type PostsClientProps = {
  initialPosts: PostDTO[];
  accounts: Account[];
};

type ViewMode = 'calendar' | 'list';

// ─── Component ────────────────────────────────────────────────────────────────

export function PostsClient({ initialPosts, accounts }: PostsClientProps) {
  const [posts, setPosts] = useState<PostDTO[]>(initialPosts);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDateStr, setComposeDateStr] = useState<string | undefined>();
  const [selectedPost, setSelectedPost] = useState<PostDTO | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Filter posts for selected account
  const filteredPosts = posts.filter((p) => p.accountId === selectedAccountId);

  // Add newly scheduled post to state
  const handleScheduled = useCallback((post: PostDTO) => {
    setPosts((prev) => [...prev, post]);
  }, []);

  // Remove or update cancelled post in state
  const handleCancelled = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'draft' as const } : p))
    );
  }, []);

  // Calendar: clicking a day opens compose with pre-filled date
  const handleDayClick = useCallback((dateStr: string) => {
    setComposeDateStr(dateStr);
    setComposeOpen(true);
  }, []);

  // Calendar: clicking a post chip shows detail sidebar
  const handlePostClick = useCallback((post: PostDTO) => {
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  }, []);

  if (accounts.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center rounded-2xl border border-slate-800 bg-slate-900 p-10 max-w-sm">
          <CalendarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Accounts Connected</h2>
          <p className="text-slate-400 mb-6">Connect a Facebook or Instagram account to start scheduling posts.</p>
          <a
            href="/settings"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Account selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="account-select" className="text-sm text-slate-400 shrink-0">Account:</label>
          <select
            id="account-select"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.platformUserName} ({acc.platform})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl bg-slate-800 border border-slate-700 p-1">
            <button
              onClick={() => setViewMode('calendar')}
              aria-label="Calendar view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {/* Compose button */}
          <button
            id="compose-post-btn"
            onClick={() => { setComposeDateStr(undefined); setComposeOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Calendar / List */}
        <div className="flex-1 min-w-0">
          {viewMode === 'calendar' ? (
            <PostCalendar
              posts={filteredPosts}
              onDayClick={handleDayClick}
              onPostClick={handlePostClick}
            />
          ) : (
            <div className="space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-slate-500">
                  <CalendarIcon className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">No posts yet. Click <strong className="text-slate-400">New Post</strong> to get started.</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} onCancelled={handleCancelled} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Post detail side panel */}
        {selectedPost && (
          <div className="w-72 shrink-0">
            <div className="sticky top-0 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Post Detail</h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-slate-500 hover:text-white text-xs transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                <PostCard post={selectedPost} onCancelled={handleCancelled} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {selectedAccount && (
        <ComposeModal
          accountId={selectedAccountId}
          accountName={selectedAccount.platformUserName}
          isOpen={composeOpen}
          defaultDate={composeDateStr}
          onClose={() => setComposeOpen(false)}
          onScheduled={handleScheduled}
        />
      )}
    </div>
  );
}
