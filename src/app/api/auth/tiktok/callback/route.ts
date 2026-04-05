import { NextResponse } from 'next/server';
import { tiktokAuthService } from '@/infrastructure/external/tiktok/tiktok-auth.service';
import { encryptToken } from '@/infrastructure/security/token-encryption';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/infrastructure/config/env-registry';

import { OAuthCallbackSchema } from '@/domain/validation/schemas';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  
  const parsed = OAuthCallbackSchema.safeParse(params);

  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map(e => e.message).join(', ');
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(errorMsg)}`, request.url));
  }

  const { code } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 1. Exchange code for token
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/tiktok/callback`;
    
    console.log('🔄 [TIKTOK_CALLBACK] Exchanging code...', { code, redirectUri });
    const tokenData = await tiktokAuthService.exchangeCodeForToken(code, redirectUri);
    
    // 2. Get TikTok profile
    console.log('🔄 [TIKTOK_CALLBACK] Fetching profile...');
    const tiktokProfile = await tiktokAuthService.getUserProfile(tokenData.access_token);

    // 3. Encrypt tokens using TikTok specific key
    const encryptedAccessToken = encryptToken(tokenData.access_token, env.TIKTOK_TOKEN_ENCRYPTION_KEY);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? encryptToken(tokenData.refresh_token, env.TIKTOK_TOKEN_ENCRYPTION_KEY) 
      : null;
      
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // 4. Persistence using Supabase upsert (following platform account pattern)
    
    // Upsert platform account
    const { data: account, error: accountError } = await (supabase.from('platform_accounts') as any)
      .upsert({
        profile_id: user.id,
        platform: 'tiktok',
        platform_user_id: tiktokProfile.open_id,
        platform_user_name: tiktokProfile.display_name || 'TikTok User',
      })
      .select()
      .single();

    if (accountError || !account) {
      throw new Error(`Failed to create platform account: ${accountError?.message}`);
    }

    // Upsert TikTok token
    const { error: tokenError } = await (supabase.from('tiktok_tokens') as any)
      .upsert({
        account_id: account.id,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
        console.error('❌ [TIKTOK_CALLBACK] Token Persistence Error:', tokenError);
        throw tokenError;
    }

    console.log('✅ [TIKTOK_CALLBACK] TikTok connection successful!');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('❌ [TIKTOK_CALLBACK] OAuth Error:', error);
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
