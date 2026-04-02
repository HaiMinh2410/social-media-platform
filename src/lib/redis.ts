import { Redis } from "@upstash/redis";
import IORedis from "ioredis";
import { env } from "@/infrastructure/config/env-registry";

/**
 * HTTP-based client for serverless environments (Next.js components)
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * TCP-based connection for BullMQ producers and workers.
 * Uses Upstash Redis URL with SSL support.
 */
export const queueConnection = new IORedis(env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // Critical for BullMQ
});
