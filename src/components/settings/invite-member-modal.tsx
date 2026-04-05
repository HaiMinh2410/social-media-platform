'use client';

import { useState } from 'react';
import { Mail, Shield, X, Loader2, CheckCircle2 } from 'lucide-react';
import { inviteMemberAction } from '@/app/actions/workspace.action';
import { WorkspaceRole } from '@/domain/types/workspace';
import { useRouter } from 'next/navigation';

interface InviteMemberModalProps {
  workspaceId: string;
}

export function InviteMemberModal({ workspaceId }: InviteMemberModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onClose = () => router.push('/settings/members');


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('workspaceId', workspaceId);
    formData.append('email', email);
    formData.append('role', role);

    const result = await inviteMemberAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Đã gửi lời mời!</h2>
          <p className="text-slate-500">
            Một email đã được gửi tới <strong>{email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <Mail className="text-blue-600" size={20} />
             Mời thành viên mới
           </h2>
           <button 
             onClick={onClose}
             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
           >
             <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
             <input 
               type="email" 
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="colleague@example.com"
               className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
             />
           </div>

           <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4 text-center">Assign workspace role</label>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: 'admin', title: 'Admin', desc: 'Toàn quyền điều khiển', color: 'bg-red-50 text-red-600 border-red-100' },
                   { id: 'manager', title: 'Manager', desc: 'Quản lý team & nội dung', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                   { id: 'agent', title: 'Agent', desc: 'Chỉ xử lý tin nhắn & post', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                   { id: 'viewer', title: 'Viewer', desc: 'Chỉ xem báo cáo', color: 'bg-slate-50 text-slate-600 border-slate-100' },
                 ].map((r) => (
                   <button
                     key={r.id}
                     type="button"
                     onClick={() => setRole(r.id as WorkspaceRole)}
                     className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                       role === r.id 
                       ? 'border-blue-600 ring-4 ring-blue-500/5 bg-blue-50/20' 
                       : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                     }`}
                   >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded-lg ${r.color}`}>
                          <Shield size={12} />
                        </div>
                        <span className={`font-bold text-sm ${role === r.id ? 'text-blue-700' : 'text-slate-900'}`}>{r.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {r.desc}
                      </p>
                   </button>
                 ))}
              </div>
           </div>

           {error && (
             <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <X size={14} className="flex-shrink-0" />
                <span>{error}</span>
             </div>
           )}

           <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative flex items-center justify-center gap-2"
              >
                {loading ? (
                   <>
                     <Loader2 size={20} className="animate-spin" />
                     Đang gửi...
                   </>
                ) : (
                  'Gửi lời mời'
                )}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
