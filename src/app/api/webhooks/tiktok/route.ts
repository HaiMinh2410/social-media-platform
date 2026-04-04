import { NextResponse } from 'next/server';
import { validateTikTokSignature } from '@/infrastructure/security/hmac-validator';
import { tiktokWebhookHandler } from '@/infrastructure/external/tiktok/webhook-handler.service';

/**
 * TikTok Webhook Endpoint
 * 
 * GET: Verification challenge from TikTok.
 * POST: Real-time messaging events.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    console.log('✅ [TIKTOK_WEBHOOK] Handshake verified.');
    return new Response(challenge, { status: 200 });
  }

  return new Response('No challenge provided', { status: 400 });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-tiktok-signature');

  if (!signature) {
    return new Response('Missing Signature', { status: 401 });
  }

  const rawBody = await request.text();

  // 1. Validate Signature
  // TikTok uses HMAC-SHA256 with the client_secret on the raw body.
  if (!validateTikTokSignature(rawBody, signature)) {
    console.warn('⚠️ [TIKTOK_WEBHOOK] Invalid HMAC signature.');
    return new Response('Invalid Signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);

    // 2. Delegate processing and enqueuing to service
    await tiktokWebhookHandler.handlePayload(payload);

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('❌ [TIKTOK_WEBHOOK] Failed to process payload:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
