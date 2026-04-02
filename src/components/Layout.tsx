import React, { ReactNode } from 'react';
import { LayoutDashboard, History, User, LogOut, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'history' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'history' | 'profile') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function Layout({ children, activeTab, setActiveTab, isDarkMode, toggleTheme }: LayoutProps) {
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'history', label: 'Bệnh án', icon: History },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">Theo Dõi Sức Khoẻ</h1>
          {userEmail && <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">{userEmail}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('Toggle theme clicked');
              toggleTheme();
            }}
            className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-3 shadow-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-all',
              activeTab === item.id ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            )}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
