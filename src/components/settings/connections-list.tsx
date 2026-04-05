'use client';

import { PlatformAccountWithStatus } from "@/infrastructure/database/repositories/platform-account.repository";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Trash2, Plus, Facebook, Instagram, MessageCircle, Music2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ConnectPlatformModal } from "./connect-modal";
import { disconnectPlatformAccountAction } from "@/application/auth/platform-connection.action";
import { useRouter } from "next/navigation";

interface ConnectionsListProps {
  accounts: PlatformAccountWithStatus[];
}

export function ConnectionsList({ accounts }: ConnectionsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const router = useRouter();

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account? All history will be hidden but preserved.')) return;
    
    setLoadingAccountId(accountId);
    const result = await disconnectPlatformAccountAction(accountId);
    
    if (result.error) {
      alert(result.error);
    }
    
    setLoadingAccountId(null);
    router.refresh();
  };
  const platforms = [
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'instagram', name: 'Instagram Business', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'text-slate-900', bgColor: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-6">
      {platforms.map((platform) => {
        const platformAccounts = accounts.filter(a => a.platform === platform.id);
        
        return (
          <div key={platform.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${platform.bgColor} ${platform.color}`}>
                  <platform.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{platform.name}</h3>
                  <p className="text-sm text-slate-500">
                    {platformAccounts.length === 0 
                      ? 'No accounts connected' 
                      : `${platformAccounts.length} account${platformAccounts.length > 1 ? 's' : ''} active`}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} className="mr-2" />
                Connect
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {platformAccounts.length > 0 ? (
                platformAccounts.map((account) => (
                  <div key={account.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm overflow-hidden uppercase">
                         {account.platform_user_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{account.platform_user_name}</span>
                          {account.is_connected ? (
                            <span className="flex items-center text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="flex items-center text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ID: {account.platform_user_id} • 
                          {account.is_connected ? (
                            ` Expires ${formatDistanceToNow(new Date(account.platform === 'tiktok' ? account.tiktok_tokens!.expires_at : account.meta_tokens!.expires_at), { addSuffix: true })}`
                          ) : (
                            ' Connection lost'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!account.is_connected && (
                        <Button size="sm" variant="outline" className="rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50">
                          <RefreshCw size={14} className="mr-1.5" />
                          Reconnect
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={!!loadingAccountId}
                      >
                        {loadingAccountId === account.id ? (
                          <RefreshCw size={14} className="animate-spin text-red-500" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50/50">
                  <p className="text-sm text-slate-400">Not connected to any {platform.name} yet.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <ConnectPlatformModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
