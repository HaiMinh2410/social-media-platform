import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushJob } from "@/infrastructure/queue/bullmq-producer";
import { QueueName, JobType } from "@/domain/types/queue";

/**
 * Vercel Cron handler to schedule token refreshes.
 * This endpoint should be protected by Vercel Cron secret in production.
 */
export async function GET(request: NextRequest) {
  // Simple check for Cron header (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("🕒 [CRON] Starting token refresh scheduler...");

  try {
    // Find tokens expiring in the next 7 days
    const upcomingExpiry = new Date();
    upcomingExpiry.setDate(upcomingExpiry.getDate() + 7);

    const tokensToRefresh = await db.metaToken.findMany({
      where: {
        expiresAt: {
          lte: upcomingExpiry,
        },
      },
      select: {
        accountId: true,
      },
    });

    console.log(`🕒 [CRON] Found ${tokensToRefresh.length} Meta tokens requiring refresh.`);

    for (const token of tokensToRefresh) {
      await pushJob(QueueName.AI_PROCESSING, JobType.REFRESH_META_TOKEN, {
        accountId: token.accountId,
      });
    }

    // --- TIKTOK REFRESH ---
    // TikTok access tokens expire every 24h. We refresh those expiring in the next 12h.
    const tiktokExpiry = new Date();
    tiktokExpiry.setHours(tiktokExpiry.getHours() + 12);

    const tiktokToRefresh = await db.tikTokToken.findMany({
      where: {
        expiresAt: {
          lte: tiktokExpiry,
        },
      },
      select: {
        accountId: true,
      },
    });

    console.log(`🕒 [CRON] Found ${tiktokToRefresh.length} TikTok tokens requiring refresh.`);

    for (const token of tiktokToRefresh) {
      await pushJob(QueueName.AI_PROCESSING, JobType.REFRESH_TIKTOK_TOKEN, {
        accountId: token.accountId,
      });
    }

    return NextResponse.json({
      success: true,
      metaScheduled: tokensToRefresh.length,
      tiktokScheduled: tiktokToRefresh.length,
    });
  } catch (error: any) {
    console.error("❌ [CRON] Token refresh scheduler failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
