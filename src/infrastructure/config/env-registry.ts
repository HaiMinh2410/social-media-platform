import { envSchema, type EnvConfig } from "@/domain/types/env";

let envCache: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (envCache) return envCache;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN,
    META_TOKEN_ENCRYPTION_KEY: process.env.META_TOKEN_ENCRYPTION_KEY,
  });

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`❌ [ENV_REGISTRY] Found invalid environment variables:\n${issues}`);
    throw new Error("Invalid environment variables");
  }

  envCache = result.data;
  return result.data;
}

export const env = validateEnv();
