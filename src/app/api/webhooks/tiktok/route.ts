import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateTikTokSignature } from '@/infrastructure/security/hmac-validator';
import { tiktokWebhookHandler } from '@/infrastructure/external/tiktok/webhook-handler.service';

/**
 * Schemas
 */

const TikTokVerificationSchema = z.object({
  challenge: z.string().min(1),
});

const TikTokWebhookPayloadSchema = z.object({
  event: z.string(),
  timestamp: z.number(),
  data: z.record(z.any()),
});

/**
 * TikTok Webhook Endpoint
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = TikTokVerificationSchema.safeParse(params);

  if (!parsed.success) {
    console.warn('⚠️ [TIKTOK_WEBHOOK] Handshake failed:', parsed.error.flatten().fieldErrors);
    return new Response('No challenge provided', { status: 400 });
  }

  console.log('✅ [TIKTOK_WEBHOOK] Handshake verified.');
  return new Response(parsed.data.challenge, { status: 200 });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-tiktok-signature');

  if (!signature) {
    return new Response('Missing Signature', { status: 401 });
  }

  const rawBody = await request.text();

  // 1. Validate Signature
  if (!validateTikTokSignature(rawBody, signature)) {
    console.warn('⚠️ [TIKTOK_WEBHOOK] Invalid HMAC signature.');
    return new Response('Invalid Signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);

    // 2. Validate Payload
    const parsedPayload = TikTokWebhookPayloadSchema.safeParse(payload);
    if (!parsedPayload.success) {
        console.error('❌ [TIKTOK_WEBHOOK] Invalid payload structure:', parsedPayload.error.format());
        return new Response('Bad Request', { status: 400 });
    }

    // 3. Delegate processing
    await tiktokWebhookHandler.handlePayload(parsedPayload.data as any);

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('❌ [TIKTOK_WEBHOOK] Failed to process payload:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
