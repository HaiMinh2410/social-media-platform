import { getMyWorkspaces } from "@/infrastructure/database/repositories/workspace.repository";
import { getPlatformAccountsByWorkspace } from "@/infrastructure/database/repositories/platform-account.repository";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ConnectionsList } from "@/components/settings/connections-list";
import { MoveLeft, HelpCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Platform Connections - Antigravity",
  description: "Manage your social media platform accounts and connection status.",
};

export default async function ConnectionsPage() {
  const { data: workspaces, error: workspaceError } = await getMyWorkspaces();

  if (workspaceError || !workspaces || workspaces.length === 0) {
    redirect('/settings');
  }

  // Use the first workspace as default for now
  const workspace = workspaces[0];
  const { data: accounts, error: accountsError } = await getPlatformAccountsByWorkspace(workspace.id);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <Link href="/settings" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group">
          <MoveLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </Link>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Connections</h1>
            <p className="text-slate-500 mt-2">
              Sync your accounts to enable AI auto-replies and shared inbox.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/docs/connections" className="p-2.5 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
               <HelpCircle size={20} />
             </Link>
          </div>
        </header>
      </div>

      {(workspaceError || accountsError) && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-3xl text-sm flex items-start gap-3">
           <div className="p-1 bg-red-100 rounded-lg">
             <MoveLeft size={14} className="rotate-90" />
           </div>
           <div>
             <p className="font-bold">Error!</p>
             <p className="opacity-90">{workspaceError || accountsError}</p>
           </div>
        </div>
      )}

      <ConnectionsList accounts={accounts || []} />

      <footer className="mt-12 p-8 border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Missing a platform? We&apos;re working on adding LinkedIn, X (Twitter) and Threads integration soon.
        </p>
      </footer>
    </div>
  );
}
