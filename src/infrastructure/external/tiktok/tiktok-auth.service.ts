import { env } from '@/infrastructure/config/env-registry';
import { type TikTokExchangeResponse, type TikTokUserProfile } from '@/domain/tiktok/tiktok-auth.types';

export class TikTokAuthService {
  private get baseUrl() {
    return env.TIKTOK_SANDBOX === 'true' 
      ? 'https://sandbox-open-api.tiktok.com' 
      : 'https://open.tiktokapis.com';
  }

  /**
   * Generates a TikTok Login URL.
   */
  getLoginUrl(redirectUri: string, state: string): string {
    const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
    url.searchParams.append('client_key', env.TIKTOK_CLIENT_KEY);
    // TikTok uses standard scopes: user.info.basic, video.upload, dm.manage
    url.searchParams.append('scope', 'user.info.basic,video.upload,dm.manage');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('state', state);
    
    return url.toString();
  }

  /**
   * Exchanges a temporary OAuth code for an access token and refresh token.
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TikTokExchangeResponse> {
    const url = `${this.baseUrl}/v2/oauth/token/`;
    const params = new URLSearchParams();
    params.append('client_key', env.TIKTOK_CLIENT_KEY);
    params.append('client_secret', env.TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [TIKTOK_AUTH_SERVICE] Exchange failed:', data);
      throw new Error(`TikTok OAuth exchange failed: ${data.error_description || data.message || 'Unknown error'}`);
    }

    // TikTok successful response structure:
    // { "access_token": "...", "refresh_token": "...", "expires_in": 86400, "open_id": "...", ... }
    return data as TikTokExchangeResponse;
  }

  /**
   * Fetches the user's profile information from TikTok.
   */
  async getUserProfile(accessToken: string): Promise<TikTokUserProfile> {
    const url = `${this.baseUrl}/v2/user/info/`;
    // Field selection for TikTok: open_id,union_id,avatar_url,display_name
    const fields = 'open_id,union_id,avatar_url,display_name';
    
    const response = await fetch(`${url}?fields=${fields}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [TIKTOK_AUTH_SERVICE] Profile fetch failed:', data);
      throw new Error(`TikTok Profile fetch failed: ${data.message || 'Unknown error'}`);
    }

    // TikTok returns user info nested in 'data.user'
    return data.data?.user as TikTokUserProfile;
  }

  /**
   * Refreshes a TikTok access token using the refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokExchangeResponse> {
    const url = `${this.baseUrl}/v2/oauth/token/`;
    const params = new URLSearchParams();
    params.append('client_key', env.TIKTOK_CLIENT_KEY);
    params.append('client_secret', env.TIKTOK_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [TIKTOK_AUTH_SERVICE] Refresh failed:', data);
      throw new Error(`TikTok token refresh failed: ${data.error_description || data.message || 'Unknown error'}`);
    }

    return data as TikTokExchangeResponse;
  }
}

export const tiktokAuthService = new TikTokAuthService();
