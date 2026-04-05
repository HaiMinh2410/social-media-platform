'use client';

import { useState } from 'react';
import { WorkspaceMemberWithProfile, Invitation, WorkspaceRole } from '@/domain/types/workspace';
import { UserX, Shield, Trash2, Timer, Mail, Loader2, Plus } from 'lucide-react';
import { updateMemberRoleAction, removeMemberAction, revokeInvitationAction } from '@/app/actions/workspace.action';
import { toast } from 'sonner';

interface MembersListProps {
  workspaceId: string;
  initialMembers: WorkspaceMemberWithProfile[];
  initialInvitations: Invitation[];
}

export function MembersList({ workspaceId, initialMembers, initialInvitations }: MembersListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleUpdateRole(memberId: string, role: WorkspaceRole) {
    setProcessingId(memberId + '-' + role);
    
    toast.promise(updateMemberRoleAction(workspaceId, memberId, role), {
      loading: `Updating role to ${role}...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        setMembers(members.map(m => m.profile_id === memberId ? { ...m, role } : m));
        return `Role updated to ${role}`;
      },
      error: (err) => err.message || 'Failed to update role',
      finally: () => setProcessingId(null)
    });
  }

  async function handleRemoveMember(memberId: string, name: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${name} khỏi Workspace?`)) return;
    
    setProcessingId(memberId);
    
    toast.promise(removeMemberAction(workspaceId, memberId), {
      loading: `Removing ${name}...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        setMembers(members.filter(m => m.profile_id !== memberId));
        return `${name} has been removed`;
      },
      error: (err) => err.message || 'Failed to remove member',
      finally: () => setProcessingId(null)
    });
  }

  async function handleRevokeInvitation(invitationId: string, email: string) {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi lời mời của ${email}?`)) return;
    
    setProcessingId(invitationId);
    
    toast.promise(revokeInvitationAction(invitationId), {
      loading: `Revoking invitation for ${email}...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        setInvitations(invitations.filter(i => i.id !== invitationId));
        return `Invitation for ${email} revoked`;
      },
      error: (err) => err.message || 'Failed to revoke invitation',
      finally: () => setProcessingId(null)
    });
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Active Members Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
               <Shield size={18} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Members</h2>
               <p className="text-xs text-slate-500 font-medium">{members.length} people connected</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-100">
            {members.map((member) => (
              <li key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-slate-50/50 transition-all duration-300 gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-100 ring-2 ring-white overflow-hidden transform group-hover/avatar:scale-105 transition-transform duration-300">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover ring-2 ring-white" />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {member.profile?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    {member.role === 'admin' && (
                       <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-lg shadow-md ring-2 ring-white">
                         <Shield size={10} fill="currentColor" />
                       </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                      {member.profile_id === processingId ? (
                         <div className="flex items-center gap-2">
                           <Loader2 size={16} className="animate-spin" />
                           {member.profile?.full_name || 'Processing...'}
                         </div>
                      ) : (
                        member.profile?.full_name || 'Anonymous User'
                      )}
                    </h4>
                    <p className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold w-fit mt-1.5 tracking-widest uppercase">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-center bg-white border border-slate-200/60 p-1.5 rounded-2xl shadow-sm">
                    {['admin', 'manager', 'agent', 'viewer'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleUpdateRole(member.profile_id!, r as WorkspaceRole)}
                        disabled={!!processingId}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative ${
                          member.role === r 
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {processingId === `${member.profile_id}-${r}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : r}
                      </button>
                    ))}
                  </div>
                  
                  <div className="h-8 w-px bg-slate-100 mx-1" />

                  <button 
                    onClick={() => handleRemoveMember(member.profile_id!, member.profile?.full_name || 'this user')}
                    disabled={!!processingId}
                    className="p-3 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Remove member"
                  >
                    <UserX size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                 <Timer size={18} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Invitations</h2>
                 <p className="text-xs text-slate-500 font-medium">Waiting for response</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-dotted border-slate-300 overflow-hidden shadow-sm hover:border-slate-400 transition-colors">
            <ul className="divide-y divide-slate-100">
              {invitations.map((inv) => (
                <li key={inv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between group bg-slate-50/10 hover:bg-slate-50/40 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-amber-100 flex items-center justify-center text-amber-500 shadow-sm group-hover:border-amber-200 transition-all">
                       <Mail size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{inv.email}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg font-bold tracking-widest uppercase">{inv.role}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                    disabled={!!processingId}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-red-100 text-red-500 text-xs font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {processingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Revoke Invitation
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Empty State Help */}
      {members.length === 1 && invitations.length === 0 && (
         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed text-center">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
               <Plus size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Duy nhất bạn trong team</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">Mời thêm thành viên để cùng quản lý các nền tảng mạng xã hội hiệu quả hơn.</p>
         </div>
      )}
    </div>
  );
}
