import { Student, ExamScore, GraduationResult, Subject, AdmissionCombination } from '../types';

export interface ScoreDistribution {
  subject: Subject | 'Toán' | 'Ngữ văn';
  totalExamined: number;
  countLe1: number;      // <= 1.0 (Điểm liệt)
  count1To5: number;     // 1.0 < điểm < 5.0
  count5To7: number;     // 5.0 <= điểm <= 7.0
  countGt7: number;      // > 7.0
  countGe5: number;      // >= 5.0 (Đạt)
  minScore: number;
  maxScore: number;
  avgScore: number;
  passRate: number;      // %
}

export class ScoreCalculator {
  /**
   * Tính điểm trung bình các năm học THPT (ĐTB các năm học) theo Quy chế thi TN THPT:
   * ĐTB các năm học = [(ĐTB lớp 10) × 1 + (ĐTB lớp 11) × 2 + (ĐTB lớp 12) × 3] / 6
   */
  static calcTb3Nam(tb10: number, tb11: number, tb12: number): number {
    const t10 = Number(tb10) || 0;
    const t11 = Number(tb11) || 0;
    const t12 = Number(tb12) || 0;
    const val = (t10 * 1 + t11 * 2 + t12 * 3) / 6;
    return Number(val.toFixed(2));
  }

  /**
   * Tính Điểm xét tốt nghiệp (ĐXTN) theo Quy chế thi TN THPT:
   * ĐXTN = [((Tổng điểm 4 bài thi + Điểm Khuyến khích) / 4 + ĐTB các năm học) / 2] + Điểm Ưu tiên
   */
  static calcDxtn(
    toan: number,
    van: number,
    mon1: number,
    mon2: number,
    khuyenKhich: number,
    tb3Nam: number,
    uuTien: number
  ): number {
    const tong4Mon = toan + van + mon1 + mon2;
    const kk = Number(khuyenKhich) || 0;
    const ut = Number(uuTien) || 0;
    const val = (((tong4Mon + kk) / 4 + tb3Nam) / 2) + ut;
    return Number(val.toFixed(2));
  }

  /**
   * Kiểm tra điều kiện công nhận tốt nghiệp:
   * Đậu: ĐXTN >= 5.0 VÀ tất cả các môn > 1.0 (không có môn nào <= 1.0)
   */
  static evaluateGraduation(student: Student, score?: ExamScore): GraduationResult {
    const emptyScore: ExamScore = {
      id: '',
      truong_id: student.truong_id,
      sbd: student.sbd,
      toan: null,
      van: null,
      mon_1: null,
      mon_2: null,
      khuyen_khich: student.khuyen_khich || 0,
      uu_tien: student.uu_tien || 0
    };

    const s = score || emptyScore;
    const toan = s.toan ?? 0;
    const van = s.van ?? 0;
    const mon1 = s.mon_1 ?? 0;
    const mon2 = s.mon_2 ?? 0;
    const kk = s.khuyen_khich ?? student.khuyen_khich ?? 0;
    const ut = s.uu_tien ?? student.uu_tien ?? 0;

    const tb3Nam = this.calcTb3Nam(student.tb_lop_10, student.tb_lop_11, student.tb_lop_12);
    const tong4Mon = Number((toan + van + mon1 + mon2).toFixed(2));
    const dxtn = this.calcDxtn(toan, van, mon1, mon2, kk, tb3Nam, ut);

    const hasScores = s.toan !== null && s.toan !== undefined && s.van !== null && s.van !== undefined;
    const isDiemLiet = (s.toan !== null && s.toan !== undefined && s.toan <= 1.0) ||
                       (s.van !== null && s.van !== undefined && s.van <= 1.0) ||
                       (s.mon_1 !== null && s.mon_1 !== undefined && s.mon_1 <= 1.0) ||
                       (s.mon_2 !== null && s.mon_2 !== undefined && s.mon_2 <= 1.0);

    const isPass = hasScores && dxtn >= 5.0 && !isDiemLiet;

    let xepLoai = 'Chưa xét';
    if (hasScores) {
      if (!isPass) {
        xepLoai = isDiemLiet ? 'Hỏng tốt nghiệp (Điểm liệt)' : 'Hỏng tốt nghiệp';
      } else {
        if (dxtn >= 8.0 && toan >= 7.0 && van >= 7.0 && mon1 >= 7.0 && mon2 >= 7.0) {
          xepLoai = 'Giỏi';
        } else if (dxtn >= 6.5 && toan >= 6.0 && van >= 6.0 && mon1 >= 6.0 && mon2 >= 6.0) {
          xepLoai = 'Khá';
        } else {
          xepLoai = 'Trung bình';
        }
      }
    }

    return {
      student,
      score: s,
      tb_3_nam: tb3Nam,
      tong_diem_4_mon: tong4Mon,
      dxtn,
      is_pass: isPass,
      is_diem_liet: isDiemLiet,
      xep_loai: xepLoai
    };
  }

  /**
   * Tính thống kê điểm theo từng môn học (Thực tế, Trung bình, Min, Max, Tỷ lệ)
   */
  static getSubjectStatistics(students: Student[], scores: ExamScore[]): Record<string, ScoreDistribution> {
    const scoreMap = new Map(scores.map(s => [s.sbd, s]));
    const subjectList: (Subject | 'Toán' | 'Ngữ văn')[] = [
      'Toán',
      'Ngữ văn',
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

    const result: Record<string, ScoreDistribution> = {};

    subjectList.forEach(subj => {
      const pointValues: number[] = [];

      students.forEach(st => {
        const sc = scoreMap.get(st.sbd);
        if (!sc) return;

        if (subj === 'Toán' && sc.toan !== null && sc.toan !== undefined) {
          pointValues.push(sc.toan);
        } else if (subj === 'Ngữ văn' && sc.van !== null && sc.van !== undefined) {
          pointValues.push(sc.van);
        } else if (st.mon_tu_chon_1 === subj && sc.mon_1 !== null && sc.mon_1 !== undefined) {
          pointValues.push(sc.mon_1);
        } else if (st.mon_tu_chon_2 === subj && sc.mon_2 !== null && sc.mon_2 !== undefined) {
          pointValues.push(sc.mon_2);
        }
      });

      const total = pointValues.length;
      if (total === 0) {
        result[subj] = {
          subject: subj,
          totalExamined: 0,
          countLe1: 0,
          count1To5: 0,
          count5To7: 0,
          countGt7: 0,
          countGe5: 0,
          minScore: 0,
          maxScore: 0,
          avgScore: 0,
          passRate: 0
        };
        return;
      }

      let le1 = 0;
      let p1To5 = 0;
      let p5To7 = 0;
      let gt7 = 0;
      let sum = 0;
      let min = pointValues[0];
      let max = pointValues[0];

      pointValues.forEach(pt => {
        sum += pt;
        if (pt < min) min = pt;
        if (pt > max) max = pt;

        if (pt <= 1.0) le1++;
        else if (pt < 5.0) p1To5++;
        else if (pt <= 7.0) p5To7++;
        else gt7++;
      });

      const ge5 = p5To7 + gt7;
      result[subj] = {
        subject: subj,
        totalExamined: total,
        countLe1: le1,
        count1To5: p1To5,
        count5To7: p5To7,
        countGt7: gt7,
        countGe5: ge5,
        minScore: min,
        maxScore: max,
        avgScore: Number((sum / total).toFixed(2)),
        passRate: Number(((ge5 / total) * 100).toFixed(1))
      };
    });

    return result;
  }

  /**
   * Tính top thí sinh theo tổ hợp xét tuyển đại học
   */
  static getTopStudentsByCombination(
    combination: AdmissionCombination,
    students: Student[],
    scores: ExamScore[],
    limit = 20
  ) {
    const scoreMap = new Map(scores.map(s => [s.sbd, s]));
    const listWithScores: { student: Student; score_mon1: number; score_mon2: number; score_mon3: number; total_score: number }[] = [];

    const getScoreForSubject = (student: Student, sc: ExamScore, subj: Subject): number | null => {
      if (subj === 'Toán') return sc.toan ?? null;
      if (subj === 'Ngữ văn') return sc.van ?? null;
      if (student.mon_tu_chon_1 === subj) return sc.mon_1 ?? null;
      if (student.mon_tu_chon_2 === subj) return sc.mon_2 ?? null;
      return null;
    };

    students.forEach(st => {
      const sc = scoreMap.get(st.sbd);
      if (!sc) return;

      const p1 = getScoreForSubject(st, sc, combination.mon_1);
      const p2 = getScoreForSubject(st, sc, combination.mon_2);
      const p3 = getScoreForSubject(st, sc, combination.mon_3);

      if (p1 !== null && p2 !== null && p3 !== null) {
        const total = Number((p1 + p2 + p3).toFixed(2));
        listWithScores.push({
          student: st,
          score_mon1: p1,
          score_mon2: p2,
          score_mon3: p3,
          total_score: total
        });
      }
    });

    return listWithScores
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit);
  }
}
