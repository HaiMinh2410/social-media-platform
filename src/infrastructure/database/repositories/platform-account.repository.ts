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
    
    // Fetch accounts with their tokens
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*, meta_tokens(*), tiktok_tokens(*)')
      .eq('workspace_id', workspaceId);

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
