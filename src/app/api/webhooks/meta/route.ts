import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/infrastructure/config/env-registry';
import { validateMetaSignature } from '@/infrastructure/security/hmac-validator';
import { metaWebhookHandler } from '@/infrastructure/external/meta/webhook-handler.service';

/**
 * Schemas
 */

const MetaVerificationSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.literal(env.META_WEBHOOK_VERIFY_TOKEN, {
    errorMap: () => ({ message: 'Invalid verification token' }),
  }),
  'hub.challenge': z.string().min(1),
});

const MetaWebhookPayloadSchema = z.object({
  object: z.enum(['page', 'instagram', 'whatsapp_business_account']),
  entry: z.array(z.any()),
});

/**
 * Meta Webhook Endpoint
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = MetaVerificationSchema.safeParse(params);

  if (!parsed.success) {
    console.warn('⚠️ [META_WEBHOOK] Verification failed:', parsed.error.flatten().fieldErrors);
    return new Response('Forbidden', { status: 403 });
  }

  console.log('✅ [META_WEBHOOK] Endpoint verified.');
  return new Response(parsed.data['hub.challenge'], { status: 200 });
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

    // 2. Validate Payload Structure
    const parsedPayload = MetaWebhookPayloadSchema.safeParse(payload);
    if (!parsedPayload.success) {
        console.error('❌ [META_WEBHOOK] Invalid payload structure:', parsedPayload.error.format());
        return new Response('Bad Request', { status: 400 });
    }

    // 3. Handle payload asynchronously
    await metaWebhookHandler.handlePayload(parsedPayload.data);

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('❌ [META_WEBHOOK] Processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

