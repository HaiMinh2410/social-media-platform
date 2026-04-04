import IORedis from "ioredis";
import { env } from "@/infrastructure/config/env-registry";

/**
 * TCP-based connection for BullMQ producers and workers.
 * Uses Upstash Redis URL with SSL support.
 * This file should NOT be imported in Next.js Middleware (Edge Runtime).
 */
export const queueConnection = new IORedis(env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // Critical for BullMQ
});
