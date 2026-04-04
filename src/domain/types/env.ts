import { z } from "zod";

export const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Upstash Redis (HTTP)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Upstash Redis (TCP for BullMQ)
  UPSTASH_REDIS_URL: z.string().url(),

  // Groq AI
  GROQ_API_KEY: z.string().min(1),

  // Meta Platforms (Phase 2)
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  META_TOKEN_ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex

  // TikTok (Phase 5)
  TIKTOK_CLIENT_KEY: z.string().min(1),
  TIKTOK_CLIENT_SECRET: z.string().min(1),
  TIKTOK_TOKEN_ENCRYPTION_KEY: z.string().length(64),
  TIKTOK_SANDBOX: z.string().optional().default("false"),
});

export type EnvConfig = z.infer<typeof envSchema>;
