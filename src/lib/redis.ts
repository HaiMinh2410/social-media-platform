import { Redis } from "@upstash/redis";
import { env } from "@/infrastructure/config/env-registry";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
