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

export type MessageDTO = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isFromUs: boolean;
  platformMessageId: string;
  isRead: boolean;
};


export type SendMessagePayload = {
  conversationId: string;
  content: string;
};

export type SendMessageResult = {
  message: MessageDTO;
  platformMessageId: string;
};

export type AISuggestionDTO = {
  id: string;
  content: string;
  createdAt: Date;
};
