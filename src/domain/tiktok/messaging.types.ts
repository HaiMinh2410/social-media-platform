/**
 * TikTok Messaging Domain Types
 */

export type TikTokSendMessagePayload = {
  brandId: string;
  advertiserId: string;
  receiverId: string;
  text: string;
  accessToken: string;
};

export type TikTokSendMessageResponse = {
  data?: {
    message_id: string;
  };
  code: number;
  message: string;
  request_id: string;
};
