export type Platform = 'meta' | 'tiktok';

export interface Profile {
  id: string; // uuid from auth.users
  full_name: string | null;
  avatar_url: string | null;
  updated_at: Date;
}

export interface PlatformAccount {
  id: string;
  profile_id: string;
  workspace_id: string;
  platform: Platform;
  platform_user_id: string;
  platform_user_name: string;
  created_at: Date;
}

export interface MetaToken {
  id: string;
  account_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  expires_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  account_id: string;
  platform_conversation_id: string;
  last_message_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  platform_message_id: string;
  created_at: Date;
}

export interface AIReplyLog {
  id: string;
  message_id: string;
  prompt: string;
  response: string;
  model: string;
  created_at: Date;
}
export interface BotConfiguration {
  id: string;
  account_id: string;
  is_active: boolean;
  trigger_labels: string[];
  confidence_threshold: number;
  auto_send: boolean;
  updated_at: Date;
}
