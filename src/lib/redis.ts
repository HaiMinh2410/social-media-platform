import { Redis } from "@upstash/redis";
import { env } from "@/infrastructure/config/env-registry";

/**
 * HTTP-based client for serverless environments (Next.js components)
 * This client is Edge Runtime compatible.
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
