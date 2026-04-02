import { createClient } from '@/lib/supabase/server';
import type { MetaWebhookPayload, MetaMessagingEvent } from '@/domain/meta/webhook.types';

export class MetaWebhookHandlerService {
  /**
   * Processes a Meta Webhook payload and persists messages.
   */
  async handlePayload(payload: MetaWebhookPayload) {
    if (payload.object !== 'page' && payload.object !== 'instagram') {
      return;
    }

    const supabase = await createClient();

    for (const entry of payload.entry) {
      if (!entry.messaging) continue;

      for (const event of entry.messaging) {
        if (event.message) {
          await this.handleMessage(event, supabase);
        }
      }
    }
  }

  /**
   * Handles an individual messaging event.
   */
  private async handleMessage(event: MetaMessagingEvent, supabase: any) {
    const { sender, recipient, message, timestamp } = event;
    if (!message) return;

    // 1. Find the platform account (either sender or recipient)
    const { data: account, error: accountError } = await (supabase.from('platform_accounts') as any)
      .select('id, profile_id')
      .eq('platform_user_id', recipient.id) // Recipient is our page/account
      .single();

    if (accountError || !account) {
      console.warn('⚠️ [WEBHOOK_HANDLER] Received message for unknown platform account:', recipient.id);
      return;
    }

    // 2. Find or create conversation
    const platformConversationId = sender.id; // Or a combined ID depending on Meta's logic
    const { data: conversation, error: convError } = await (supabase.from('conversations') as any)
      .upsert({
        account_id: account.id,
        platform_conversation_id: platformConversationId,
        last_message_at: new Date(timestamp).toISOString(),
      }, { onConflict: 'account_id,platform_conversation_id' })
      .select()
      .single();

    if (convError || !conversation) {
      console.error('❌ [WEBHOOK_HANDLER] Failed to upsert conversation:', convError);
      return;
    }

    // 3. Persist the message
    const { error: msgError } = await (supabase.from('messages') as any)
      .upsert({
        conversation_id: conversation.id,
        sender_id: sender.id,
        content: message.text,
        platform_message_id: message.mid,
        created_at: new Date(timestamp).toISOString(),
      }, { onConflict: 'platform_message_id' });

    if (msgError) {
      console.error('❌ [WEBHOOK_HANDLER] Failed to persist message:', msgError);
    } else {
      console.log('✅ [WEBHOOK_HANDLER] Message persisted:', message.mid);
    }
  }
}

export const metaWebhookHandler = new MetaWebhookHandlerService();
