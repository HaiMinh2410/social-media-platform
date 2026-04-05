'use client';

import { PlatformAccountDetail } from "@/infrastructure/database/repositories/platform-account.repository";
import { Facebook, Instagram, MessageCircle, Music2, Calendar, Shield, Zap, Globe, Clock, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLATFORM_CONFIG = {
  facebook: { name: 'Facebook Page', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  instagram: { name: 'Instagram Business', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  whatsapp: { name: 'WhatsApp Business', icon: MessageCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  tiktok: { name: 'TikTok', icon: Music2, color: 'text-slate-900', bgColor: 'bg-slate-100' },
};

export function AccountOverview({ account }: { account: PlatformAccountDetail }) {
  const platform = PLATFORM_CONFIG[account.platform as keyof typeof PLATFORM_CONFIG];
  const Icon = platform?.icon || Globe;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info Card */}
        <Card className="md:col-span-2 rounded-3xl border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Account Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl border-4 border-white shadow-md overflow-hidden uppercase">
                {account.platform_user_name.charAt(0)}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{account.platform_user_name}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <span className={platform?.color}>{platform?.name}</span> • ID: {account.platform_user_id}
                    </p>
                  </div>
                  <Badge variant={account.is_connected ? "success" : "destructive"} className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                    {account.is_connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Connected Since
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{format(new Date(account.created_at), 'PPP')}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Status expires
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {account.platform === 'tiktok' 
                        ? (account.tiktok_tokens ? format(new Date(account.tiktok_tokens.expires_at), 'PPP') : 'N/A')
                        : (account.meta_tokens ? format(new Date(account.meta_tokens.expires_at), 'PPP') : 'N/A')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Status Card */}
        <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              AI Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
             {account.bot_configurations?.is_active ? (
               <>
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Bot is Active</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Responding with {Math.round(account.bot_configurations.confidence_threshold * 100)}%+ confidence
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-none">AUTO-REPLY ON</Badge>
               </>
             ) : (
               <>
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-400">Bot is Offline</h4>
                  <p className="text-xs text-slate-400 mt-1">Manual mode enabled</p>
                </div>
                <Badge variant="outline" className="text-slate-400 border-slate-200">INACTIVE</Badge>
               </>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary */}
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1 mt-8 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Performance Metrics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Followers', value: account.analytics_snapshots?.[0]?.followers || 0, trend: '+0%' },
          { label: 'Total Reach', value: account.analytics_snapshots?.[0]?.reach || 0, trend: '+0%' },
          { label: 'Impressions', value: account.analytics_snapshots?.[0]?.impressions || 0, trend: '+0%' },
          { label: 'Engagement', value: account.analytics_snapshots?.[0]?.engagement || 0, trend: '+0%' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-slate-200 shadow-none hover:border-slate-300 transition-colors">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h4 className="text-2xl font-black text-slate-900">{stat.value.toLocaleString()}</h4>
                <span className="text-[10px] font-bold text-emerald-500 mb-1">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
