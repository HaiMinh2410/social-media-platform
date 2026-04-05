'use server';

import { metaAuthService, MetaAuthService } from '@/infrastructure/external/meta/meta-auth.service';
import { metaWhatsAppService } from '@/infrastructure/external/meta/meta-whatsapp.service';
import { decryptToken, encryptToken } from '@/infrastructure/security/token-encryption';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { type WABAPhoneNumber } from '@/domain/meta/meta-auth.types';

export async function getWhatsAppAuthUrlAction() {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/whatsapp/callback`;
  
  const loginUrl = MetaAuthService.getWhatsAppLoginUrl(redirectUri, 'whatsapp-state');
  return loginUrl;
}

export async function getMetaAuthUrlAction(platform: 'facebook' | 'instagram') {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;
  
  // Scopes are dependent on platform type
  const scopes = platform === 'facebook' 
    ? ['pages_manage_metadata', 'pages_show_list', 'pages_messaging', 'public_profile']
    : ['instagram_basic', 'instagram_manage_messages', 'pages_show_list', 'pages_manage_metadata', 'public_profile'];

  const loginUrl = MetaAuthService.getLoginUrl(redirectUri, `meta-${platform}-state`, scopes);
  return loginUrl;
}

export async function fetchAvailableWABAPhoneNumbersAction(encryptedToken: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const accessToken = decryptToken(encryptedToken);
    const accounts = await metaWhatsAppService.getWABAs(accessToken);
    
    let allPhoneNumbers: any[] = [];
    
    for (const waba of accounts) {
      const phones = await metaWhatsAppService.getPhoneNumbers(waba.id, accessToken);
      allPhoneNumbers.push(...phones.map(p => ({
        ...p,
        wabaId: waba.id,
        wabaName: waba.name
      })));
    }
    
    return { data: allPhoneNumbers, error: null };
  } catch (error: any) {
    console.error('❌ [FETCH_WABA_PHONES_ACTION] Error:', error);
    return { data: null, error: error.message || 'Failed to fetch WhatsApp numbers' };
  }
}

export async function connectWhatsAppAccountAction(
  phoneNumberId: string, 
  name: string, 
  encryptedToken: string, 
  workspaceId: string
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Authentication required' };
    }

    const accessToken = decryptToken(encryptedToken);
    
    // Refresh for long-lived? For now just use the short-lived one and extend later if needed
    // Actually exchange for long-lived token
    const tokenData = await metaAuthService.refreshAccessToken(accessToken);
    const longLivedToken = tokenData.access_token;
    const encryptedLongLived = encryptToken(longLivedToken);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Persistence
    const { data: account, error: accountError } = await (supabase.from('platform_accounts') as any)
      .upsert({
        profile_id: user.id,
        workspace_id: workspaceId,
        platform: 'whatsapp',
        platform_user_id: phoneNumberId,
        platform_user_name: name,
      })
      .select()
      .single();

    if (accountError || !account) {
      throw new Error(`Failed to create WhatsApp platform account: ${accountError?.message}`);
    }

    const { error: tokenError } = await (supabase.from('meta_tokens') as any)
      .upsert({
        account_id: account.id,
        encrypted_access_token: encryptedLongLived,
        encrypted_refresh_token: null,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    revalidatePath('/settings/connections');
    return { data: account, error: null };
  } catch (error: any) {
    console.error('❌ [CONNECT_WHATSAPP_ACTION] Error:', error);
    return { error: error.message || 'Failed to connect WhatsApp account' };
  }
}
