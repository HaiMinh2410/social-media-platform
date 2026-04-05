import { type WABAEntry, type WABAPhoneNumber } from '@/domain/meta/meta-auth.types';

export class MetaWhatsAppService {
  private static readonly GRAPH_API_VERSION = 'v19.0';
  private static readonly GRAPH_API_URL = 'https://graph.facebook.com';

  /**
   * Fetches the user's WhatsApp Business Accounts.
   */
  async getWABAs(accessToken: string): Promise<WABAEntry[]> {
    const url = new URL(`${MetaWhatsAppService.GRAPH_API_URL}/${MetaWhatsAppService.GRAPH_API_VERSION}/me/whatsapp_business_accounts`);
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [META_WHATSAPP_SERVICE] Fetch WABAs failed:', data);
      throw new Error(`WhatsApp Business Accounts fetch failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data.data as WABAEntry[];
  }

  /**
   * Fetches phone numbers for a specific WABA.
   */
  async getPhoneNumbers(wabaId: string, accessToken: string): Promise<WABAPhoneNumber[]> {
    const url = new URL(`${MetaWhatsAppService.GRAPH_API_URL}/${MetaWhatsAppService.GRAPH_API_VERSION}/${wabaId}/phone_numbers`);
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [META_WHATSAPP_SERVICE] Fetch Phone Numbers failed:', data);
      throw new Error(`WhatsApp Phone Numbers fetch failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data.data as WABAPhoneNumber[];
  }
}

export const metaWhatsAppService = new MetaWhatsAppService();
