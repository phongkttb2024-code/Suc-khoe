import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Activity, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        if (data.user && data.session) {
          // Auto-login if email confirmation is disabled
        } else {
          alert('Đăng ký thành công! Vui lòng kiểm tra hộp thư đến (Gmail) của bạn để xác nhận tài khoản trước khi đăng nhập. Nếu không thấy, hãy kiểm tra thư rác.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message === 'User already registered') {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else if (err.message === 'Invalid login credentials') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (err.message === 'Email not confirmed') {
        setError('Vui lòng xác nhận email của bạn trước khi đăng nhập.');
      } else {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-2xl border border-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 rotate-3">
            <Activity size={40} />
          </div>
          <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900">
            {isRegistering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            {isRegistering ? 'Bắt đầu hành trình chăm sóc sức khỏe' : 'Đăng nhập để tiếp tục theo dõi'}
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleEmailAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <span className="flex items-center gap-2">
                {isRegistering ? 'Đăng ký ngay' : 'Đăng nhập'}
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký miễn phí'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
