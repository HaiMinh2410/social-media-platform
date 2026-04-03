import { TrendingUp, Users, BarChart3, ThumbsUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Commented out to fix missing module

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  description: string;
}

function StatCard({ title, value, change, icon: Icon, description }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-400 mt-1 flex items-center">
          {isPositive ? (
            <span className="text-emerald-500 mr-1 flex items-center">
              <ArrowUpRight className="h-3 w-3" />
              {change.toFixed(1)}%
            </span>
          ) : (
            <span className="text-rose-500 mr-1 flex items-center">
              <ArrowDownRight className="h-3 w-3" />
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats }: { stats: any }) {
  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Reach"
        value={stats.reach.value.toLocaleString()}
        change={stats.reach.change}
        icon={BarChart3}
        description="vs previous day"
      />
      <StatCard
        title="Impressions"
        value={stats.impressions.value.toLocaleString()}
        change={stats.impressions.change}
        icon={TrendingUp}
        description="vs previous day"
      />
      <StatCard
        title="Engagement"
        value={stats.engagement.value.toLocaleString()}
        change={stats.engagement.change}
        icon={ThumbsUp}
        description="vs previous day"
      />
      <StatCard
        title="Total Followers"
        value={stats.followers.value.toLocaleString()}
        change={stats.followers.change}
        icon={Users}
        description="vs previous day"
      />
    </div>
  );
}

/**
 * Fallback Card component if @/components/ui/card doesn't exist
 * As we follow Vanilla CSS / Tailwind, we'll implement it inline if needed,
 * but let's check if the user has shadcn/ui.
 */
function Card({ children, className = '' }: { children: any; className?: string }) {
    return <div className={`rounded-xl border shadow ${className}`}>{children}</div>;
}

function CardHeader({ children, className = '' }: { children: any; className?: string }) {
    return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = '' }: { children: any; className?: string }) {
    return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

function CardContent({ children, className = '' }: { children: any; className?: string }) {
    return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}
