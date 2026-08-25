import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  Hash, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileDown, 
  AlertCircle
} from 'lucide-react';
import { Student, Subject, ELECTIVE_SUBJECTS, School, ExamConfig } from '../../types';
import { ExcelImporterService, ImportError } from '../../services/excel-importer';
import { ExportService } from '../../services/export-service';

interface StudentManagerProps {
  students: Student[];
  school: School;
  examConfig: ExamConfig;
  onSaveStudent: (student: Student) => void;
  onSaveBulkStudents: (students: Student[]) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteBulkStudents: (ids: string[]) => void;
  onClearAllStudents?: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  school,
  examConfig,
  onSaveStudent,
  onSaveBulkStudents,
  onDeleteStudent,
  onDeleteBulkStudents,
  onClearAllStudents,
  onShowToast,
}) => {
  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsedStudents, setImportParsedStudents] = useState<Student[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Student Form State
  const [formSbd, setFormSbd] = useState('');
  const [formHoTen, setFormHoTen] = useState('');
  const [formNgaySinh, setFormNgaySinh] = useState('');
  const [formLop, setFormLop] = useState('12A1');
  const [formGioiTinh, setFormGioiTinh] = useState<'Nam' | 'Nữ'>('Nam');
  const [formNoiSinh, setFormNoiSinh] = useState('Cà Mau');
  const [formDanToc, setFormDanToc] = useState('Kinh');
  const [formTb10, setFormTb10] = useState(8.0);
  const [formTb11, setFormTb11] = useState(8.0);
  const [formTb12, setFormTb12] = useState(8.0);
  const [formMon1, setFormMon1] = useState<Subject>('Vật lí');
  const [formMon2, setFormMon2] = useState<Subject>('Hóa học');
  const [formKk, setFormKk] = useState(0);
  const [formUt, setFormUt] = useState(0);

  // Unique Classes list for filter
  const classList = useMemo(() => {
    const set = new Set(students.map(s => s.lop));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchQuery = s.ho_ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.sbd.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.lop.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClass === 'ALL' || s.lop === selectedClass;
      const matchSubject = selectedSubject === 'ALL' || s.mon_tu_chon_1 === selectedSubject || s.mon_tu_chon_2 === selectedSubject;
      return matchQuery && matchClass && matchSubject;
    }).sort((a, b) => (a.sbd || '').localeCompare(b.sbd || '') || a.lop.localeCompare(b.lop) || a.ho_ten.localeCompare(b.ho_ten, 'vi'));
  }, [students, searchQuery, selectedClass, selectedSubject]);

  // Toggle Selection
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Open Form Modal for Create or Edit
  const handleOpenForm = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormSbd(student.sbd || '');
      setFormHoTen(student.ho_ten);
      setFormNgaySinh(student.ngay_sinh);
      setFormLop(student.lop);
      setFormGioiTinh(student.gioi_tinh);
      setFormNoiSinh(student.noi_sinh || 'Cà Mau');
      setFormDanToc(student.dan_toc || 'Kinh');
      setFormTb10(student.tb_lop_10);
      setFormTb11(student.tb_lop_11);
      setFormTb12(student.tb_lop_12);
      setFormMon1(student.mon_tu_chon_1);
      setFormMon2(student.mon_tu_chon_2);
      setFormKk(student.khuyen_khich || 0);
      setFormUt(student.uu_tien || 0);
    } else {
      setEditingStudent(null);
      setFormSbd('');
      setFormHoTen('');
      setFormNgaySinh('2007-01-15');
      setFormLop('12A1');
      setFormGioiTinh('Nam');
      setFormNoiSinh('Cà Mau');
      setFormDanToc('Kinh');
      setFormTb10(0);
      setFormTb11(0);
      setFormTb12(0);
      setFormMon1('Vật lí');
      setFormMon2('Hóa học');
      setFormKk(0);
      setFormUt(0);
    }
    setIsFormModalOpen(true);
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHoTen.trim()) {
      onShowToast('error', 'Lỗi nhập liệu', 'Vui lòng điền Họ tên thí sinh.');
      return;
    }
    if (formMon1 === formMon2) {
      onShowToast('error', 'Lỗi môn tự chọn', 'Môn tự chọn 1 và Môn 2 không được trùng nhau.');
      return;
    }

    // Check duplicate name warning
    const duplicateName = students.find(s => s.ho_ten.toLowerCase() === formHoTen.trim().toLowerCase() && s.id !== editingStudent?.id);
    if (duplicateName) {
      onShowToast('warning', 'Cảnh báo trùng tên', `Trùng tên với thí sinh lớp ${duplicateName.lop} (SBD: ${duplicateName.sbd || 'Chưa cấp'}).`);
    }

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : `st-${Date.now()}`,
      truong_id: school.id,
      sbd: formSbd.trim(),
      ho_ten: formHoTen.trim(),
      ngay_sinh: formNgaySinh,
      lop: formLop,
      gioi_tinh: formGioiTinh,
      noi_sinh: formNoiSinh,
      dan_toc: formDanToc,
      tb_lop_10: Number(formTb10) || 0,
      tb_lop_11: Number(formTb11) || 0,
      tb_lop_12: Number(formTb12) || 0,
      mon_tu_chon_1: formMon1,
      mon_tu_chon_2: formMon2,
      khuyen_khich: Number(formKk) || 0,
      uu_tien: Number(formUt) || 0,
    };

    onSaveStudent(studentToSave);
    setIsFormModalOpen(false);
    onShowToast('success', editingStudent ? 'Đã cập nhật thí sinh' : 'Đã thêm thí sinh mới', `${studentToSave.ho_ten}`);
  };

  // Tách Tên và Họ đệm để sắp xếp chuẩn tiếng Việt (Chuẩn Khảo thí Quốc gia)
  const getVietnameseNameParts = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { hoDem: '', ten: parts[0] };
    const ten = parts[parts.length - 1];
    const hoDem = parts.slice(0, -1).join(' ');
    return { hoDem, ten };
  };

  // Auto Generate SBD for all students (Sắp xếp Lớp -> Tên -> Họ đệm -> Ngày sinh)
  const handleAutoGenerateSbd = () => {
    if (students.length === 0) {
      onShowToast('warning', 'Chưa có dữ liệu', 'Vui lòng thêm hoặc import danh sách thí sinh trước.');
      return;
    }

    const prefix = examConfig.tien_to_sbd || '01';
    const sorted = [...students].sort((a, b) => {
      // 1. Sắp xếp theo Lớp
      if (a.lop !== b.lop) return a.lop.localeCompare(b.lop, 'vi');
      
      // 2. Sắp xếp theo Tên (từ cuối)
      const nameA = getVietnameseNameParts(a.ho_ten);
      const nameB = getVietnameseNameParts(b.ho_ten);
      const cmpTen = nameA.ten.localeCompare(nameB.ten, 'vi');
      if (cmpTen !== 0) return cmpTen;

      // 3. Sắp xếp theo Họ và Tên đệm
      const cmpHo = nameA.hoDem.localeCompare(nameB.hoDem, 'vi');
      if (cmpHo !== 0) return cmpHo;

      // 4. Sắp xếp theo Ngày sinh
      return a.ngay_sinh.localeCompare(b.ngay_sinh);
    });

    const updated = sorted.map((st, idx) => ({
      ...st,
      sbd: `${prefix}${String(1000 + idx + 1).padStart(4, '0')}`
    }));

    onSaveBulkStudents(updated);
    onShowToast('success', 'Đánh số báo danh thành công', `Đã sắp xếp thứ tự A-Z và sinh SBD cho ${updated.length} thí sinh (Từ ${updated[0]?.sbd} đến ${updated[updated.length - 1]?.sbd}).`);
  };

  // Handle Excel File Selection & Parse
  const handleSelectExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsImporting(true);

    try {
      const json = await ExcelImporterService.readExcelToJson(file);
      const result = ExcelImporterService.parseStudentsExcel(json, school.id, students.map(s => s.sbd));
      setImportParsedStudents(result.validStudents);
      setImportErrors(result.errors);
      setIsImportModalOpen(true);
    } catch (err: any) {
      onShowToast('error', 'Lỗi đọc file Excel', err.message || 'Không thể đọc nội dung file.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (importParsedStudents.length === 0) return;
    onSaveBulkStudents(importParsedStudents);
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportParsedStudents([]);
    setImportErrors([]);
    onShowToast('success', 'Import thành công', `Đã lưu ${importParsedStudents.length} thí sinh vào hệ thống.`);
  };

  // Export Current Filtered Students to 3 Formats
  const handleExportList = async (ext: 'xlsx' | 'pdf' | 'docx') => {
    const columns = [
      { header: 'STT', key: 'stt', width: 8, align: 'center' as const },
      { header: 'Số Báo Danh', key: 'sbd', width: 14, align: 'center' as const },
      { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 26, align: 'left' as const },
      { header: 'Ngày Sinh', key: 'ngay_sinh', width: 14, align: 'center' as const },
      { header: 'Lớp', key: 'lop', width: 10, align: 'center' as const },
      { header: 'Giới Tính', key: 'gioi_tinh', width: 10, align: 'center' as const },
      { header: 'TB 10', key: 'tb_lop_10', width: 10, align: 'right' as const },
      { header: 'TB 11', key: 'tb_lop_11', width: 10, align: 'right' as const },
      { header: 'TB 12', key: 'tb_lop_12', width: 10, align: 'right' as const },
      { header: 'Môn TC 1', key: 'mon_tu_chon_1', width: 16, align: 'left' as const },
      { header: 'Môn TC 2', key: 'mon_tu_chon_2', width: 16, align: 'left' as const },
      { header: 'KK', key: 'khuyen_khich', width: 8, align: 'right' as const },
      { header: 'UT', key: 'uu_tien', width: 8, align: 'right' as const },
    ];

    const rows = filteredStudents.map((st, i) => ({
      stt: i + 1,
      sbd: st.sbd,
      ho_ten: st.ho_ten,
      ngay_sinh: st.ngay_sinh,
      lop: st.lop,
      gioi_tinh: st.gioi_tinh,
      tb_lop_10: st.tb_lop_10.toFixed(1),
      tb_lop_11: st.tb_lop_11.toFixed(1),
      tb_lop_12: st.tb_lop_12.toFixed(1),
      mon_tu_chon_1: st.mon_tu_chon_1,
      mon_tu_chon_2: st.mon_tu_chon_2,
      khuyen_khich: st.khuyen_khich || 0,
      uu_tien: st.uu_tien || 0
    }));

    const exportData = {
      reportTitle: 'DANH SÁCH THÍ SINH ĐĂNG KÝ DỰ THI TỐT NGHIỆP THPT',
      subTitle: `${examConfig.ten_ky_thi} - Năm học ${examConfig.nam}`,
      school,
      examConfig,
      columns,
      rows,
      landscape: true
    };

    if (ext === 'xlsx') await ExportService.exportToExcel(exportData);
    else if (ext === 'pdf') ExportService.exportToPdf(exportData);
    else if (ext === 'docx') await ExportService.exportToWord(exportData);

    onShowToast('success', 'Xuất báo cáo thành công', `Đã tạo file ${ext.toUpperCase()}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Quản Lý Danh Sách Thí Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <strong className="text-slate-800">{students.length}</strong> thí sinh | Đã cấp SBD: <strong className="text-emerald-600">{students.filter(s => s.sbd && s.sbd !== '0').length}</strong> | Chưa cấp SBD: <strong className={students.filter(s => !s.sbd || s.sbd === '0').length > 0 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{students.filter(s => !s.sbd || s.sbd === '0').length}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tải mẫu Excel */}
          <button
            onClick={() => ExcelImporterService.downloadStudentSampleTemplate()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-300 transition-colors"
            title="File mẫu không cần cột SBD, các cột điểm để trống mặc định nhận giá trị 0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải File Mẫu (Chuẩn Không SBD)</span>
          </button>

          {/* Nhập từ Excel */}
          <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium cursor-pointer shadow-xs transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Đang đọc file...' : 'Nhập Từ Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleSelectExcelFile}
              disabled={isImporting}
            />
          </label>

          {/* Nhập thủ công */}
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm Thí Sinh</span>
          </button>

          {/* Tự sinh SBD chuẩn sau khi chốt danh sách */}
          <button
            onClick={handleAutoGenerateSbd}
            title="Sắp xếp chuẩn theo Lớp -> Tên A-Z -> Họ đệm -> Ngày sinh và sinh SBD"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all animate-pulse"
          >
            <Hash className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Đánh Số Báo Danh Tự Động</span>
          </button>

          {/* Xuất danh sách 3 định dạng */}
          <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <span className="px-2 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 border-r border-slate-300">
              <FileDown className="w-3.5 h-3.5" />
              Xuất DS:
            </span>
            <button
              onClick={() => handleExportList('xlsx')}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              Excel
            </button>
            <button
              onClick={() => handleExportList('pdf')}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              PDF
            </button>
            <button
              onClick={() => handleExportList('docx')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition-colors"
            >
              Word
            </button>
          </div>

          {/* Nút Xóa Toàn Bộ Danh Sách Thí Sinh */}
          {students.length > 0 && onClearAllStudents && (
            <button
              onClick={() => {
                if (window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ ${students.length} THÍ SINH CỦA KỲ THI NÀY KHÔNG?\n\n- Toàn bộ danh sách thí sinh sẽ bị xóa sạch.\n- Phân bổ phòng thi cũng sẽ được làm mới về 0.`)) {
                  onClearAllStudents();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors"
              title="Xóa toàn bộ danh sách thí sinh hiện tại để nhập lại từ đầu"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Toàn Bộ DS</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Số báo danh, Họ tên, Lớp..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Class */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden"
            >
              <option value="ALL">Tất cả lớp ({classList.length} lớp)</option>
              {classList.map(c => (
                <option key={c} value={c}>Lớp {c}</option>
              ))}
            </select>
          </div>

          {/* Filter by Subject */}
          <div>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-hidden"
            >
              <option value="ALL">Tất cả môn tự chọn</option>
              {ELECTIVE_SUBJECTS.map(s => (
                <option key={s} value={s}>Môn {s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Delete Trigger */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl animate-fade-in">
            <span className="text-xs text-rose-700 font-semibold">Đã chọn {selectedIds.size} thí sinh</span>
            <button
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} thí sinh được chọn?`)) {
                  onDeleteBulkStudents(Array.from(selectedIds));
                  setSelectedIds(new Set());
                  onShowToast('success', 'Đã xóa thí sinh', `Đã xóa ${selectedIds.size} thí sinh.`);
                }
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa đã chọn</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-adminNavy text-white border-b border-slate-700 font-semibold select-none">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-sky-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3 w-28 text-center">Số Báo Danh</th>
                <th className="p-3 min-w-[180px]">Họ và Tên</th>
                <th className="p-3 w-24 text-center">Ngày Sinh</th>
                <th className="p-3 w-16 text-center">Giới Tính</th>
                <th className="p-3 min-w-[100px]">Nơi Sinh</th>
                <th className="p-3 w-20 text-center">Dân Tộc</th>
                <th className="p-3 w-16 text-center">Lớp</th>
                <th className="p-3 min-w-[130px] text-center">Môn TC 1</th>
                <th className="p-3 min-w-[130px] text-center">Môn TC 2</th>
                <th className="p-3 w-16 text-center">TB 10</th>
                <th className="p-3 w-16 text-center">TB 11</th>
                <th className="p-3 w-16 text-center">TB 12</th>
                <th className="p-3 w-16 text-center" title="Điểm Khuyến khích">KK</th>
                <th className="p-3 w-16 text-center" title="Điểm Ưu tiên">UT</th>
                <th className="p-3 w-20 text-center sticky right-0 bg-adminNavy">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-slate-400 italic">
                    Không tìm thấy thí sinh nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, index) => {
                  const isSelected = selectedIds.has(st.id);
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-sky-50/60 transition-colors ${
                        isSelected ? 'bg-sky-50' : index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(st.id)}
                          className="rounded text-sky-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center text-slate-500 font-mono font-medium">
                        {index + 1}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {st.sbd && st.sbd.trim() !== '' && st.sbd !== '0' ? (
                          <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {st.sbd}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold border border-amber-300">
                            Chưa cấp SBD
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {st.ho_ten}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono text-[11px]">{st.ngay_sinh}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          st.gioi_tinh === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {st.gioi_tinh}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{st.noi_sinh || '-'}</td>
                      <td className="p-3 text-center text-slate-600">{st.dan_toc || 'Kinh'}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{st.lop}</td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[11px] font-medium text-indigo-700">
                          {st.mon_tu_chon_1}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-medium text-emerald-700">
                          {st.mon_tu_chon_2}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-700">
                        {st.tb_lop_10 > 0 ? st.tb_lop_10.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-700">
                        {st.tb_lop_11 > 0 ? st.tb_lop_11.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-700">
                        {st.tb_lop_12 > 0 ? st.tb_lop_12.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        {st.khuyen_khich > 0 ? (
                          <span className="text-emerald-700 font-semibold">+{st.khuyen_khich}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        {st.uu_tien > 0 ? (
                          <span className="text-emerald-700 font-semibold">+{st.uu_tien}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center sticky right-0 bg-white shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenForm(st)}
                            title="Sửa thí sinh"
                            className="p-1 hover:bg-slate-200 text-slate-600 hover:text-sky-700 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa thí sinh ${st.ho_ten} (${st.sbd})?`)) {
                                onDeleteStudent(st.id);
                                onShowToast('success', 'Đã xóa thí sinh', st.ho_ten);
                              }
                            }}
                            title="Xóa thí sinh"
                            className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Form Thêm / Sửa Thí Sinh */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                {editingStudent ? 'Chỉnh Sửa Thông Tin Thí Sinh' : 'Thêm Thí Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số Báo Danh (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formSbd}
                    onChange={e => setFormSbd(e.target.value)}
                    placeholder="Để trống để tự sinh sau"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={formHoTen}
                    onChange={e => setFormHoTen(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Sinh *</label>
                  <input
                    type="date"
                    required
                    value={formNgaySinh}
                    onChange={e => setFormNgaySinh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp *</label>
                  <input
                    type="text"
                    required
                    value={formLop}
                    onChange={e => setFormLop(e.target.value)}
                    placeholder="VD: 12A1"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới Tính</label>
                  <select
                    value={formGioiTinh}
                    onChange={e => setFormGioiTinh(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white outline-hidden"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nơi Sinh</label>
                  <input
                    type="text"
                    value={formNoiSinh}
                    onChange={e => setFormNoiSinh(e.target.value)}
                    placeholder="VD: Cà Mau"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dân Tộc</label>
                  <input
                    type="text"
                    value={formDanToc}
                    onChange={e => setFormDanToc(e.target.value)}
                    placeholder="VD: Kinh"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Môn Tự Chọn */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
                <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <span>Môn Tự Chọn Đăng Ký (2 môn trong 10 môn)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Môn Tự Chọn 1 *</label>
                    <select
                      value={formMon1}
                      onChange={e => setFormMon1(e.target.value as Subject)}
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden font-medium"
                    >
                      {ELECTIVE_SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Môn Tự Chọn 2 *</label>
                    <select
                      value={formMon2}
                      onChange={e => setFormMon2(e.target.value as Subject)}
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden font-medium"
                    >
                      {ELECTIVE_SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {formMon1 === formMon2 && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Môn tự chọn 1 và Môn 2 không được trùng nhau.
                  </p>
                )}
              </div>

              {/* Điểm Học Bạ & Ưu Tiên */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">TB Lớp 10 (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formTb10}
                    onChange={e => setFormTb10(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">TB Lớp 11 (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formTb11}
                    onChange={e => setFormTb11(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">TB Lớp 12 (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formTb12}
                    onChange={e => setFormTb12(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Khuyến Khích (0-4)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="4"
                    value={formKk}
                    onChange={e => setFormKk(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ưu Tiên (0-2)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="2"
                    value={formUt}
                    onChange={e => setFormUt(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-center outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-adminNavy text-white hover:bg-slate-800 transition-all shadow-xs"
                >
                  {editingStudent ? 'Cập Nhật Thí Sinh' : 'Thêm Vào Danh Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview & Validate Excel Import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Kết Quả Đọc & Kiểm Tra Dữ Liệu File Excel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <strong>{importFile?.name}</strong> | Hợp lệ: <strong className="text-emerald-600">{importParsedStudents.length}</strong> dòng | Cảnh báo/Lỗi: <strong className="text-rose-600">{importErrors.length}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Warning Panel if any */}
            {importErrors.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 max-h-36 overflow-y-auto">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Danh Sách Lỗi & Cảnh Báo Dòng ({importErrors.length}):
                </div>
                <div className="space-y-1">
                  {importErrors.map((err, i) => (
                    <div key={i} className="text-xs text-amber-800 flex items-center gap-2">
                      <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">Dòng {err.row}</span>
                      <span className="font-semibold">[{err.field}]:</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="mt-4 flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700 select-none">
                  <tr>
                    <th className="p-2.5 text-center">STT</th>
                    <th className="p-2.5 text-center">SBD</th>
                    <th className="p-2.5 min-w-[160px]">Họ và Tên</th>
                    <th className="p-2.5 text-center">Ngày Sinh</th>
                    <th className="p-2.5 text-center">Giới Tính</th>
                    <th className="p-2.5">Nơi Sinh</th>
                    <th className="p-2.5 text-center">Dân Tộc</th>
                    <th className="p-2.5 text-center">Lớp</th>
                    <th className="p-2.5 text-center">Môn TC 1</th>
                    <th className="p-2.5 text-center">Môn TC 2</th>
                    <th className="p-2.5 text-center">TB 10</th>
                    <th className="p-2.5 text-center">TB 11</th>
                    <th className="p-2.5 text-center">TB 12</th>
                    <th className="p-2.5 text-center">KK</th>
                    <th className="p-2.5 text-center">UT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importParsedStudents.map((st, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2 text-center font-mono">
                        {st.sbd ? (
                          <span className="font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{st.sbd}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tự sinh sau</span>
                        )}
                      </td>
                      <td className="p-2 font-semibold text-slate-800">{st.ho_ten}</td>
                      <td className="p-2 text-center text-slate-600 font-mono text-[11px]">{st.ngay_sinh}</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          st.gioi_tinh === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {st.gioi_tinh}
                        </span>
                      </td>
                      <td className="p-2 text-slate-600">{st.noi_sinh || '-'}</td>
                      <td className="p-2 text-center text-slate-600">{st.dan_toc || 'Kinh'}</td>
                      <td className="p-2 text-center font-bold text-slate-700">{st.lop}</td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[11px] font-medium text-indigo-700">
                          {st.mon_tu_chon_1}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-medium text-emerald-700">
                          {st.mon_tu_chon_2}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono text-slate-700">{st.tb_lop_10 > 0 ? st.tb_lop_10.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center font-mono text-slate-700">{st.tb_lop_11 > 0 ? st.tb_lop_11.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center font-mono text-slate-700">{st.tb_lop_12 > 0 ? st.tb_lop_12.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center font-mono text-slate-600">{st.khuyen_khich || 0}</td>
                      <td className="p-2 text-center font-mono text-slate-600">{st.uu_tien || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div className="text-xs text-slate-500">
                Nhấn "Lưu vào hệ thống" để hoàn tất import.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importParsedStudents.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu {importParsedStudents.length} Thí Sinh Vào Hệ Thống</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
