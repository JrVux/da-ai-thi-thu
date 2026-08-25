import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  FolderOpen, 
  History, 
  UserCheck, 
  Calendar, 
  Hash, 
  FileText, 
  Building2, 
  CheckCircle2,
  FolderSync,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Layers,
  KeyRound,
  Copy,
  Lock,
  ShieldCheck,
  Download,
  Upload,
  Database,
  HardDrive
} from 'lucide-react';
import { ExamConfig, AuditLog, School } from '../../types';
import { DBService } from '../../services/db';

interface ExamConfigViewProps {
  config: ExamConfig;
  allConfigs: ExamConfig[];
  activeExamId: string;
  school: School;
  auditLogs: AuditLog[];
  onSave: (config: ExamConfig, resetData?: boolean) => void;
  onSelectExam: (examId: string) => void;
  onCreateExam: (newConfig: Partial<ExamConfig>) => void;
  onDeleteExam: (examId: string) => void;
  onResetExamData: (examId: string) => void;
}

export const ExamConfigView: React.FC<ExamConfigViewProps> = ({
  config,
  allConfigs,
  activeExamId,
  school,
  auditLogs,
  onSave,
  onSelectExam,
  onCreateExam,
  onDeleteExam,
  onResetExamData,
}) => {
  const [formData, setFormData] = useState<ExamConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);
  const [selectedFolderHandle, setSelectedFolderHandle] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [newExamName, setNewExamName] = useState('');
  const [newExamYear, setNewExamYear] = useState<number>(new Date().getFullYear());
  const [newExamRooms, setNewExamRooms] = useState<number>(10);
  const [newExamCapacity, setNewExamCapacity] = useState<number>(24);
  const [newExamDate, setNewExamDate] = useState<string>('2025-06-26');
  const [newExamLeader, setNewExamLeader] = useState<string>('Trưởng Điểm Thi');

  // Invite Codes Management
  const [inviteCodes, setInviteCodes] = useState<string[]>(() => DBService.getInviteCodes());
  const [newCustomCode, setNewCustomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAddCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomCode.trim()) return;
    DBService.addInviteCode(newCustomCode);
    setInviteCodes(DBService.getInviteCodes());
    setNewCustomCode('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRevokeCode = (code: string) => {
    if (inviteCodes.length <= 1) {
      alert('Hệ thống cần giữ ít nhất 1 mã mời để đảm bảo quyền truy cập.');
      return;
    }
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn THU HỒI mã mời [${code}]?\n\n- Người dùng đang dùng mã này sẽ bị thu hồi quyền truy cập ngay lập tức.\n- Mã này sẽ không thể dùng để kích hoạt được nữa.`)) {
      DBService.revokeInviteCode(code);
      setInviteCodes(DBService.getInviteCodes());
    }
  };

  const handleLockSystem = () => {
    if (window.confirm('Khóa lại phần mềm ngay bây giờ?\n\nBạn sẽ được đưa về màn hình kích hoạt và cần nhập lại mã mời để tiếp tục.')) {
      DBService.deactivateSystem();
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const json = DBService.exportFullBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_DuLieu_THPTCaMau_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (window.confirm('Bạn có chắc chắn muốn PHỤC HỒI dữ liệu từ file này? Dữ liệu hiện tại sẽ được thay thế bằng bản sao lưu.')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const res = DBService.importFullBackupJSON(content);
          if (res.success) {
            alert(res.message);
            window.location.reload();
          } else {
            alert(`❌ Lỗi: ${res.message}`);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    setFormData({ ...config });
  }, [config.id, config.ten_ky_thi, config.so_phong, config.so_hoc_sinh_phong]);

  const handleChange = (field: keyof ExamConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };

  const handlePickDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle) {
          const pathName = `[Thư mục cục bộ]: ${dirHandle.name}`;
          setSelectedFolderHandle(dirHandle.name);
          handleChange('thu_muc_du_lieu', pathName);
        }
      } else {
        const customPath = prompt('Nhập đường dẫn thư mục lưu trữ kỳ thi trên máy tính:', formData.thu_muc_du_lieu);
        if (customPath) {
          handleChange('thu_muc_du_lieu', customPath);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveAndReset = () => {
    onSave(formData, true);
    setShowResetConfirm(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCreateNewExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;

    onCreateExam({
      ten_ky_thi: newExamName.trim().toUpperCase(),
      nam: Number(newExamYear) || 2025,
      so_phong: Number(newExamRooms) || 10,
      so_hoc_sinh_phong: Number(newExamCapacity) || 24,
      ngay_thi: newExamDate,
      truong_diem_thi: newExamLeader.trim(),
      tien_to_sbd: '01'
    });

    setShowCreateModal(false);
    setNewExamName('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-gradient-to-r from-adminNavy via-slate-800 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <Settings className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cấu Hình Kỳ Thi & Quản Lý Nhiều Kỳ Thi</h1>
            <p className="text-sm text-slate-300 mt-1">
              Thiết lập thông số kỹ thuật, chuyển đổi qua lại giữa các kỳ thi và quản lý vòng đời dữ liệu
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>➕ Tạo Kỳ Thi Mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Danh Sách Các Kỳ Thi Của Trường ({allConfigs.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Nhấn vào kỳ thi để chuyển đổi dữ liệu</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allConfigs.map(c => {
            const isActive = c.id === activeExamId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectExam(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50/70 border-amber-400 shadow-xs'
                    : 'bg-slate-50 hover:bg-white hover:border-slate-300 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm line-clamp-1">{c.ten_ky_thi}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Năm: <strong>{c.nam}</strong> • {c.so_phong} phòng ({c.so_hoc_sinh_phong} TS/phòng)
                    </div>
                  </div>
                  {isActive ? (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md whitespace-nowrap">Đang chọn</span>
                  ) : (
                    <span className="text-slate-400 hover:text-slate-600 text-xs">Chọn</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span>Ngày thi: {c.ngay_thi || 'Chưa đặt'}</span>
                  <span className="truncate max-w-[120px]">{c.truong_diem_thi || 'Chưa đặt'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Chi Tiết Cấu Hình: <span className="text-amber-700">{formData.ten_ky_thi}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">1. Tên Kỳ Thi / Hội Đồng Thi *</label>
                <input type="text" required value={formData.ten_ky_thi} onChange={e => handleChange('ten_ky_thi', e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">2. Năm Học / Năm Tổ Chức *</label>
                <input type="number" required min={2020} max={2035} value={formData.nam} onChange={e => handleChange('nam', parseInt(e.target.value) || 2025)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" /> 3. Điểm Thi / Trường Học
                </label>
                <input type="text" value={school.ten_truong} disabled className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">4. Quy Mô Số Phòng Thi *</label>
                <input type="number" required min={1} max={50} value={formData.so_phong} onChange={e => handleChange('so_phong', parseInt(e.target.value) || 10)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">5. Sức Chứa Thí Sinh / Phòng *</label>
                <input type="number" required min={10} max={40} value={formData.so_hoc_sinh_phong} onChange={e => handleChange('so_hoc_sinh_phong', parseInt(e.target.value) || 24)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-600" /> 6. Thư Mục Lưu Trữ Dữ Liệu
                </label>
                <div className="flex gap-2">
                  <input type="text" value={formData.thu_muc_du_lieu || ''} onChange={e => handleChange('thu_muc_du_lieu', e.target.value)} className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
                  <button type="button" onClick={handlePickDirectory} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <FolderSync className="w-4 h-4 text-slate-600" /> Chọn Thư Mục...
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" /> 7. Trưởng Điểm Thi / Chủ Tịch Hội Đồng *
                </label>
                <input type="text" required value={formData.truong_diem_thi} onChange={e => handleChange('truong_diem_thi', e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">8. Ghi Chú Đặc Biệt</label>
                <textarea rows={2} value={formData.ghi_chu || ''} onChange={e => handleChange('ghi_chu', e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-500" /> Tiền Tố SBD
                </label>
                <input type="text" value={formData.tien_to_sbd} onChange={e => handleChange('tien_to_sbd', e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Ngày Thi
                </label>
                <input type="date" value={formData.ngay_thi || ''} onChange={e => handleChange('ngay_thi', e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between pt-5 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> <span>Xóa Kỳ Thi</span>
                </button>
                <button type="button" onClick={() => setShowResetConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-200 rounded-xl transition-all cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> <span>Sửa & Reset Dữ Liệu</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                {isSaved && <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in"><CheckCircle2 className="w-4 h-4" /> Đã lưu!</span>}
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
                  <Save className="w-4 h-4" /> <span>Lưu Cấu Hình</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="lg:col-span-1 space-y-6">
          {/* Card Quản lý Mã Mời Bản Quyền Phần Mềm */}
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-indigo-50 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Mã Mời Chia Sẻ (Bản Quyền)</span>
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200">
                Super Admin
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Khi chia sẻ phần mềm cho các trường hoặc giáo viên, người dùng cần nhập <strong>Mã Mời</strong> này để mở khóa kích hoạt:
            </p>

            {/* List of Invite Codes */}
            <div className="mt-3.5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {inviteCodes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-indigo-900 tracking-wider">
                    {code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 text-[11px] font-semibold rounded-lg border border-indigo-200 shadow-2xs transition-all cursor-pointer"
                      title="Sao chép mã mời"
                    >
                      {copiedCode === code ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Chép</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeCode(code)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Thu hồi / Hủy hiệu lực mã này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Code Form */}
            <form onSubmit={handleAddCode} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newCustomCode}
                onChange={(e) => setNewCustomCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã mới muốn cấp..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold uppercase outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Cấp Mã
              </button>
            </form>

            {/* Lock / Deactivate Software Button */}
            <div className="mt-3 pt-2 text-center">
              <button
                type="button"
                onClick={handleLockSystem}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Khóa lại phần mềm và yêu cầu nhập lại mã mời"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Khóa Lại Phần Mềm (Thử Nghiệm Màn Hình Mời)</span>
              </button>
            </div>
          </div>

          {/* Card Sao Lưu & Phục Hồi Dữ Liệu (Chống Mất Dữ Liệu) */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Sao Lưu & Phục Hồi Dữ Liệu</span>
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                An Toàn 100%
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Tải file sao lưu về máy để bảo vệ dữ liệu khi dọn dẹp trình duyệt hoặc chuyển đổi máy tính:
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải File Sao Lưu Toàn Bộ Kỳ Thi (.json)</span>
              </button>

              <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Phục Hồi Dữ Liệu Từ File (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Dù xóa cache hay cài lại máy tính, chỉ cần nạp lại file sao lưu là toàn bộ thí sinh, điểm thi và cấu hình được khôi phục nguyên vẹn.</span>
            </div>
          </div>

          {/* Lịch Sử Cập Nhật */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <History className="w-4 h-4 text-amber-600" /> Lịch Sử Cập Nhật
            </h3>
            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Chưa có lịch sử thay đổi.</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="text-amber-700">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <div className="text-slate-600">{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3"><AlertTriangle className="w-6 h-6" /> <h3 className="text-lg font-bold text-slate-900">Xóa Kỳ Thi?</h3></div>
            <p className="text-sm text-slate-600 mb-4">Cảnh báo: Toàn bộ danh sách thí sinh và điểm thi sẽ bị xóa vĩnh viễn!</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer">Hủy</button>
              <button onClick={() => { onDeleteExam(formData.id); setShowDeleteConfirm(false); }} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white cursor-pointer">Xác Nhận Xóa</button>
            </div>
          </div>
        </div>
      )}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-amber-100">
            <div className="flex items-center gap-3 text-amber-600 mb-3"><RotateCcw className="w-6 h-6" /> <h3 className="text-lg font-bold text-slate-900">Reset Dữ Liệu?</h3></div>
            <p className="text-sm text-slate-600 mb-4">Hệ thống sẽ lưu cấu hình và làm sạch toàn bộ dữ liệu hiện tại.</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer">Hủy</button>
              <button onClick={handleSaveAndReset} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white cursor-pointer">Lưu & Reset</button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-amber-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b">Tạo Kỳ Thi Mới</h3>
            <form onSubmit={handleCreateNewExamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên kỳ thi *</label>
                <input type="text" required value={newExamName} onChange={e => setNewExamName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl cursor-pointer">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
