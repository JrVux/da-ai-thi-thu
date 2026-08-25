import { 
  School, 
  ExamConfig, 
  Student, 
  Room, 
  ExamScore, 
  AdmissionCombination, 
  AuditLog,
  Subject,
  AILogEntry,
  AISubjectAnalysis
} from '../types';

// Default Seed School: THPT Cà Mau
export const DEFAULT_SCHOOL: School = {
  id: 'school-cm-01',
  ten_truong: 'TRƯỜNG THPT CÀ MAU',
  ma_truong: '010',
  so_gd: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO CÀ MAU',
  dia_chi: 'Số 41, Đường Phan Đình Phùng, Phường An Xuyên, Tỉnh Cà Mau',
  so_dien_thoai: '0290 3831 234',
  hieu_truong: 'Nguyễn Văn A',
  logo: '/logo.png'
};

export const DEFAULT_EXAM_CONFIG: ExamConfig = {
  id: 'cfg-cm-2025',
  truong_id: DEFAULT_SCHOOL.id,
  ten_ky_thi: 'KỲ THI TỐT NGHIỆP THPT NĂM 2025',
  nam: 2025,
  truong: 'TRƯỜNG THPT CÀ MAU',
  so_phong: 10,
  so_hoc_sinh_phong: 24,
  thu_muc_du_lieu: 'E:\\00_DU_AN\\DA AI THI THU\\data_ky_thi_2025',
  truong_diem_thi: 'Trần Văn B (Phó Giám Đốc Sở GD&ĐT)',
  ghi_chu: 'Kỳ thi tốt nghiệp THPT theo Chương trình Giáo dục phổ thông 2018 (Thông tư 24/2024/TT-BGDĐT).',
  ngay_thi: '2025-06-26',
  tien_to_sbd: '01',
  ngay_tao: '2025-01-15T08:00:00.000Z',
  ngay_cap_nhat: new Date().toISOString(),
  nguoi_cap_nhat: 'Admin Trường'
};

// Initial Seed Combinations according to Section 8 (A, B, C, D, X)
export const INITIAL_COMBINATIONS: AdmissionCombination[] = [
  // Khối A
  { id: 'c-a00', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A00', ten_to_hop: 'Toán, Vật lí, Hóa học', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Hóa học' },
  { id: 'c-a01', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A01', ten_to_hop: 'Toán, Vật lí, Tiếng Anh', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Tiếng Anh' },
  { id: 'c-a02', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A02', ten_to_hop: 'Toán, Vật lí, Sinh học', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Sinh học' },
  { id: 'c-a03', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A03', ten_to_hop: 'Toán, Vật lí, Lịch sử', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Lịch sử' },
  { id: 'c-a04', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A04', ten_to_hop: 'Toán, Vật lí, Địa lí', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Địa lí' },
  { id: 'c-a05', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A05', ten_to_hop: 'Toán, Hóa học, Lịch sử', khoi: 'A', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Lịch sử' },
  { id: 'c-a06', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A06', ten_to_hop: 'Toán, Hóa học, Địa lí', khoi: 'A', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Địa lí' },
  { id: 'c-a07', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A07', ten_to_hop: 'Toán, Lịch sử, Địa lí', khoi: 'A', mon_1: 'Toán', mon_2: 'Lịch sử', mon_3: 'Địa lí' },
  { id: 'c-a09', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A09', ten_to_hop: 'Toán, Địa lí, GDKT&PL', khoi: 'A', mon_1: 'Toán', mon_2: 'Địa lí', mon_3: 'GDKT&PL' },
  { id: 'c-a10', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'A10', ten_to_hop: 'Toán, Vật lí, GDKT&PL', khoi: 'A', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'GDKT&PL' },

  // Khối B
  { id: 'c-b00', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B00', ten_to_hop: 'Toán, Hóa học, Sinh học', khoi: 'B', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Sinh học' },
  { id: 'c-b01', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B01', ten_to_hop: 'Toán, Sinh học, Lịch sử', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Lịch sử' },
  { id: 'c-b02', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B02', ten_to_hop: 'Toán, Sinh học, Địa lí', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Địa lí' },
  { id: 'c-b03', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B03', ten_to_hop: 'Toán, Sinh học, Ngữ văn', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Ngữ văn' },
  { id: 'c-b04', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B04', ten_to_hop: 'Toán, Sinh học, GDKT&PL', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'GDKT&PL' },
  { id: 'c-b08', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B08', ten_to_hop: 'Toán, Sinh học, Tiếng Anh', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Tiếng Anh' },
  { id: 'c-b10', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B10', ten_to_hop: 'Toán, Hóa học, GDKT&PL', khoi: 'B', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'GDKT&PL' },
  { id: 'c-b11', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B11', ten_to_hop: 'Toán, Sinh học, Công nghệ Nông nghiệp', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Công nghệ Nông nghiệp' },
  { id: 'c-b12', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B12', ten_to_hop: 'Toán, Sinh học, Công nghệ Công nghiệp', khoi: 'B', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Công nghệ Công nghiệp' },
  { id: 'c-b13', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'B13', ten_to_hop: 'Toán, Hóa học, Công nghệ Nông nghiệp', khoi: 'B', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Công nghệ Nông nghiệp' },

  // Khối C
  { id: 'c-c00', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C00', ten_to_hop: 'Ngữ văn, Lịch sử, Địa lí', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Lịch sử', mon_3: 'Địa lí' },
  { id: 'c-c01', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C01', ten_to_hop: 'Ngữ văn, Toán, Vật lí', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Toán', mon_3: 'Vật lí' },
  { id: 'c-c02', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C02', ten_to_hop: 'Ngữ văn, Toán, Hóa học', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Toán', mon_3: 'Hóa học' },
  { id: 'c-c03', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C03', ten_to_hop: 'Ngữ văn, Toán, Lịch sử', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Toán', mon_3: 'Lịch sử' },
  { id: 'c-c04', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C04', ten_to_hop: 'Ngữ văn, Toán, Địa lí', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Toán', mon_3: 'Địa lí' },
  { id: 'c-c05', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C05', ten_to_hop: 'Ngữ văn, Vật lí, Hóa học', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Vật lí', mon_3: 'Hóa học' },
  { id: 'c-c07', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C07', ten_to_hop: 'Ngữ văn, Vật lí, Lịch sử', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Vật lí', mon_3: 'Lịch sử' },
  { id: 'c-c08', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C08', ten_to_hop: 'Ngữ văn, Hóa học, Sinh học', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Hóa học', mon_3: 'Sinh học' },
  { id: 'c-c14', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C14', ten_to_hop: 'Ngữ văn, Toán, GDKT&PL', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Toán', mon_3: 'GDKT&PL' },
  { id: 'c-c19', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'C19', ten_to_hop: 'Ngữ văn, Lịch sử, GDKT&PL', khoi: 'C', mon_1: 'Ngữ văn', mon_2: 'Lịch sử', mon_3: 'GDKT&PL' },

  // Khối D
  { id: 'c-d01', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D01', ten_to_hop: 'Toán, Ngữ văn, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'Ngữ văn', mon_3: 'Tiếng Anh' },
  { id: 'c-d07', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D07', ten_to_hop: 'Toán, Hóa học, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Tiếng Anh' },
  { id: 'c-d08', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D08', ten_to_hop: 'Toán, Sinh học, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Tiếng Anh' },
  { id: 'c-d09', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D09', ten_to_hop: 'Toán, Lịch sử, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'Lịch sử', mon_3: 'Tiếng Anh' },
  { id: 'c-d10', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D10', ten_to_hop: 'Toán, Địa lí, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'Địa lí', mon_3: 'Tiếng Anh' },
  { id: 'c-d11', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D11', ten_to_hop: 'Ngữ văn, Vật lí, Tiếng Anh', khoi: 'D', mon_1: 'Ngữ văn', mon_2: 'Vật lí', mon_3: 'Tiếng Anh' },
  { id: 'c-d14', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D14', ten_to_hop: 'Ngữ văn, Lịch sử, Tiếng Anh', khoi: 'D', mon_1: 'Ngữ văn', mon_2: 'Lịch sử', mon_3: 'Tiếng Anh' },
  { id: 'c-d15', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D15', ten_to_hop: 'Ngữ văn, Địa lí, Tiếng Anh', khoi: 'D', mon_1: 'Ngữ văn', mon_2: 'Địa lí', mon_3: 'Tiếng Anh' },
  { id: 'c-d66', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D66', ten_to_hop: 'Ngữ văn, GDKT&PL, Tiếng Anh', khoi: 'D', mon_1: 'Ngữ văn', mon_2: 'GDKT&PL', mon_3: 'Tiếng Anh' },
  { id: 'c-d96', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'D96', ten_to_hop: 'Toán, GDKT&PL, Tiếng Anh', khoi: 'D', mon_1: 'Toán', mon_2: 'GDKT&PL', mon_3: 'Tiếng Anh' },

  // Khối X (mới theo CT 2018)
  { id: 'c-x05', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X05', ten_to_hop: 'Toán, Vật lí, GDKT&PL', khoi: 'X', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'GDKT&PL' },
  { id: 'c-x06', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X06', ten_to_hop: 'Toán, Vật lí, Tin học', khoi: 'X', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Tin học' },
  { id: 'c-x07', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X07', ten_to_hop: 'Toán, Vật lí, Công nghệ Công nghiệp', khoi: 'X', mon_1: 'Toán', mon_2: 'Vật lí', mon_3: 'Công nghệ Công nghiệp' },
  { id: 'c-x09', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X09', ten_to_hop: 'Toán, Hóa học, GDKT&PL', khoi: 'X', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'GDKT&PL' },
  { id: 'c-x10', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X10', ten_to_hop: 'Toán, Hóa học, Tin học', khoi: 'X', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Tin học' },
  { id: 'c-x11', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X11', ten_to_hop: 'Toán, Hóa học, Công nghệ Công nghiệp', khoi: 'X', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Công nghệ Công nghiệp' },
  { id: 'c-x12', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X12', ten_to_hop: 'Toán, Hóa học, Công nghệ Nông nghiệp', khoi: 'X', mon_1: 'Toán', mon_2: 'Hóa học', mon_3: 'Công nghệ Nông nghiệp' },
  { id: 'c-x13', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X13', ten_to_hop: 'Toán, Sinh học, GDKT&PL', khoi: 'X', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'GDKT&PL' },
  { id: 'c-x26', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X26', ten_to_hop: 'Toán, Tiếng Anh, Tin học', khoi: 'X', mon_1: 'Toán', mon_2: 'Tiếng Anh', mon_3: 'Tin học' },
  { id: 'c-x27', truong_id: DEFAULT_SCHOOL.id, ma_to_hop: 'X27', ten_to_hop: 'Toán, Sinh học, Tin học', khoi: 'X', mon_1: 'Toán', mon_2: 'Sinh học', mon_3: 'Tin học' },
];

// Sample Students for THPT Cà Mau
export const INITIAL_STUDENTS: Student[] = [
  { id: 'st-01', truong_id: DEFAULT_SCHOOL.id, sbd: '010001', ho_ten: 'Nguyễn Văn An', ngay_sinh: '2007-03-15', lop: '12A1', gioi_tinh: 'Nam', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 8.2, tb_lop_11: 8.5, tb_lop_12: 8.8, mon_tu_chon_1: 'Vật lí', mon_tu_chon_2: 'Hóa học', khuyen_khich: 1.5, uu_tien: 0.5 },
  { id: 'st-02', truong_id: DEFAULT_SCHOOL.id, sbd: '010002', ho_ten: 'Trần Thị Bình', ngay_sinh: '2007-05-20', lop: '12A1', gioi_tinh: 'Nữ', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 7.8, tb_lop_11: 8.0, tb_lop_12: 8.4, mon_tu_chon_1: 'Vật lí', mon_tu_chon_2: 'Tiếng Anh', khuyen_khich: 1.0, uu_tien: 0 },
  { id: 'st-03', truong_id: DEFAULT_SCHOOL.id, sbd: '010003', ho_ten: 'Lê Hoàng Cường', ngay_sinh: '2007-11-10', lop: '12A1', gioi_tinh: 'Nam', noi_sinh: 'Bạc Liêu', dan_toc: 'Kinh', tb_lop_10: 6.5, tb_lop_11: 6.8, tb_lop_12: 7.2, mon_tu_chon_1: 'Lịch sử', mon_tu_chon_2: 'Địa lí', khuyen_khich: 0, uu_tien: 0.25 },
  { id: 'st-04', truong_id: DEFAULT_SCHOOL.id, sbd: '010004', ho_ten: 'Phạm Thị Dung', ngay_sinh: '2007-08-05', lop: '12A2', gioi_tinh: 'Nữ', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 9.0, tb_lop_11: 9.1, tb_lop_12: 9.3, mon_tu_chon_1: 'Hóa học', mon_tu_chon_2: 'Sinh học', khuyen_khich: 2.0, uu_tien: 0 },
  { id: 'st-05', truong_id: DEFAULT_SCHOOL.id, sbd: '010005', ho_ten: 'Võ Minh Đức', ngay_sinh: '2007-02-14', lop: '12A2', gioi_tinh: 'Nam', noi_sinh: 'Cà Mau', dan_toc: 'Khmer', tb_lop_10: 7.0, tb_lop_11: 7.3, tb_lop_12: 7.5, mon_tu_chon_1: 'Tin học', mon_tu_chon_2: 'Vật lí', khuyen_khich: 0.5, uu_tien: 0.5 },
  { id: 'st-06', truong_id: DEFAULT_SCHOOL.id, sbd: '010006', ho_ten: 'Đặng Thùy Giang', ngay_sinh: '2007-09-28', lop: '12A2', gioi_tinh: 'Nữ', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 8.0, tb_lop_11: 8.2, tb_lop_12: 8.6, mon_tu_chon_1: 'GDKT&PL', mon_tu_chon_2: 'Tiếng Anh', khuyen_khich: 1.0, uu_tien: 0 },
  { id: 'st-07', truong_id: DEFAULT_SCHOOL.id, sbd: '010007', ho_ten: 'Huỳnh Hải Hà', ngay_sinh: '2007-04-12', lop: '12A3', gioi_tinh: 'Nữ', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 6.0, tb_lop_11: 6.2, tb_lop_12: 6.5, mon_tu_chon_1: 'Lịch sử', mon_tu_chon_2: 'GDKT&PL', khuyen_khich: 0, uu_tien: 0 },
  { id: 'st-08', truong_id: DEFAULT_SCHOOL.id, sbd: '010008', ho_ten: 'Bùi Quốc Hùng', ngay_sinh: '2007-12-01', lop: '12A3', gioi_tinh: 'Nam', noi_sinh: 'Kiên Giang', dan_toc: 'Hoa', tb_lop_10: 7.5, tb_lop_11: 7.6, tb_lop_12: 7.9, mon_tu_chon_1: 'Vật lí', mon_tu_chon_2: 'Tin học', khuyen_khich: 1.0, uu_tien: 0.25 },
  { id: 'st-09', truong_id: DEFAULT_SCHOOL.id, sbd: '010009', ho_ten: 'Đỗ Kim Khánh', ngay_sinh: '2007-06-18', lop: '12A3', gioi_tinh: 'Nữ', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 8.5, tb_lop_11: 8.7, tb_lop_12: 9.0, mon_tu_chon_1: 'Hóa học', mon_tu_chon_2: 'Tiếng Anh', khuyen_khich: 1.5, uu_tien: 0 },
  { id: 'st-10', truong_id: DEFAULT_SCHOOL.id, sbd: '010010', ho_ten: 'Ngô Thanh Liêm', ngay_sinh: '2007-10-30', lop: '12A4', gioi_tinh: 'Nam', noi_sinh: 'Cà Mau', dan_toc: 'Kinh', tb_lop_10: 5.8, tb_lop_11: 6.0, tb_lop_12: 6.2, mon_tu_chon_1: 'Địa lí', mon_tu_chon_2: 'GDKT&PL', khuyen_khich: 0, uu_tien: 0 }
];

// Sample Initial Scores
export const INITIAL_SCORES: ExamScore[] = [
  { id: 'sc-01', truong_id: DEFAULT_SCHOOL.id, sbd: '010001', toan: 8.4, van: 7.5, mon_1: 8.75, mon_2: 9.0, khuyen_khich: 1.5, uu_tien: 0.5 },
  { id: 'sc-02', truong_id: DEFAULT_SCHOOL.id, sbd: '010002', toan: 7.6, van: 8.0, mon_1: 7.5, mon_2: 8.2, khuyen_khich: 1.0, uu_tien: 0 },
  { id: 'sc-03', truong_id: DEFAULT_SCHOOL.id, sbd: '010003', toan: 6.2, van: 7.0, mon_1: 6.5, mon_2: 7.0, khuyen_khich: 0, uu_tien: 0.25 },
  { id: 'sc-04', truong_id: DEFAULT_SCHOOL.id, sbd: '010004', toan: 9.2, van: 8.5, mon_1: 9.5, mon_2: 9.0, khuyen_khich: 2.0, uu_tien: 0 },
  { id: 'sc-05', truong_id: DEFAULT_SCHOOL.id, sbd: '010005', toan: 7.0, van: 6.5, mon_1: 8.0, mon_2: 7.25, khuyen_khich: 0.5, uu_tien: 0.5 },
  { id: 'sc-06', truong_id: DEFAULT_SCHOOL.id, sbd: '010006', toan: 8.0, van: 8.2, mon_1: 7.8, mon_2: 8.5, khuyen_khich: 1.0, uu_tien: 0 },
  { id: 'sc-07', truong_id: DEFAULT_SCHOOL.id, sbd: '010007', toan: 5.5, van: 6.0, mon_1: 6.0, mon_2: 6.5, khuyen_khich: 0, uu_tien: 0 },
  { id: 'sc-08', truong_id: DEFAULT_SCHOOL.id, sbd: '010008', toan: 7.8, van: 7.2, mon_1: 8.5, mon_2: 8.0, khuyen_khich: 1.0, uu_tien: 0.25 },
  { id: 'sc-09', truong_id: DEFAULT_SCHOOL.id, sbd: '010009', toan: 8.8, van: 8.0, mon_1: 9.0, mon_2: 8.6, khuyen_khich: 1.5, uu_tien: 0 },
  { id: 'sc-10', truong_id: DEFAULT_SCHOOL.id, sbd: '010010', toan: 6.0, van: 5.5, mon_1: 6.2, mon_2: 5.8, khuyen_khich: 0, uu_tien: 0 }
];

// Initial Rooms (Chuẩn gọn: Phòng 01, Phòng 02, ... bỏ dãy/tầng)
export const INITIAL_ROOMS: Room[] = [
  { id: 'room-01', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P01', ten_phong: 'Phòng 01', suc_chua: 28 },
  { id: 'room-02', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P02', ten_phong: 'Phòng 02', suc_chua: 28 },
  { id: 'room-03', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P03', ten_phong: 'Phòng 03', suc_chua: 28 },
  { id: 'room-04', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P04', ten_phong: 'Phòng 04', suc_chua: 28 },
  { id: 'room-05', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P05', ten_phong: 'Phòng 05', suc_chua: 28 },
  { id: 'room-06', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P06', ten_phong: 'Phòng 06', suc_chua: 28 },
  { id: 'room-07', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P07', ten_phong: 'Phòng 07', suc_chua: 28 },
  { id: 'room-08', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P08', ten_phong: 'Phòng 08', suc_chua: 28 },
  { id: 'room-09', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P09', ten_phong: 'Phòng 09', suc_chua: 28 },
  { id: 'room-10', truong_id: DEFAULT_SCHOOL.id, ma_phong: 'P10', ten_phong: 'Phòng 10', suc_chua: 28 }
];

// Default Valid Invite Codes
export const DEFAULT_INVITE_CODES = [
  'THPT-CAMAU-2025',
  'CAMAU-2025',
  'GDPT-2025',
  'ADMIN-8888',
  'VIP-2025'
];

// Dual-mode Storage Key Constants
const STORAGE_KEYS = {
  SCHOOLS: 'qlkt_schools_v1',
  ACTIVE_SCHOOL_ID: 'qlkt_active_school_id_v1',
  EXAM_CONFIGS: 'qlkt_exam_configs_v2',
  ACTIVE_EXAM_ID: 'qlkt_active_exam_id_v2',
  STUDENTS: 'qlkt_students_v1',
  ROOMS: 'qlkt_rooms_v1',
  SCORES: 'qlkt_scores_v1',
  COMBINATIONS: 'qlkt_combinations_v1',
  AUDIT_LOGS: 'qlkt_audit_logs_v1',
  AI_LOGS: 'qlkt_ai_logs_v1',
  AI_ANALYSIS: 'qlkt_ai_analysis_v1',
  ROOM_ASSIGNMENTS: 'qlkt_room_assignments_v1',
  USER_ROLE: 'qlkt_user_role_v1',
  INVITE_ACTIVATED: 'qlkt_invite_activated_v1',
  INVITE_CODES: 'qlkt_invite_codes_v1'
};

// Database Service Helper with In-Memory / LocalStorage Persistence
export class DBService {
  private static getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // School & Multi-tenant
  static getSchools(): School[] {
    let list = this.getItem<School[]>(STORAGE_KEYS.SCHOOLS, [DEFAULT_SCHOOL]);
    const idx = list.findIndex(s => s.id === DEFAULT_SCHOOL.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...DEFAULT_SCHOOL };
    } else {
      list.unshift(DEFAULT_SCHOOL);
    }
    this.setItem(STORAGE_KEYS.SCHOOLS, list);
    return list;
  }

  static getActiveSchoolId(): string {
    return this.getItem<string>(STORAGE_KEYS.ACTIVE_SCHOOL_ID, DEFAULT_SCHOOL.id);
  }

  static setActiveSchoolId(id: string): void {
    this.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, id);
  }

  static getActiveSchool(): School {
    const activeId = this.getActiveSchoolId();
    const schools = this.getSchools();
    return schools.find(s => s.id === activeId) || DEFAULT_SCHOOL;
  }

  static saveSchool(school: School): void {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === school.id);
    if (idx >= 0) {
      schools[idx] = school;
    } else {
      schools.push(school);
    }
    this.setItem(STORAGE_KEYS.SCHOOLS, schools);
  }

  // ==========================================
  // EXAMS MANAGEMENT (Hỗ trợ Nhiều Kỳ Thi)
  // ==========================================
  static getExamConfigs(truongId = this.getActiveSchoolId()): ExamConfig[] {
    const rawConfigs = this.getItem<any>(STORAGE_KEYS.EXAM_CONFIGS, null);
    let list: ExamConfig[] = [];
    if (Array.isArray(rawConfigs)) {
      list = rawConfigs;
    } else if (rawConfigs && typeof rawConfigs === 'object') {
      list = Object.values(rawConfigs);
    }
    
    // Đảm bảo có ít nhất 1 kỳ thi cho trường mặc định
    if (list.length === 0 || !list.some(c => c.truong_id === truongId)) {
      const defaultExam: ExamConfig = {
        ...DEFAULT_EXAM_CONFIG,
        truong_id: truongId,
        id: `cfg-${truongId}-2025`
      };
      list.push(defaultExam);
      this.setItem(STORAGE_KEYS.EXAM_CONFIGS, list);
    }

    return list.filter(c => c.truong_id === truongId);
  }

  static getActiveExamId(): string {
    const activeSchoolId = this.getActiveSchoolId();
    const stored = this.getItem<Record<string, string>>(STORAGE_KEYS.ACTIVE_EXAM_ID, {});
    if (stored[activeSchoolId]) {
      return stored[activeSchoolId];
    }
    const exams = this.getExamConfigs(activeSchoolId);
    return exams[0]?.id || `cfg-${activeSchoolId}-2025`;
  }

  static setActiveExamId(examId: string): void {
    const activeSchoolId = this.getActiveSchoolId();
    const stored = this.getItem<Record<string, string>>(STORAGE_KEYS.ACTIVE_EXAM_ID, {});
    stored[activeSchoolId] = examId;
    this.setItem(STORAGE_KEYS.ACTIVE_EXAM_ID, stored);
  }

  static getExamConfig(truongId = this.getActiveSchoolId(), examId?: string): ExamConfig {
    const exams = this.getExamConfigs(truongId);
    const targetId = examId || this.getActiveExamId();
    const found = exams.find(e => e.id === targetId);
    if (found) return found;
    return exams[0] || {
      ...DEFAULT_EXAM_CONFIG,
      id: `cfg-${truongId}`,
      truong_id: truongId,
      truong: this.getActiveSchool().ten_truong
    };
  }

  static syncRoomsWithConfig(config: ExamConfig): Room[] {
    const all = this.getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const otherRooms = all.filter(r => !(r.truong_id === config.truong_id && (r.ky_thi_id || config.id) === config.id));
    let schoolRooms = all.filter(r => r.truong_id === config.truong_id && (r.ky_thi_id || config.id) === config.id);

    const targetCount = Math.max(1, config.so_phong);
    const targetCapacity = Math.max(1, config.so_hoc_sinh_phong || 24);

    if (schoolRooms.length < targetCount) {
      for (let i = schoolRooms.length + 1; i <= targetCount; i++) {
        const ma = `P${String(i).padStart(2, '0')}`;
        schoolRooms.push({
          id: `room-${config.truong_id}-${config.id}-${i}-${Date.now()}`,
          truong_id: config.truong_id,
          ky_thi_id: config.id,
          ma_phong: ma,
          ten_phong: `Phòng ${String(i).padStart(2, '0')}`,
          suc_chua: targetCapacity
        });
      }
    } else if (schoolRooms.length > targetCount) {
      schoolRooms = schoolRooms.slice(0, targetCount);
    }

    // Làm sạch tên phòng
    schoolRooms = schoolRooms.map((r, idx) => {
      const matchNum = r.ma_phong.match(/\d+/) || r.ten_phong.match(/\d+/);
      const numStr = matchNum ? String(matchNum[0]).padStart(2, '0') : String(idx + 1).padStart(2, '0');
      return {
        ...r,
        ky_thi_id: config.id,
        ma_phong: `P${numStr}`,
        ten_phong: `Phòng ${numStr}`,
        suc_chua: targetCapacity
      };
    });

    const updatedAll = [...otherRooms, ...schoolRooms];
    this.setItem(STORAGE_KEYS.ROOMS, updatedAll);
    return schoolRooms;
  }

  static saveExamConfig(config: ExamConfig, userName = 'Admin', resetData = false): void {
    const rawConfigs = this.getItem<any>(STORAGE_KEYS.EXAM_CONFIGS, []);
    let list: ExamConfig[] = Array.isArray(rawConfigs) ? rawConfigs : (rawConfigs ? Object.values(rawConfigs) : []);
    
    config.ngay_cap_nhat = new Date().toISOString();
    config.nguoi_cap_nhat = userName;

    const idx = list.findIndex(c => c.id === config.id);
    if (idx >= 0) {
      list[idx] = config;
    } else {
      config.ngay_tao = new Date().toISOString();
      list.push(config);
    }
    this.setItem(STORAGE_KEYS.EXAM_CONFIGS, list);
    this.setActiveExamId(config.id);

    // Tự động đồng bộ số lượng phòng thi và sức chứa phòng
    this.syncRoomsWithConfig(config);

    if (resetData) {
      this.clearExamData(config.id, userName);
    }

    this.logAudit({
      truong_id: config.truong_id,
      user_name: userName,
      action: idx >= 0 ? 'CẬP NHẬT CẤU HÌNH KỲ THI' : 'TẠO KỲ THI MỚI',
      details: `Kỳ thi: ${config.ten_ky_thi} (${config.nam}) - ${config.so_phong} phòng thi (${config.so_hoc_sinh_phong} TS/phòng) ${resetData ? '- [Đã Reset toàn bộ dữ liệu]' : ''}`
    });
  }

  static deleteExam(examId: string, userName = 'Admin'): void {
    const truongId = this.getActiveSchoolId();

    // 1. Xóa sạch toàn bộ dữ liệu đi kèm của kỳ thi này TRƯỚC khi xóa cấu hình
    this.clearExamData(examId, userName);

    // 2. Xóa phòng thi gắn với kỳ thi này
    const allRooms = this.getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    this.setItem(STORAGE_KEYS.ROOMS, allRooms.filter(r => r.truong_id !== truongId || (r.ky_thi_id && r.ky_thi_id !== examId)));

    // 3. Xóa cấu hình kỳ thi
    const rawConfigs = this.getItem<any>(STORAGE_KEYS.EXAM_CONFIGS, []);
    let list: ExamConfig[] = Array.isArray(rawConfigs) ? rawConfigs : (rawConfigs ? Object.values(rawConfigs) : []);
    const target = list.find(c => c.id === examId);
    list = list.filter(c => c.id !== examId);
    
    // Nếu xóa hết kỳ thi của trường thì tạo mới một kỳ thi mặc định sạch
    if (!list.some(c => c.truong_id === truongId)) {
      const defaultExam: ExamConfig = {
        ...DEFAULT_EXAM_CONFIG,
        id: `cfg-${truongId}-${Date.now()}`,
        truong_id: truongId
      };
      list.push(defaultExam);
      this.setActiveExamId(defaultExam.id);
    } else {
      const remainingForSchool = list.filter(c => c.truong_id === truongId);
      this.setActiveExamId(remainingForSchool[0].id);
    }
    this.setItem(STORAGE_KEYS.EXAM_CONFIGS, list);

    if (target) {
      this.logAudit({
        truong_id: truongId,
        user_name: userName,
        action: 'XÓA KỲ THI',
        details: `Đã xóa kỳ thi: ${target.ten_ky_thi} (${target.nam}) và toàn bộ dữ liệu liên quan.`
      });
    }
  }

  static clearExamData(examId: string, userName = 'Admin'): void {
    const truongId = this.getActiveSchoolId();

    // 1. Xóa thí sinh thuộc kỳ thi này
    const allStudents = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const filteredStudents = allStudents.filter(s => {
      if (s.truong_id !== truongId) return true;
      const sExamId = s.ky_thi_id || 'cfg-school-cm-01-2025';
      return sExamId !== examId;
    });
    this.setItem(STORAGE_KEYS.STUDENTS, filteredStudents);

    // 2. Xóa điểm thi thuộc kỳ thi này
    const allScores = this.getItem<ExamScore[]>(STORAGE_KEYS.SCORES, []);
    const filteredScores = allScores.filter(s => {
      if (s.truong_id !== truongId) return true;
      const sExamId = s.ky_thi_id || 'cfg-school-cm-01-2025';
      return sExamId !== examId;
    });
    this.setItem(STORAGE_KEYS.SCORES, filteredScores);

    // 3. Xóa phân bổ phòng thi thuộc kỳ thi này
    const assignmentsMap = this.getItem<Record<string, Record<string, string[]>>>(STORAGE_KEYS.ROOM_ASSIGNMENTS, {});
    const key = `${truongId}__${examId}`;
    delete assignmentsMap[key];
    delete assignmentsMap[truongId];
    this.setItem(STORAGE_KEYS.ROOM_ASSIGNMENTS, assignmentsMap);

    this.logAudit({
      truong_id: truongId,
      user_name: userName,
      action: 'XÓA / RESET DỮ LIỆU KỲ THI',
      details: `Đã xóa sạch thí sinh, điểm thi và phân bổ phòng của kỳ thi.`
    });
  }

  // ==========================================
  // STUDENTS CRUD (Cô lập theo Kỳ Thi)
  // ==========================================
  static getStudents(truongId = this.getActiveSchoolId(), examId?: string): Student[] {
    const targetExamId = examId || this.getActiveExamId();
    const all = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    
    const list = all.filter(s => {
      if (s.truong_id !== truongId) return false;
      const sExamId = s.ky_thi_id || 'cfg-school-cm-01-2025';
      return sExamId === targetExamId;
    });
    
    // Tự động lọc trùng lặp
    const seen = new Set<string>();
    const cleanList: Student[] = [];
    list.forEach(s => {
      const key = s.sbd ? `sbd_${s.sbd}` : `identity_${s.ho_ten.trim().toLowerCase()}_${s.ngay_sinh}_${s.lop.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        cleanList.push({
          ...s,
          ky_thi_id: targetExamId
        });
      }
    });
    return cleanList;
  }

  static saveStudent(student: Student, userName = 'Admin'): void {
    const examId = student.ky_thi_id || this.getActiveExamId();
    student.ky_thi_id = examId;
    const all = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = all.findIndex(s => s.id === student.id);
    student.updated_at = new Date().toISOString();

    if (idx >= 0) {
      all[idx] = student;
      this.logAudit({
        truong_id: student.truong_id,
        user_name: userName,
        action: 'SỬA THÍ SINH',
        details: `SBD: ${student.sbd} - Họ tên: ${student.ho_ten} - Lớp: ${student.lop}`
      });
    } else {
      student.created_at = new Date().toISOString();
      all.push(student);
      this.logAudit({
        truong_id: student.truong_id,
        user_name: userName,
        action: 'THÊM THÍ SINH',
        details: `SBD: ${student.sbd} - Họ tên: ${student.ho_ten} - Lớp: ${student.lop}`
      });
    }
    this.setItem(STORAGE_KEYS.STUDENTS, all);
  }

  static saveBulkStudents(students: Student[], userName = 'Admin', examId?: string): void {
    const truongId = this.getActiveSchoolId();
    const targetExamId = examId || this.getActiveExamId();

    const all = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const otherStudents = all.filter(s => {
      if (s.truong_id !== truongId) return true;
      const sExamId = s.ky_thi_id || 'cfg-school-cm-01-2025';
      return sExamId !== targetExamId;
    });

    const uniqueMap = new Map<string, Student>();
    students.forEach((s) => {
      s.truong_id = truongId;
      s.ky_thi_id = targetExamId;
      s.updated_at = new Date().toISOString();
      const key = s.sbd ? `sbd_${s.sbd}` : `identity_${s.ho_ten.trim().toLowerCase()}_${s.ngay_sinh}_${s.lop.trim().toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, s);
      }
    });

    const uniqueStudents = Array.from(uniqueMap.values());
    const updated = [...otherStudents, ...uniqueStudents];
    this.setItem(STORAGE_KEYS.STUDENTS, updated);

    this.logAudit({
      truong_id: truongId,
      user_name: userName,
      action: 'IMPORT THÍ SINH HÀNG LOẠT',
      details: `Đã lưu danh sách ${uniqueStudents.length} thí sinh cho kỳ thi.`
    });
  }

  static deleteStudent(id: string, userName = 'Admin'): void {
    const all = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const target = all.find(s => s.id === id);
    const filtered = all.filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.STUDENTS, filtered);

    if (target) {
      this.logAudit({
        truong_id: target.truong_id,
        user_name: userName,
        action: 'XÓA THÍ SINH',
        details: `Đã xóa SBD: ${target.sbd} - ${target.ho_ten}`
      });
    }
  }

  static deleteBulkStudents(ids: string[], userName = 'Admin'): void {
    const all = this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const filtered = all.filter(s => !ids.includes(s.id));
    this.setItem(STORAGE_KEYS.STUDENTS, filtered);

    this.logAudit({
      truong_id: this.getActiveSchoolId(),
      user_name: userName,
      action: 'XÓA NHIỀU THÍ SINH',
      details: `Đã xóa ${ids.length} thí sinh được chọn.`
    });
  }

  static clearAllStudents(truongId = this.getActiveSchoolId(), examId?: string, userName = 'Admin'): void {
    const targetExamId = examId || this.getActiveExamId();
    this.clearExamData(targetExamId, userName);
  }

  // ==========================================
  // SCORES CRUD (Cô lập theo Kỳ Thi)
  // ==========================================
  static getScores(truongId = this.getActiveSchoolId(), examId?: string): ExamScore[] {
    const targetExamId = examId || this.getActiveExamId();
    const all = this.getItem<ExamScore[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    return all.filter(s => {
      if (s.truong_id !== truongId) return false;
      const sExamId = s.ky_thi_id || 'cfg-school-cm-01-2025';
      return sExamId === targetExamId;
    });
  }

  static saveScore(score: ExamScore, userName = 'Admin'): void {
    const truongId = this.getActiveSchoolId();
    const examId = score.ky_thi_id || this.getActiveExamId();
    score.truong_id = truongId;
    score.ky_thi_id = examId;

    const all = this.getItem<ExamScore[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    const idx = all.findIndex(s => s.sbd === score.sbd && s.truong_id === truongId && (s.ky_thi_id || examId) === examId);

    if (idx >= 0) {
      all[idx] = score;
      this.logAudit({
        truong_id: truongId,
        user_name: userName,
        action: 'SỬA ĐIỂM THI',
        details: `SBD: ${score.sbd}`
      });
    } else {
      if (!score.id) score.id = `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      all.push(score);
      this.logAudit({
        truong_id: truongId,
        user_name: userName,
        action: 'NHẬP ĐIỂM THI',
        details: `SBD: ${score.sbd}`
      });
    }
    this.setItem(STORAGE_KEYS.SCORES, all);
  }

  static saveBulkScores(scores: ExamScore[], userName = 'Admin', examId?: string): void {
    const truongId = this.getActiveSchoolId();
    const targetExamId = examId || this.getActiveExamId();
    const all = this.getItem<ExamScore[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);

    scores.forEach((s) => {
      s.truong_id = truongId;
      s.ky_thi_id = targetExamId;
      const idx = all.findIndex(item => item.sbd === s.sbd && item.truong_id === truongId && (item.ky_thi_id || targetExamId) === targetExamId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...s };
      } else {
        if (!s.id) s.id = `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        all.push(s);
      }
    });

    this.setItem(STORAGE_KEYS.SCORES, all);
    this.logAudit({
      truong_id: truongId,
      user_name: userName,
      action: 'NHẬP ĐIỂM THI HÀNG LOẠT',
      details: `Đã cập nhật điểm cho ${scores.length} thí sinh trong kỳ thi.`
    });
  }

  // ==========================================
  // ROOMS & ASSIGNMENTS (Cô lập theo Kỳ Thi)
  // ==========================================
  static getRooms(truongId = this.getActiveSchoolId(), examId?: string): Room[] {
    const targetExamId = examId || this.getActiveExamId();
    const all = this.getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    let hasDirty = false;

    const cleanedAll = all.map(r => {
      const matchNum = r.ma_phong.match(/\d+/) || r.ten_phong.match(/\d+/);
      const numStr = matchNum ? String(matchNum[0]).padStart(2, '0') : '01';
      const cleanMa = `P${numStr}`;
      const cleanTen = `Phòng ${numStr}`;
      if (r.ma_phong !== cleanMa || r.ten_phong !== cleanTen) {
        hasDirty = true;
      }
      return {
        ...r,
        ma_phong: cleanMa,
        ten_phong: cleanTen
      };
    });

    if (hasDirty) {
      this.setItem(STORAGE_KEYS.ROOMS, cleanedAll);
    }

    return cleanedAll.filter(r => {
      if (r.truong_id !== truongId) return false;
      const rExamId = r.ky_thi_id || this.getExamConfigs(truongId)[0]?.id;
      return rExamId === targetExamId;
    });
  }

  static saveRoom(room: Room): void {
    const examId = room.ky_thi_id || this.getActiveExamId();
    room.ky_thi_id = examId;
    const all = this.getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const matchNum = room.ma_phong.match(/\d+/) || room.ten_phong.match(/\d+/);
    const numStr = matchNum ? String(matchNum[0]).padStart(2, '0') : '01';
    const cleanRoom: Room = {
      ...room,
      ky_thi_id: examId,
      ma_phong: `P${numStr}`,
      ten_phong: `Phòng ${numStr}`
    };

    const idx = all.findIndex(r => r.id === cleanRoom.id);
    if (idx >= 0) {
      all[idx] = cleanRoom;
    } else {
      all.push(cleanRoom);
    }
    this.setItem(STORAGE_KEYS.ROOMS, all);
  }

  static deleteRoom(id: string): void {
    const all = this.getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    this.setItem(STORAGE_KEYS.ROOMS, all.filter(r => r.id !== id));
  }

  static getRoomAssignments(truongId = this.getActiveSchoolId(), examId?: string): Record<string, string[]> {
    const targetExamId = examId || this.getActiveExamId();
    const assignmentsMap = this.getItem<Record<string, Record<string, string[]>>>(STORAGE_KEYS.ROOM_ASSIGNMENTS, {});
    const key = `${truongId}__${targetExamId}`;
    const raw = assignmentsMap[key] || assignmentsMap[truongId] || {};
    
    // Tự động làm sạch các ID thí sinh cũ/rác không còn tồn tại trong danh sách của kỳ thi này
    const currentStudents = this.getStudents(truongId, targetExamId);
    const validIdSet = new Set(currentStudents.map(s => s.id));
    const clean: Record<string, string[]> = {};
    
    Object.entries(raw).forEach(([roomId, idList]) => {
      clean[roomId] = (idList || []).filter(id => validIdSet.has(id));
    });

    return clean;
  }

  static saveRoomAssignments(assignments: Record<string, string[]>, truongId = this.getActiveSchoolId(), examId?: string): void {
    const targetExamId = examId || this.getActiveExamId();
    const all = this.getItem<Record<string, Record<string, string[]>>>(STORAGE_KEYS.ROOM_ASSIGNMENTS, {});
    const key = `${truongId}__${targetExamId}`;
    all[key] = assignments;
    this.setItem(STORAGE_KEYS.ROOM_ASSIGNMENTS, all);
  }

  // Admission Combinations CRUD
  static getCombinations(truongId = this.getActiveSchoolId()): AdmissionCombination[] {
    const all = this.getItem<AdmissionCombination[]>(STORAGE_KEYS.COMBINATIONS, INITIAL_COMBINATIONS);
    return all.filter(c => c.truong_id === truongId || c.truong_id === DEFAULT_SCHOOL.id);
  }

  static saveCombination(comb: AdmissionCombination): void {
    const all = this.getItem<AdmissionCombination[]>(STORAGE_KEYS.COMBINATIONS, INITIAL_COMBINATIONS);
    const idx = all.findIndex(c => c.id === comb.id);
    if (idx >= 0) {
      all[idx] = comb;
    } else {
      all.push(comb);
    }
    this.setItem(STORAGE_KEYS.COMBINATIONS, all);
  }

  static deleteCombination(id: string): void {
    const all = this.getItem<AdmissionCombination[]>(STORAGE_KEYS.COMBINATIONS, INITIAL_COMBINATIONS);
    this.setItem(STORAGE_KEYS.COMBINATIONS, all.filter(c => c.id !== id));
  }

  // Audit Logs
  static getAuditLogs(truongId = this.getActiveSchoolId()): AuditLog[] {
    const all = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return all.filter(l => l.truong_id === truongId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const all = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const entry: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    all.unshift(entry);
    if (all.length > 500) all.pop(); // Keep 500 latest entries
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, all);
  }

  // AI Logs & Saved Analysis
  static getAILogs(): AILogEntry[] {
    return this.getItem<AILogEntry[]>(STORAGE_KEYS.AI_LOGS, []);
  }

  static logAI(entry: Omit<AILogEntry, 'id' | 'timestamp'>): void {
    const all = this.getAILogs();
    const item: AILogEntry = {
      ...entry,
      id: `ailog-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    all.unshift(item);
    if (all.length > 100) all.pop();
    this.setItem(STORAGE_KEYS.AI_LOGS, all);
  }

  static getSavedAIAnalysis(truongId = this.getActiveSchoolId()): AISubjectAnalysis | null {
    const all = this.getItem<Record<string, AISubjectAnalysis>>(STORAGE_KEYS.AI_ANALYSIS, {});
    return all[truongId] || null;
  }

  static saveAIAnalysis(analysis: AISubjectAnalysis, truongId = this.getActiveSchoolId()): void {
    const all = this.getItem<Record<string, AISubjectAnalysis>>(STORAGE_KEYS.AI_ANALYSIS, {});
    all[truongId] = analysis;
    this.setItem(STORAGE_KEYS.AI_ANALYSIS, all);
  }

  // ==========================================
  // INVITE CODE & ACTIVATION GATE
  // ==========================================
  static isActivated(): boolean {
    const activated = this.getItem<boolean>(STORAGE_KEYS.INVITE_ACTIVATED, false);
    if (!activated) return false;
    const activatedCode = this.getItem<string>('qlkt_activated_with_code_v1', '');
    if (activatedCode) {
      const validCodes = this.getInviteCodes().map(c => c.trim().toUpperCase());
      // Nếu mã đã kích hoạt trước đó bị thu hồi khỏi danh sách mã hợp lệ -> Khóa lại quyền
      if (!validCodes.includes(activatedCode)) {
        this.setItem(STORAGE_KEYS.INVITE_ACTIVATED, false);
        return false;
      }
    }
    return true;
  }

  static getInviteCodes(): string[] {
    return this.getItem<string[]>(STORAGE_KEYS.INVITE_CODES, DEFAULT_INVITE_CODES);
  }

  static activateSystem(inputCode: string): boolean {
    if (!inputCode) return false;
    const cleanInput = inputCode.trim().toUpperCase();
    const validCodes = this.getInviteCodes().map(c => c.trim().toUpperCase());
    
    if (validCodes.includes(cleanInput)) {
      this.setItem(STORAGE_KEYS.INVITE_ACTIVATED, true);
      this.setItem('qlkt_activated_with_code_v1', cleanInput);
      this.logAudit({
        truong_id: this.getActiveSchoolId(),
        user_name: 'Super Admin',
        action: 'KÍCH HOẠT PHẦN MỀM',
        details: `Hệ thống đã kích hoạt thành công với Mã mời: ${cleanInput}`
      });
      return true;
    }
    return false;
  }

  static addInviteCode(newCode: string): void {
    const clean = newCode.trim().toUpperCase();
    if (!clean) return;
    const list = this.getInviteCodes();
    if (!list.includes(clean)) {
      list.push(clean);
      this.setItem(STORAGE_KEYS.INVITE_CODES, list);
      this.logAudit({
        truong_id: this.getActiveSchoolId(),
        user_name: 'Super Admin',
        action: 'TẠO MÃ MỜI MỚI',
        details: `Đã cấp mới mã mời: ${clean}`
      });
    }
  }

  static revokeInviteCode(codeToRevoke: string): void {
    const clean = codeToRevoke.trim().toUpperCase();
    let list = this.getInviteCodes();
    list = list.filter(c => c.trim().toUpperCase() !== clean);
    this.setItem(STORAGE_KEYS.INVITE_CODES, list);

    // Nếu đang dùng chính mã bị thu hồi thì khóa ngay lập tức
    const currentCode = this.getItem<string>('qlkt_activated_with_code_v1', '');
    if (currentCode === clean) {
      this.setItem(STORAGE_KEYS.INVITE_ACTIVATED, false);
    }

    this.logAudit({
      truong_id: this.getActiveSchoolId(),
      user_name: 'Super Admin',
      action: 'THU HỒI MÃ MỜI',
      details: `Đã thu hồi và hủy hiệu lực mã mời: ${clean}`
    });
  }

  static deactivateSystem(): void {
    this.setItem(STORAGE_KEYS.INVITE_ACTIVATED, false);
    this.setItem('qlkt_activated_with_code_v1', '');
  }

  // ==========================================
  // FULL BACKUP & RESTORE (Chống Mất Dữ Liệu Khi Xóa Cache)
  // ==========================================
  static exportFullBackupJSON(): string {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('qlkt_')) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const activeSchool = this.getSchools().find(s => s.id === this.getActiveSchoolId());
    return JSON.stringify({
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      school_name: activeSchool?.ten_truong || 'Trường THPT Cà Mau',
      data: backup
    }, null, 2);
  }

  static importFullBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || typeof parsed.data !== 'object') {
        return { success: false, message: 'File sao lưu không đúng định dạng dữ liệu.' };
      }
      Object.entries(parsed.data).forEach(([key, val]) => {
        if (typeof val === 'string') {
          localStorage.setItem(key, val);
        }
      });
      return { 
        success: true, 
        message: `Phục hồi thành công toàn bộ dữ liệu từ bản sao lưu ngày ${new Date(parsed.exported_at || Date.now()).toLocaleString('vi-VN')}.` 
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi khi đọc file sao lưu.' };
    }
  }
}
