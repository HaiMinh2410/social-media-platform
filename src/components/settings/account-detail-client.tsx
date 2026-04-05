'use client';

import React, { useState } from "react";
import { PlatformAccountDetail } from "@/infrastructure/database/repositories/platform-account.repository";
import { AccountOverview } from "./account-overview";
import { AccountSyncLogs } from "./account-sync-logs";
import { LayoutGrid, Activity, Settings, ArrowLeft, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { disconnectPlatformAccountAction } from "@/application/auth/platform-connection.action";
import { useRouter } from "next/navigation";

// Simplified local Tabs Component since Radix UI is not available
function Tabs({ children, defaultValue, className }: { children: React.ReactNode, defaultValue: string, className?: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, (child: any) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        if (child.type === TabsContent) {
          return child.props.value === activeTab ? child : null;
        }
        return child;
      })}
    </div>
  );
}

function TabsList({ children, className, activeTab, setActiveTab }: any) {
  return (
    <div className={className}>
      {React.Children.map(children, (child: any) => 
        React.cloneElement(child, {
          isActive: child.props.value === activeTab,
          onClick: () => setActiveTab(child.props.value)
        })
      )}
    </div>
  );
}

function TabsTrigger({ children, value, className, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`${className} ${isActive ? 'data-[state=active]' : ''}`}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

function TabsContent({ children, value, className }: any) {
  return <div className={className}>{children}</div>;
}

export function AccountDetailClient({ account }: { account: PlatformAccountDetail }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this account? All history will be hidden but preserved.')) return;
    
    setLoading(true);
    const result = await disconnectPlatformAccountAction(account.id);
    
    if (result.error) {
      alert(result.error);
    } else {
        router.push('/settings/connections');
        router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings/connections" className="p-3 bg-white hover:bg-slate-50 transition-colors border border-slate-200 rounded-2xl shadow-sm text-slate-500 hover:text-slate-900 group">
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 leading-none">{account.platform_user_name}</h1>
            </div>
            <p className="text-slate-400 mt-2 font-medium">Account Details & Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            {!account.is_connected && (
              <Button variant="outline" className="rounded-2xl h-14 px-6 border-blue-100 text-blue-600 hover:bg-blue-50 font-bold shadow-sm">
                <RefreshCw size={20} className="mr-2" />
                Reconnect Account
              </Button>
            )}
            <Button 
                variant="destructive" 
                className="rounded-2xl h-14 px-6 font-bold shadow-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100"
                onClick={handleDisconnect}
                disabled={loading}
            >
              {loading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={20} className="mr-2" />
                  Disconnect
                </>
              )}
            </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-100 mb-8 h-12 w-full max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 h-10 px-6 font-black uppercase text-[10px] tracking-widest">
            <LayoutGrid size={14} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 h-10 px-6 font-black uppercase text-[10px] tracking-widest">
            <RefreshCw size={14} />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 h-10 px-6 font-black uppercase text-[10px] tracking-widest">
            <Settings size={14} />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 ring-0 focus-visible:ring-0">
          <AccountOverview account={account} />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-0 ring-0 focus-visible:ring-0">
          <AccountSyncLogs account={account} />
        </TabsContent>

        <TabsContent value="config" className="mt-0 ring-0 focus-visible:ring-0">
          <Card className="rounded-3xl border-slate-200 shadow-none overflow-hidden">
             <CardHeader className="p-8 border-b border-slate-50">
               <CardTitle className="text-xl font-black text-slate-800">Account Settings</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[12px] tracking-tight">Data Synchronization</h4>
                    <p className="text-sm text-slate-500 mt-1">Automatically fetch followers, reach and engagement every 24 hours.</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[12px] tracking-tight">AI Reply Mode</h4>
                    <p className="text-sm text-slate-500 mt-1">Control how AI responds to new messages for this particular account.</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200">Configure AI</Button>
                </div>
                <div className="pt-4">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                     <AlertCircle size={14} className="text-red-400" />
                     Danger Zone
                   </p>
                   <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
                     <div>
                       <p className="font-bold text-red-900 text-sm italic">Disconnect this account from your workspace</p>
                       <p className="text-xs text-red-600 mt-1 tracking-tight">Permanently removes tokens and hides historical data.</p>
                     </div>
                     <Button variant="destructive" className="rounded-xl px-6 font-bold" onClick={handleDisconnect} disabled={loading}>
                       Disconnect Account
                     </Button>
                   </div>
                </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
