import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Download, 
  Layers, 
  Users, 
  FileCheck2, 
  GraduationCap, 
  Filter, 
  Eye,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileDown
} from 'lucide-react';
import { 
  Student, 
  ExamScore, 
  Room, 
  School, 
  ExamConfig, 
  AdmissionCombination, 
  AISubjectAnalysis,
  Subject,
  ELECTIVE_SUBJECTS
} from '../../types';
import { ScoreCalculator } from '../../services/score-calc';
import { ExportService, ExportReportData, ReportColumn } from '../../services/export-service';
import { AIClientService } from '../../services/ai-client';
import { DBService } from '../../services/db';

interface ReportManagerProps {
  students: Student[];
  scores: ExamScore[];
  rooms: Room[];
  assignments: Record<string, string[]>;
  combinations: AdmissionCombination[];
  school: School;
  examConfig: ExamConfig;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ReportManager: React.FC<ReportManagerProps> = ({
  students,
  scores,
  rooms,
  assignments,
  combinations,
  school,
  examConfig,
  onShowToast,
}) => {
  // 2 Groups of Reports
  const [reportGroup, setReportGroup] = useState<'PRE_EXAM' | 'POST_EXAM'>('PRE_EXAM');
  const [selectedReportId, setSelectedReportId] = useState<string>('pre-room');

  // Filter modifiers for sub-reports
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedCombinationId, setSelectedCombinationId] = useState<string>(combinations[0]?.id || 'c-a00');
  const [includeAIAnalysisInExport, setIncludeAIAnalysisInExport] = useState<boolean>(true);

  // Customizable score milestones for Report 10
  const [milestoneLiet, setMilestoneLiet] = useState<number>(1.0);
  const [milestoneDat, setMilestoneDat] = useState<number>(5.0);
  const [milestoneKha, setMilestoneKha] = useState<number>(7.0);
  const [milestoneGioi, setMilestoneGioi] = useState<number>(8.0);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AISubjectAnalysis | null>(() => DBService.getSavedAIAnalysis(school.id));
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  // Unique Classes
  const classList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.lop))).sort();
  }, [students]);

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const scoreMap = useMemo(() => new Map(scores.map(s => [s.sbd, s])), [scores]);

  // All graduation results
  const allGradResults = useMemo(() => {
    return students.map(st => ScoreCalculator.evaluateGraduation(st, scoreMap.get(st.sbd)));
  }, [students, scoreMap]);

  // Subject statistics
  const subjectStats = useMemo(() => {
    return ScoreCalculator.getSubjectStatistics(students, scores);
  }, [students, scores]);

  // 11 Reports Definition (Đồng bộ số thứ tự 1-11 chuẩn nhất quán với các file mẫu)
  const preExamReports = useMemo(() => [
    { id: 'pre-room', label: '1. Danh sách thí sinh theo phòng thi', icon: Layers, badge: '40 Sheet Phòng' },
    { id: 'pre-class', label: '2. Danh sách thí sinh theo lớp', icon: Users, badge: `${classList.length} Sheet Lớp` },
    { id: 'pre-subject', label: '3. Danh sách thí sinh theo môn tự chọn', icon: FileText, badge: '12 Sheet Môn' },
    { id: 'pre-stats-room', label: '4. Danh sách đăng ký dự thi (5 cột)', icon: BarChart3, badge: 'Chuẩn 5 Cột' },
    { id: 'pre-receipt', label: '5. Phiếu thu bài thi', icon: FileCheck2, badge: '40 Sheet Thu Bài' },
    { id: 'pre-blank-sheet', label: '6. Bảng ghi tên ghi điểm (Bản trống phòng thi)', icon: FileCheck2, badge: 'Từng Phòng Thi' },
  ], [classList.length]);

  const postExamReports = useMemo(() => [
    { id: 'post-grad-class', label: '7. Kết quả tốt nghiệp theo lớp', icon: Users, badge: `${classList.length} Sheet Lớp` },
    { id: 'post-grad-all', label: '8. Kết quả tốt nghiệp (Toàn trường)', icon: GraduationCap, badge: 'Toàn Trường' },
    { id: 'post-top-combinations', label: '9. Top thí sinh theo khối xét tuyển ĐH', icon: Sparkles, badge: '5 Sheet Khối ĐH' },
    { id: 'post-score-milestones', label: '10. Thống kê điểm thi theo mốc tùy chỉnh', icon: BarChart3, badge: 'Tùy Chỉnh Mốc' },
    { id: 'post-subject-details', label: '11. Thống kê điểm theo từng môn học', icon: TrendingUp },
  ], [classList.length]);

  // Handle Run AI Analysis
  const handleRunAIAnalysis = async () => {
    setIsAnalyzingAI(true);
    setAiAnalysis(null);
    try {
      const passedCount = allGradResults.filter(r => r.is_pass).length;
      const passRate = students.length > 0 ? Number(((passedCount / students.length) * 100).toFixed(1)) : 0;
      
      const classPassRates: Record<string, { total: number; pass: number }> = {};
      allGradResults.forEach(r => {
        const cl = r.student.lop;
        if (!classPassRates[cl]) classPassRates[cl] = { total: 0, pass: 0 };
        classPassRates[cl].total++;
        if (r.is_pass) classPassRates[cl].pass++;
      });

      const weakClasses = Object.entries(classPassRates)
        .filter(([, v]) => (v.pass / v.total) < 0.7)
        .map(([k, v]) => `Lớp ${k} (${((v.pass / v.total) * 100).toFixed(0)}% đỗ)`);

      const result = await AIClientService.analyzeExamData(
        school.ten_truong,
        examConfig.ten_ky_thi,
        subjectStats,
        passRate,
        students.length,
        weakClasses
      );

      setAiAnalysis(result);
      onShowToast('success', 'Hoàn tất phân tích AI', `Phục vụ bởi: ${result.provider_used}`);
    } catch (err: any) {
      onShowToast('error', 'Lỗi phân tích AI', err.message || 'Không thể chạy phân tích.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Build Report Data Dynamic Generator
  const currentReportData = useMemo((): ExportReportData => {
    let reportTitle = '';
    let subTitle = `${examConfig.ten_ky_thi} - Năm học ${examConfig.nam}`;
    let columns: ReportColumn[] = [];
    let rows: Record<string, any>[] = [];
    let pages: { title?: string; subTitle?: string; rows: Record<string, any>[] }[] = [];
    let landscape = false;

    // 1. Danh sách thí sinh theo phòng thi (Mỗi phòng 1 trang A4)
    if (selectedReportId === 'pre-room') {
      const room = rooms.find(r => r.id === selectedRoomId);
      reportTitle = room ? `DANH SÁCH THÍ SINH PHÒNG THI ${room.ma_phong} (${room.ten_phong})` : 'DANH SÁCH THÍ SINH THEO TẤT CẢ PHÒNG THI';
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Phòng Thi', key: 'phong', width: 14, align: 'left' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Môn Tự Chọn 1', key: 'mon1', width: 16, align: 'left' },
        { header: 'Môn Tự Chọn 2', key: 'mon2', width: 16, align: 'left' },
      ];

      const targetRooms = room ? [room] : rooms;
      const pagesList: { title?: string; subTitle?: string; rows: Record<string, any>[] }[] = [];

      targetRooms.forEach(r => {
        const studentIds = assignments[r.id] || [];
        const roomStudents = studentIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];
        const pageRows = roomStudents.map((st, idx) => ({
          stt: idx + 1,
          phong: r.ten_phong,
          sbd: st.sbd,
          ho_ten: st.ho_ten,
          lop: st.lop,
          mon1: st.mon_tu_chon_1,
          mon2: st.mon_tu_chon_2
        }));

        pagesList.push({
          title: `DANH SÁCH THÍ SINH ${r.ten_phong.toUpperCase()}`,
          subTitle: `${examConfig.ten_ky_thi} - Sức chứa: ${r.suc_chua} TS (Đã xếp: ${pageRows.length} TS)`,
          rows: pageRows
        });

        pageRows.forEach(pr => rows.push(pr));
      });

      pages = pagesList;
    }

    // 2. Danh sách thí sinh theo lớp (Mỗi lớp 1 trang A4)
    else if (selectedReportId === 'pre-class') {
      reportTitle = selectedClass === 'ALL' ? 'DANH SÁCH THÍ SINH THEO TỪNG LỚP' : `DANH SÁCH THÍ SINH LỚP ${selectedClass}`;
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Ngày Sinh', key: 'ngay_sinh', width: 12, align: 'center' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Môn Tự Chọn 1', key: 'mon1', width: 16, align: 'left' },
        { header: 'Môn Tự Chọn 2', key: 'mon2', width: 16, align: 'left' },
      ];

      const targetClasses = selectedClass === 'ALL' ? classList : [selectedClass];
      const pagesList: { title?: string; subTitle?: string; rows: Record<string, any>[] }[] = [];

      targetClasses.forEach(cl => {
        const classStudents = students.filter(s => s.lop === cl);
        const pageRows = classStudents.map((st, i) => ({
          stt: i + 1,
          sbd: st.sbd,
          ho_ten: st.ho_ten,
          ngay_sinh: st.ngay_sinh,
          lop: st.lop,
          mon1: st.mon_tu_chon_1,
          mon2: st.mon_tu_chon_2
        }));

        pagesList.push({
          title: `DANH SÁCH THÍ SINH LỚP ${cl}`,
          subTitle: `${examConfig.ten_ky_thi} - Tổng số: ${pageRows.length} học sinh`,
          rows: pageRows
        });

        pageRows.forEach(pr => rows.push(pr));
      });

      pages = pagesList;
    }

    // 3. Danh sách thí sinh theo môn tự chọn
    else if (selectedReportId === 'pre-subject') {
      reportTitle = selectedSubject === 'ALL' ? 'DANH SÁCH THÍ SINH THEO MÔN TỰ CHỌN' : `DANH SÁCH THÍ SINH ĐĂNG KÝ MÔN ${selectedSubject.toUpperCase()}`;
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Môn Đăng Ký', key: 'mon_dk', width: 18, align: 'center' },
        { header: 'Môn Tự Chọn Khác', key: 'mon_khac', width: 18, align: 'left' },
      ];
      let stt = 1;
      students.forEach(st => {
        if (selectedSubject === 'ALL' || st.mon_tu_chon_1 === selectedSubject || st.mon_tu_chon_2 === selectedSubject) {
          const isMon1 = st.mon_tu_chon_1 === selectedSubject;
          rows.push({
            stt: stt++,
            sbd: st.sbd,
            ho_ten: st.ho_ten,
            lop: st.lop,
            mon_dk: selectedSubject === 'ALL' ? `${st.mon_tu_chon_1}, ${st.mon_tu_chon_2}` : selectedSubject,
            mon_khac: selectedSubject === 'ALL' ? '-' : (isMon1 ? st.mon_tu_chon_2 : st.mon_tu_chon_1)
          });
        }
      });
    }

    // 4. Danh sách đăng ký dự thi theo phòng (Chuẩn 5 cột theo mẫu DangKyDuThi.xlsx)
    else if (selectedReportId === 'pre-stats-room') {
      reportTitle = 'DANH SÁCH ĐĂNG KÝ DỰ THI';
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Phòng thi', key: 'phong', width: 14, align: 'left' },
        { header: 'Số thí sinh dự thi', key: 'so_luong', width: 18, align: 'center' },
        { header: 'Ca 1 (Môn tự chọn 1)', key: 'ca_1', width: 32, align: 'left' },
        { header: 'Ca 2 (Môn tự chọn 2)', key: 'ca_2', width: 32, align: 'left' },
      ];

      // Đảm bảo có danh sách phòng thi
      let effectiveRooms = rooms;
      if (effectiveRooms.length === 0) {
        effectiveRooms = Array.from({ length: examConfig.so_phong || 10 }, (_, i) => ({
          id: `room-gen-${i + 1}`,
          truong_id: school.id,
          ky_thi_id: examConfig.id,
          ma_phong: String(i + 1).padStart(3, '0'),
          ten_phong: `Phòng ${String(i + 1).padStart(3, '0')}`,
          suc_chua: examConfig.so_hoc_sinh_phong || 24,
          so_ca_thi: 2
        }));
      }

      // Đảm bảo có phân bổ thí sinh
      let currentAssignments = assignments;
      if (Object.keys(currentAssignments).length === 0 && students.length > 0 && effectiveRooms.length > 0) {
        const alloc = RoomAllocationService.allocateRooms(students, effectiveRooms);
        currentAssignments = alloc.assignments;
      }

      effectiveRooms.forEach((r, idx) => {
        const studentIds = currentAssignments[r.id] || [];
        const roomStudents = studentIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];

        // Phân nhóm môn tự chọn Ca 1 và Ca 2
        const ca1Map: Record<string, number> = {};
        const ca2Map: Record<string, number> = {};

        roomStudents.forEach(st => {
          if (st.mon_tu_chon_1) {
            ca1Map[st.mon_tu_chon_1] = (ca1Map[st.mon_tu_chon_1] || 0) + 1;
          }
          if (st.mon_tu_chon_2) {
            ca2Map[st.mon_tu_chon_2] = (ca2Map[st.mon_tu_chon_2] || 0) + 1;
          }
        });

        const ca1Text = Object.entries(ca1Map).map(([m, c]) => `${m} (${c})`).join('; ') || (roomStudents.length > 0 ? 'Toán / Văn' : '-');
        const ca2Text = Object.entries(ca2Map).map(([m, c]) => `${m} (${c})`).join('; ') || '-';

        rows.push({
          stt: idx + 1,
          phong: r.ten_phong,
          so_luong: roomStudents.length,
          ca_1: ca1Text,
          ca_2: ca2Text
        });
      });
    }

    // 5. Phiếu thu bài thi (Mỗi phòng 1 trang A4)
    else if (selectedReportId === 'pre-receipt') {
      const room = rooms.find(r => r.id === selectedRoomId);
      reportTitle = room ? `PHIẾU THU BÀI THI - ${room.ten_phong.toUpperCase()}` : 'PHIẾU THU BÀI THI (TẤT CẢ PHÒNG THI)';
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Số Báo Danh', key: 'sbd', width: 14, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Số Tờ', key: 'so_to', width: 10, align: 'center' },
        { header: 'Chữ Ký Nộp Bài', key: 'chu_ky', width: 18, align: 'center' },
        { header: 'Ghi Chú', key: 'ghi_chu', width: 16, align: 'left' },
      ];

      const targetRooms = room ? [room] : rooms;
      const pagesList: { title?: string; subTitle?: string; rows: Record<string, any>[] }[] = [];

      targetRooms.forEach(r => {
        const studentIds = assignments[r.id] || [];
        const roomStudents = studentIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];
        const pageRows = roomStudents.map((st, idx) => ({
          stt: idx + 1,
          sbd: st.sbd,
          ho_ten: st.ho_ten,
          lop: st.lop,
          so_to: '......',
          chu_ky: '',
          ghi_chu: ''
        }));

        pagesList.push({
          title: `PHIẾU THU BÀI THI - ${r.ten_phong.toUpperCase()}`,
          subTitle: `${examConfig.ten_ky_thi} - Môn thi: .......................................`,
          rows: pageRows
        });

        pageRows.forEach(pr => rows.push(pr));
      });

      pages = pagesList;
    }

    // 6. Bảng ghi tên ghi điểm (Bản trống)
    else if (selectedReportId === 'pre-blank-sheet') {
      reportTitle = 'BẢNG GHI TÊN GHI ĐIỂM BÀI THI (TẠI PHÒNG THI)';
      subTitle = `${examConfig.ten_ky_thi} - Môn thi: .......................................`;
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Số Tờ Giấy Thi', key: 'so_to', width: 14, align: 'center' },
        { header: 'Điểm Bằng Số', key: 'diem_so', width: 14, align: 'center' },
        { header: 'Điểm Bằng Chữ', key: 'diem_chu', width: 16, align: 'center' },
        { header: 'Chữ Ký Thí Sinh', key: 'chu_ky', width: 16, align: 'center' },
      ];
      rows = students.map((st, i) => ({
        stt: i + 1,
        sbd: st.sbd,
        ho_ten: st.ho_ten,
        ngay_sinh: st.ngay_sinh,
        lop: st.lop,
        so_to: '',
        diem_so: '',
        diem_chu: '',
        chu_ky: ''
      }));
    }

    // 7. Kết quả tốt nghiệp theo lớp
    else if (selectedReportId === 'post-grad-class') {
      reportTitle = selectedClass === 'ALL' ? 'THỐNG KÊ KẾT QUẢ TỐT NGHIỆP THEO TỪNG LỚP' : `BẢNG KẾT QUẢ TỐT NGHIỆP LỚP ${selectedClass}`;
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Lớp', key: 'lop', width: 10, align: 'center' },
        { header: 'Tổng Thí Sinh', key: 'tong', width: 14, align: 'center' },
        { header: 'Số Lượng Đỗ', key: 'do', width: 14, align: 'center' },
        { header: 'Tỉ Lệ Đỗ (%)', key: 'ti_le', width: 14, align: 'center' },
        { header: `Điểm Liệt (≤ ${milestoneLiet})`, key: 'liet', width: 14, align: 'center' },
        { header: 'ĐXTN Trung Bình', key: 'dxtn_tb', width: 16, align: 'right' },
      ];
      classList.forEach((cl, idx) => {
        const classResults = allGradResults.filter(r => r.student.lop === cl);
        const total = classResults.length;
        const passed = classResults.filter(r => r.is_pass).length;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
        const liet = classResults.filter(r => r.is_diem_liet).length;
        const avgDxtn = total > 0 ? (classResults.reduce((acc, r) => acc + r.dxtn, 0) / total).toFixed(2) : '0';

        rows.push({
          stt: idx + 1,
          lop: cl,
          tong: total,
          do: passed,
          ti_le: `${rate}%`,
          liet: liet,
          dxtn_tb: avgDxtn
        });
      });
    }

    // 8. Kết quả tốt nghiệp (Toàn trường)
    else if (selectedReportId === 'post-grad-all') {
      reportTitle = 'BẢNG KẾT QUẢ XÉT TỐT NGHIỆP THPT (TOÀN TRƯỜNG)';
      landscape = true;
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 22, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: 'Toán', key: 'toan', width: 8, align: 'right' },
        { header: 'Văn', key: 'van', width: 8, align: 'right' },
        { header: 'Môn 1', key: 'mon1', width: 14, align: 'right' },
        { header: 'Môn 2', key: 'mon2', width: 14, align: 'right' },
        { header: 'TB 3N', key: 'tb3n', width: 8, align: 'right' },
        { header: 'KK', key: 'kk', width: 6, align: 'right' },
        { header: 'UT', key: 'ut', width: 6, align: 'right' },
        { header: 'ĐXTN', key: 'dxtn', width: 10, align: 'right' },
        { header: 'Kết Quả', key: 'ket_qua', width: 14, align: 'center' },
      ];
      rows = allGradResults.map((r, i) => ({
        stt: i + 1,
        sbd: r.student.sbd,
        ho_ten: r.student.ho_ten,
        lop: r.student.lop,
        toan: r.score.toan ?? '-',
        van: r.score.van ?? '-',
        mon1: r.score.mon_1 !== null && r.score.mon_1 !== undefined ? `${r.student.mon_tu_chon_1}: ${r.score.mon_1}` : r.student.mon_tu_chon_1,
        mon2: r.score.mon_2 !== null && r.score.mon_2 !== undefined ? `${r.student.mon_tu_chon_2}: ${r.score.mon_2}` : r.student.mon_tu_chon_2,
        tb3n: r.tb_3_nam.toFixed(2),
        kk: r.score.khuyen_khich || r.student.khuyen_khich || 0,
        ut: r.score.uu_tien || r.student.uu_tien || 0,
        dxtn: r.dxtn.toFixed(2),
        ket_qua: r.is_pass ? `ĐỖ (${r.xep_loai})` : (r.is_diem_liet ? 'HỎNG (Liệt)' : 'HỎNG TN')
      }));
    }

    // 9. Top thí sinh theo khối xét tuyển ĐH
    else if (selectedReportId === 'post-top-combinations') {
      const comb = combinations.find(c => c.id === selectedCombinationId) || combinations[0];
      reportTitle = `TOP THÍ SINH CÓ ĐIỂM XÉT TUYỂN ĐẠI HỌC CAO NHẤT (KHỐI ${comb?.ma_to_hop || 'A00'})`;
      columns = [
        { header: 'Hạng', key: 'stt', width: 6, align: 'center' },
        { header: 'SBD', key: 'sbd', width: 12, align: 'center' },
        { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Lớp', key: 'lop', width: 8, align: 'center' },
        { header: comb ? `${comb.mon_1}` : 'Môn 1', key: 'm1', width: 10, align: 'right' },
        { header: comb ? `${comb.mon_2}` : 'Môn 2', key: 'm2', width: 10, align: 'right' },
        { header: comb ? `${comb.mon_3}` : 'Môn 3', key: 'm3', width: 10, align: 'right' },
        { header: 'Tổng Điểm Tổ Hợp', key: 'tong', width: 16, align: 'right' },
        { header: 'ĐXTN', key: 'dxtn', width: 10, align: 'right' },
      ];
      if (comb) {
        const topList = ScoreCalculator.getTopStudentsByCombination(comb, students, scores, 20);
        rows = topList.map((item, idx) => ({
          stt: idx + 1,
          sbd: item.student.sbd,
          ho_ten: item.student.ho_ten,
          lop: item.student.lop,
          m1: item.score_mon1.toFixed(2),
          m2: item.score_mon2.toFixed(2),
          m3: item.score_mon3.toFixed(2),
          tong: item.total_score.toFixed(2),
          dxtn: ScoreCalculator.evaluateGraduation(item.student, scoreMap.get(item.student.sbd)).dxtn.toFixed(2)
        }));
      }
    }

    // 10. Thống kê điểm theo mốc TÙY CHỈNH
    else if (selectedReportId === 'post-score-milestones') {
      reportTitle = `THỐNG KÊ PHÂN BỐ ĐIỂM THI THEO CÁC MỐC (Liệt ≤ ${milestoneLiet} | Đạt ≥ ${milestoneDat} | Khá ≥ ${milestoneKha} | Giỏi ≥ ${milestoneGioi})`;
      landscape = true;
      columns = [
        { header: 'Môn Thi', key: 'mon', width: 18, align: 'left' },
        { header: 'Số Bài Thi', key: 'tong', width: 10, align: 'center' },
        { header: `Điểm Liệt (≤ ${milestoneLiet})`, key: 'm_liet', width: 14, align: 'center' },
        { header: `Dưới Đạt (${milestoneLiet} - ${milestoneDat})`, key: 'm_duoidat', width: 14, align: 'center' },
        { header: `Đạt (${milestoneDat} - ${milestoneKha})`, key: 'm_dat', width: 14, align: 'center' },
        { header: `Khá (${milestoneKha} - ${milestoneGioi})`, key: 'm_kha', width: 14, align: 'center' },
        { header: `Giỏi (≥ ${milestoneGioi})`, key: 'm_gioi', width: 14, align: 'center' },
        { header: `Tỉ Lệ Đạt (≥ ${milestoneDat})`, key: 'ti_le', width: 14, align: 'center' },
      ];

      const subjectList = [
        'Toán', 'Ngữ văn', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'GDKT&PL', 'Tin học', 'Công nghệ Công nghiệp', 'Công nghệ Nông nghiệp', 'Tiếng Anh'
      ];

      subjectList.forEach(subj => {
        const scoresForSubj: number[] = [];
        students.forEach(st => {
          const sc = scoreMap.get(st.sbd);
          if (!sc) return;
          if (subj === 'Toán' && sc.toan !== null && sc.toan !== undefined) scoresForSubj.push(sc.toan);
          else if (subj === 'Ngữ văn' && sc.van !== null && sc.van !== undefined) scoresForSubj.push(sc.van);
          else {
            if (st.mon_tu_chon_1 === subj && sc.mon_1 !== null && sc.mon_1 !== undefined) scoresForSubj.push(sc.mon_1);
            else if (st.mon_tu_chon_2 === subj && sc.mon_2 !== null && sc.mon_2 !== undefined) scoresForSubj.push(sc.mon_2);
          }
        });

        const total = scoresForSubj.length;
        if (total > 0) {
          const countLiet = scoresForSubj.filter(p => p <= milestoneLiet).length;
          const countDuoiDat = scoresForSubj.filter(p => p > milestoneLiet && p < milestoneDat).length;
          const countDat = scoresForSubj.filter(p => p >= milestoneDat && p < milestoneKha).length;
          const countKha = scoresForSubj.filter(p => p >= milestoneKha && p < milestoneGioi).length;
          const countGioi = scoresForSubj.filter(p => p >= milestoneGioi).length;
          const passCount = scoresForSubj.filter(p => p >= milestoneDat).length;
          const passRate = ((passCount / total) * 100).toFixed(1);

          rows.push({
            mon: subj,
            tong: total,
            m_liet: `${countLiet} (${((countLiet / total) * 100).toFixed(1)}%)`,
            m_duoidat: `${countDuoiDat} (${((countDuoiDat / total) * 100).toFixed(1)}%)`,
            m_dat: `${countDat} (${((countDat / total) * 100).toFixed(1)}%)`,
            m_kha: `${countKha} (${((countKha / total) * 100).toFixed(1)}%)`,
            m_gioi: `${countGioi} (${((countGioi / total) * 100).toFixed(1)}%)`,
            ti_le: `${passRate}%`
          });
        }
      });
    }

    // 11. Thống kê điểm theo môn (min, max, avg, pass rate)
    else if (selectedReportId === 'post-subject-details') {
      reportTitle = 'BÁO CÁO CHI TIẾT THỐNG KÊ ĐIỂM THI THEO TỪNG MÔN HỌC';
      columns = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Môn Học', key: 'mon', width: 22, align: 'left' },
        { header: 'Số Bài Thi', key: 'tong', width: 12, align: 'center' },
        { header: 'Điểm Thấp Nhất', key: 'min', width: 14, align: 'right' },
        { header: 'Điểm Cao Nhất', key: 'max', width: 14, align: 'right' },
        { header: 'Điểm Trung Bình', key: 'avg', width: 14, align: 'right' },
        { header: `Tỉ Lệ Đạt (≥ ${milestoneDat})`, key: 'pass_rate', width: 16, align: 'right' }
      ];
      let idx = 1;
      Object.values(subjectStats).forEach(s => {
        if (s.totalExamined > 0) {
          rows.push({
            stt: idx++,
            mon: s.subject,
            tong: s.totalExamined,
            min: s.minScore.toFixed(2),
            max: s.maxScore.toFixed(2),
            avg: s.avgScore.toFixed(2),
            pass_rate: `${s.passRate}%`
          });
        }
      });
    }

    return {
      reportTitle,
      subTitle,
      school,
      examConfig,
      columns,
      rows,
      pages: pages.length > 0 ? pages : undefined,
      landscape,
      aiAnalysisText: (includeAIAnalysisInExport && aiAnalysis) ? `${aiAnalysis.tong_quan}\n- Môn nổi bật: ${aiAnalysis.mon_manh.join('; ')}\n- Điểm cần lưu ý: ${aiAnalysis.mon_yeu_can_luu_y.join('; ')}\n- Kiến nghị sư phạm: ${aiAnalysis.kien_nghi_su_pham.join('; ')}` : undefined
    };
  }, [
    selectedReportId,
    selectedClass,
    selectedRoomId,
    selectedSubject,
    selectedCombinationId,
    students,
    rooms,
    assignments,
    allGradResults,
    subjectStats,
    combinations,
    school,
    examConfig,
    includeAIAnalysisInExport,
    aiAnalysis,
    classList,
    studentMap
  ]);

  // Handle Export
  const handleExport = async (ext: 'xlsx' | 'pdf' | 'docx') => {
    try {
      if (ext === 'xlsx') await ExportService.exportToExcel(currentReportData);
      else if (ext === 'pdf') ExportService.exportToPdf(currentReportData);
      else if (ext === 'docx') await ExportService.exportToWord(currentReportData);

      onShowToast('success', 'Xuất báo cáo thành công', `Đã tạo file ${ext.toUpperCase()}`);
    } catch (err: any) {
      onShowToast('error', 'Lỗi xuất file', err.message || 'Không thể tạo file xuất.');
    }
  };

  // Official Multi-Sheet Excel Downloads (Theo đúng các mẫu trong thư mục New folder)
  const handleExportOfficialRooms = async () => {
    try {
      await ExportService.exportOfficialDanhSachTheoPhongExcel(rooms, assignments, students, school, examConfig);
      onShowToast('success', 'Đã xuất DanhSachTheoPhong.xlsx', `Đã tạo file Excel gồm ${rooms.length} sheet (mỗi phòng 1 sheet).`);
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialClasses = async () => {
    try {
      await ExportService.exportOfficialDanhSachTheoLopExcel(students, assignments, rooms, school, examConfig);
      onShowToast('success', 'Đã xuất DanhSachTheoLop.xlsx', `Đã tạo file Excel gồm ${classList.length} sheet (mỗi lớp 1 sheet).`);
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialSubjects = async () => {
    try {
      await ExportService.exportOfficialDanhSachTheoMonExcel(students, assignments, rooms, school, examConfig);
      onShowToast('success', 'Đã xuất DanhSachTheoMon.xlsx', 'Đã tạo file Excel gồm 12 sheet môn thi.');
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialReceipts = async () => {
    try {
      await ExportService.exportOfficialPhieuThuBaiExcel(rooms, assignments, students, school, examConfig);
      onShowToast('success', 'Đã xuất PhieuThuBai.xlsx', `Đã tạo file Excel gồm ${rooms.length} sheet phiếu thu bài.`);
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialGradByClass = async () => {
    try {
      await ExportService.exportOfficialKetQuaTotNghiepTheoLopExcel(students, scores, assignments, rooms, school, examConfig);
      onShowToast('success', 'Đã xuất KetQuaTotNghiepTheoLop.xlsx', 'Đã tạo file kết quả tốt nghiệp từng lớp.');
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialTop10 = async () => {
    try {
      await ExportService.exportOfficialTop10KhoiDaiHocExcel(students, scores, combinations, school, examConfig);
      onShowToast('success', 'Đã xuất Top10KhoiDaiHoc.xlsx', 'Đã tạo file Top 10 các khối A, A1, B, C, D.');
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const handleExportOfficialRegistration = async () => {
    try {
      await ExportService.exportOfficialDangKyDuThiExcel(rooms, assignments, students, school, examConfig);
      onShowToast('success', 'Đã xuất DangKyDuThi.xlsx', 'Đã tạo danh sách đăng ký dự thi theo phòng chuẩn 5 cột.');
    } catch (e: any) {
      onShowToast('error', 'Lỗi xuất file', e.message);
    }
  };

  const officialExport = useMemo(() => {
    switch (selectedReportId) {
      case 'pre-room':
        return { label: 'Tải DanhSachTheoPhong.xlsx (40 Sheet)', fn: handleExportOfficialRooms };
      case 'pre-class':
        return { label: 'Tải DanhSachTheoLop.xlsx (Tất Cả Lớp)', fn: handleExportOfficialClasses };
      case 'pre-subject':
        return { label: 'Tải DanhSachTheoMon.xlsx (12 Sheet Môn)', fn: handleExportOfficialSubjects };
      case 'pre-stats-room':
        return { label: 'Tải DangKyDuThi.xlsx (Chuẩn 5 Cột)', fn: handleExportOfficialRegistration };
      case 'pre-receipt':
        return { label: 'Tải PhieuThuBai.xlsx (40 Sheet Thu Bài)', fn: handleExportOfficialReceipts };
      case 'post-grad-class':
        return { label: 'Tải KetQuaTotNghiepTheoLop.xlsx (Từng Lớp)', fn: handleExportOfficialGradByClass };
      case 'post-top-combinations':
        return { label: 'Tải Top10KhoiDaiHoc.xlsx (5 Sheet Khối)', fn: handleExportOfficialTop10 };
      default:
        return null;
    }
  }, [selectedReportId, handleExportOfficialRooms, handleExportOfficialClasses, handleExportOfficialSubjects, handleExportOfficialRegistration, handleExportOfficialReceipts, handleExportOfficialGradByClass, handleExportOfficialTop10]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Hệ Thống Báo Cáo Khảo Thí & Phân Tích Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tách biệt 2 phân hệ: Danh sách chuẩn bị thi (trước ngày thi) & Kết quả thi (sau khi có điểm) • Xuất đầy đủ biểu mẫu chuẩn Quốc gia
          </p>
        </div>

        {/* Action: AI Analysis Trigger */}
        <button
          onClick={handleRunAIAnalysis}
          disabled={isAnalyzingAI}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>{isAnalyzingAI ? 'AI Đang Phân Tích...' : 'Phân Tích Bằng AI'}</span>
        </button>
      </div>

      {/* Main 2-Group Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setReportGroup('PRE_EXAM');
            setSelectedReportId('pre-room');
          }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            reportGroup === 'PRE_EXAM'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5.1 Danh Sách Chuẩn Bị Thi (Trước Ngày Thi)</span>
        </button>

        <button
          onClick={() => {
            setReportGroup('POST_EXAM');
            setSelectedReportId('post-grad-class');
          }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            reportGroup === 'POST_EXAM'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>5.2 Kết Quả Thi & Thống Kê (Sau Khi Có Điểm)</span>
        </button>
      </div>

      {/* AI Analysis Insight Card if Available */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 via-sky-50 to-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Nhận Xét & Đánh Giá Sư Phạm Chuyên Sâu Từ AI ({aiAnalysis.provider_used})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={includeAIAnalysisInExport}
                  onChange={e => setIncludeAIAnalysisInExport(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Đính kèm nhận xét AI vào file xuất</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(aiAnalysis.timestamp).toLocaleTimeString('vi-VN')} {new Date(aiAnalysis.timestamp).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-indigo-100">
            {aiAnalysis.tong_quan}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
              <div className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Môn Điểm Mạnh
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                {aiAnalysis.mon_manh.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <div className="font-bold text-amber-900 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Môn & Lớp Cần Lưu Ý
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {aiAnalysis.mon_yeu_can_luu_y.map((m, i) => <li key={i}>{m}</li>)}
                {aiAnalysis.lop_can_boi_duong.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>

            <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200">
              <div className="font-bold text-sky-900 mb-1.5 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                Kiến Nghị Sư Phạm
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-sky-800">
                {aiAnalysis.kien_nghi_su_pham.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-report Selection & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Submenu */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            {reportGroup === 'PRE_EXAM' ? 'Báo Cáo Chuẩn Bị Thi' : 'Báo Cáo Kết Quả Thi'}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-1">
            {(reportGroup === 'PRE_EXAM' ? preExamReports : postExamReports).map(item => {
              const Icon = item.icon;
              const isSelected = selectedReportId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedReportId(item.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-adminNavy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-sky-300' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${
                      isSelected ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Preview & 3-Format Export Actions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Dynamic Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedReportId === 'pre-class' && (
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-medium focus:bg-white outline-hidden"
                >
                  <option value="ALL">Tất cả lớp ({classList.length})</option>
                  {classList.map(c => <option key={c} value={c}>Lớp {c}</option>)}
                </select>
              )}

              {selectedReportId === 'pre-room' && (
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-medium focus:bg-white outline-hidden"
                >
                  <option value="ALL">Tất cả phòng thi ({rooms.length})</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.ma_phong} - {r.ten_phong}</option>)}
                </select>
              )}

              {selectedReportId === 'pre-subject' && (
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-medium focus:bg-white outline-hidden"
                >
                  <option value="ALL">Tất cả môn tự chọn</option>
                  {ELECTIVE_SUBJECTS.map(s => <option key={s} value={s}>Môn {s}</option>)}
                </select>
              )}

              {selectedReportId === 'post-top-combinations' && (
                <select
                  value={selectedCombinationId}
                  onChange={e => setSelectedCombinationId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:bg-white outline-hidden"
                >
                  {combinations.map(c => (
                    <option key={c.id} value={c.id}>
                      Tổ Hợp {c.ma_to_hop} ({c.mon_1} - {c.mon_2} - {c.mon_3})
                    </option>
                  ))}
                </select>
              )}

              {selectedReportId === 'post-score-milestones' && (
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
                  <span className="font-bold text-indigo-900 flex items-center gap-1 pl-1">
                    ⚙️ Thiết đặt mốc điểm:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[11px]">Liệt ≤</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={milestoneLiet}
                      onChange={e => setMilestoneLiet(Number(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[11px]">Đạt ≥</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={milestoneDat}
                      onChange={e => setMilestoneDat(Number(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[11px]">Khá ≥</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={milestoneKha}
                      onChange={e => setMilestoneKha(Number(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 text-[11px]">Giỏi ≥</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={milestoneGioi}
                      onChange={e => setMilestoneGioi(Number(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-center"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setMilestoneLiet(1.0);
                      setMilestoneDat(5.0);
                      setMilestoneKha(7.0);
                      setMilestoneGioi(8.0);
                    }}
                    className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                    title="Đặt lại mốc điểm chuẩn Bộ GD (1.0 - 5.0 - 7.0 - 8.0)"
                  >
                    Mặc Định
                  </button>
                </div>
              )}
            </div>

            {/* Export Actions: Multi-Sheet Button + Single-View 3 Formats */}
            <div className="flex flex-wrap items-center gap-2">
              {officialExport && (
                <button
                  onClick={officialExport.fn}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Tải trọn bộ file Excel Multi-Sheet chuẩn chính thức theo mẫu Bộ/Sở GD"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>📥 {officialExport.label}</span>
                </button>
              )}

              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">|</span>

              <button
                onClick={() => handleExport('xlsx')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                title="Xuất file Excel cho bảng đang xem"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                title="Xem bản in & xuất file PDF A4 sẵn sàng in trực tiếp"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF (In)</span>
              </button>
              <button
                onClick={() => handleExport('docx')}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                title="Xuất file Word docx có thể chỉnh sửa và ký tên"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>
            </div>
          </div>

          {/* Live Administrative Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            {/* Administrative Header Simulation */}
            <div className="flex justify-between items-start text-center text-xs pb-3 border-b border-slate-100 font-times">
              <div>
                <div className="font-bold text-slate-800">{school.so_gd.toUpperCase()}</div>
                <div className="text-slate-600">{school.ten_truong.toUpperCase()}</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-slate-700 underline">Độc lập - Tự do - Hạnh phúc</div>
              </div>
            </div>

            <div className="text-center pt-2">
              <h3 className="text-base font-bold text-adminNavy uppercase tracking-wide">
                {currentReportData.reportTitle}
              </h3>
              <p className="text-xs text-slate-500 italic mt-0.5">
                {currentReportData.subTitle}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse font-times">
                <thead>
                  <tr className="bg-adminNavy text-white font-bold">
                    {currentReportData.columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`p-2.5 border border-slate-700 text-${col.align || 'left'}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentReportData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={currentReportData.columns.length} className="p-8 text-center text-slate-400 italic font-sans">
                        Không có dữ liệu cho báo cáo này.
                      </td>
                    </tr>
                  ) : (
                    currentReportData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        {currentReportData.columns.map((col, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2.5 border border-slate-200 text-${col.align || 'left'}`}
                          >
                            {row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Administrative Signature Simulation */}
            <div className="flex justify-between items-start text-xs pt-6 text-center font-times text-slate-800">
              <div className="w-48">
                <div className="font-bold">NGƯỜI LẬP BẢNG</div>
                <div className="h-14"></div>
              </div>
              <div className="w-64">
                <div className="italic text-[11px] mb-1">
                  Cà Mau, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
                <div className="font-bold">TRƯỞNG ĐIỂM THI / HIỆU TRƯỞNG</div>
                <div className="h-14"></div>
                <div className="font-bold">{examConfig.truong_diem_thi || school.hieu_truong}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
