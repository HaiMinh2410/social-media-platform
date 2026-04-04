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
  unreadCount?: number;
  lastUserMessageAt?: Date;
};

export type ConversationDetail = {
  messages: MessageDTO[];
  platform: string;
  lastUserMessageAt: Date | null;
  customerName?: string;
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
