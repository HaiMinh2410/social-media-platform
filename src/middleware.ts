import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/infrastructure/security/rate-limiter";

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting Check (Global, NOT per-route)
  const rateLimitResponse = await checkRateLimit(request);

  if (!rateLimitResponse.success) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "You have exceeded our request frequency limit.",
        retryAfter: rateLimitResponse.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResponse.retryAfter || "60",
          "X-RateLimit-Limit": rateLimitResponse.limit?.toString() || "",
          "X-RateLimit-Remaining": rateLimitResponse.remaining?.toString() || "",
          "X-RateLimit-Reset": rateLimitResponse.reset?.toString() || "",
        },
      }
    );
  }

  // 2. Supabase Session Update (Required for SSR)
  const response = await updateSession(request);

  // 3. Inject Rate Limit Metadata into Headers (Helpful for API clients)
  if (rateLimitResponse.limit !== undefined) {
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResponse.remaining?.toString() || ""
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResponse.reset?.toString() || ""
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
