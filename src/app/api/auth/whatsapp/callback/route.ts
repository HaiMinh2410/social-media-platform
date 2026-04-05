import { NextResponse } from 'next/server';
import { metaAuthService } from '@/infrastructure/external/meta/meta-auth.service';
import { encryptToken } from '@/infrastructure/security/token-encryption';
import { createClient } from '@/lib/supabase/server';
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

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/whatsapp/callback`;
    
    // 1. Exchange code for token
    const tokenData = await metaAuthService.exchangeCodeForToken(code, redirectUri);
    
    // 2. Encrypt token for passing to selection page
    // Note: This is a short-lived token from the exchange.
    const encryptedToken = encryptToken(tokenData.access_token);
    
    // 3. Redirect to selection page
    const selectUrl = new URL('/settings/connections/whatsapp/select', request.url);
    selectUrl.searchParams.append('token', encryptedToken);
    
    return NextResponse.redirect(selectUrl);
  } catch (error: any) {
    console.error('❌ [WHATSAPP_CALLBACK_ROUTE] OAuth Error:', error);
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
