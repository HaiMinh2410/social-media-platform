import { analyticsQueryService } from '@/application/analytics/analytics-query.service';
import { db } from '@/lib/db';
import { StatsCards } from '@/components/analytics/stats-cards';
import { MetricsChart } from '@/components/analytics/metrics-chart';
import { AlertCircle } from 'lucide-react';

/**
 * Analytics Page (Server Component)
 */
export default async function AnalyticsPage() {
  // 1. Fetch first available Meta account
  const account = await db.platformAccount.findFirst({
    where: { platform: { in: ['facebook', 'instagram'] } }
  });

  if (!account) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center rounded-xl border border-slate-800 bg-slate-900 p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Accounts Connected</h2>
          <p className="text-slate-400 mb-6">Connect your Facebook or Instagram account to see real-time analytics and performance metrics.</p>
          <a href="/settings" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block">
            Connect Account
          </a>
        </div>
      </div>
    );
  }

  // 2. Fetch summary and historical data
  const [summaryRes, historyRes] = await Promise.all([
    analyticsQueryService.getStatsSummary(account.id),
    analyticsQueryService.getAccountHistory(account.id, 14) // Last 14 days
  ]);

  const summary = summaryRes.data;
  const history = historyRes.data || [];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Analytics Overview</h2>
          <p className="text-slate-400">Detailed performance insights for {account.platformUserName}.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
          <button className="px-3 py-1 bg-slate-700 text-white rounded text-sm font-medium">Last 14 Days</button>
          <button className="px-3 py-1 text-slate-400 hover:text-slate-100 text-sm font-medium">Last 30 Days</button>
        </div>
      </div>

      <StatsCards stats={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MetricsChart 
          title="Reach & Impressions" 
          data={history} 
          metrics={['reach', 'impressions']} 
          type="line" 
        />
        <MetricsChart 
          title="Engagement Trends" 
          data={history} 
          metrics={['engagement']} 
          type="bar" 
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Historical Data Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-800 text-slate-300">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Reach</th>
                <th className="px-6 py-3 font-medium">Impressions</th>
                <th className="px-6 py-3 font-medium">Engagement</th>
                <th className="px-6 py-3 font-medium">Followers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {history.length > 0 ? (
                history.reverse().map((row: any) => (
                  <tr key={row.date} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">{row.date}</td>
                    <td className="px-6 py-4">{row.reach.toLocaleString()}</td>
                    <td className="px-6 py-4">{row.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4">{row.engagement.toLocaleString()}</td>
                    <td className="px-6 py-4">{row.followers.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">Gathering data. Come back in 24 hours.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
