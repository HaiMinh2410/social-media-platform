import { NextResponse } from 'next/server';
import { tiktokAuthService } from '@/infrastructure/external/tiktok/tiktok-auth.service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/tiktok/callback`;
    
    // Generate state – could be random, currently just user ID for simplicity as we trust the flow
    const state = user.id;

    const authUrl = tiktokAuthService.getLoginUrl(redirectUri, state);
    
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('❌ [TIKTOK_CONNECT_ROUTE] Error:', error);
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
