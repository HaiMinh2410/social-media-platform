import { getMyWorkspaces } from "@/infrastructure/database/repositories/workspace.repository";
import { User, Building2, Users, Share2, Bot, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Settings - Antigravity",
  description: "Manage your profile, team, and workspace configuration.",
};

export default async function SettingsPage() {
  const { data: workspaces, error } = await getMyWorkspaces();

  // Pick the first one as default for MVP
  const workspace = workspaces?.[0];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Settings</h1>
        <p className="text-lg text-slate-500 mt-2">
          Control your account preferences and collaborate with your team.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Workspace Card */}
        <div className="group relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Workspace</h3>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{workspace?.role || 'Member'}</p>
            </div>
          </div>
          <p className="text-slate-600 mb-6 line-clamp-2">
            Configure your workspace details, slug and global preferences.
          </p>
          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
             <span className="font-medium text-slate-900">{workspace?.name || 'Loading...'}</span>
             <Link href="/settings/general" className="text-blue-600 hover:translate-x-1 transition-transform inline-flex">
               <ArrowRight size={20} />
             </Link>
          </div>
        </div>

        {/* Team Card */}
        <Link href="/settings/members" className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Team Members</h3>
          </div>
          <p className="text-slate-600 mb-6">
            Invite colleagues, manage roles and control access levels for your workspace.
          </p>
          <div className="flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all">
            <span>Manage Team</span>
            <ArrowRight size={18} className="ml-1" />
          </div>
        </Link>

        {/* Connections Card */}
        <Link href="/settings/connections" className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Share2 size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Platform Accounts</h3>
          </div>
          <p className="text-slate-600 mb-6">
            Connect meta, instagram and tiktok accounts to synchronize your inbox.
          </p>
          <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
            <span>Manage Channels</span>
            <ArrowRight size={18} className="ml-1" />
          </div>
        </Link>

        {/* Automation Card */}
        <Link href="/settings/bot" className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
              <Bot size={24} />
            </div>
            <h3 className="font-bold text-slate-900">AI Automation</h3>
          </div>
          <p className="text-slate-600 mb-6">
            Configure auto-replies, confidence levels and trigger rules for your bot.
          </p>
          <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
            <span>Configure AI</span>
            <ArrowRight size={18} className="ml-1" />
          </div>
        </Link>

        {/* Security Card */}
        <div className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300 cursor-not-allowed opacity-75">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <Shield size={24} />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900">Security</h3>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold w-fit">COMING SOON</span>
            </div>
          </div>
          <p className="text-slate-600">
            Password management, two-factor authentication and data backup policies.
          </p>
        </div>

      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm">
          Warning: There was an error fetching your workspace context. Some actions may be limited.
        </div>
      )}
    </div>
  );
}
