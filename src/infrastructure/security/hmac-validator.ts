import crypto from 'node:crypto';
import { env } from '@/infrastructure/config/env-registry';

/**
 * Validates the X-Hub-Signature-256 header from Meta Webhooks.
 * @param body The raw request body as a string.
 * @param signature The signature from the header (format: sha256=...).
 */
export function validateMetaSignature(body: string, signature: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(body)
    .digest('hex');

  const actualSignature = signature.substring(7); // Remove 'sha256='

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Validates the X-TikTok-Signature header from TikTok Webhooks.
 * @param body The raw request body as a string.
 * @param signature The signature from the header.
 */
export function validateTikTokSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.TIKTOK_CLIENT_SECRET)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (e) {
    return false;
  }
}
