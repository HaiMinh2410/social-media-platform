import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";
import type { HandshakeResult } from "@/domain/types/infra";

/**
 * Service to verify infrastructure connectivity for T002.
 * Tests connection to Supabase and Upstash Redis.
 */
export async function testHandshake(): Promise<HandshakeResult> {
  const result: HandshakeResult = {
    supabase: false,
    redis: false,
    errors: [],
  };

  try {
    // 1. Test Supabase Server Connection
    // Since we don't have schemas yet, we just check if the client can be initialized and 
    // a basic system-level call is possible.
    const supabase = createSupabaseServer();
    const { error: sbError } = await supabase.auth.getSession();
    
    // Auth getSession doesn't require a real session to return success/fail relative to connection.
    if (sbError) {
      result.errors.push(`Supabase: ${sbError.message}`);
    } else {
      result.supabase = true;
    }
  } catch (e: any) {
    result.errors.push(`Supabase Error: ${e.message}`);
  }

  try {
    // 2. Test Upstash Redis Connection
    const redis = getRedisClient();
    const pong = await redis.ping();
    if (pong === "PONG") {
      result.redis = true;
    } else {
      result.errors.push(`Redis: Pong failed - ${pong}`);
    }
  } catch (e: any) {
    result.errors.push(`Redis Error: ${e.message}`);
  }

  return result;
}
