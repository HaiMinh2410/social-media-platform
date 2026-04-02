import type { Profile, PlatformAccount, MetaToken, Conversation, Message, AIReplyLog } from "./database";

/**
 * Mapped Supabase Database type based on domain interfaces.
 * This ensures strict typing across the application.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<Profile, 'updated_at'>> & { updated_at?: string };
      };
      platform_accounts: {
        Row: PlatformAccount;
        Insert: Omit<PlatformAccount, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<PlatformAccount, 'created_at'>> & { created_at?: string };
      };
      meta_tokens: {
        Row: MetaToken;
        Insert: Omit<MetaToken, 'updated_at' | 'expires_at'> & { updated_at?: string; expires_at: string };
        Update: Partial<Omit<MetaToken, 'updated_at' | 'expires_at'>> & { updated_at?: string; expires_at?: string };
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'last_message_at'> & { last_message_at?: string };
        Update: Partial<Omit<Conversation, 'last_message_at'>> & { last_message_at?: string };
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Message, 'created_at'>> & { created_at?: string };
      };
      ai_reply_logs: {
        Row: AIReplyLog;
        Insert: Omit<AIReplyLog, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<AIReplyLog, 'created_at'>> & { created_at?: string };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      platform: 'meta' | 'tiktok';
    };
  };
};
