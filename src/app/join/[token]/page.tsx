import { getInvitationByToken } from "@/application/workspace/workspace.service";
import { createClient } from "@/lib/supabase/server";
import { Shield, ArrowRight, Sparkles, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/app/actions/workspace.action";

export const metadata = {
  title: "Join Workspace - Social Media Platform",
  description: "Accept your invitation to join a workspace.",
};

export default async function JoinPage({ params }: { params: { token: string } }) {
  const { data: invitation, error } = await getInvitationByToken(params.token);
  
  if (error || !invitation) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-lg w-full text-center">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Shield size={40} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Invalid Invitation</h1>
           <p className="text-slate-500 mb-8 font-medium">Sorry, your invitation link is invalid or has expired.</p>
           <Link href="/login" className="block w-full">
             <Button variant="outline" className="w-full h-14 rounded-3xl font-bold">
               Back to Login
             </Button>
           </Link>
        </div>
      </main>
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="bg-white p-12 sm:p-20 rounded-[4rem] shadow-2xl max-w-2xl w-full text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-8">
            <Sparkles size={14} />
            You're Invited!
         </div>
         
         <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-200 rotate-3 transform hover:rotate-0 transition-transform duration-500 cursor-help">
            <Shield size={48} className="text-white" />
         </div>

         <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{(invitation as any).workspaces?.name}</span>
         </h1>
         
         <p className="text-slate-500 text-lg mb-12 font-medium max-w-md mx-auto">
            You've been invited by <span className="text-slate-900 font-bold">Admin</span> to collaborate as an <span className="text-indigo-600 font-bold capitalize">{invitation.role}</span>.
         </p>

         {!user ? (
            <div className="space-y-4">
               <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl mb-8">
                  <p className="text-sm text-slate-600 leading-relaxed">
                     Please sign in to accept this invitation. We'll link this account to the workspace automatically.
                  </p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={`/login?redirect=/join/${params.token}`} className="flex-[2]">
                    <Button className="w-full h-16 rounded-[2rem] text-lg font-bold shadow-xl shadow-indigo-100">
                        <LogIn className="mr-2" />
                        Log in to Join
                    </Button>
                  </Link>
                  <Link href={`/login?mode=signup&redirect=/join/${params.token}`} className="flex-1">
                    <Button variant="outline" className="w-full h-16 rounded-[2rem] text-lg font-bold">
                        <UserPlus className="mr-2" />
                        Sign up
                    </Button>
                  </Link>
               </div>
            </div>
         ) : (
            <form action={async () => {
              'use server';
              const result = await acceptInvitationAction(params.token);
              if (result.success) {
                redirect('/settings/members');
              }
            }}>
               <Button type="submit" className="w-full h-20 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-indigo-200 hover:scale-[1.02] transition-all group">
                  Accept Invitation
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
               </Button>
               <p className="mt-6 text-sm text-slate-400 font-medium">
                  Logged in as <span className="text-slate-600 font-bold">{user.email}</span>
               </p>
            </form>
         )}
      </div>

      <p className="absolute bottom-10 text-slate-500 font-bold text-xs uppercase tracking-widest opacity-50">
         Social Media Management System &copy; 2026
      </p>
    </main>
  );
}
