'use client';

import { Lock, Mail, AlertCircle } from 'lucide-react';
import { AuthFeedback } from '@/components/auth/auth-feedback';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ [LOGIN] API Success, redirecting...');
        // Force full page reload to ensure cookies are read correctly by middleware
        window.location.href = '/dashboard';
        return;
      }

      if (data && data.error) {
        setError(data.error);
      } else {
        setError('Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError('Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans text-slate-800">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-slate-100">
        <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white text-2xl mb-4 shadow-lg shadow-indigo-200">
                S
            </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SocialAgent</h1>
          <p className="mt-2 text-sm text-slate-500">Đăng nhập để quản lý các mạng xã hội của bạn</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={loading}
                className="block w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm outline-none transition-all disabled:bg-slate-50"
                placeholder="Email của bạn"
              />
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
                className="block w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm outline-none transition-all disabled:bg-slate-50"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="min-h-[1.5rem]">
            {loading && <AuthFeedback isSimple />}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 mt-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Protected by Supabase SSR</p>
        </div>
      </div>
    </div>
  );
}
