import { env } from '@/infrastructure/config/env-registry';
import { type MetaExchangeResponse, type MetaUserProfile, type MetaTokenSet } from '@/domain/meta/meta-auth.types';

export class MetaAuthService {
  private static readonly GRAPH_API_VERSION = 'v19.0';
  private static readonly GRAPH_API_URL = 'https://graph.facebook.com';

  /**
   * Exchanges a temporary OAuth code for a short-lived access token.
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaExchangeResponse> {
    const url = new URL(`${MetaAuthService.GRAPH_API_URL}/${MetaAuthService.GRAPH_API_VERSION}/oauth/access_token`);
    url.searchParams.append('client_id', env.META_APP_ID);
    url.searchParams.append('client_secret', env.META_APP_SECRET);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('code', code);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [META_AUTH_SERVICE] Exchange failed:', data);
      throw new Error(`Meta OAuth exchange failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data as MetaExchangeResponse;
  }

  /**
   * Fetches the user's profile information from Meta.
   */
  async getUserProfile(accessToken: string): Promise<MetaUserProfile> {
    const url = new URL(`${MetaAuthService.GRAPH_API_URL}/${MetaAuthService.GRAPH_API_VERSION}/me`);
    url.searchParams.append('access_token', accessToken);
    url.searchParams.append('fields', 'id,name,email');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Meta Profile fetch failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data as MetaUserProfile;
  }

  /**
   * Generates a Meta Login URL.
   */
  static getLoginUrl(redirectUri: string, state: string): string {
    const url = new URL(`https://www.facebook.com/${MetaAuthService.GRAPH_API_VERSION}/dialog/oauth`);
    url.searchParams.append('client_id', env.META_APP_ID);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('state', state);
    url.searchParams.append('scope', 'instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,pages_messaging');
    
    return url.toString();
  }
}

export const metaAuthService = new MetaAuthService();
