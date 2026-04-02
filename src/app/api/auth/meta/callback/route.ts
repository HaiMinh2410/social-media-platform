import { NextResponse } from 'next/server';
import { metaAuthService } from '@/infrastructure/external/meta/meta-auth.service';
import { encryptToken } from '@/infrastructure/security/token-encryption';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/infrastructure/config/env-registry';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=missing_code', request.url));
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
       return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 1. Exchange code for token
    // Note: redirect_uri must match EXACTLY what was sent in the login dialog request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;
    
    const tokenData = await metaAuthService.exchangeCodeForToken(code, redirectUri);
    
    // 2. Get Meta profile
    const metaProfile = await metaAuthService.getUserProfile(tokenData.access_token);

    // 3. Encrypt access token
    const encryptedToken = encryptToken(tokenData.access_token);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // 4. Persistence (Using direct DB access via Prisma for upsert safety or Supabase)
    // Here we use the supabase client created for the server
    
    // Upsert platform account
    const { data: account, error: accountError } = await (supabase.from('platform_accounts') as any)
      .upsert({
        profile_id: user.id,
        platform: 'meta',
        platform_user_id: metaProfile.id,
        platform_user_name: metaProfile.name,
      })
      .select()
      .single();

    if (accountError || !account) {
      throw new Error(`Failed to create platform account: ${accountError?.message}`);
    }

    // Upsert meta token
    const { error: tokenError } = await (supabase.from('meta_tokens') as any)
      .upsert({
        account_id: account.id,
        encrypted_access_token: encryptedToken,
        encrypted_refresh_token: null,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('❌ [META_CALLBACK_ROUTE] OAuth Error:', error);
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
