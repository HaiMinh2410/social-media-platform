/**
 * Meta Messaging Service
 * Handles sending messages via the Meta Graph API (Pages/Instagram Send API).
 */

type MetaSendMessagePayload = {
  recipientId: string;
  messageText: string;
  accessToken: string;
};

type MetaSendMessageResponse = {
  recipientId: string;
  messageId: string;
};

type MetaApiErrorResponse = {
  error?: {
    message: string;
    type: string;
    code: number;
  };
};

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = 'https://graph.facebook.com';

/**
 * Sends a text message to a Meta user via the Send API.
 */
export async function sendMetaMessage(
  payload: MetaSendMessagePayload
): Promise<{ data: MetaSendMessageResponse | null; error: string | null }> {
  const { recipientId, messageText, accessToken } = payload;

  const url = `${GRAPH_API_URL}/${GRAPH_API_VERSION}/me/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text: messageText },
      }),
    });

    const data = await response.json() as MetaSendMessageResponse & MetaApiErrorResponse;

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `Meta API returned status ${response.status}`;
      console.error('❌ [META_MESSAGING] Send failed:', errorMessage);
      return { data: null, error: errorMessage };
    }

    console.log('✅ [META_MESSAGING] Message sent to:', recipientId);
    return {
      data: {
        recipientId: data.recipientId,
        messageId: data.messageId,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error sending Meta message';
    console.error('❌ [META_MESSAGING] Exception:', message);
    return { data: null, error: message };
  }
}
