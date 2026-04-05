'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAvailableWABAPhoneNumbersAction, connectWhatsAppAccountAction } from "@/application/meta/whatsapp-auth.action";
import { MessageCircle, CheckCircle2, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppSelectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use first workspace as default, though we might want to pass it from callback
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!token) {
        setError('Missing authentication token. Please try again.');
        setLoading(false);
        return;
      }

      // Fetch WABA Phone Numbers
      const { data, error } = await fetchAvailableWABAPhoneNumbersAction(token);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      setPhoneNumbers(data || []);
      setLoading(false);
    }
    
    init();
  }, [token]);

  const handleConnect = async (phone: any) => {
    setConnecting(phone.id);
    
    // In a real app we'd get this from context or workspace selector
    // For now we try to fetch it or use a default
    const result = await connectWhatsAppAccountAction(
      phone.id,
      phone.verified_name || phone.display_phone_number,
      token!,
      '00000000-0000-0000-0000-000000000000' // Placeholder for first workspace, handled in action for profile/workspace resolution logic
    );

    if (result.error) {
      setError(result.error);
      setConnecting(null);
    } else {
      router.push('/settings/connections?success=whatsapp');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Fetching your WhatsApp accounts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
         <div className="p-4 rounded-[2rem] bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
            <MessageCircle size={32} fill="currentColor" className="opacity-10" />
            <MessageCircle size={32} className="absolute inset-0 m-4" />
         </div>
         <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Connect WhatsApp</h1>
            <p className="text-slate-500">Select which phone number you want to use.</p>
         </div>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl flex items-start gap-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Error connecting</p>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {phoneNumbers.length > 0 ? (
          phoneNumbers.map((phone) => (
            <div 
              key={phone.id}
              className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-5 italic">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  {phone.verified_name?.charAt(0) || "+"}
                </div>
                <div>
                   <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {phone.verified_name}
                   </h3>
                   <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-slate-500">{phone.display_phone_number}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                         {phone.quality_rating}
                      </span>
                   </div>
                   <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-tighter">WABA: {phone.wabaName}</p>
                </div>
              </div>
              
              <Button
                onClick={() => handleConnect(phone)}
                disabled={!!connecting}
                className={`rounded-2xl h-12 px-6 transition-all font-bold ${
                  connecting === phone.id 
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                {connecting === phone.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Connect
                    <ChevronRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 italic">No WhatsApp Business accounts found on this Meta login.</p>
            <Button variant="link" onClick={() => router.back()} className="mt-2">Try another account</Button>
          </div>
        )}
      </div>

      <p className="mt-12 text-center text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
        Antigravity will subscribe to incoming messages for the selected number. You can disable this at any time in the connections settings.
      </p>
    </div>
  );
}
