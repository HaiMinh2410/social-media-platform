import { db } from '@/lib/db';
import { metaInsightsService } from '@/infrastructure/external/meta/meta-insights.service';
import { decryptToken } from '@/infrastructure/security/token-encryption';

export class AnalyticsService {
  /**
   * Performs daily sync for a specific account.
   * Gets the latest insights and upserts a snapshot.
   */
  async syncAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Fetch the account and its encrypted token
      const platformAccount = await db.platformAccount.findUnique({
        where: { id: accountId },
        include: {
          metaTokens: {
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!platformAccount) {
        return { success: false, error: 'Platform account not found' };
      }

      if (!platformAccount.metaTokens || platformAccount.metaTokens.length === 0) {
        return { success: false, error: 'No Meta tokens found for this account' };
      }

      const latestToken = platformAccount.metaTokens[0];
      const accessToken = decryptToken(latestToken.encryptedAccessToken);
      const pageId = platformAccount.platformUserId; // Assuming this is the ID needed for the insights graph path

      // 2. Fetch metrics from Meta Insights API
      const result = await metaInsightsService.fetchDailyMetrics(pageId, accessToken);

      if (result.error || !result.data) {
        return { success: false, error: result.error || 'Failed to fetch insights data' };
      }

      // 3. Upsert the data into AnalyticsSnapshots table
      // We use the start of 'today' as the snapshot date (UTC)
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const snapshot = await db.analyticsSnapshots.upsert({
        where: {
          accountId_date: {
            accountId,
            date: today
          }
        },
        update: {
          reach: result.data.reach,
          impressions: result.data.impressions,
          engagement: result.data.engagement,
          followers: result.data.followers,
        },
        create: {
          accountId,
          date: today,
          reach: result.data.reach,
          impressions: result.data.impressions,
          engagement: result.data.engagement,
          followers: result.data.followers,
        }
      });

      console.log(`✅ [ANALYTICS_SERVICE] Synced account: ${accountId} for date: ${today.toISOString()}`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ [ANALYTICS_SERVICE] Sync error for ${accountId}:`, error);
      return { success: false, error: error.message || 'Internal failure during sync' };
    }
  }

  /**
   * Syncs metadata for all active Meta accounts.
   */
  async syncAllMetaAccounts(): Promise<{ total: number; successful: number; failed: number }> {
    const activeMetaAccounts = await db.platformAccount.findMany({
      where: { platform: 'facebook' } // or 'instagram'
    });

    const results = { total: activeMetaAccounts.length, successful: 0, failed: 0 };

    for (const account of activeMetaAccounts) {
      const { success } = await this.syncAccount(account.id);
      if (success) results.successful++;
      else results.failed++;
    }

    return results;
  }
}

export const analyticsService = new AnalyticsService();
