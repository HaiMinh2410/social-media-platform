'use client';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface MetricsChartProps {
    data: any[];
    type: 'line' | 'bar';
    metrics: string[];
    title: string;
}

export function MetricsChart({ data, type, metrics, title }: MetricsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[350px] w-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
                Data is being gathered. Check back tomorrow.
            </div>
        );
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-6">{title}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend />
                            {metrics.map((m, i) => (
                                <Line 
                                    key={m} 
                                    type="monotone" 
                                    dataKey={m} 
                                    stroke={colors[i % colors.length]} 
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend />
                            {metrics.map((m, i) => (
                                <Bar 
                                    key={m} 
                                    dataKey={m} 
                                    fill={colors[i % colors.length]} 
                                    radius={[4, 4, 0, 0]} 
                                />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
