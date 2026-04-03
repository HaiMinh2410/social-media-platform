export type ConversationPreview = {
  id: string;
  platformConversationId: string;
  lastMessageAt: Date;
  platformAccount: {
    platform: string;
    platformUserName: string;
  };
  latestMessage: {
    content: string;
    createdAt: Date;
    senderId: string;
    platformMessageId: string;
  } | null;
  unreadCount?: number; // Currently not modeled precisely in schema, but good for future
};
