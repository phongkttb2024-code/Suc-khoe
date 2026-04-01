import React, { ReactNode } from 'react';
import { LayoutDashboard, History, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'history' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'history' | 'profile') => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'history', label: 'Bệnh án', icon: History },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">HealthTrack</h1>
        <button
          onClick={handleLogout}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="mx-auto max-w-lg">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t bg-white px-2 py-3 shadow-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            )}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
