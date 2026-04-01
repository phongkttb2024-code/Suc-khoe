import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { HealthRecord } from '../types';
import { Calendar, FileText, User as DoctorIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MedicalHistoryProps {
  user: User;
}

export function MedicalHistory({ user }: MedicalHistoryProps) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRecords();
  }, [user.id]);

  async function fetchRecords() {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('health_records').insert([
        {
          user_id: user.id,
          diagnosis,
          doctor,
          notes,
          date,
        },
      ]);

      if (error) throw error;
      
      setShowAddForm(false);
      setDiagnosis('');
      setDoctor('');
      setNotes('');
      fetchRecords();
    } catch (err) {
      console.error('Error adding record:', err);
      alert('Có lỗi xảy ra khi thêm bệnh án.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Lịch sử bệnh án</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700"
        >
          <Plus size={18} />
          Thêm mới
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl bg-white p-6 shadow-md border border-blue-100">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Thêm bệnh án mới</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Chẩn đoán</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Bác sĩ điều trị</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ngày khám</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-700"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg bg-slate-100 py-2 font-bold text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl bg-white py-12 text-center shadow-sm">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-500">Chưa có lịch sử bệnh án nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="rounded-2xl bg-white p-5 shadow-sm border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{record.diagnosis}</h4>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(record.date), 'dd MMMM, yyyy', { locale: vi })}
                    </div>
                    {record.doctor && (
                      <div className="flex items-center gap-1">
                        <DoctorIcon size={14} />
                        BS. {record.doctor}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {record.notes && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-1">Ghi chú:</p>
                  {record.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
