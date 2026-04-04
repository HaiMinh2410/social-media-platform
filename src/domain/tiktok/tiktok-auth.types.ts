export interface TikTokExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  open_id: string;
  scope: string;
}

export interface TikTokUserProfile {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
}

export interface TikTokTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}
