'use client';

import { PlatformAccountDetail } from "@/infrastructure/database/repositories/platform-account.repository";
import { formatDistanceToNow } from "date-fns";
import { Zap, RefreshCw, MessageCircle, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AccountSyncLogs({ account }: { account: PlatformAccountDetail }) {
  const { recent_activity: activities } = account;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-900">No recent activity</h3>
        <p className="text-sm text-slate-500 mt-2">Activity logs will appear here once the account starts processing data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm pt-4">
        <div className="px-6 pb-2 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Recent Activity Feed</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Last 15 Events</span>
        </div>
        <div className="divide-y divide-slate-50">
          {activities.map((activity) => (
            <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-2xl ${
                  activity.type === 'ai_reply' ? 'bg-amber-50 text-amber-500' :
                  activity.type === 'token_refresh' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                }`}>
                  {activity.type === 'ai_reply' ? <Zap size={20} /> :
                   activity.type === 'token_refresh' ? <RefreshCw size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{activity.description}</span>
                    <Badge className={`rounded-full px-2 py-0 h-5 text-[8px] font-black uppercase tracking-tight border-none ${
                        activity.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                        activity.status === 'failure' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {activity.status === 'success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                       activity.status === 'failure' ? <AlertCircle className="w-3 h-3 mr-1" /> : null}
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 uppercase font-medium">
                    <span className="text-slate-300">•</span>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    <span className="text-slate-300">•</span>
                    {activity.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 text-center">
        <p className="text-xs text-slate-400">
           Historical data older than 7 days is archived automatically.
        </p>
      </div>
    </div>
  );
}
