import { type NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/application/analytics/analytics-sync.service";

/**
 * Vercel Cron handler to sync analytics for Meta accounts.
 * This endpoint should be protected by Vercel Cron secret in production.
 */
export async function GET(request: NextRequest) {
  // Simple check for Cron header
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("🕒 [CRON] Starting analytics sync process...");

  try {
    const results = await analyticsService.syncAllMetaAccounts();
    
    console.log(`🕒 [CRON] Analytics sync complete: ${results.successful}/${results.total} succeeded.`);
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error("❌ [CRON] Analytics sync failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
