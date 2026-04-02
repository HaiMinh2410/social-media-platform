import crypto from 'node:crypto';
import { env } from '@/infrastructure/config/env-registry';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * The key is derived from META_TOKEN_ENCRYPTION_KEY (must be 32 bytes).
 */
export function encryptToken(token: string): string {
  const key = Buffer.from(env.META_TOKEN_ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    throw new Error('META_TOKEN_ENCRYPTION_KEY must be a 32-byte hex string');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv:encrypted:tag (all in hex)
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Decrypts a string encrypted with AES-256-GCM.
 */
export function decryptToken(encryptedData: string): string {
  const key = Buffer.from(env.META_TOKEN_ENCRYPTION_KEY, 'hex');
  const [ivHex, encryptedHex, tagHex] = encryptedData.split(':');

  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
