import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DBService } from './db';
import { Student, ExamScore, Room, ExamConfig, School } from '../types';

const SUPABASE_CONFIG_KEY = 'qlkt_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  static getConfig(): SupabaseConfig {
    try {
      const data = localStorage.getItem(SUPABASE_CONFIG_KEY);
      return data ? JSON.parse(data) : { url: '', anonKey: '', autoSync: false };
    } catch {
      return { url: '', anonKey: '', autoSync: false };
    }
  }

  static saveConfig(config: SupabaseConfig): void {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    this.client = null; // Reset client
  }

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const config = this.getConfig();
    if (config.url && config.anonKey) {
      try {
        this.client = createClient(config.url.trim(), config.anonKey.trim());
        return this.client;
      } catch (err) {
        console.error('[Supabase] Initialization error:', err);
        return null;
      }
    }
    return null;
  }

  static isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
  }

  static async testConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
    try {
      const tempClient = createClient(url.trim(), key.trim());
      const { error } = await tempClient.from('truong').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        if (error.message.includes('relation "public.truong" does not exist')) {
          return {
            success: true,
            message: 'Kết nối Supabase thành công! Lưu ý: Hãy chạy file SQL schema để khởi tạo bảng dữ liệu.'
          };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Kết nối Supabase Cloud Database thành công 100%!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Không thể kết nối đến Supabase URL.' };
    }
  }

  /**
   * Đẩy toàn bộ dữ liệu cục bộ lên Supabase Cloud
   */
  static async pushToCloud(schoolId: string, examId: string): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) return { success: false, message: 'Chưa cấu hình Supabase URL & Anon Key.' };

    try {
      const school = DBService.getSchools().find(s => s.id === schoolId);
      const exam = DBService.getExamConfig(schoolId, examId);
      const students = DBService.getStudents(schoolId, examId);
      const scores = DBService.getScores(schoolId, examId);

      // 1. Upsert School
      if (school) {
        await client.from('truong').upsert({
          id: school.id,
          ten_truong: school.ten_truong,
          ma_truong: school.ma_truong,
          so_gd: school.so_gd,
          dia_chi: school.dia_chi,
          hieu_truong: school.hieu_truong
        });
      }

      // 2. Upsert Exam Config
      if (exam) {
        await client.from('cau_hinh').upsert({
          id: exam.id,
          truong_id: schoolId,
          ten_ky_thi: exam.ten_ky_thi,
          nam: exam.nam,
          truong: exam.truong,
          so_phong: exam.so_phong,
          so_hoc_sinh_phong: exam.so_hoc_sinh_phong,
          truong_diem_thi: exam.truong_diem_thi,
          ghi_chu: exam.ghi_chu
        });
      }

      // 3. Upsert Students
      if (students.length > 0) {
        const studentPayload = students.map(st => ({
          id: st.id,
          truong_id: schoolId,
          sbd: st.sbd,
          ho_ten: st.ho_ten,
          ngay_sinh: st.ngay_sinh,
          lop: st.lop,
          tb_lop_10: st.tb_lop_10 || 0,
          tb_lop_11: st.tb_lop_11 || 0,
          tb_lop_12: st.tb_lop_12 || 0,
          mon_tu_chon_1: st.mon_tu_chon_1,
          mon_tu_chon_2: st.mon_tu_chon_2,
          khuyen_khich: st.khuyen_khich || 0,
          uu_tien: st.uu_tien || 0
        }));
        await client.from('thi_sinh').upsert(studentPayload);
      }

      // 4. Upsert Scores
      if (scores.length > 0) {
        const scorePayload = scores.map(sc => ({
          id: sc.id,
          truong_id: schoolId,
          sbd: sc.sbd,
          toan: sc.toan,
          ngu_van: sc.van,
          diem_mon_1: sc.mon_1,
          diem_mon_2: sc.mon_2,
          khuyen_khich: sc.khuyen_khich || 0,
          uu_tien: sc.uu_tien || 0
        }));
        await client.from('diem_thi').upsert(scorePayload);
      }

      return {
        success: true,
        message: `Đã đồng bộ lên Supabase Cloud: ${students.length} thí sinh, ${scores.length} bài thi thành công!`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi trong quá trình đồng bộ lên Cloud.' };
    }
  }

  /**
   * Kéo dữ liệu từ Supabase Cloud về máy cục bộ
   */
  static async pullFromCloud(schoolId: string, examId: string): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) return { success: false, message: 'Chưa cấu hình Supabase URL & Anon Key.' };

    try {
      const { data: cloudStudents, error: errSt } = await client.from('thi_sinh').select('*').eq('truong_id', schoolId);
      const { data: cloudScores, error: errSc } = await client.from('diem_thi').select('*').eq('truong_id', schoolId);

      if (errSt) throw errSt;

      if (cloudStudents && cloudStudents.length > 0) {
        const mappedStudents: Student[] = cloudStudents.map(cs => ({
          id: cs.id,
          truong_id: cs.truong_id,
          ky_thi_id: examId,
          sbd: cs.sbd,
          ho_ten: cs.ho_ten,
          ngay_sinh: cs.ngay_sinh,
          lop: cs.lop,
          gioi_tinh: cs.gioi_tinh || 'Nam',
          tb_lop_10: Number(cs.tb_lop_10) || 0,
          tb_lop_11: Number(cs.tb_lop_11) || 0,
          tb_lop_12: Number(cs.tb_lop_12) || 0,
          mon_tu_chon_1: cs.mon_tu_chon_1,
          mon_tu_chon_2: cs.mon_tu_chon_2,
          khuyen_khich: Number(cs.khuyen_khich) || 0,
          uu_tien: Number(cs.uu_tien) || 0
        }));
        DBService.saveBulkStudents(mappedStudents, 'Supabase Sync', examId);
      }

      if (cloudScores && cloudScores.length > 0) {
        const mappedScores: ExamScore[] = cloudScores.map(cs => ({
          id: cs.id,
          truong_id: schoolId,
          ky_thi_id: examId,
          sbd: cs.sbd,
          toan: cs.toan,
          van: cs.ngu_van,
          mon_1: cs.diem_mon_1,
          mon_2: cs.diem_mon_2,
          khuyen_khich: Number(cs.khuyen_khich) || 0,
          uu_tien: Number(cs.uu_tien) || 0
        }));
        DBService.saveBulkScores(mappedScores, 'Supabase Sync', examId);
      }

      return {
        success: true,
        message: `Đã nạp ${cloudStudents?.length || 0} thí sinh và ${cloudScores?.length || 0} bài thi từ Supabase Cloud về máy thành công!`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi khi tải dữ liệu từ Cloud.' };
    }
  }
}
