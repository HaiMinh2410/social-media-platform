/**
 * TikTok Messaging Service
 * Handles sending messages via the TikTok Business API.
 */

import type { TikTokSendMessagePayload, TikTokSendMessageResponse } from '@/domain/tiktok/messaging.types';

const TIKTOK_API_VERSION = 'v1.3';
const TIKTOK_API_URL = 'https://business_api.tiktok.com/open_api';

/**
 * Sends a text message (DM) via TikTok Business API.
 * @param payload The message payload including receiver and access token.
 */
export async function sendTikTokMessage(
  payload: TikTokSendMessagePayload
): Promise<{ data: { messageId: string } | null; error: string | null }> {
  const { brandId, receiverId, text, accessToken } = payload;
  
  const url = `${TIKTOK_API_URL}/${TIKTOK_API_VERSION}/messaging/send/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken, // TikTok uses 'Access-Token' header instead of 'Authorization'
      },
      body: JSON.stringify({
        brand_id: brandId,
        receiver_id: receiverId,
        message: {
          text: text,
        },
      }),
    });

    const data = await response.json() as TikTokSendMessageResponse;

    if (!response.ok || data.code !== 0) {
      const errorMessage = data.message || `TikTok API returned status ${response.status} (code: ${data.code})`;
      console.error('❌ [TIKTOK_MESSAGING] Send failed:', errorMessage);
      return { data: null, error: errorMessage };
    }

    const messageId = data.data?.message_id;
    if (!messageId) {
      return { data: null, error: 'TikTok API succeeded but returned no message_id' };
    }

    console.log('✅ [TIKTOK_MESSAGING] Message sent to:', receiverId);
    return {
      data: { messageId },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error sending TikTok message';
    console.error('❌ [TIKTOK_MESSAGING] Exception:', message);
    return { data: null, error: message };
  }
}
