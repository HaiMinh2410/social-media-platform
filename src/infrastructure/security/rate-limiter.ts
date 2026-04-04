import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

// Auth: 10 req/minute per IP
const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:auth",
});

// Webhooks: 1000 req/minute global per endpoint (usually Meta/TikTok)
const webhookLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "rl:webhook",
});

// Inbox: 200 req/minute per user (fallback to IP)
const inboxLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "1 m"),
  analytics: true,
  prefix: "rl:inbox",
});

export type RateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: string;
};

export async function checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const path = request.nextUrl.pathname;

  // Determine which limiter to use
  let limiter: Ratelimit | null = null;
  let key: string | null = null;

  if (path.startsWith("/api/auth")) {
    limiter = authLimiter;
    key = request.ip ?? "anonymous";
  } else if (path.startsWith("/api/webhooks")) {
    limiter = webhookLimiter;
    key = request.ip ?? "webhook";
  } else if (path.startsWith("/api/inbox")) {
    limiter = inboxLimiter;
    // Attempt to use a user identifier if possible (e.g. from cookie or header)
    // For now, if no easy userId, fallback to IP
    key = request.ip ?? "inbox";
  }

  if (!limiter || !key) {
    return { success: true };
  }

  try {
    // 50ms timeout to avoid blocking requests if Upstash is slow
    const result = await Promise.race([
      limiter.limit(key),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 50))
    ]);

    if (!result) {
      console.warn("Rate limiter timed out, allowing request.");
      return { success: true };
    }

    const { success, limit, remaining, reset } = result;
    
    return { 
      success, 
      limit, 
      remaining, 
      reset,
      retryAfter: Math.ceil((reset - Date.now()) / 1000).toString(),
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail safe: allow the request if rate limiting script errors
    return { success: true };
  }
}
