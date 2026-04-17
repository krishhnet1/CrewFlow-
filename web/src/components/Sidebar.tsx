'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Wallet,
  BarChart3,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const navItems: NavItem[] = [
  { href: '/', label: 'Me', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/people', label: 'People', icon: Users },
  { href: '/payroll', label: 'Payroll', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border-subtle bg-bg-card">
      <div className="flex h-16 items-center px-xl">
        <span className="text-xl font-black tracking-tight">
          Crew<span className="text-accent">Flow</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-md py-md">
        {navItems.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-md rounded-btn px-md py-md text-sm font-semibold transition-colors ${
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border-subtle p-md">
        {userEmail && (
          <div className="mb-sm px-md text-xs text-text-muted truncate">{userEmail}</div>
        )}
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-md rounded-btn px-md py-md text-sm font-semibold text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
