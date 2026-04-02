export interface MetaTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  userId: string;
}

export interface MetaExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MetaUserProfile {
  id: string;
  name: string;
  email?: string;
}
