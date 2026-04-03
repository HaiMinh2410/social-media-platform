'use client';

import type { ConversationPreview } from '@/domain/types/inbox';
import { MessageSquare, Smartphone, Monitor } from 'lucide-react';

type Props = {
  conversation: ConversationPreview;
  isActive?: boolean;
  onClick?: (id: string) => void;
};

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { platformAccount, latestMessage, lastMessageAt } = conversation;
  
  // Basic platform icon logic
  const renderPlatformIcon = () => {
    switch (platformAccount.platform.toLowerCase()) {
      case 'instagram':
        return <Smartphone className="h-4 w-4 text-pink-500" />;
      case 'facebook':
        return <Monitor className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-slate-400" />;
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(lastMessageAt));

  return (
    <div
      onClick={() => onClick?.(conversation.id)}
      className={`group cursor-pointer p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 flex gap-4 items-start ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
      }`}
    >
      {/* Avatar Placeholder */}
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
          {platformAccount.platformUserName.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 bg-white shadow-sm border border-slate-100">
          {renderPlatformIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-sm font-semibold text-slate-900 truncate pr-2">
            {platformAccount.platformUserName}
          </h3>
          <span className="text-xs text-slate-500 shrink-0">{formattedDate}</span>
        </div>
        
        <p className="text-sm text-slate-500 line-clamp-2 leading-snug">
          {latestMessage?.content || 'Started a conversation'}
        </p>
      </div>

      {/* Badges / Unread indicators can go here */}
      {conversation.unreadCount && conversation.unreadCount > 0 ? (
        <div className="shrink-0 flex items-center justify-center h-5 min-w-[20px] rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white mt-1">
          {conversation.unreadCount}
        </div>
      ) : null}
    </div>
  );
}
