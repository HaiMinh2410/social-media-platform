export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_reply_logs: {
        Row: {
          created_at: string
          id: string
          message_id: string
          model: string
          prompt: string
          response: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          model: string
          prompt: string
          response: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          model?: string
          prompt?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reply_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_snapshots: {
        Row: {
          account_id: string
          created_at: string
          date: string
          engagement: number
          followers: number
          id: string
          impressions: number
          reach: number
        }
        Insert: {
          account_id: string
          created_at?: string
          date: string
          engagement?: number
          followers?: number
          id?: string
          impressions?: number
          reach?: number
        }
        Update: {
          account_id?: string
          created_at?: string
          date?: string
          engagement?: number
          followers?: number
          id?: string
          impressions?: number
          reach?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_configurations: {
        Row: {
          account_id: string
          auto_send: boolean
          confidence_threshold: number
          id: string
          is_active: boolean
          trigger_labels: string[] | null
          updated_at: string
        }
        Insert: {
          account_id: string
          auto_send?: boolean
          confidence_threshold?: number
          id?: string
          is_active?: boolean
          trigger_labels?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          auto_send?: boolean
          confidence_threshold?: number
          id?: string
          is_active?: boolean
          trigger_labels?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_configurations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          account_id: string
          id: string
          last_message_at: string
          platform_conversation_id: string
        }
        Insert: {
          account_id: string
          id?: string
          last_message_at?: string
          platform_conversation_id: string
        }
        Update: {
          account_id?: string
          id?: string
          last_message_at?: string
          platform_conversation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          platform_message_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          platform_message_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          platform_message_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_tokens: {
        Row: {
          account_id: string
          encrypted_access_token: string
          encrypted_refresh_token: string | null
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          encrypted_access_token: string
          encrypted_refresh_token?: string | null
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          encrypted_access_token?: string
          encrypted_refresh_token?: string | null
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_accounts: {
        Row: {
          created_at: string
          id: string
          platform: string
          platform_user_id: string
          platform_user_name: string
          profile_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          platform_user_id: string
          platform_user_name: string
          profile_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          platform_user_id?: string
          platform_user_name?: string
          profile_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          account_id: string
          content: string | null
          created_at: string
          id: string
          media_urls: string[] | null
          platform_post_id: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          platform_post_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          platform_post_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          profile_id?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
