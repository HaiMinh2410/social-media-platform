'use client';

import { X, Facebook, Instagram, MessageCircle, Music2, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getWhatsAppAuthUrlAction, getMetaAuthUrlAction } from "@/application/meta/meta-auth.action";

interface ConnectPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectPlatformModal({ isOpen, onClose }: ConnectPlatformModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (platformId: string) => {
    setLoading(platformId);
    try {
      if (platformId === 'whatsapp') {
        const url = await getWhatsAppAuthUrlAction();
        window.location.href = url;
      } else if (platformId === 'facebook' || platformId === 'instagram') {
        const url = await getMetaAuthUrlAction();
        window.location.href = url;
      } else if (platformId === 'tiktok') {
        window.location.href = '/api/auth/tiktok/connect';
      }
    } catch (err) {
      console.error(`Failed to get connection URL for ${platformId}`, err);
      setLoading(null);
    }
  };

  const platforms = [
    { 
      id: 'facebook', 
      name: 'Facebook Page', 
      icon: Facebook, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      desc: 'Connect your business pages for unified messaging.' 
    },
    { 
      id: 'instagram', 
      name: 'Instagram Business', 
      icon: Instagram, 
      color: 'text-pink-600', 
      bgColor: 'bg-pink-50', 
      desc: 'Sync direct messages and comments for growth.' 
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp Business', 
      icon: MessageCircle, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50', 
      desc: 'Connect directly with clients on their favorite app.' 
    },
    { 
      id: 'tiktok', 
      name: 'TikTok Business', 
      icon: Music2, 
      color: 'text-slate-900', 
      bgColor: 'bg-slate-100', 
      desc: 'Access your 48-hour messaging window and insights.' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Connect Channel</h2>
            <p className="text-slate-500 mt-1">Select a platform to link with your workspace.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          {platforms.map((p) => (
            <button
              key={p.id}
              disabled={!!loading}
              className="w-full flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all group disabled:opacity-50 disabled:translate-y-0"
              onClick={() => handleConnect(p.id)}
            >
              <div className="flex items-center gap-5 text-left">
                <div className={`p-4 rounded-2xl ${p.bgColor} ${p.color}`}>
                  {loading === p.id ? <Loader2 size={28} className="animate-spin" /> : <p.icon size={28} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-[250px]">{p.desc}</p>
                </div>
              </div>
              <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                 <ArrowRight size={20} />
              </div>
            </button>
          ))}
        </div>

        <div className="p-8 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
             <ExternalLink size={14} />
             <span>Secure OAuth connection</span>
          </div>
          <p className="max-w-[200px]">We never store your personal login credentials.</p>
        </div>
      </div>
    </div>
  );
}
