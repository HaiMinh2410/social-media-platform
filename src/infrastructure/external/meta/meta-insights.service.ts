import { env } from '@/infrastructure/config/env-registry';
import { type AnalyticsSyncResponse, type MetaInsightsData } from '@/domain/analytics';

export class MetaInsightsService {
  private static readonly GRAPH_API_VERSION = 'v19.0';
  private static readonly GRAPH_API_URL = 'https://graph.facebook.com';

  /**
   * Fetches daily metrics from Meta Insights API.
   * metrics requested: 
   * - reach: page_impressions_unique
   * - impressions: page_impressions
   * - engagement: page_post_engagements
   * - followers: page_fans
   */
  async fetchDailyMetrics(pageId: string, accessToken: string): Promise<AnalyticsSyncResponse> {
    const url = new URL(`${MetaInsightsService.GRAPH_API_URL}/${MetaInsightsService.GRAPH_API_VERSION}/${pageId}/insights`);
    url.searchParams.append('metric', 'page_impressions_unique,page_impressions,page_post_engagements,page_fans');
    url.searchParams.append('period', 'day');
    url.searchParams.append('access_token', accessToken);

    try {
      const response = await fetch(url.toString());
      const resData = await response.json();

      if (!response.ok) {
        console.error('❌ [META_INSIGHTS_SERVICE] Fetch failed:', resData);
        return { 
          data: null, 
          error: resData.error?.message || 'Meta Insights fetch failed' 
        };
      }

      // Extract metrics from the array response
      const metrics: MetaInsightsData = {
        reach: 0,
        impressions: 0,
        engagement: 0,
        followers: 0,
      };

      resData.data.forEach((item: any) => {
        const lastValue = item.values[item.values.length - 1]?.value || 0;
        switch (item.name) {
          case 'page_impressions_unique':
            metrics.reach = lastValue;
            break;
          case 'page_impressions':
            metrics.impressions = lastValue;
            break;
          case 'page_post_engagements':
            metrics.engagement = lastValue;
            break;
          case 'page_fans':
            metrics.followers = lastValue;
            break;
        }
      });

      return { data: metrics, error: null };

    } catch (error: any) {
      console.error('❌ [META_INSIGHTS_SERVICE] Error:', error);
      return { data: null, error: error.message || 'Internal connection error to Meta Graph API' };
    }
  }
}

export const metaInsightsService = new MetaInsightsService();
