import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { DBService } from '../../services/db';
import { School } from '../../types';

interface ActivationGateProps {
  school: School;
  onActivated: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ActivationGate: React.FC<ActivationGateProps> = ({
  school,
  onActivated,
  onShowToast
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!inviteCode.trim()) {
      setErrorMsg('Vui lòng nhập mã mời bản quyền.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const success = DBService.activateSystem(inviteCode);
      if (success) {
        onShowToast('success', 'Kích hoạt thành công!', 'Chào mừng Super Admin. Toàn bộ tính năng đã được mở khóa.');
        onActivated();
      } else {
        setErrorMsg('Mã mời không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.');
        onShowToast('error', 'Kích hoạt thất bại', 'Mã mời không hợp lệ.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Top Header Glow */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 transform -translate-x-8 translate-y-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* School Badge & Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg border-2 border-amber-400 flex items-center justify-center overflow-hidden">
              <img
                src={school.logo || '/logo.png'}
                alt={school.ten_truong}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1">
            {school.so_gd || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO CÀ MAU'}
          </div>
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
            {school.ten_truong || 'TRƯỜNG THPT CÀ MAU'}
          </div>
          
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 uppercase tracking-wide">
            HỆ THỐNG QUẢN LÝ KỲ THI THỬ TỐT NGHIỆP
          </h2>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/80 border border-indigo-400/40 text-indigo-200 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kích Hoạt Bản Quyền Super Admin</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center text-xs text-slate-600 leading-relaxed">
            Phần mềm được bảo vệ bởi hệ thống khóa bản quyền. Thầy/Cô vui lòng nhập <strong>Mã Mời (Invite Code)</strong> được cấp bởi Quản trị viên để mở khóa sử dụng.
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhập Mã Mời Kích Hoạt (Invite Code):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã mời được cấp..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-slate-900 font-bold tracking-widest text-center uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal transition-all outline-hidden text-sm"
                  autoFocus
                />
              </div>
              {errorMsg && (
                <p className="mt-2 text-xs text-rose-600 font-semibold text-center">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Đang kiểm tra mã...</span>
              ) : (
                <>
                  <span>KÍCH HOẠT VÀ SỬ DỤNG NGAY</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice (Không đề xuất lộ mã) */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <span>🔒 Vui lòng liên hệ <strong>Quản Trị Viên (Super Admin)</strong> để được cấp mã mời sử dụng phần mềm.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chuẩn GDPT 2018 (Thông tư 24/2024/TT-BGDĐT)</span>
          </div>
          <div>Bản quyền THPT Cà Mau</div>
        </div>
      </div>
    </div>
  );
};
