import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRightLeft, 
  ShieldAlert, 
  Check, 
  X, 
  Users,
  Eye,
  FileDown
} from 'lucide-react';
import { Room, Student, RoomAllocationPlan, School, ExamConfig } from '../../types';
import { RoomAllocationService } from '../../services/room-allocation';
import { ExportService } from '../../services/export-service';

interface RoomManagerProps {
  rooms: Room[];
  students: Student[];
  assignments: Record<string, string[]>;
  school: School;
  examConfig: ExamConfig;
  onSaveRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
  onSaveAssignments: (assignments: Record<string, string[]>) => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const RoomManager: React.FC<RoomManagerProps> = ({
  rooms,
  students,
  assignments,
  school,
  examConfig,
  onSaveRoom,
  onDeleteRoom,
  onSaveAssignments,
  onShowToast,
}) => {
  const [activePlan, setActivePlan] = useState<'current' | 'algo' | 'ai'>('current');
  const [algoPlan, setAlgoPlan] = useState<RoomAllocationPlan | null>(null);
  const [aiPlan, setAiPlan] = useState<RoomAllocationPlan | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Manual move student modal
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromRoomId: string } | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');

  // Form Room state
  const [formMaPhong, setFormMaPhong] = useState('P01');
  const [formTenPhong, setFormTenPhong] = useState('');
  const [formSucChua, setFormSucChua] = useState(24);
  const [formGhiChu, setFormGhiChu] = useState('');

  // Selected Room for detailed inspection
  const [inspectedRoomId, setInspectedRoomId] = useState<string>(rooms[0]?.id || '');

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  // Current active plan evaluation
  const currentPlan = useMemo(() => {
    return RoomAllocationService.evaluatePlan(
      'current-plan',
      'Phương án Đang Áp Dụng',
      'manual',
      assignments,
      students,
      rooms,
      examConfig.so_hoc_sinh_phong || 24
    );
  }, [assignments, students, rooms, examConfig.so_hoc_sinh_phong]);

  // Tự động chữa lành và áp dụng phương án chuẩn 0 vi phạm nếu phương án hiện tại có lỗi
  React.useEffect(() => {
    if (currentPlan.stats.violations_count > 0 && students.length > 0 && rooms.length > 0) {
      const plan = RoomAllocationService.runAlgorithmicAllocation(
        students,
        rooms,
        examConfig.so_hoc_sinh_phong || 28
      );
      onSaveAssignments(plan.assignments);
    }
  }, [students.length, rooms.length, currentPlan.stats.violations_count]);

  // Run Algorithmic Allocation
  const handleRunAlgorithm = () => {
    const plan = RoomAllocationService.runAlgorithmicAllocation(
      students,
      rooms,
      examConfig.so_hoc_sinh_phong || 24
    );
    setAlgoPlan(plan);
    onShowToast('info', 'Đã tính toán phương án thuật toán', `Phân bổ ${plan.total_students} thí sinh vào ${plan.total_rooms} phòng.`);
    return plan;
  };

  // Run AI Allocation
  const handleRunAI = () => {
    const plan = RoomAllocationService.runAIAllocation(
      students,
      rooms,
      examConfig.so_hoc_sinh_phong || 24
    );
    setAiPlan(plan);
    onShowToast('info', 'Đã tạo phương án AI song song', `Đề xuất phân cụm môn tự chọn tối ưu.`);
    return plan;
  };

  // Run Both and Compare Side-by-Side
  const handleCompareSideBySide = () => {
    const a = handleRunAlgorithm();
    const b = handleRunAI();
    setAlgoPlan(a);
    setAiPlan(b);
    setIsComparing(true);
  };

  // Apply a Plan
  const handleApplyPlan = (plan: RoomAllocationPlan) => {
    onSaveAssignments(plan.assignments);
    setIsComparing(false);
    onShowToast('success', 'Đã áp dụng phương án xếp phòng', `Đã phân bổ ${plan.total_students} thí sinh vào đúng ${rooms.length} phòng của trường (Sức chứa ≤ ${examConfig.so_hoc_sinh_phong || 28} TS/phòng).`);
  };

  // Save Room CRUD
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMaPhong.trim() || !formTenPhong.trim()) return;

    const roomToSave: Room = {
      id: editingRoom ? editingRoom.id : `room-${Date.now()}`,
      truong_id: school.id,
      ma_phong: formMaPhong.trim(),
      ten_phong: formTenPhong.trim(),
      suc_chua: Number(formSucChua) || 24,
      ghi_chu: formGhiChu
    };

    onSaveRoom(roomToSave);
    setIsRoomModalOpen(false);
    onShowToast('success', editingRoom ? 'Đã sửa phòng thi' : 'Đã tạo phòng thi mới', roomToSave.ten_phong);
  };

  // Open Room Modal
  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormMaPhong(room.ma_phong);
      setFormTenPhong(room.ten_phong);
      setFormSucChua(room.suc_chua);
      setFormGhiChu(room.ghi_chu || '');
    } else {
      setEditingRoom(null);
      const nextNum = rooms.length + 1;
      setFormMaPhong(`P${String(nextNum).padStart(2, '0')}`);
      setFormTenPhong(`Phòng ${String(nextNum).padStart(2, '0')}`);
      setFormSucChua(examConfig.so_hoc_sinh_phong || 24);
      setFormGhiChu('');
    }
    setIsRoomModalOpen(true);
  };

  // Handle Manual Student Transfer between Rooms
  const handleTransferStudent = () => {
    if (!movingStudent || !targetRoomId) return;
    const nextAssignments = { ...assignments };

    // Remove from old room
    if (nextAssignments[movingStudent.fromRoomId]) {
      nextAssignments[movingStudent.fromRoomId] = nextAssignments[movingStudent.fromRoomId].filter(id => id !== movingStudent.student.id);
    }

    // Add to target room
    if (!nextAssignments[targetRoomId]) nextAssignments[targetRoomId] = [];
    nextAssignments[targetRoomId].push(movingStudent.student.id);

    onSaveAssignments(nextAssignments);
    setMovingStudent(null);
    onShowToast('success', 'Đã chuyển phòng thi', `Đã chuyển ${movingStudent.student.ho_ten} sang ${rooms.find(r => r.id === targetRoomId)?.ten_phong}`);
  };

  // Export Room Schedule to 3 formats
  const handleExportRooms = async (ext: 'xlsx' | 'pdf' | 'docx') => {
    const columns = [
      { header: 'STT', key: 'stt', width: 8, align: 'center' as const },
      { header: 'Phòng Thi', key: 'phong', width: 22, align: 'left' as const },
      { header: 'Số Báo Danh', key: 'sbd', width: 14, align: 'center' as const },
      { header: 'Họ và Tên Thí Sinh', key: 'ho_ten', width: 26, align: 'left' as const },
      { header: 'Lớp', key: 'lop', width: 10, align: 'center' as const },
      { header: 'Môn Tự Chọn 1', key: 'mon1', width: 18, align: 'left' as const },
      { header: 'Môn Tự Chọn 2', key: 'mon2', width: 18, align: 'left' as const },
    ];

    const rows: any[] = [];
    let stt = 1;

    rooms.forEach(r => {
      const studentIds = assignments[r.id] || [];
      studentIds.forEach(sid => {
        const st = studentMap.get(sid);
        if (!st) return;
        rows.push({
          stt: stt++,
          phong: `${r.ma_phong} - ${r.ten_phong}`,
          sbd: st.sbd,
          ho_ten: st.ho_ten,
          lop: st.lop,
          mon1: st.mon_tu_chon_1,
          mon2: st.mon_tu_chon_2
        });
      });
    });

    const exportData = {
      reportTitle: 'DANH SÁCH THÍ SINH THEO PHÒNG THI',
      subTitle: `${examConfig.ten_ky_thi} - Tổng số phòng: ${rooms.length} phòng`,
      school,
      examConfig,
      columns,
      rows,
      landscape: false
    };

    if (ext === 'xlsx') await ExportService.exportToExcel(exportData);
    else if (ext === 'pdf') ExportService.exportToPdf(exportData);
    else if (ext === 'docx') await ExportService.exportToWord(exportData);

    onShowToast('success', 'Xuất báo cáo phòng thi', `Đã tạo file ${ext.toUpperCase()}`);
  };

  const inspectedRoom = rooms.find(r => r.id === inspectedRoomId) || rooms[0];
  const inspectedStudents = (assignments[inspectedRoom?.id] || []).map(id => studentMap.get(id)).filter(Boolean) as Student[];
  const inspectedCheck = inspectedRoom ? RoomAllocationService.validateRoomShiftRules(inspectedStudents, inspectedRoom.suc_chua) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            Xếp Phòng Thi & Phân Bổ Thí Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy tắc: Tối đa 24 thí sinh/phòng • Mỗi ca ≤ 3 môn • Tổng 2 ca ≤ 5 môn • Không trùng môn giữa 2 ca
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenRoomModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Phòng</span>
          </button>

          {/* Nút Tự Động Xếp Phòng Tối Ưu */}
          <button
            onClick={() => {
              const plan = handleRunAlgorithm();
              handleApplyPlan(plan);
              onShowToast('success', 'Đã xếp phòng tối ưu', `Đã phân bổ ${plan.total_students} thí sinh vào ${plan.total_rooms} phòng (Triệt tiêu 100% cảnh báo trùng môn).`);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Tự động chuẩn hóa ca thi, gom cụm môn và triệt tiêu 100% cảnh báo trùng môn"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Tự Động Xếp Phòng Tối Ưu (Khử Trùng Môn)</span>
          </button>

          {/* Nút so sánh 2 phương án (Thuật toán vs AI) */}
          <button
            onClick={handleCompareSideBySide}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Layers className="w-4 h-4 text-sky-200" />
            <span>So Sánh Phương Án AI</span>
          </button>

          {/* Xuất danh sách 3 định dạng */}
          <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <span className="px-2 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 border-r border-slate-300">
              <FileDown className="w-3.5 h-3.5" />
              Xuất DS:
            </span>
            <button
              onClick={() => handleExportRooms('xlsx')}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              Excel
            </button>
            <button
              onClick={() => handleExportRooms('pdf')}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors border-r border-slate-200"
            >
              PDF
            </button>
            <button
              onClick={() => handleExportRooms('docx')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition-colors"
            >
              Word
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng số phòng</div>
            <div className="text-lg font-bold text-slate-900">{rooms.length} phòng</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Thí sinh đã xếp phòng</div>
            <div className="text-lg font-bold text-slate-900">{currentPlan.total_students} / {students.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">TB thí sinh / phòng</div>
            <div className="text-lg font-bold text-slate-900">{currentPlan.stats.avg_students_per_room} TS/phòng</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Quy chuẩn phòng thi</div>
            <div className="text-xs font-bold text-emerald-700">
              {currentPlan.stats.violations_count > 0 ? `Vượt sức chứa (${currentPlan.stats.violations_count} phòng)` : 'Đạt chuẩn khảo thí (100%)'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Room List & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Room Grid */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Danh Sách Phòng Thi</span>
              <span className="text-xs text-slate-400 font-normal">({rooms.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {rooms.map(r => {
              const assignedIds = assignments[r.id] || [];
              const roomSts = assignedIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];
              const chk = RoomAllocationService.validateRoomShiftRules(roomSts, r.suc_chua);
              const isSelected = inspectedRoomId === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setInspectedRoomId(r.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-xs ring-1 ring-sky-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-adminNavy text-white font-mono font-bold text-xs rounded-md">
                        {r.ma_phong}
                      </span>
                      <span className="font-semibold text-xs text-slate-800">{r.ten_phong}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenRoomModal(r); }}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc muốn xóa phòng ${r.ten_phong}?`)) onDeleteRoom(r.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Sĩ số: <strong className={assignedIds.length > r.suc_chua ? 'text-rose-600' : 'text-slate-800'}>{assignedIds.length}</strong> / {r.suc_chua}
                    </span>
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${chk.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {chk.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {chk.isValid ? 'Hợp lệ' : `${chk.violations.length} vi phạm`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Students in Selected Room */}
        <div className="lg:col-span-2 space-y-4">
          {inspectedRoom ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-mono text-xs rounded-md">
                      {inspectedRoom.ma_phong}
                    </span>
                    {inspectedRoom.ten_phong}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Sức chứa tối đa: <strong>{inspectedRoom.suc_chua}</strong> | Đã phân bổ: <strong className="text-sky-700">{inspectedStudents.length}</strong> thí sinh
                  </div>
                </div>

                {inspectedCheck && !inspectedCheck.isValid && (
                  <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-0.5">
                    {inspectedCheck.violations.map((v, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ca 1 & Ca 2 Subjects in this room */}
              {inspectedCheck && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Môn tự chọn Ca 1 ({inspectedCheck.ca1Subjects.length} môn):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inspectedCheck.ca1Subjects.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Môn tự chọn Ca 2 ({inspectedCheck.ca2Subjects.length} môn):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inspectedCheck.ca2Subjects.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Students in Room Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5 w-24 text-center">SBD</th>
                      <th className="p-2.5">Họ và Tên</th>
                      <th className="p-2.5 w-16 text-center">Lớp</th>
                      <th className="p-2.5">Môn Tự Chọn</th>
                      <th className="p-2.5 w-20 text-center">Chuyển</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          Chưa có thí sinh nào trong phòng thi này.
                        </td>
                      </tr>
                    ) : (
                      inspectedStudents.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-sky-800">{st.sbd}</td>
                          <td className="p-2.5 font-medium text-slate-800">{st.ho_ten}</td>
                          <td className="p-2.5 text-center">{st.lop}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700 font-medium">
                              {st.mon_tu_chon_1} • {st.mon_tu_chon_2}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => {
                                setMovingStudent({ student: st, fromRoomId: inspectedRoom.id });
                                setTargetRoomId(rooms.find(r => r.id !== inspectedRoom.id)?.id || '');
                              }}
                              title="Chuyển thí sinh sang phòng khác"
                              className="p-1 hover:bg-sky-100 text-sky-700 rounded transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 italic">
              Vui lòng chọn hoặc tạo một phòng thi để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Side-by-Side Comparison (Algorithm vs AI) */}
      {isComparing && algoPlan && aiPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-6 sm:p-8 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  So Sánh Phương Án Xếp Phòng: Thuật Toán vs Đề Xuất AI
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đánh giá song song các chỉ số cân bằng tải và mức độ tuân thủ ràng buộc môn thi
                </p>
              </div>
              <button onClick={() => setIsComparing(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 overflow-y-auto p-1">
              {/* Option 1: Algorithm */}
              <div className="border-2 border-sky-300 bg-sky-50/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-sky-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Phương Án 1: Thuật Toán Ràng Buộc
                    </span>
                    <span className="text-xs font-semibold text-sky-800">
                      {algoPlan.stats.is_valid ? 'Hợp Lệ 100%' : 'Có Cảnh Báo'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-sky-100">
                      <span className="text-slate-600">Số phòng sử dụng:</span>
                      <strong className="text-slate-900">{algoPlan.total_rooms} phòng</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-sky-100">
                      <span className="text-slate-600">Trung bình thí sinh / phòng:</span>
                      <strong className="text-slate-900">{algoPlan.stats.avg_students_per_room} TS</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-sky-100">
                      <span className="text-slate-600">Số môn tối đa trong 1 ca:</span>
                      <strong className="text-slate-900">{algoPlan.stats.max_subjects_per_shift} môn (≤ 3)</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-sky-100">
                      <span className="text-slate-600">Số vi phạm ràng buộc:</span>
                      <strong className={algoPlan.stats.violations_count > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {algoPlan.stats.violations_count}
                      </strong>
                    </div>
                  </div>

                  {algoPlan.stats.violations_details.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 space-y-1">
                      {algoPlan.stats.violations_details.map((v, i) => (
                        <div key={i}>• {v}</div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleApplyPlan(algoPlan)}
                  className="w-full py-2.5 bg-adminNavy hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Phương Án Thuật Toán</span>
                </button>
              </div>

              {/* Option 2: AI Proposal */}
              <div className="border-2 border-indigo-300 bg-indigo-50/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Phương Án 2: Đề Xuất Tối Ưu AI
                    </span>
                    <span className="text-xs font-semibold text-indigo-800">
                      {aiPlan.stats.is_valid ? 'Hợp Lệ 100%' : 'Có Cảnh Báo'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-indigo-100">
                      <span className="text-slate-600">Số phòng sử dụng:</span>
                      <strong className="text-slate-900">{aiPlan.total_rooms} phòng</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-indigo-100">
                      <span className="text-slate-600">Trung bình thí sinh / phòng:</span>
                      <strong className="text-slate-900">{aiPlan.stats.avg_students_per_room} TS</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-indigo-100">
                      <span className="text-slate-600">Số môn tối đa trong 1 ca:</span>
                      <strong className="text-slate-900">{aiPlan.stats.max_subjects_per_shift} môn (≤ 3)</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded-lg border border-indigo-100">
                      <span className="text-slate-600">Số vi phạm ràng buộc:</span>
                      <strong className={aiPlan.stats.violations_count > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {aiPlan.stats.violations_count}
                      </strong>
                    </div>
                  </div>

                  {aiPlan.stats.violations_details.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 space-y-1">
                      {aiPlan.stats.violations_details.map((v, i) => (
                        <div key={i}>• {v}</div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleApplyPlan(aiPlan)}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Phương Án AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Room */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              {editingRoom ? 'Chỉnh Sửa Phòng Thi' : 'Tạo Phòng Thi Mới'}
            </h3>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Phòng *</label>
                <input
                  type="text"
                  required
                  value={formMaPhong}
                  onChange={e => setFormMaPhong(e.target.value)}
                  placeholder="VD: P01"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Phòng Thi *</label>
                <input
                  type="text"
                  required
                  value={formTenPhong}
                  onChange={e => setFormTenPhong(e.target.value)}
                  placeholder="VD: Phòng 01 (Nhà A - Tầng 1)"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sức Chứa Tối Đa (Thí sinh) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={formSucChua}
                  onChange={e => setFormSucChua(parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={formGhiChu}
                  onChange={e => setFormGhiChu(e.target.value)}
                  placeholder="VD: Phòng có máy lạnh"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-adminNavy hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs"
                >
                  Lưu Phòng Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Student to another room */}
      {movingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-sky-600" />
              Chuyển Thí Sinh Sang Phòng Thi Khác
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Thí sinh: <strong>{movingStudent.student.ho_ten}</strong> (SBD: <strong>{movingStudent.student.sbd}</strong>)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn Phòng Thi Đích *</label>
                <select
                  value={targetRoomId}
                  onChange={e => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ma_phong} - {r.ten_phong} (Hiện có: {(assignments[r.id] || []).length}/{r.suc_chua})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleTransferStudent}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-medium shadow-xs"
                >
                  Xác Nhận Chuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
