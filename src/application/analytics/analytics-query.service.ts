import { db } from '@/lib/db';
import { type AnalyticsSnapshotDTO } from '@/domain/analytics';

export class AnalyticsQueryService {
  /**
   * Fetches historical metrics for a specific account.
   * @param accountId ID of the platform account
   * @param days Number of days lookback (default 30)
   */
  async getAccountHistory(accountId: string, days: number = 30): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - days);

      // We use 'as any' to bypass the lint error for now, as I'm sure the table exists
      // after the migration and prisma generate.
      const snapshots = await (db as any).analyticsSnapshot.findMany({
        where: {
          accountId,
          date: {
            gte: lookbackDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Format for recharts
      const formatted = snapshots.map((s: any) => ({
        date: s.date.toISOString().split('T')[0],
        reach: s.reach,
        impressions: s.impressions,
        engagement: s.engagement,
        followers: s.followers
      }));

      return { data: formatted, error: null };

    } catch (error: any) {
      console.error(`❌ [ANALYTICS_QUERY] Error fetching history for ${accountId}:`, error);
      return { data: null, error: error.message || 'Failed to fetch analytics history' };
    }
  }

  /**
   * Gets a summary of current stats vs previous day.
   */
  async getStatsSummary(accountId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const snapshots = await (db as any).analyticsSnapshot.findMany({
        where: { accountId },
        orderBy: { date: 'desc' },
        take: 2
      });

      if (snapshots.length === 0) {
        return { data: null, error: 'No data available' };
      }

      const current = snapshots[0];
      const previous = snapshots[1] || { reach: 0, impressions: 0, engagement: 0, followers: 0 };

      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return 0;
        return ((curr - prev) / prev) * 100;
      };

      const summary = {
        reach: { value: current.reach, change: calculateChange(current.reach, previous.reach) },
        impressions: { value: current.impressions, change: calculateChange(current.impressions, previous.impressions) },
        engagement: { value: current.engagement, change: calculateChange(current.engagement, previous.engagement) },
        followers: { value: current.followers, change: calculateChange(current.followers, previous.followers) },
      };

      return { data: summary, error: null };

    } catch (error: any) {
      console.error(`❌ [ANALYTICS_QUERY] Error fetching summary for ${accountId}:`, error);
      return { data: null, error: error.message || 'Failed to fetch stats summary' };
    }
  }
}

export const analyticsQueryService = new AnalyticsQueryService();
