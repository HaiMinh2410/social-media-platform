import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { env } from "@/infrastructure/config/env-registry";

export async function GET() {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    checks: {
      database: "unknown",
      redis: "unknown",
    }
  };

  try {
    // Basic ping check for Postgres
    await db.$queryRaw`SELECT 1`;
    status.checks.database = "healthy";
  } catch (error) {
    status.checks.database = "unhealthy";
    console.error("❌ [HEALTH_CHECK] DB Ping failed:", error);
  }

  try {
    // Basic ping check for Upstash Redis
    await redis.ping();
    status.checks.redis = "healthy";
  } catch (error) {
    status.checks.redis = "unhealthy";
    console.error("❌ [HEALTH_CHECK] Redis Ping failed:", error);
  }

  const isHealthy = status.checks.database === "healthy" && status.checks.redis === "healthy";

  return NextResponse.json(status, { status: isHealthy ? 200 : 503 });
}
