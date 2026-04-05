'use client';

import { useState } from 'react';
import { WorkspaceMemberWithProfile, Invitation, WorkspaceRole } from '@/domain/types/workspace';
import { UserX, Shield, Trash2, Timer, Mail } from 'lucide-react';
import { updateMemberRoleAction, removeMemberAction, revokeInvitationAction } from '@/app/actions/workspace.action';

interface MembersListProps {
  workspaceId: string;
  initialMembers: WorkspaceMemberWithProfile[];
  initialInvitations: Invitation[];
}

export function MembersList({ workspaceId, initialMembers, initialInvitations }: MembersListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpdateRole(memberId: string, role: WorkspaceRole) {
    setLoading(memberId);
    const { error } = await updateMemberRoleAction(workspaceId, memberId, role);
    if (!error) {
      setMembers(members.map(m => m.profile_id === memberId ? { ...m, role } : m));
    }
    setLoading(null);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi Workspace?')) return;
    setLoading(memberId);
    const { error } = await removeMemberAction(workspaceId, memberId);
    if (!error) {
      setMembers(members.filter(m => m.profile_id !== memberId));
    }
    setLoading(null);
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời này?')) return;
    setLoading(invitationId);
    const { error } = await revokeInvitationAction(invitationId);
    if (!error) {
      setInvitations(invitations.filter(i => i.id !== invitationId));
    }
    setLoading(null);
  }

  return (
    <div className="space-y-12">
      {/* Active Members Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
               <Shield size={18} />
             </div>
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Members</h2>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-widest">{members.length} Total</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-100">
            {members.map((member) => (
              <li key={member.id} className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-100 ring-2 ring-white">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover ring-2 ring-white" />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {member.profile?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{member.profile?.full_name || 'Anonymous User'}</h4>
                    <p className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold w-fit mt-1 tracking-widest uppercase">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center bg-white border border-slate-100 p-1 rounded-2xl shadow-sm">
                    {['admin', 'manager', 'agent', 'viewer'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleUpdateRole(member.profile_id!, r as WorkspaceRole)}
                        disabled={loading === member.profile_id}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          member.role === r 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member.profile_id!)}
                    disabled={loading === member.profile_id}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                 <Timer size={18} />
               </div>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Invitations</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-dotted border-slate-300 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {invitations.map((inv) => (
                <li key={inv.id} className="p-5 flex items-center justify-between group bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-500">
                       <Mail size={22} className="group-hover:animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{inv.email}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">{inv.role}</p>
                        <p className="text-[9px] text-slate-400 italic">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRevokeInvitation(inv.id)}
                    disabled={loading === inv.id}
                    className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
