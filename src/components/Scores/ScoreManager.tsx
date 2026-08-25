import React, { useState, useMemo } from 'react';
import { 
  Edit3, 
  FileSpreadsheet, 
  Download, 
  Save, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Sparkles, 
  FileDown, 
  X, 
  AlertTriangle, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Student, ExamScore, School, ExamConfig } from '../../types';
import { ScoreCalculator } from '../../services/score-calc';
import { ExcelImporterService, ScoreImportResult } from '../../services/excel-importer';
import { ExportService } from '../../services/export-service';

interface ScoreManagerProps {
  students: Student[];
  scores: ExamScore[];
  school: School;
  examConfig: ExamConfig;
  onSaveScore: (score: ExamScore) => void;
  onSaveBulkScores: (scores: ExamScore[]) => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ScoreManager: React.FC<ScoreManagerProps> = ({
  students,
  scores,
  school,
  examConfig,
  onSaveScore,
  onSaveBulkScores,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PASS' | 'FAIL' | 'DIEM_LIET'>('ALL');

  // Excel Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ScoreImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Local grid edit state for real-time editing
  const [editingScores, setEditingScores] = useState<Record<string, ExamScore>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Map of scores by SBD
  const scoreMap = useMemo(() => {
    const map = new Map<string, ExamScore>();
    scores.forEach(s => map.set(s.sbd, s));
    return map;
  }, [scores]);

  // Combined Student + Score + Graduation Result
  const studentResults = useMemo(() => {
    return students.map(st => {
      const liveScore = editingScores[st.sbd] || scoreMap.get(st.sbd) || {
        id: `sc-${st.id}`,
        truong_id: school.id,
        sbd: st.sbd,
        toan: null,
        van: null,
        mon_1: null,
        mon_2: null,
        khuyen_khich: st.khuyen_khich,
        uu_tien: st.uu_tien
      };

      const evalResult = ScoreCalculator.evaluateGraduation(st, liveScore);
      return {
        student: st,
        score: liveScore,
        evalResult
      };
    });
  }, [students, scoreMap, editingScores, school.id]);

  // Filtered list
  const filteredResults = useMemo(() => {
    return studentResults.filter(({ student, evalResult }) => {
      const matchQuery = student.ho_ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.sbd.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.lop.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClass === 'ALL' || student.lop === selectedClass;
      
      let matchStatus = true;
      if (filterStatus === 'PASS') matchStatus = evalResult.is_pass;
      else if (filterStatus === 'FAIL') matchStatus = !evalResult.is_pass;
      else if (filterStatus === 'DIEM_LIET') matchStatus = evalResult.is_diem_liet;

      return matchQuery && matchClass && matchStatus;
    }).sort((a, b) => a.student.sbd.localeCompare(b.student.sbd));
  }, [studentResults, searchQuery, selectedClass, filterStatus]);

  // Classes list
  const classList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.lop))).sort();
  }, [students]);

  // Handle cell edit
  const handleScoreCellChange = (sbd: string, field: keyof ExamScore, value: string) => {
    const current = editingScores[sbd] || scoreMap.get(sbd) || {
      id: '',
      truong_id: school.id,
      sbd,
      toan: null,
      van: null,
      mon_1: null,
      mon_2: null
    };

    let numVal: number | null = null;
    if (value.trim() !== '') {
      numVal = parseFloat(value.replace(',', '.'));
      if (isNaN(numVal) || numVal < 0 || numVal > 10) return; // Ignore invalid
    }

    const updated = {
      ...current,
      [field]: numVal
    };

    setEditingScores(prev => ({
      ...prev,
      [sbd]: updated
    }));
    setHasUnsavedChanges(true);
  };

  // Save all in-grid changes
  const handleSaveAllGridScores = () => {
    const list = Object.values(editingScores);
    if (list.length === 0) return;
    onSaveBulkScores(list);
    setEditingScores({});
    setHasUnsavedChanges(false);
    onShowToast('success', 'Đã lưu điểm thi', `Đã cập nhật dữ liệu điểm cho ${list.length} thí sinh.`);
  };

  // Import Excel
  const handleSelectExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const json = await ExcelImporterService.readExcelToJson(file);
      const result = ExcelImporterService.parseScoresExcel(json, school.id, students);
      setImportResult(result);
      setIsImportModalOpen(true);
    } catch (err: any) {
      onShowToast('error', 'Lỗi đọc file Excel điểm', err.message || 'Không thể đọc nội dung file.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Confirm Import
  const handleConfirmImportScores = () => {
    if (!importResult || importResult.validScores.length === 0) return;
    onSaveBulkScores(importResult.validScores);
    setIsImportModalOpen(false);
    setImportResult(null);
    onShowToast('success', 'Import điểm thành công', `Đã cập nhật điểm cho ${importResult.validScores.length} thí sinh.`);
  };

  // Export 3 formats
  const handleExportScores = async (ext: 'xlsx' | 'pdf' | 'docx') => {
    const columns = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' as const },
      { header: 'SBD', key: 'sbd', width: 12, align: 'center' as const },
      { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' as const },
      { header: 'Lớp', key: 'lop', width: 8, align: 'center' as const },
      { header: 'Toán', key: 'toan', width: 8, align: 'right' as const },
      { header: 'Ngữ văn', key: 'van', width: 8, align: 'right' as const },
      { header: 'Môn TC 1', key: 'mon_1', width: 14, align: 'right' as const },
      { header: 'Môn TC 2', key: 'mon_2', width: 14, align: 'right' as const },
      { header: 'TB 3N', key: 'tb_3_nam', width: 8, align: 'right' as const },
      { header: 'KK', key: 'kk', width: 6, align: 'right' as const },
      { header: 'UT', key: 'ut', width: 6, align: 'right' as const },
      { header: 'ĐXTN', key: 'dxtn', width: 10, align: 'right' as const },
      { header: 'Kết Quả', key: 'ket_qua', width: 12, align: 'center' as const },
    ];

    const rows = filteredResults.map(({ student, score, evalResult }, i) => ({
      stt: i + 1,
      sbd: student.sbd,
      ho_ten: student.ho_ten,
      lop: student.lop,
      toan: score.toan !== null && score.toan !== undefined ? score.toan.toFixed(2) : '',
      van: score.van !== null && score.van !== undefined ? score.van.toFixed(2) : '',
      mon_1: score.mon_1 !== null && score.mon_1 !== undefined ? `${student.mon_tu_chon_1}: ${score.mon_1.toFixed(2)}` : student.mon_tu_chon_1,
      mon_2: score.mon_2 !== null && score.mon_2 !== undefined ? `${student.mon_tu_chon_2}: ${score.mon_2.toFixed(2)}` : student.mon_tu_chon_2,
      tb_3_nam: evalResult.tb_3_nam.toFixed(2),
      kk: score.khuyen_khich || student.khuyen_khich || 0,
      ut: score.uu_tien || student.uu_tien || 0,
      dxtn: evalResult.dxtn.toFixed(2),
      ket_qua: evalResult.is_pass ? 'ĐỖ TN' : (evalResult.is_diem_liet ? 'HỎNG (Liệt)' : 'HỎNG TN')
    }));

    const exportData = {
      reportTitle: 'BẢNG TỔNG HỢP ĐIỂM THI VÀ XÉT CÔNG NHẬN TỐT NGHIỆP THPT',
      subTitle: `${examConfig.ten_ky_thi} - Điểm liệt: <= 1.0 điểm`,
      school,
      examConfig,
      columns,
      rows,
      landscape: true
    };

    if (ext === 'xlsx') await ExportService.exportToExcel(exportData);
    else if (ext === 'pdf') ExportService.exportToPdf(exportData);
    else if (ext === 'docx') await ExportService.exportToWord(exportData);

    onShowToast('success', 'Xuất bảng điểm thành công', `Đã tạo file ${ext.toUpperCase()}`);
  };

  // Quick statistics
  const totalGraduated = studentResults.filter(r => r.evalResult.is_pass).length;
  const passRate = students.length > 0 ? ((totalGraduated / students.length) * 100).toFixed(1) : '0';
  const totalDiemLiet = studentResults.filter(r => r.evalResult.is_diem_liet).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-sky-600" />
            Nhập Điểm & Xét Công Nhận Tốt Nghiệp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Công thức: ĐXTN = [ (Toán + Văn + M1 + M2)/4 + KK/4 + TB_3năm ] / 2 + UT • Điều kiện đỗ: ĐXTN ≥ 5.0 và không có môn nào ≤ 1.0
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tải mẫu điểm Excel */}
          <button
            onClick={() => ExcelImporterService.downloadScoreSampleTemplate()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Mẫu Điểm</span>
          </button>

          {/* Import Excel */}
          <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium cursor-pointer shadow-xs transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Đang đọc file...' : 'Nhập Điểm Từ Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleSelectExcelFile}
              disabled={isImporting}
            />
          </label>

          {/* Lưu thay đổi trực tiếp */}
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAllGridScores}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md animate-bounce"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Điểm Đã Sửa</span>
            </button>
          )}

          {/* Xuất danh sách 3 định dạng */}
          <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <span className="px-2 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 border-r border-slate-300">
              <FileDown className="w-3.5 h-3.5" />
              Xuất Bảng:
            </span>
            <button
              onClick={() => handleExportScores('xlsx')}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              Excel
            </button>
            <button
              onClick={() => handleExportScores('pdf')}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              PDF
            </button>
            <button
              onClick={() => handleExportScores('docx')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition-colors"
            >
              Word
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tỉ lệ đỗ tốt nghiệp</div>
            <div className="text-xl font-bold text-sky-900">{passRate}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Số thí sinh đỗ TN</div>
            <div className="text-xl font-bold text-emerald-700">{totalGraduated} / {students.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Số thí sinh hỏng TN</div>
            <div className="text-xl font-bold text-rose-700">{students.length - totalGraduated}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Thí sinh bị điểm liệt (≤1.0)</div>
            <div className={`text-xl font-bold ${totalDiemLiet > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {totalDiemLiet} TS
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo SBD, Họ tên, Lớp..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden"
            >
              <option value="ALL">Tất cả lớp ({classList.length})</option>
              {classList.map(c => (
                <option key={c} value={c}>Lớp {c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden font-medium"
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="PASS">✅ Đỗ tốt nghiệp (ĐXTN ≥ 5.0)</option>
              <option value="FAIL">❌ Hỏng tốt nghiệp</option>
              <option value="DIEM_LIET">⚠️ Bị điểm liệt (≤ 1.0 điểm)</option>
            </select>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            Có điểm đang chỉnh sửa chưa lưu!
          </div>
        )}
      </div>

      {/* Interactive Score Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-adminNavy text-white font-semibold select-none">
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3 w-24 text-center">SBD</th>
                <th className="p-3 min-w-[160px]">Họ và Tên</th>
                <th className="p-3 w-16 text-center">Lớp</th>
                <th className="p-3 w-20 text-center bg-sky-950/40">Toán</th>
                <th className="p-3 w-20 text-center bg-sky-950/40">Ngữ văn</th>
                <th className="p-3 w-32 text-center bg-indigo-950/40">Môn Tự Chọn 1</th>
                <th className="p-3 w-32 text-center bg-indigo-950/40">Môn Tự Chọn 2</th>
                <th className="p-3 w-16 text-center" title="Điểm trung bình 3 năm">TB 3N</th>
                <th className="p-3 w-14 text-center">KK</th>
                <th className="p-3 w-14 text-center">UT</th>
                <th className="p-3 w-20 text-center bg-amber-950/30">ĐXTN</th>
                <th className="p-3 w-28 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400 italic">
                    Không có dữ liệu điểm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredResults.map(({ student, score, evalResult }, idx) => {
                  const isToanLiet = score.toan !== null && score.toan !== undefined && score.toan <= 1.0;
                  const isVanLiet = score.van !== null && score.van !== undefined && score.van <= 1.0;
                  const isMon1Liet = score.mon_1 !== null && score.mon_1 !== undefined && score.mon_1 <= 1.0;
                  const isMon2Liet = score.mon_2 !== null && score.mon_2 !== undefined && score.mon_2 <= 1.0;

                  return (
                    <tr key={student.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-sky-800 bg-sky-50/50 rounded">
                        {student.sbd}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{student.ho_ten}</td>
                      <td className="p-2.5 text-center text-slate-600">{student.lop}</td>

                      {/* Toán input */}
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={score.toan !== null && score.toan !== undefined ? score.toan : ''}
                          onChange={e => handleScoreCellChange(student.sbd, 'toan', e.target.value)}
                          placeholder="-"
                          className={`w-16 py-1 px-1.5 text-center text-xs font-mono font-bold rounded-lg border outline-hidden transition-all ${
                            isToanLiet
                              ? 'bg-rose-100 border-rose-400 text-rose-800'
                              : 'bg-white border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                          }`}
                        />
                      </td>

                      {/* Văn input */}
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={score.van !== null && score.van !== undefined ? score.van : ''}
                          onChange={e => handleScoreCellChange(student.sbd, 'van', e.target.value)}
                          placeholder="-"
                          className={`w-16 py-1 px-1.5 text-center text-xs font-mono font-bold rounded-lg border outline-hidden transition-all ${
                            isVanLiet
                              ? 'bg-rose-100 border-rose-400 text-rose-800'
                              : 'bg-white border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                          }`}
                        />
                      </td>

                      {/* Môn 1 input */}
                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 max-w-[65px] truncate" title={student.mon_tu_chon_1}>
                            {student.mon_tu_chon_1}:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={score.mon_1 !== null && score.mon_1 !== undefined ? score.mon_1 : ''}
                            onChange={e => handleScoreCellChange(student.sbd, 'mon_1', e.target.value)}
                            placeholder="-"
                            className={`w-14 py-1 px-1 text-center text-xs font-mono font-bold rounded-lg border outline-hidden ${
                              isMon1Liet
                                ? 'bg-rose-100 border-rose-400 text-rose-800'
                                : 'bg-white border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Môn 2 input */}
                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 max-w-[65px] truncate" title={student.mon_tu_chon_2}>
                            {student.mon_tu_chon_2}:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={score.mon_2 !== null && score.mon_2 !== undefined ? score.mon_2 : ''}
                            onChange={e => handleScoreCellChange(student.sbd, 'mon_2', e.target.value)}
                            placeholder="-"
                            className={`w-14 py-1 px-1 text-center text-xs font-mono font-bold rounded-lg border outline-hidden ${
                              isMon2Liet
                                ? 'bg-rose-100 border-rose-400 text-rose-800'
                                : 'bg-white border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* TB 3 năm */}
                      <td className="p-2.5 text-center font-mono text-slate-600 font-medium">
                        {evalResult.tb_3_nam.toFixed(2)}
                      </td>

                      {/* KK & UT */}
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {score.khuyen_khich ?? student.khuyen_khich ?? 0}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {score.uu_tien ?? student.uu_tien ?? 0}
                      </td>

                      {/* ĐXTN */}
                      <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-amber-50/40">
                        {evalResult.dxtn.toFixed(2)}
                      </td>

                      {/* Trạng thái tốt nghiệp */}
                      <td className="p-2.5 text-center">
                        {evalResult.is_pass ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐỖ ({evalResult.xep_loai})
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            evalResult.is_diem_liet
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            <XCircle className="w-3 h-3" />
                            {evalResult.is_diem_liet ? 'Liệt môn' : 'Hỏng TN'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Preview & Confirm Import Scores from Excel */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Kiểm Tra Điểm Import Từ File Excel
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-600">
              Tìm thấy: <strong className="text-emerald-700">{importResult.validScores.length}</strong> dòng điểm hợp lệ | Cảnh báo: <strong className="text-amber-600">{importResult.errors.length}</strong>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 max-h-32 overflow-y-auto space-y-1">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="text-xs text-amber-800 flex items-center gap-2">
                    <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">Dòng {err.row}</span>
                    <span className="font-semibold">[{err.field}]:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2 text-center">STT</th>
                    <th className="p-2 text-center">SBD</th>
                    <th className="p-2 text-center">Toán</th>
                    <th className="p-2 text-center">Ngữ văn</th>
                    <th className="p-2 text-center">Môn TC 1</th>
                    <th className="p-2 text-center">Môn TC 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.validScores.map((sc, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400">{i + 1}</td>
                      <td className="p-2 text-center font-mono font-bold text-sky-800">{sc.sbd}</td>
                      <td className="p-2 text-center font-mono">{sc.toan ?? '-'}</td>
                      <td className="p-2 text-center font-mono">{sc.van ?? '-'}</td>
                      <td className="p-2 text-center font-mono">{sc.mon_1 ?? '-'}</td>
                      <td className="p-2 text-center font-mono">{sc.mon_2 ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmImportScores}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs"
              >
                Cập Nhật {importResult.validScores.length} Điểm Thí Sinh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
