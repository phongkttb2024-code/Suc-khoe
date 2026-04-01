import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType } from '../types';
import { Activity, Heart, Droplets, Ruler, Weight } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user.id]);

  const stats = [
    { label: 'Nhịp tim', value: '72 bpm', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Huyết áp', value: '120/80', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Nhóm máu', value: profile?.blood_type || '--', icon: Droplets, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <h2 className="text-lg font-medium opacity-90">Xin chào,</h2>
        <h1 className="text-2xl font-bold">{profile?.full_name || user.email?.split('@')[0]}</h1>
        <p className="mt-4 text-sm opacity-80 italic">"Sức khỏe là vàng. Hãy chăm sóc bản thân mỗi ngày."</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className={cn('rounded-xl p-3', stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Ruler size={18} />
            <span className="text-sm font-medium">Chiều cao</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {profile?.height ? `${profile.height} cm` : '--'}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Weight size={18} />
            <span className="text-sm font-medium">Cân nặng</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {profile?.weight ? `${profile.weight} kg` : '--'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Tình trạng hiện tại</h3>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-700">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium">Sức khỏe của bạn đang ở mức ổn định</span>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
