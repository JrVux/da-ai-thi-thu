import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Layout/Navbar';
import { StudentManager } from './components/Students/StudentManager';
import { RoomManager } from './components/Rooms/RoomManager';
import { ScoreManager } from './components/Scores/ScoreManager';
import { CombinationManager } from './components/Combinations/CombinationManager';
import { ReportManager } from './components/Reports/ReportManager';
import { ExamConfigView } from './components/ExamConfig/ExamConfigView';
import { AIConfigModal } from './components/AIStudio/AIConfigModal';
import { ActivationGate } from './components/Auth/ActivationGate';
import { ToastContainer, ToastMessage } from './components/Common/Toast';
import { DBService, DEFAULT_EXAM_CONFIG } from './services/db';
import { RoomAllocationService } from './services/room-allocation';
import { 
  School, 
  ExamConfig, 
  Student, 
  Room, 
  ExamScore, 
  AdmissionCombination, 
  AuditLog, 
  UserRole 
} from './types';

export const App: React.FC = () => {
  // Activation & Security Gate
  const [isActivated, setIsActivated] = useState<boolean>(() => DBService.isActivated());

  // Navigation & Role (Single Super Admin)
  const [activeTab, setActiveTab] = useState<string>('students');
  const [userRole, setUserRole] = useState<UserRole>('super_admin');
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Schools & Active School
  const [schools, setSchools] = useState<School[]>(() => DBService.getSchools());
  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => DBService.getActiveSchoolId());

  // Exam Configs & Active Exam (Multi-exam support)
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>(() => DBService.getExamConfigs(activeSchoolId));
  const [activeExamId, setActiveExamId] = useState<string>(() => DBService.getActiveExamId());
  const [examConfig, setExamConfig] = useState<ExamConfig>(() => DBService.getExamConfig(activeSchoolId, activeExamId));

  // Main Data States (scoped to active school & active exam)
  const [students, setStudents] = useState<Student[]>(() => DBService.getStudents(activeSchoolId, activeExamId));
  const [rooms, setRooms] = useState<Room[]>(() => DBService.getRooms(activeSchoolId, activeExamId));
  const [scores, setScores] = useState<ExamScore[]>(() => DBService.getScores(activeSchoolId, activeExamId));
  const [combinations, setCombinations] = useState<AdmissionCombination[]>(() => DBService.getCombinations(activeSchoolId));
  const [assignments, setAssignments] = useState<Record<string, string[]>>(() => DBService.getRoomAssignments(activeSchoolId, activeExamId));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DBService.getAuditLogs(activeSchoolId));

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Reload data when active school or active exam changes
  const reloadExamData = useCallback((schoolId: string, examId: string) => {
    const allExams = DBService.getExamConfigs(schoolId);
    setExamConfigs(allExams);
    
    const cfg = DBService.getExamConfig(schoolId, examId);
    setExamConfig(cfg);

    const syncedRooms = DBService.syncRoomsWithConfig(cfg);
    setRooms(syncedRooms);

    const currentStudents = DBService.getStudents(schoolId, examId);
    setStudents(currentStudents);
    setScores(DBService.getScores(schoolId, examId));
    setCombinations(DBService.getCombinations(schoolId));
    setAssignments(DBService.getRoomAssignments(schoolId, examId));
    setAuditLogs(DBService.getAuditLogs(schoolId));
  }, []);

  useEffect(() => {
    DBService.setActiveSchoolId(activeSchoolId);
    const currExamId = DBService.getActiveExamId();
    setActiveExamId(currExamId);
    reloadExamData(activeSchoolId, currExamId);
  }, [activeSchoolId, reloadExamData]);

  const activeSchool = schools.find(s => s.id === activeSchoolId) || schools[0];

  // School handlers
  const handleSelectSchool = (id: string) => {
    setActiveSchoolId(id);
    const target = schools.find(s => s.id === id);
    if (target) {
      addToast('info', 'Đã chuyển trường', target.ten_truong);
    }
  };

  const handleAddSchool = (newSchool: School) => {
    DBService.saveSchool(newSchool);
    setSchools(DBService.getSchools());
    setActiveSchoolId(newSchool.id);
    addToast('success', 'Đã tạo trường mới', newSchool.ten_truong);
  };

  // Exam handlers (Multi-Exam)
  const handleSelectExam = (examId: string) => {
    DBService.setActiveExamId(examId);
    setActiveExamId(examId);
    reloadExamData(activeSchoolId, examId);
    const target = examConfigs.find(c => c.id === examId);
    if (target) {
      addToast('info', 'Đã chuyển kỳ thi', target.ten_ky_thi);
    }
  };

  const handleCreateExam = (newConfigPartial?: Partial<ExamConfig>) => {
    const newId = `cfg-${activeSchoolId}-${Date.now()}`;
    const newExam: ExamConfig = {
      ...DEFAULT_EXAM_CONFIG,
      id: newId,
      truong_id: activeSchoolId,
      ten_ky_thi: newConfigPartial?.ten_ky_thi || `KỲ THI MỚI NĂM ${new Date().getFullYear()}`,
      nam: newConfigPartial?.nam || new Date().getFullYear(),
      so_phong: newConfigPartial?.so_phong || 10,
      so_hoc_sinh_phong: newConfigPartial?.so_hoc_sinh_phong || 24,
      ngay_thi: newConfigPartial?.ngay_thi || '2025-06-26',
      truong_diem_thi: newConfigPartial?.truong_diem_thi || activeSchool.hieu_truong || 'Trưởng Điểm Thi',
      tien_to_sbd: '01'
    };

    DBService.saveExamConfig(newExam, userRole, false);
    DBService.setActiveExamId(newId);
    setActiveExamId(newId);
    reloadExamData(activeSchoolId, newId);
    addToast('success', 'Đã tạo kỳ thi mới', newExam.ten_ky_thi);
  };

  const handleDeleteExam = (examId: string) => {
    DBService.deleteExam(examId, userRole);
    const remainingExams = DBService.getExamConfigs(activeSchoolId);
    setExamConfigs(remainingExams);
    const nextExamId = DBService.getActiveExamId();
    setActiveExamId(nextExamId);
    reloadExamData(activeSchoolId, nextExamId);
    addToast('warning', 'Đã xóa kỳ thi', 'Toàn bộ dữ liệu của kỳ thi đã được dọn sạch.');
  };

  const handleResetExamData = (examId: string) => {
    DBService.clearExamData(examId, userRole);
    reloadExamData(activeSchoolId, examId);
    addToast('info', 'Đã reset dữ liệu kỳ thi', 'Thí sinh, điểm thi và phòng thi đã được làm mới.');
  };

  // Config handler
  const handleSaveExamConfig = (cfg: ExamConfig, resetData = false) => {
    DBService.saveExamConfig(cfg, userRole, resetData);
    setExamConfig(cfg);
    reloadExamData(activeSchoolId, cfg.id);
    addToast('success', 'Đã lưu cấu hình kỳ thi', resetData ? 'Đã lưu và reset sạch dữ liệu kỳ thi.' : 'Đã cập nhật thông số kỳ thi.');
  };

  // Student handlers
  const handleSaveStudent = (st: Student) => {
    st.ky_thi_id = activeExamId;
    DBService.saveStudent(st, userRole);
    setStudents(DBService.getStudents(activeSchoolId, activeExamId));
    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
  };

  const handleSaveBulkStudents = (stList: Student[]) => {
    DBService.saveBulkStudents(stList, userRole, activeExamId);
    const updatedStudents = DBService.getStudents(activeSchoolId, activeExamId);
    setStudents(updatedStudents);

    // Tự động xếp phòng chuẩn cho danh sách thí sinh
    const currentRooms = DBService.getRooms(activeSchoolId, activeExamId);
    if (updatedStudents.length > 0 && currentRooms.length > 0) {
      const optimalPlan = RoomAllocationService.runAlgorithmicAllocation(
        updatedStudents,
        currentRooms,
        examConfig.so_hoc_sinh_phong || 28
      );
      DBService.saveRoomAssignments(optimalPlan.assignments, activeSchoolId, activeExamId);
      setAssignments(optimalPlan.assignments);
    }

    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
  };

  const handleDeleteStudent = (id: string) => {
    DBService.deleteStudent(id, userRole);
    setStudents(DBService.getStudents(activeSchoolId, activeExamId));
    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
  };

  const handleDeleteBulkStudents = (ids: string[]) => {
    DBService.deleteBulkStudents(ids, userRole);
    setStudents(DBService.getStudents(activeSchoolId, activeExamId));
    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
  };

  const handleClearAllStudents = () => {
    DBService.clearAllStudents(activeSchoolId, activeExamId, userRole);
    setStudents([]);
    setScores([]);
    setAssignments({});
    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
    addToast('info', 'Đã xóa toàn bộ dữ liệu kỳ thi', 'Danh sách thí sinh, điểm thi và xếp phòng đã được xóa sạch.');
  };

  // Score handlers
  const handleSaveScore = (sc: ExamScore) => {
    sc.ky_thi_id = activeExamId;
    DBService.saveScore(sc, userRole);
    setScores(DBService.getScores(activeSchoolId, activeExamId));
  };

  const handleSaveBulkScores = (scList: ExamScore[]) => {
    DBService.saveBulkScores(scList, userRole, activeExamId);
    setScores(DBService.getScores(activeSchoolId, activeExamId));
    setAuditLogs(DBService.getAuditLogs(activeSchoolId));
  };

  // Room handlers
  const handleSaveRoom = (room: Room) => {
    room.ky_thi_id = activeExamId;
    DBService.saveRoom(room);
    setRooms(DBService.getRooms(activeSchoolId, activeExamId));
  };

  const handleDeleteRoom = (id: string) => {
    DBService.deleteRoom(id);
    setRooms(DBService.getRooms(activeSchoolId, activeExamId));
  };

  const handleSaveAssignments = (newAssignments: Record<string, string[]>) => {
    DBService.saveRoomAssignments(newAssignments, activeSchoolId, activeExamId);
    setAssignments(newAssignments);
  };

  // Combination handlers
  const handleSaveCombination = (comb: AdmissionCombination) => {
    DBService.saveCombination(comb);
    setCombinations(DBService.getCombinations(activeSchoolId));
  };

  const handleDeleteCombination = (id: string) => {
    DBService.deleteCombination(id);
    setCombinations(DBService.getCombinations(activeSchoolId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Security Activation Gate with Invite Code */}
      {!isActivated && (
        <ActivationGate
          school={activeSchool}
          onActivated={() => setIsActivated(true)}
          onShowToast={addToast}
        />
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        schools={schools}
        activeSchool={activeSchool}
        onSelectSchool={handleSelectSchool}
        onAddSchool={handleAddSchool}
        examConfigs={examConfigs}
        activeExamId={activeExamId}
        onSelectExam={handleSelectExam}
        onCreateExam={() => handleCreateExam()}
        examConfig={examConfig}
        userRole={userRole}
        onChangeUserRole={setUserRole}
        onOpenConfigModal={() => setActiveTab('exam-config')}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'students' && (
          <StudentManager
            students={students}
            school={activeSchool}
            examConfig={examConfig}
            onSaveStudent={handleSaveStudent}
            onSaveBulkStudents={handleSaveBulkStudents}
            onDeleteStudent={handleDeleteStudent}
            onDeleteBulkStudents={handleDeleteBulkStudents}
            onClearAllStudents={handleClearAllStudents}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomManager
            rooms={rooms}
            students={students}
            assignments={assignments}
            school={activeSchool}
            examConfig={examConfig}
            onSaveRoom={handleSaveRoom}
            onDeleteRoom={handleDeleteRoom}
            onSaveAssignments={handleSaveAssignments}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'scores' && (
          <ScoreManager
            students={students}
            scores={scores}
            school={activeSchool}
            examConfig={examConfig}
            onSaveScore={handleSaveScore}
            onSaveBulkScores={handleSaveBulkScores}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'combinations' && (
          <CombinationManager
            combinations={combinations}
            school={activeSchool}
            students={students}
            scores={scores}
            onSaveCombination={handleSaveCombination}
            onDeleteCombination={handleDeleteCombination}
            onShowToast={addToast}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportManager
            students={students}
            scores={scores}
            rooms={rooms}
            assignments={assignments}
            combinations={combinations}
            school={activeSchool}
            examConfig={examConfig}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'exam-config' && (
          <ExamConfigView
            config={examConfig}
            allConfigs={examConfigs}
            activeExamId={activeExamId}
            school={activeSchool}
            auditLogs={auditLogs}
            onSave={handleSaveExamConfig}
            onSelectExam={handleSelectExam}
            onCreateExam={handleCreateExam}
            onDeleteExam={handleDeleteExam}
            onResetExamData={handleResetExamData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>Phần Mềm Quản Lý Kỳ Thi Thử THPT (Web App)</strong> • Phòng CNTT - THPT Cà Mau by Antigravity 2026
          </div>
          <div>
            Phiên bản 1.0.0 • Tiêu chuẩn Chương trình GDPT 2018 (Thông tư 24/2024/TT-BGDĐT)
          </div>
        </div>
      </footer>

      {/* AI Configuration Modal */}
      <AIConfigModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onShowToast={addToast}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
