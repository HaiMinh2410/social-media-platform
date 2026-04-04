import { z } from 'zod';

/**
 * Common Validation Schemas
 */

export const IdSchema = z.string().uuid('Invalid ID format');

export const PlatformSchema = z.enum(['meta', 'tiktok']);

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Message Content Validation
 */
export const MessageContentSchema = z.string()
  .min(1, 'Message content cannot be empty')
  .max(2000, 'Message is too long (max 2000 characters)')
  .trim();

/**
 * OAuth Callback Validation
 */
export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});
