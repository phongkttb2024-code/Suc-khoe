import React, { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { HealthRecord } from '../types';
import { Calendar, FileText, User as DoctorIcon, Plus, X, CheckCircle2, Send, Edit2, Camera, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MedicalHistoryProps {
  user: User;
}

export function MedicalHistory({ user }: MedicalHistoryProps) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [prescriptionUrl, setPrescriptionUrl] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [user.id]);

  useEffect(() => {
    if (editingRecord) {
      setDiagnosis(editingRecord.diagnosis);
      setDoctor(editingRecord.doctor || '');
      setNotes(editingRecord.notes || '');
      setDate(editingRecord.date);
      setPrescriptionUrl(editingRecord.prescription_url || '');
      setShowAddForm(true);
    } else {
      setDiagnosis('');
      setDoctor('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setPrescriptionUrl('');
    }
  }, [editingRecord]);

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

  async function uploadPrescription(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Bạn phải chọn một hình ảnh để tải lên.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `prescriptions/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          throw new Error('Không tìm thấy Bucket "prescriptions". Vui lòng kiểm tra xem bạn đã tạo Bucket tên chính xác là "prescriptions" (có chữ s ở cuối) trong Supabase Storage chưa.');
        }
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(filePath);

      setPrescriptionUrl(publicUrl);
    } catch (error: any) {
      alert(`Lỗi tải ảnh: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteRecord(id: string) {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setShowDeleteConfirm(null);
      setShowAddForm(false);
      setEditingRecord(null);
      fetchRecords();
      alert('Đã xóa bệnh án thành công!');
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert(`Có lỗi xảy ra khi xóa bệnh án: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const recordData = {
        user_id: user.id,
        diagnosis,
        doctor,
        notes,
        date,
        prescription_url: prescriptionUrl,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('health_records')
          .update(recordData)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('health_records').insert([recordData]);
        if (error) throw error;
        
        // Actual Email Notification via Resend
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: user.email,
              subject: 'Thông báo: Bệnh án mới đã được thêm',
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #334155;">
                  <h2 style="color: #2563eb;">Chào bạn,</h2>
                  <p>Một bệnh án mới đã được thêm vào tài khoản của bạn trên hệ thống <b>Theo Dõi Sức Khoẻ</b>.</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <p><b>Chẩn đoán:</b> ${diagnosis}</p>
                    <p><b>Bác sĩ:</b> ${doctor || 'Không rõ'}</p>
                    <p><b>Ngày khám:</b> ${format(new Date(date), 'dd/MM/yyyy')}</p>
                  </div>
                  <p>Bạn có thể đăng nhập vào ứng dụng để xem chi tiết.</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không phản hồi.</p>
                </div>
              `
            })
          });
        } catch (emailErr) {
          console.error('Error sending email:', emailErr);
        }
      }
      
      setShowAddForm(false);
      setEditingRecord(null);
      fetchRecords();
      
      alert(editingRecord ? 'Đã cập nhật bệnh án!' : 'Đã lưu bệnh án thành công!');
    } catch (err: any) {
      console.error('Error adding/updating record:', err);
      alert(`Có lỗi xảy ra khi lưu bệnh án: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch sử bệnh án</h2>
        <button
          onClick={() => {
            setEditingRecord(null);
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} />
          Thêm mới
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-2xl border border-blue-100 dark:border-slate-700 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
            <button 
              onClick={() => {
                setShowAddForm(false);
                setEditingRecord(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
              {editingRecord ? 'Chỉnh sửa bệnh án' : 'Thêm bệnh án mới'}
            </h3>
            <form onSubmit={handleAddRecord} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Chẩn đoán / Tên bệnh</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Viêm họng cấp, Kiểm tra định kỳ..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bác sĩ điều trị</label>
                  <input
                    type="text"
                    placeholder="Tên bác sĩ"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ngày khám</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú & Đơn thuốc</label>
                <textarea
                  placeholder="Nhập chi tiết đơn thuốc hoặc lời dặn của bác sĩ..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Hình ảnh đơn thuốc</label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center relative">
                    {prescriptionUrl ? (
                      <img src={prescriptionUrl} alt="Prescription" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm font-bold"
                  >
                    <Camera size={18} />
                    {prescriptionUrl ? 'Thay đổi ảnh' : 'Tải ảnh đơn thuốc'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={uploadPrescription}
                    disabled={uploading}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingRecord ? 'Cập nhật bệnh án' : 'Lưu & Gửi thông báo'}
                </button>
                
                {editingRecord && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(editingRecord.id)}
                    className="w-full rounded-2xl bg-red-50 dark:bg-red-900/10 py-4 font-bold text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  >
                    Xóa bệnh án này
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-2xl"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-600">
                <X size={32} />
              </div>
              <h3 className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">Xác nhận xóa?</h3>
              <p className="mb-8 text-center text-slate-500 dark:text-slate-400">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bệnh án này?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-700 py-4 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteRecord(showDeleteConfirm)}
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 dark:shadow-red-900/20 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang xóa...' : 'Xóa ngay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-800 py-16 text-center shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700">
            <FileText size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có bệnh án</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bắt đầu lưu trữ lịch sử khám bệnh của bạn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <motion.div 
              key={record.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{record.diagnosis}</h4>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" />
                      {format(new Date(record.date), 'dd MMMM, yyyy', { locale: vi })}
                    </div>
                    {record.doctor && (
                      <div className="flex items-center gap-1.5">
                        <DoctorIcon size={14} className="text-blue-500" />
                        BS. {record.doctor}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setEditingRecord(record)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
              </div>
              
              {record.notes && (
                <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Chi tiết & Lời dặn:
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}

              {record.prescription_url && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Hình ảnh đơn thuốc</p>
                  <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700">
                    <img 
                      src={record.prescription_url} 
                      alt="Đơn thuốc" 
                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(record.prescription_url!, '_blank')}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
