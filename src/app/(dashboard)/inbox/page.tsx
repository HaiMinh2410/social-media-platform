import { getConversationsAction } from '@/app/actions/inbox.action';
import { ConversationList } from '@/components/inbox/conversation-list';
import { MessageSquare } from 'lucide-react';

import { ChatWindow } from '@/components/inbox/chat-window';

export const metadata = {
  title: 'Inbox | SocialAgent',
};

export default async function InboxPage({ searchParams }: { searchParams: { conversationId?: string } }) {
  const { data: conversations, error } = await getConversationsAction();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-red-500">
          <p className="font-bold">Error loading inbox</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const selectedId = searchParams.conversationId;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Left sidebar: Conversation List */}
      <ConversationList initialConversations={conversations || []} />

      {/* Right area: Chat window */}
      <div className="flex-1 h-full overflow-hidden">
        {selectedId ? (
          <ChatWindow conversationId={selectedId} />
        ) : (
          <div className="hidden md:flex flex-1 h-full items-center justify-center bg-slate-50 border-l border-slate-200">
            <div className="text-center text-slate-500 flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg text-slate-700 font-medium mb-1">Select a conversation</h3>
              <p className="text-sm text-slate-400 max-w-[250px]">
                Choose a conversation from the list to view messages and reply.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
