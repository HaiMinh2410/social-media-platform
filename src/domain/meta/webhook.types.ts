export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
    attachments?: any[];
  };
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging: MetaMessagingEvent[];
}

export interface MetaWebhookPayload {
  object: 'page' | 'instagram' | 'whatsapp_business_account';
  entry: MetaWebhookEntry[];
}
