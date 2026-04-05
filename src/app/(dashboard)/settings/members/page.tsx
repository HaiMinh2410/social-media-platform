import { getMyWorkspaces } from "@/infrastructure/database/repositories/workspace.repository";
import { getTeamContext } from "@/application/workspace/workspace.service";
import { MembersList } from "@/components/settings/members-list";
import { InviteMemberModal } from "@/components/settings/invite-member-modal";
import { Users, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Team Members - Settings",
  description: "Invite and manage your team members and their access levels.",
};

export default async function MembersPage({ searchParams }: { searchParams: { invite?: string } }) {
  const { data: workspaces } = await getMyWorkspaces();
  const workspace = workspaces?.[0]; // MVP: first workspace

  if (!workspace) {
    redirect('/settings');
  }

  // Check if current user is admin/manager to allow inviting
  const canInvite = workspace.role === 'admin' || workspace.role === 'manager';

  const { data: teamContext, error } = await getTeamContext(workspace.id);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl text-red-700">
           Lỗi khi tải dữ liệu team: {error}
        </div>
      </div>
    );
  }

  const showInviteModal = searchParams.invite === 'true';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <Link href="/settings" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest mb-4">
            <ArrowLeft size={14} />
            Back to settings
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Management</h1>
              <p className="text-slate-500 font-medium">Manage members for <span className="text-indigo-600 font-bold">{workspace.name}</span></p>
            </div>
          </div>
        </div>

        {canInvite && (
          <Link 
            href="?invite=true"
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all hover:translate-y-[-2px] shadow-lg shadow-slate-200"
          >
            <Plus size={20} />
            Invite Member
          </Link>
        )}
      </header>

      <MembersList 
        workspaceId={workspace.id}
        initialMembers={teamContext?.members || []}
        initialInvitations={teamContext?.invitations || []}
      />

      {showInviteModal && canInvite && (
        <InviteMemberModal 
          workspaceId={workspace.id}
        />
      )}
    </div>
  );
}
