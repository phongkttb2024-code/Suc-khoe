import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType } from '../types';
import { User as UserIcon, Save, AlertCircle } from 'lucide-react';

interface ProfileProps {
  user: User;
}

export function Profile({ user }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    blood_type: '',
    height: '',
    weight: '',
  });

  useEffect(() => {
    async function getProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || '',
            age: data.age?.toString() || '',
            gender: data.gender || '',
            blood_type: data.blood_type || '',
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user.id]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updates = {
        id: user.id,
        full_name: formData.full_name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        blood_type: formData.blood_type,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <UserIcon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Thông tin cá nhân</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Họ và tên</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tuổi</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Giới tính</label>
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nhóm máu</label>
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.blood_type}
              onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
            >
              <option value="">Chọn nhóm máu</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:col-span-1">
            <div>
              <label className="block text-sm font-medium text-slate-700">Chiều cao (cm)</label>
              <input
                type="number"
                step="0.1"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Cân nặng (kg)</label>
              <input
                type="number"
                step="0.1"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg p-3 text-sm',
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
