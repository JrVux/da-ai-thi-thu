// TypeScript Data Models for Quản Lý Kỳ Thi THPT

export type UserRole = 'super_admin' | 'admin_truong' | 'giam_thi' | 'giao_vien';

export interface School {
  id: string;
  ten_truong: string;
  ma_truong: string;
  so_gd: string;
  dia_chi?: string;
  so_dien_thoai?: string;
  hieu_truong?: string;
  logo?: string;
}

export interface ExamConfig {
  id: string;
  truong_id: string;
  ten_ky_thi: string;
  nam: number;
  truong: string; // Tên trường / Hội đồng thi
  so_phong: number;
  so_hoc_sinh_phong: number;
  thu_muc_du_lieu: string; // Thư mục lưu dữ liệu kỳ thi
  truong_diem_thi: string; // Họ tên Trưởng điểm thi
  ghi_chu?: string;
  ngay_thi?: string;
  tien_to_sbd: string; // VD: "01"
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  nguoi_cap_nhat?: string;
}

export interface AuditLog {
  id: string;
  truong_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export type Subject = 
  | 'Toán'
  | 'Ngữ văn'
  | 'Vật lí'
  | 'Hóa học'
  | 'Sinh học'
  | 'Lịch sử'
  | 'Địa lí'
  | 'GDKT&PL'
  | 'Tin học'
  | 'Công nghệ Công nghiệp'
  | 'Công nghệ Nông nghiệp'
  | 'Tiếng Anh';

export const ELECTIVE_SUBJECTS: Subject[] = [
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'GDKT&PL',
  'Tin học',
  'Công nghệ Công nghiệp',
  'Công nghệ Nông nghiệp',
  'Tiếng Anh'
];

export interface Student {
  id: string;
  truong_id: string;
  ky_thi_id?: string;
  sbd: string; // Số báo danh
  ho_ten: string;
  ngay_sinh: string; // YYYY-MM-DD or DD/MM/YYYY
  lop: string;
  gioi_tinh: 'Nam' | 'Nữ';
  noi_sinh?: string;
  dan_toc?: string;
  tb_lop_10: number;
  tb_lop_11: number;
  tb_lop_12: number;
  mon_tu_chon_1: Subject;
  mon_tu_chon_2: Subject;
  khuyen_khich: number; // Điểm khuyến khích (0 - 4)
  uu_tien: number; // Điểm ưu tiên (0 - 2)
  phong_thi_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamScore {
  id: string;
  truong_id: string;
  ky_thi_id?: string;
  sbd: string;
  toan?: number | null;
  van?: number | null;
  mon_1?: number | null; // Điểm môn tự chọn 1
  mon_2?: number | null; // Điểm môn tự chọn 2
  khuyen_khich?: number;
  uu_tien?: number;
  updated_at?: string;
  updated_by?: string;
}

export interface Room {
  id: string;
  truong_id: string;
  ky_thi_id?: string;
  ma_phong: string; // VD: P01, P02
  ten_phong: string;
  suc_chua: number;
  ghi_chu?: string;
}

export interface RoomAssignment {
  room_id: string;
  student_ids: string[];
  subjects: {
    ca_1: Subject[];
    ca_2: Subject[];
  };
  violations?: string[];
}

export interface RoomAllocationPlan {
  id: string;
  name: string;
  type: 'algorithm' | 'ai' | 'manual';
  total_rooms: number;
  total_students: number;
  assignments: Record<string, string[]>; // roomId -> studentIds
  stats: {
    avg_students_per_room: number;
    max_subjects_per_shift: number;
    violations_count: number;
    violations_details: string[];
    is_valid: boolean;
  };
  created_at: string;
}

export interface AdmissionCombination {
  id: string;
  truong_id: string;
  ma_to_hop: string; // VD: A00, X06
  ten_to_hop: string;
  khoi: 'A' | 'B' | 'C' | 'D' | 'X';
  mon_1: Subject;
  mon_2: Subject;
  mon_3: Subject;
  ghi_chu?: string;
}

export interface GraduationResult {
  student: Student;
  score: ExamScore;
  tb_3_nam: number;
  tong_diem_4_mon: number;
  dxtn: number;
  is_pass: boolean;
  is_diem_liet: boolean;
  xep_loai?: string;
}

export interface AIProviderConfig {
  gemini_api_key?: string;
  openrouter_api_key?: string;
  deepseek_api_key?: string;
  active_provider?: 'gemini' | 'openrouter' | 'deepseek';
}

export interface AILogEntry {
  id: string;
  timestamp: string;
  provider: string;
  task: string;
  duration_ms: number;
  status: 'success' | 'fallback' | 'failed';
  error?: string;
}

export interface AISubjectAnalysis {
  tong_quan: string;
  mon_manh: string[];
  mon_yeu_can_luu_y: string[];
  lop_can_boi_duong: string[];
  nhan_xet_chi_tiet: string;
  kien_nghi_su_pham: string[];
  timestamp: string;
  provider_used: string;
}
