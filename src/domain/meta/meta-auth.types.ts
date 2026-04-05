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

export interface WABAEntry {
  id: string;
  name: string;
  verified_name?: string;
  status?: string;
}

export interface WABAPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}
