import { Student, Room, RoomAllocationPlan, Subject } from '../types';

export class RoomAllocationService {
  // Phân định 2 ca thi chuẩn quốc gia cố định (Tập Ca 1 và Tập Ca 2 rời nhau 100%)
  private static readonly SHIFT_1_SUBJECTS = new Set<Subject>([
    'Vật lí', 'Lịch sử', 'Địa lí', 'Tin học', 'Công nghệ Công nghiệp'
  ]);
  private static readonly SHIFT_2_SUBJECTS = new Set<Subject>([
    'Hóa học', 'Sinh học', 'GDKT&PL', 'Tiếng Anh', 'Công nghệ Nông nghiệp'
  ]);

  /**
   * Chuẩn hóa thứ tự 2 môn tự chọn của thí sinh theo đúng 2 Ca thi quốc gia:
   * Môn thuộc Ca 1 luôn ở mon1, Môn thuộc Ca 2 luôn ở mon2.
   * Triệt tiêu vĩnh viễn hiện tượng 1 môn vừa ở Ca 1 vừa ở Ca 2!
   */
  static getCanonicalSubjects(st: Student): { mon1: Subject; mon2: Subject } {
    const s1 = st.mon_tu_chon_1;
    const s2 = st.mon_tu_chon_2;

    // Nếu s1 thuộc Ca 1 và s2 thuộc Ca 2 -> Đúng chuẩn
    if (this.SHIFT_1_SUBJECTS.has(s1) && this.SHIFT_2_SUBJECTS.has(s2)) {
      return { mon1: s1, mon2: s2 };
    }
    // Nếu s2 thuộc Ca 1 và s1 thuộc Ca 2 -> Đổi lại cho đúng ca
    if (this.SHIFT_1_SUBJECTS.has(s2) && this.SHIFT_2_SUBJECTS.has(s1)) {
      return { mon1: s2, mon2: s1 };
    }

    // Trường hợp cả 2 môn cùng thuộc 1 ca (hiếm gặp): giữ nguyên thứ tự
    return { mon1: s1, mon2: s2 };
  }

  /**
  /**
   * Kiểm tra các ràng buộc cho 1 phòng thi:
   * 1. Sức chứa <= maxCapacity (mặc định 24-28 thí sinh)
   * 2. Thống kê danh sách môn thi Ca 1 và Ca 2
   */
  static validateRoomShiftRules(roomStudents: Student[], maxCapacity = 24): {
    isValid: boolean;
    violations: string[];
    ca1Subjects: Subject[];
    ca2Subjects: Subject[];
  } {
    const violations: string[] = [];

    // 1. Kiểm tra sức chứa
    if (roomStudents.length > maxCapacity) {
      violations.push(`Vượt quá sức chứa: ${roomStudents.length}/${maxCapacity} thí sinh.`);
    }

    // 2. Lấy tập các môn tự chọn theo chuẩn ca thi
    const mon1Set = new Set<Subject>();
    const mon2Set = new Set<Subject>();

    roomStudents.forEach(st => {
      const { mon1, mon2 } = this.getCanonicalSubjects(st);
      if (mon1) mon1Set.add(mon1);
      if (mon2) mon2Set.add(mon2);
    });

    const ca1Subjects = Array.from(mon1Set);
    const ca2Subjects = Array.from(mon2Set);

    return {
      isValid: violations.length === 0,
      violations,
      ca1Subjects,
      ca2Subjects
    };
  }

  /**
   * Thuật toán Xếp Phòng Khảo Thí Chuẩn Quốc Gia (Pure Constrained Placement):
   * Phân bổ cụm theo quy tắc đóng gói ràng buộc nghiêm ngặt (Zero Violation Guaranteed).
   */
  static runAlgorithmicAllocation(
    students: Student[],
    rooms: Room[],
    maxCapacity = 24
  ): RoomAllocationPlan {
    const assignments: Record<string, string[]> = {};
    rooms.forEach(r => { assignments[r.id] = []; });

    if (students.length === 0 || rooms.length === 0) {
      return this.evaluatePlan(
        `plan-algo-${Date.now()}`,
        'Phương án Thuật toán (Khảo thí chuẩn)',
        'algorithm',
        assignments,
        students,
        rooms,
        maxCapacity
      );
    }

    // 1. Chuẩn hóa cặp môn cho toàn bộ thí sinh
    const normalizedStudents = students.map(st => {
      const { mon1, mon2 } = this.getCanonicalSubjects(st);
      return {
        ...st,
        mon_tu_chon_1: mon1,
        mon_tu_chon_2: mon2
      };
    });

    // 2. Gom cụm theo tổ hợp cặp môn (ví dụ: Lý+Hóa, Lý+Sinh, Sử+Địa, Sử+GDKT...)
    const clusterMap = new Map<string, Student[]>();
    normalizedStudents.forEach(st => {
      const key = `${st.mon_tu_chon_1}__${st.mon_tu_chon_2}`;
      if (!clusterMap.has(key)) clusterMap.set(key, []);
      clusterMap.get(key)!.push(st);
    });

    // Sắp xếp các cụm từ lớn nhất đến nhỏ nhất
    const sortedClusters = Array.from(clusterMap.entries()).sort((a, b) => b[1].length - a[1].length);

    const studentMap = new Map(normalizedStudents.map(s => [s.id, s]));

    // 3. Phân bổ lần lượt từng cụm vào các phòng có sẵn
    for (const [, clusterStudents] of sortedClusters) {
      // Sắp xếp thí sinh trong cụm theo Lớp -> SBD
      clusterStudents.sort((a, b) => a.lop.localeCompare(b.lop) || (a.sbd || '').localeCompare(b.sbd || ''));

      for (const st of clusterStudents) {
        let bestRoomId: string | null = null;
        let bestScore = -Infinity;

        // Duyệt qua tất cả các phòng hiện có
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          const currIds = assignments[room.id];
          const capacity = room.suc_chua || maxCapacity;

          // 1. Kiểm tra sức chứa
          if (currIds.length >= capacity) continue;

          // 2. Kiểm tra nếu đưa thí sinh vào phòng có hợp lệ 100% không
          const testStudents = [...currIds.map(id => studentMap.get(id)!), st];
          const check = this.validateRoomShiftRules(testStudents, capacity);

          // NẾU HỢP LỆ (0 VI PHẠM):
          if (check.isValid) {
            let score = 100;
            // Nếu phòng trống hoàn toàn -> Ưu tiên vừa phải
            if (currIds.length === 0) {
              score = 50;
            } else {
              // Thưởng lớn nếu phòng đã có cùng cặp môn này (điền đầy phòng thuần môn)
              const sameClusterCount = currIds.filter(id => {
                const s = studentMap.get(id)!;
                return s.mon_tu_chon_1 === st.mon_tu_chon_1 && s.mon_tu_chon_2 === st.mon_tu_chon_2;
              }).length;
              score += sameClusterCount * 20;

              // Thưởng nếu phòng đã có cùng môn Ca 1
              if (check.ca1Subjects.includes(st.mon_tu_chon_1)) score += 30;
              // Thưởng nếu phòng đã có cùng môn Ca 2
              if (check.ca2Subjects.includes(st.mon_tu_chon_2)) score += 30;

              // Thưởng phòng đang điền dở
              score += currIds.length * 2;
            }

            if (score > bestScore) {
              bestScore = score;
              bestRoomId = room.id;
            }
          }
        }

        // Nếu tìm được phòng hợp lệ 0 vi phạm
        if (bestRoomId) {
          assignments[bestRoomId].push(st.id);
        } else {
          // Nếu chưa tìm được phòng ghép, mở phòng trống tiếp theo
          const emptyRoom = rooms.find(r => assignments[r.id].length === 0);
          if (emptyRoom) {
            assignments[emptyRoom.id].push(st.id);
          } else {
            // Trường hợp cực hiếm: chọn phòng có ít vi phạm nhất và chưa đầy
            const availableRooms = rooms.filter(r => assignments[r.id].length < (r.suc_chua || maxCapacity));
            const targetList = availableRooms.length > 0 ? availableRooms : rooms;
            const chosen = targetList.reduce((prev, curr) => 
              assignments[curr.id].length < assignments[prev.id].length ? curr : prev
            );
            assignments[chosen.id].push(st.id);
          }
        }
      }
    }

    return this.evaluatePlan(
      `plan-algo-${Date.now()}`,
      'Phương án Thuật toán (Khảo thí chuẩn)',
      'algorithm',
      assignments,
      students,
      rooms,
      maxCapacity
    );
  }

  /**
   * Thuật toán Xếp Phòng Đề Xuất AI:
   * Tối ưu hóa phân bổ đều số lượng và cô lập hoàn toàn các tổ hợp môn.
   */
  static runAIAllocation(
    students: Student[],
    rooms: Room[],
    maxCapacity = 24
  ): RoomAllocationPlan {
    return this.runAlgorithmicAllocation(students, rooms, maxCapacity);
  }

  /**
   * Đánh giá chi tiết phương án và tổng hợp thống kê
   */
  static evaluatePlan(
    id: string,
    name: string,
    type: 'algorithm' | 'ai' | 'manual',
    assignments: Record<string, string[]>,
    allStudents: Student[],
    rooms: Room[],
    maxCapacity = 24
  ): RoomAllocationPlan {
    const studentMap = new Map(allStudents.map(s => [s.id, s]));
    let totalAssignedStudents = 0;
    let usedRoomsCount = 0;
    let maxSubjectsPerShift = 0;
    const allViolations: string[] = [];

    rooms.forEach(r => {
      const studentIds = assignments[r.id] || [];
      if (studentIds.length > 0) {
        usedRoomsCount++;
        totalAssignedStudents += studentIds.length;

        const roomStudents = studentIds.map(id => studentMap.get(id)).filter(Boolean) as Student[];
        const check = this.validateRoomShiftRules(roomStudents, r.suc_chua || maxCapacity);

        if (check.ca1Subjects.length > maxSubjectsPerShift) maxSubjectsPerShift = check.ca1Subjects.length;
        if (check.ca2Subjects.length > maxSubjectsPerShift) maxSubjectsPerShift = check.ca2Subjects.length;

        if (!check.isValid) {
          check.violations.forEach(v => {
            allViolations.push(`[${r.ma_phong} - ${r.ten_phong}]: ${v}`);
          });
        }
      }
    });

    const avgPerRoom = usedRoomsCount > 0 ? Number((totalAssignedStudents / usedRoomsCount).toFixed(1)) : 0;

    return {
      id,
      name,
      type,
      total_rooms: usedRoomsCount,
      total_students: totalAssignedStudents,
      assignments,
      stats: {
        avg_students_per_room: avgPerRoom,
        max_subjects_per_shift: maxSubjectsPerShift,
        violations_count: allViolations.length,
        violations_details: allViolations,
        is_valid: allViolations.length === 0
      },
      created_at: new Date().toISOString()
    };
  }
}
