import React, { useState } from 'react';
import { 
  School as SchoolIcon, 
  Settings, 
  Users, 
  Layers, 
  Edit3, 
  BarChart3, 
  Sparkles, 
  ShieldCheck, 
  FolderOpen,
  Plus
} from 'lucide-react';
import { School, ExamConfig, UserRole } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  schools: School[];
  activeSchool: School;
  onSelectSchool: (schoolId: string) => void;
  onAddSchool: (school: School) => void;
  examConfigs: ExamConfig[];
  activeExamId: string;
  onSelectExam: (examId: string) => void;
  onCreateExam: () => void;
  examConfig: ExamConfig;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  onOpenConfigModal: () => void;
  onOpenAIModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  schools,
  activeSchool,
  onSelectSchool,
  onAddSchool,
  examConfigs,
  activeExamId,
  onSelectExam,
  onCreateExam,
  examConfig,
  userRole,
  onChangeUserRole,
  onOpenConfigModal,
  onOpenAIModal,
}) => {
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolCode.trim()) return;
    const newSchool: School = {
      id: `school-${Date.now()}`,
      ten_truong: newSchoolName.trim().toUpperCase(),
      ma_truong: newSchoolCode.trim().toUpperCase(),
      so_gd: 'SỞ GD&ĐT CÀ MAU',
      hieu_truong: 'Hiệu trưởng'
    };
    onAddSchool(newSchool);
    onSelectSchool(newSchool.id);
    setShowAddSchool(false);
    setNewSchoolName('');
    setNewSchoolCode('');
  };

  const navItems = [
    { id: 'students', label: 'Quản Lý Thí Sinh', icon: Users },
    { id: 'rooms', label: 'Xếp Phòng Thi', icon: Layers },
    { id: 'scores', label: 'Nhập & Xử Lý Điểm', icon: Edit3 },
    { id: 'combinations', label: 'Tổ Hợp Xét Tuyển', icon: ShieldCheck },
    { id: 'reports', label: 'Báo Cáo & Thống Kê', icon: BarChart3 },
    { id: 'exam-config', label: 'Cấu Hình Kỳ Thi', icon: Settings },
  ];

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    admin_truong: { label: 'Admin Trường', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    giam_thi: { label: 'Giám Thị', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    giao_vien: { label: 'Giáo Viên', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Info Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Sở GD&ĐT */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-slate-300 font-bold uppercase tracking-wide text-xs whitespace-nowrap">
            {activeSchool.so_gd || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO CÀ MAU'}
          </span>
        </div>

        {/* Center: Tiêu đề Lớn Căn Giữa Hoàn Hảo */}
        <div className="flex-1 flex items-center justify-center text-center min-w-[280px]">
          <span className="font-black text-sm sm:text-base md:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 uppercase">
            HỆ THỐNG QUẢN LÝ KỲ THI THỬ TỐT NGHIỆP
          </span>
        </div>

        {/* Right Side: AI Studio & Vai trò */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          {/* AI Settings Trigger */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold shadow-xs transition-all text-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Studio</span>
          </button>

          {/* Single Super Admin Role Badge */}
          <div className="flex items-center gap-1.5 text-xs bg-indigo-950/90 text-indigo-200 border border-indigo-500/40 px-3 py-1 rounded-lg font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Super Admin</span>
          </div>
        </div>
      </div>

      {/* Middle Brand Bar (Logo & School Information) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & School Details */}
          <div className="flex items-center gap-3.5">
            <div 
              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', maxWidth: '48px', maxHeight: '48px' }}
              className="rounded-xl bg-white p-0.5 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              <img
                src={activeSchool.logo || "/logo.png"}
                alt={activeSchool.ten_truong}
                style={{ width: '100%', height: '100%', maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }}
                className="block"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SchoolIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <select
                  value={activeSchool.id}
                  onChange={(e) => onSelectSchool(e.target.value)}
                  className="font-bold text-slate-900 bg-transparent text-lg border-b border-transparent hover:border-slate-300 focus:outline-hidden cursor-pointer tracking-tight"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.ten_truong}</option>
                  ))}
                </select>

                {userRole === 'super_admin' && (
                  <button
                    onClick={() => setShowAddSchool(true)}
                    title="Thêm trường học mới (Multi-tenant)"
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                <span>Mã trường: <strong className="text-slate-900 font-mono font-bold">{activeSchool.ma_truong}</strong></span>
                <span className="text-slate-300">|</span>
                <span className="truncate max-w-[500px]" title={activeSchool.dia_chi}>
                  ĐC: <span className="font-medium text-slate-700">{activeSchool.dia_chi || 'Số 41, Đường Phan Đình Phùng, Phường An Xuyên, Tỉnh Cà Mau'}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>Trưởng điểm thi: <strong className="text-slate-800">{examConfig.truong_diem_thi || activeSchool.hieu_truong || 'Chưa cập nhật'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Toolbar (Dời xuống ra đầu bên trái với màu cam/vàng nổi bật) */}
      <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 border border-orange-400 scale-[1.02]'
                    : 'text-slate-700 bg-white hover:bg-amber-50 hover:text-orange-600 hover:border-amber-300 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-orange-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Add School */}
      {showAddSchool && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <SchoolIcon className="w-5 h-5 text-sky-600" />
              Thêm Trường Học Mới (Multi-tenant)
            </h3>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên trường *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: TRƯỜNG THPT ĐẦM DƠI"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã trường *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: DD02"
                  value={newSchoolCode}
                  onChange={e => setNewSchoolCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchool(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-adminNavy text-white hover:bg-slate-800"
                >
                  Tạo trường mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
