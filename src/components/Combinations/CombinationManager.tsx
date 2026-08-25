import React, { useState, useMemo } from 'react';
import { ShieldCheck, Plus, Trash2, Edit2, Search, X, Check, BookOpen, Award, BarChart2, ArrowRight } from 'lucide-react';
import { AdmissionCombination, Subject, ELECTIVE_SUBJECTS, School, Student, ExamScore } from '../../types';
import { ScoreCalculator } from '../../services/score-calc';

interface CombinationManagerProps {
  combinations: AdmissionCombination[];
  school: School;
  students?: Student[];
  scores?: ExamScore[];
  onSaveCombination: (comb: AdmissionCombination) => void;
  onDeleteCombination: (id: string) => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToReports?: () => void;
}

const ALL_SUBJECTS: Subject[] = [
  'Toán',
  'Ngữ văn',
  ...ELECTIVE_SUBJECTS
];

export const CombinationManager: React.FC<CombinationManagerProps> = ({
  combinations,
  school,
  students = [],
  scores = [],
  onSaveCombination,
  onDeleteCombination,
  onShowToast,
  onNavigateToReports,
}) => {
  const [selectedKhoi, setSelectedKhoi] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComb, setEditingComb] = useState<AdmissionCombination | null>(null);
  const [viewingScoresComb, setViewingScoresComb] = useState<AdmissionCombination | null>(null);

  // Form State
  const [formMaToHop, setFormMaToHop] = useState('');
  const [formTenToHop, setFormTenToHop] = useState('');
  const [formKhoi, setFormKhoi] = useState<'A' | 'B' | 'C' | 'D' | 'X'>('A');
  const [formMon1, setFormMon1] = useState<Subject>('Toán');
  const [formMon2, setFormMon2] = useState<Subject>('Vật lí');
  const [formMon3, setFormMon3] = useState<Subject>('Hóa học');
  const [formGhiChu, setFormGhiChu] = useState('');

  const filteredCombinations = useMemo(() => {
    return combinations.filter(c => {
      const matchKhoi = selectedKhoi === 'ALL' || c.khoi === selectedKhoi;
      const matchQuery = c.ma_to_hop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.ten_to_hop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.mon_1.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.mon_2.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.mon_3.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKhoi && matchQuery;
    }).sort((a, b) => a.ma_to_hop.localeCompare(b.ma_to_hop));
  }, [combinations, selectedKhoi, searchQuery]);

  const handleOpenModal = (comb?: AdmissionCombination) => {
    if (comb) {
      setEditingComb(comb);
      setFormMaToHop(comb.ma_to_hop);
      setFormTenToHop(comb.ten_to_hop);
      setFormKhoi(comb.khoi);
      setFormMon1(comb.mon_1);
      setFormMon2(comb.mon_2);
      setFormMon3(comb.mon_3);
      setFormGhiChu(comb.ghi_chu || '');
    } else {
      setEditingComb(null);
      setFormMaToHop('');
      setFormTenToHop('');
      setFormKhoi('A');
      setFormMon1('Toán');
      setFormMon2('Vật lí');
      setFormMon3('Hóa học');
      setFormGhiChu('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMaToHop.trim()) return;

    const autoName = `${formMon1}, ${formMon2}, ${formMon3}`;
    const toSave: AdmissionCombination = {
      id: editingComb ? editingComb.id : `c-${Date.now()}`,
      truong_id: school.id,
      ma_to_hop: formMaToHop.trim().toUpperCase(),
      ten_to_hop: formTenToHop.trim() || autoName,
      khoi: formKhoi,
      mon_1: formMon1,
      mon_2: formMon2,
      mon_3: formMon3,
      ghi_chu: formGhiChu
    };

    onSaveCombination(toSave);
    setIsModalOpen(false);
    onShowToast('success', editingComb ? 'Đã sửa tổ hợp' : 'Đã thêm tổ hợp mới', `${toSave.ma_to_hop}: ${toSave.ten_to_hop}`);
  };

  const khoiColors: Record<string, string> = {
    A: 'bg-blue-100 text-blue-800 border-blue-200',
    B: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    C: 'bg-amber-100 text-amber-800 border-amber-200',
    D: 'bg-purple-100 text-purple-800 border-purple-200',
    X: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  // Tính danh sách thí sinh có điểm của tổ hợp đang xem
  const activeCombStudents = useMemo(() => {
    if (!viewingScoresComb || students.length === 0) return [];
    return ScoreCalculator.getTopStudentsByCombination(viewingScoresComb, students, scores, 100);
  }, [viewingScoresComb, students, scores]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            Danh Mục Tổ Hợp Xét Tuyển Đại Học (Khối A, B, C, D, X)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem điểm thi, xếp hạng top thí sinh theo từng tổ hợp ĐH • Chương trình GDPT 2018
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Tổ Hợp</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'A', 'B', 'C', 'D', 'X'].map(k => (
            <button
              key={k}
              onClick={() => setSelectedKhoi(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedKhoi === k
                  ? 'bg-adminNavy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k === 'ALL' ? `Tất Cả (${combinations.length})` : `Khối ${k} (${combinations.filter(c => c.khoi === k).length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã (A00, X06), môn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden"
          />
        </div>
      </div>

      {/* Combinations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCombinations.map(c => {
          // Tính sơ bộ top thí sinh và điểm của tổ hợp này
          const topList = ScoreCalculator.getTopStudentsByCombination(c, students, scores, 10);
          const topStudent = topList[0];
          const totalCandidates = topList.length;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {c.ma_to_hop}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {totalCandidates} TS
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${khoiColors[c.khoi] || 'bg-slate-100 text-slate-700'}`}>
                      Khối {c.khoi}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-xs font-medium text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span>1. {c.mon_1}</span>
                    </div>
                    {topStudent && (
                      <span className="font-mono font-bold text-slate-600 text-[11px]">
                        {topStudent.score_mon1.toFixed(2)} đ
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span>2. {c.mon_2}</span>
                    </div>
                    {topStudent && (
                      <span className="font-mono font-bold text-slate-600 text-[11px]">
                        {topStudent.score_mon2.toFixed(2)} đ
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span>3. {c.mon_3}</span>
                    </div>
                    {topStudent && (
                      <span className="font-mono font-bold text-slate-600 text-[11px]">
                        {topStudent.score_mon3.toFixed(2)} đ
                      </span>
                    )}
                  </div>
                </div>

                {topStudent ? (
                  <div className="mt-2.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 p-2 rounded-xl">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-900 font-bold flex items-center gap-1">
                        🏆 Top 1: <span className="font-semibold text-slate-800 truncate max-w-[110px]">{topStudent.student.ho_ten}</span>
                      </span>
                      <span className="font-bold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200">
                        {topStudent.total_score.toFixed(2)} đ
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between font-mono mt-1 pt-1 border-t border-sky-100">
                      <span>Lớp: {topStudent.student.lop}</span>
                      <span>{topStudent.score_mon1.toFixed(1)} + {topStudent.score_mon2.toFixed(1)} + {topStudent.score_mon3.toFixed(1)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg text-center">
                    Chưa có thí sinh dự thi đủ 3 môn
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => setViewingScoresComb(c)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title={`Xem bảng điểm và xếp hạng thí sinh tổ hợp ${c.ma_to_hop}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Xem Điểm Thi</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(c)}
                    className="p-1.5 text-slate-400 hover:text-sky-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Sửa tổ hợp"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa tổ hợp ${c.ma_to_hop}?`)) onDeleteCombination(c.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa tổ hợp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: View Scores & Ranking for Specific Combination */}
      {viewingScoresComb && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-white bg-sky-600 px-2.5 py-0.5 rounded-lg">
                    {viewingScoresComb.ma_to_hop}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bảng Điểm & Xếp Hạng Khối {viewingScoresComb.khoi}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  3 môn xét tuyển: <strong>{viewingScoresComb.mon_1}</strong> + <strong>{viewingScoresComb.mon_2}</strong> + <strong>{viewingScoresComb.mon_3}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewingScoresComb(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {activeCombStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có thí sinh dự thi tổ hợp này</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Không có thí sinh nào đăng ký và có đủ điểm 3 môn: {viewingScoresComb.mon_1}, {viewingScoresComb.mon_2}, {viewingScoresComb.mon_3}.
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-adminNavy text-white border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center font-bold">Hạng</th>
                      <th className="py-2.5 px-3 text-center font-bold">SBD</th>
                      <th className="py-2.5 px-3 font-bold">Họ và Tên</th>
                      <th className="py-2.5 px-3 text-center font-bold">Lớp</th>
                      <th className="py-2.5 px-3 text-right font-bold">{viewingScoresComb.mon_1}</th>
                      <th className="py-2.5 px-3 text-right font-bold">{viewingScoresComb.mon_2}</th>
                      <th className="py-2.5 px-3 text-right font-bold">{viewingScoresComb.mon_3}</th>
                      <th className="py-2.5 px-3 text-right font-bold bg-sky-900/80">Tổng Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeCombStudents.map((item, idx) => (
                      <tr
                        key={item.student.id}
                        className={idx < 3 ? 'bg-amber-50/50 font-semibold' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2 px-3 text-center">
                          {idx === 0 && <span className="inline-block px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full font-bold text-[10px]">🥇 1</span>}
                          {idx === 1 && <span className="inline-block px-2 py-0.5 bg-slate-300 text-slate-900 rounded-full font-bold text-[10px]">🥈 2</span>}
                          {idx === 2 && <span className="inline-block px-2 py-0.5 bg-amber-600 text-white rounded-full font-bold text-[10px]">🥉 3</span>}
                          {idx >= 3 && <span className="text-slate-500 font-mono">{idx + 1}</span>}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sky-700">{item.student.sbd}</td>
                        <td className="py-2 px-3 text-slate-900">{item.student.ho_ten}</td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-600">{item.student.lop}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.score_mon1.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.score_mon2.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">{item.score_mon3.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-sky-700 bg-sky-50/50">
                          {item.total_score.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Tổng cộng: <strong>{activeCombStudents.length}</strong> thí sinh đạt điều kiện xét tuyển
              </span>
              {onNavigateToReports && (
                <button
                  onClick={() => {
                    setViewingScoresComb(null);
                    onNavigateToReports();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Mở Báo Cáo & In File Excel/PDF</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Combination */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              {editingComb ? 'Chỉnh Sửa Tổ Hợp' : 'Thêm Tổ Hợp Mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Tổ Hợp *</label>
                  <input
                    type="text"
                    required
                    value={formMaToHop}
                    onChange={e => setFormMaToHop(e.target.value)}
                    placeholder="VD: A00, X06"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thuộc Khối *</label>
                  <select
                    value={formKhoi}
                    onChange={e => setFormKhoi(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-hidden"
                  >
                    <option value="A">Khối A (Toán - KHTN)</option>
                    <option value="B">Khối B (Toán - Hóa/Sinh)</option>
                    <option value="C">Khối C (Văn - KHXH)</option>
                    <option value="D">Khối D (Ngoại ngữ)</option>
                    <option value="X">Khối X (Tin học / Công nghệ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn 1 *</label>
                <select
                  value={formMon1}
                  onChange={e => setFormMon1(e.target.value as Subject)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn 2 *</label>
                <select
                  value={formMon2}
                  onChange={e => setFormMon2(e.target.value as Subject)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn 3 *</label>
                <select
                  value={formMon3}
                  onChange={e => setFormMon3(e.target.value as Subject)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={formGhiChu}
                  onChange={e => setFormGhiChu(e.target.value)}
                  placeholder="VD: Tổ hợp xét tuyển ngành CNTT"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs"
                >
                  Lưu Tổ Hợp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
