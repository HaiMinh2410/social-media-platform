import { NextResponse } from 'next/server';
import { env } from '@/infrastructure/config/env-registry';
import { validateMetaSignature } from '@/infrastructure/security/hmac-validator';
import { metaWebhookHandler } from '@/infrastructure/external/meta/webhook-handler.service';

/**
 * Meta Webhook Endpoint
 * 
 * GET: Verification for initial setup.
 * POST: Real-time events from Messenger/Instagram.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ [META_WEBHOOK] Endpoint verified.');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return new Response('Bad Request', { status: 400 });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256');
  
  if (!signature) {
    return new Response('Missing Signature', { status: 401 });
  }

  const rawBody = await request.text();

  // 1. Validate Signature
  if (!validateMetaSignature(rawBody, signature)) {
    console.warn('⚠️ [META_WEBHOOK] Invalid HMAC signature received.');
    return new Response('Invalid Signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);

    // 2. Handle payload asynchronously (though we await for safety/logs for now)
    // In production, we'd push to Upstash Queue immediately.
    await metaWebhookHandler.handlePayload(payload);

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('❌ [META_WEBHOOK] Processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
