'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, BarChart3, Bot, Calendar } from 'lucide-react';
import type { NavigationItem } from '@/domain/types/ui';

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Posts', href: '/posts', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Config', href: '/settings/bot', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800 ${className}`}>
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">SocialAgent</h1>
      </div>
      <div className="flex flex-1 scrollbar-hide flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 px-4 text-slate-300">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 shrink-0 ${
                    isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center w-full">
          <div>
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              U
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">User</p>
            <p className="text-xs font-medium text-slate-400">View profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
