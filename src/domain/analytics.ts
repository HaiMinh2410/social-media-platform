export interface MetaInsightsData {
  reach: number;
  impressions: number;
  engagement: number;
  followers: number;
}

export interface AnalyticsSyncResponse {
  data: MetaInsightsData | null;
  error: string | null;
}

export interface AnalyticsSnapshotDTO {
  id: string;
  accountId: string;
  date: Date;
  reach: number;
  impressions: number;
  engagement: number;
  followers: number;
  createdAt: Date;
}
