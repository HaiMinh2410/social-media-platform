import { createClient } from '@/lib/supabase/server';
import { Database } from '@/domain/types/database.types';

export type PlatformAccountWithStatus = Database['public']['Tables']['platform_accounts']['Row'] & {
  meta_tokens?: Database['public']['Tables']['meta_tokens']['Row'] | null;
  tiktok_tokens?: Database['public']['Tables']['tiktok_tokens']['Row'] | null;
  is_connected: boolean;
};

export async function getPlatformAccountsByWorkspace(workspaceId: string): Promise<{ data: PlatformAccountWithStatus[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    // Fetch accounts with their tokens, excluding disconnected ones
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*, meta_tokens(*), tiktok_tokens(*)')
      .eq('workspace_id', workspaceId)
      .is('disconnected_at', null);

    if (error) return { data: null, error: error.message };

    const now = new Date();

    const accountsWithStatus = (data as any[]).map(account => {
      let isConnected = false;
      
      if (account.platform === 'facebook' || account.platform === 'instagram' || account.platform === 'whatsapp') {
        const metaToken = account.meta_tokens?.[0];
        if (metaToken && new Date(metaToken.expires_at) > now) {
          isConnected = true;
        }
      } else if (account.platform === 'tiktok') {
        const tiktokToken = account.tiktok_tokens;
        if (tiktokToken && new Date(tiktokToken.expires_at) > now) {
          isConnected = true;
        }
      }

      return {
        ...account,
        meta_tokens: account.meta_tokens?.[0] || null,
        tiktok_tokens: account.tiktok_tokens || null,
        is_connected: isConnected
      };
    });

    return { data: accountsWithStatus, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function disconnectAccount(accountId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await (supabase.from('platform_accounts') as any)
      .update({ disconnected_at: new Date().toISOString() })
      .eq('id', accountId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export type PlatformAccountDetail = PlatformAccountWithStatus & {
  bot_configurations: Database['public']['Tables']['bot_configurations']['Row'] | null;
  analytics_snapshots: Database['public']['Tables']['analytics_snapshots']['Row'][];
  recent_activity: {
    id: string;
    description: string;
    type: 'ai_reply' | 'token_refresh' | 'system';
    status: 'success' | 'failure' | 'info';
    created_at: string;
  }[];
};

export async function getPlatformAccountDetail(accountId: string): Promise<{ data: PlatformAccountDetail | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    // 1. Fetch account with related data
    const { data: account, error: accountError } = await supabase
      .from('platform_accounts')
      .select(`
        *,
        meta_tokens(*),
        tiktok_tokens(*),
        bot_configurations(*),
        analytics_snapshots(*)
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) return { data: null, error: accountError?.message || 'Account not found' };

    const typedAccount = account as any;

    // 2. Fetch AI Reply Logs (limited)
    const { data: aiLogs, error: aiLogsError } = await supabase
      .from('ai_reply_logs')
      .select(`
        id,
        created_at,
        message:messages!inner(
          conversation:conversations!inner(
            account_id
          )
        )
      `)
      .eq('message.conversation.account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 3. Fetch TikTok Refresh Logs (if applicable)
    let tiktokLogs: any[] = [];
    if (typedAccount.platform === 'tiktok') {
      const { data: ttRefreshData } = await supabase
        .from('tiktok_token_refreshes')
        .select('*')
        .eq('account_id', accountId)
        .order('refreshed_at', { ascending: false })
        .limit(10);
      tiktokLogs = ttRefreshData || [];
    }

    // 4. Transform to unified activity feed
    const activity: PlatformAccountDetail['recent_activity'] = [
      ...((aiLogs as any[]) || []).map(log => ({
        id: log.id,
        description: 'AI reply generated',
        type: 'ai_reply' as const,
        status: 'success' as const,
        created_at: (log as any).created_at
      })),
      ...(tiktokLogs || []).map(log => ({
        id: log.id,
        description: log.success ? 'Token refreshed successfully' : `Token refresh failed: ${log.error_message}`,
        type: 'token_refresh' as const,
        status: log.success ? 'success' as const : 'failure' as const,
        created_at: log.refreshed_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

    // 5. Calculate connection status
    const now = new Date();
    let isConnected = false;
    if (typedAccount.platform === 'facebook' || typedAccount.platform === 'instagram' || typedAccount.platform === 'whatsapp') {
      const metaTokens = typedAccount.meta_tokens;
      const metaToken = Array.isArray(metaTokens) ? metaTokens[0] : metaTokens;
      if (metaToken && new Date(metaToken.expires_at) > now) {
        isConnected = true;
      }
    } else if (typedAccount.platform === 'tiktok') {
      const tiktokToken = typedAccount.tiktok_tokens;
      if (tiktokToken && new Date(tiktokToken.expires_at) > now) {
        isConnected = true;
      }
    }

    const detail: PlatformAccountDetail = {
      ...typedAccount,
      meta_tokens: Array.isArray(typedAccount.meta_tokens) ? typedAccount.meta_tokens[0] : (typedAccount.meta_tokens || null),
      tiktok_tokens: typedAccount.tiktok_tokens || null,
      bot_configurations: typedAccount.bot_configurations || null,
      analytics_snapshots: typedAccount.analytics_snapshots || [],
      is_connected: isConnected,
      recent_activity: activity
    };

    return { data: detail, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}
