'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, FileText, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { PostDTO, PostStatus } from '@/domain/types/posts';
import { cancelPostAction } from '@/app/actions/post.action';

// ─── Types ───────────────────────────────────────────────────────────────────

type PostCardProps = {
  post: PostDTO;
  onCancelled: (postId: string) => void;
};

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Clock,
  },
  published: {
    label: 'Published',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  error: {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: XCircle,
  },
  draft: {
    label: 'Cancelled',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: FileText,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PostCard({ post, onCancelled }: PostCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const config = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = config.icon;

  async function handleCancel() {
    if (!confirm('Bạn chắc chắn muốn hủy bài đăng này?')) return;
    setCancelling(true);
    const result = await cancelPostAction(post.id);
    setCancelling(false);
    if (result.error) {
      alert(`Lỗi: ${result.error}`);
      return;
    }
    onCancelled(post.id);
  }

  const contentPreview = post.content
    ? post.content.length > 120
      ? `${post.content.slice(0, 120)}...`
      : post.content
    : '(No text content)';

  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
          <span className="text-xs text-slate-500 shrink-0">
            {formatScheduledDate(post.scheduledAt)}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {post.platformPostId && (
            <a
              href={`https://www.facebook.com/${post.platformPostId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="View on platform"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {post.status === 'scheduled' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
              title="Cancel post"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          {expanded ? (post.content ?? '(No text content)') : contentPreview}
        </p>
        {post.content && post.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Media thumbnails */}
      {post.mediaUrls.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {post.mediaUrls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-800"
              >
                {/* Use img tag — these are external storage URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {post.mediaUrls.length > 4 && i === 3 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-white text-xs font-bold">+{post.mediaUrls.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No media indicator */}
      {post.mediaUrls.length === 0 && !post.content && (
        <div className="px-4 pb-4 flex items-center gap-2 text-slate-600 text-xs">
          <ImageIcon className="h-3.5 w-3.5" />
          Text only post
        </div>
      )}
    </div>
  );
}
