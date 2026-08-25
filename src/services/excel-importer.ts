import * as XLSX from 'xlsx';
import { Student, ExamScore, Subject, ELECTIVE_SUBJECTS } from '../types';

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface StudentImportResult {
  validStudents: Student[];
  errors: ImportError[];
  totalRows: number;
}

export interface ScoreImportResult {
  validScores: ExamScore[];
  errors: ImportError[];
  totalRows: number;
}

export class ExcelImporterService {
  /**
   * Chuẩn hóa chuỗi text không dấu để so khớp tên cột
   */
  private static normalizeHeader(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Định dạng ngày sinh theo chuẩn DD/MM/YYYY
   */
  static formatDateString(val: any): string {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';

    // Nếu là Excel serial number (ví dụ: 39765)
    if (/^\d{5}$/.test(str)) {
      const num = Number(str);
      const date = new Date((num - 25569) * 86400 * 1000);
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      return `${d}/${m}/${y}`;
    }

    // DD/MM/YYYY hoặc D/M/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${d}/${m}/${y}`;
    }

    // YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${d}/${m}/${y}`;
    }

    return str;
  }

  /**
   * Đọc file Excel từ File/Blob sang mảng JSON Object
   */
  static async readExcelToJson(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Tách và nhận diện 2 môn tự chọn nếu nằm chung trong 1 chuỗi (VD: "Vật lí - Hóa học", "Lý, Sinh", "Sử + Địa")
   */
  static parseCombinedSubjects(str: string): [Subject, Subject] | null {
    if (!str || str.trim() === '') return null;
    const delimiters = [',', ';', '-', '+', '&', ' và ', '/', '|'];
    for (const d of delimiters) {
      if (str.includes(d)) {
        const parts = str.split(d);
        if (parts.length >= 2) {
          const s1 = this.resolveSubject(parts[0]);
          const s2 = this.resolveSubject(parts[1]);
          if (s1 && s2 && s1 !== s2) {
            return [s1, s2];
          }
        }
      }
    }
    return null;
  }

  /**
   * Import danh sách thí sinh từ Excel (Hỗ trợ mọi định dạng cột và tên môn)
   */
  static parseStudentsExcel(
    rows: any[],
    truongId: string,
    existingSbdList: string[] = []
  ): StudentImportResult {
    const validStudents: Student[] = [];
    const errors: ImportError[] = [];
    const sbdSet = new Set(existingSbdList);

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      
      let hoTen = '';
      let ngaySinh = '';
      let lop = '';
      let gioiTinh: 'Nam' | 'Nữ' = 'Nam';
      let noiSinh = '';
      let danToc = 'Kinh';
      let tb10 = 0;
      let tb11 = 0;
      let tb12 = 0;
      let mon1: Subject | null = null;
      let mon2: Subject | null = null;
      let khuyenKhich = 0;
      let uuTien = 0;
      let sbd = '';

      Object.entries(row).forEach(([rawKey, val]) => {
        const key = this.normalizeHeader(rawKey);
        const strVal = String(val ?? '').trim();
        if (strVal === '') return;

        // 1. Họ và tên
        if (key.includes('hoten') || key === 'ho_ten' || key === 'name' || (key.includes('ten') && !key.includes('uutien'))) {
          hoTen = strVal;
        }
        // 2. Ngày sinh (Tuyệt đối KHÔNG gán cho 'ns' vì 'ns' là Nơi Sinh!)
        else if (key.includes('ngaysinh') || key === 'ngay_sinh' || key.includes('dob') || key.includes('birth') || key === 'nsinh') {
          ngaySinh = this.formatDateString(val);
        }
        // 3. Lớp
        else if (key.includes('lop') || key.includes('class')) {
          lop = strVal;
        }
        // 4. Giới tính (GT, Phái, Giới tính, hoặc Nữ đánh dấu x/1)
        else if (key === 'gt' || key.includes('gioitinh') || key.includes('phai') || key.includes('sex') || key.includes('gender')) {
          const lower = strVal.toLowerCase();
          if (lower === 'nu' || lower === 'nữ' || lower === 'female' || lower === 'f' || lower === 'gái' || lower === '1' || lower === 'x') {
            gioiTinh = 'Nữ';
          } else {
            gioiTinh = 'Nam';
          }
        }
        else if (key === 'nu' || key === 'phainu' || key.includes('cotnu') || key === 'nu_x') {
          if (strVal && (strVal.toLowerCase() === 'x' || strVal === '1' || strVal.toLowerCase() === 'nữ' || strVal.toLowerCase() === 'nu')) {
            gioiTinh = 'Nữ';
          }
        }
        // 5. Nơi sinh (NS = Nơi Sinh, Quê quán)
        else if (key === 'ns' || key.includes('noisinh') || key.includes('quequan') || key.includes('pob')) {
          noiSinh = strVal;
        }
        // 6. Dân tộc (DT = Dân Tộc)
        else if (key === 'dt' || key.includes('dantoc') || key.includes('ethnic')) {
          danToc = strVal || 'Kinh';
        }
        // 7. Điểm TB 10, 11, 12 hoặc ĐTB Học Bạ
        else if (key.includes('10') && (key.includes('tb') || key.includes('diem') || key.includes('dtb') || key.includes('lop10') || key.includes('l10') || key === '10')) {
          tb10 = parseFloat(strVal.replace(',', '.')) || 0;
        }
        else if (key.includes('11') && (key.includes('tb') || key.includes('diem') || key.includes('dtb') || key.includes('lop11') || key.includes('l11') || key === '11')) {
          tb11 = parseFloat(strVal.replace(',', '.')) || 0;
        }
        else if (key.includes('12') && (key.includes('tb') || key.includes('diem') || key.includes('dtb') || key.includes('lop12') || key.includes('l12') || key === '12')) {
          tb12 = parseFloat(strVal.replace(',', '.')) || 0;
        }
        else if (key.includes('tb3') || key.includes('tb3nam') || key.includes('dtb3') || key.includes('hocba') || key === 'dtb') {
          const avgAll = parseFloat(strVal.replace(',', '.')) || 0;
          if (avgAll > 0 && tb10 === 0 && tb11 === 0 && tb12 === 0) {
            tb10 = avgAll;
            tb11 = avgAll;
            tb12 = avgAll;
          }
        }
        // 8. Khuyến khích & Ưu tiên
        else if (key.includes('khuyenkhich') || key === 'kk' || key.includes('diemkk')) {
          khuyenKhich = parseFloat(strVal.replace(',', '.')) || 0;
        }
        else if (key.includes('uutien') || key === 'ut' || key.includes('diemut')) {
          uuTien = parseFloat(strVal.replace(',', '.')) || 0;
        }
        // 9. SBD
        else if (key === 'sbd' || key.includes('sobaodanh') || key.includes('sobd')) {
          sbd = strVal;
        }
        // 10. Cột Môn Tự Chọn 1
        else if (
          key.includes('mon1') || key.includes('mon_1') || key.includes('montc1') || key.includes('montuchon1') ||
          key.includes('tuchon1') || key.includes('monthi1') || key.includes('mondk1') || key.includes('baithi1')
        ) {
          const res = this.resolveSubject(strVal);
          if (res) mon1 = res;
        }
        // 11. Cột Môn Tự Chọn 2
        else if (
          key.includes('mon2') || key.includes('mon_2') || key.includes('montc2') || key.includes('montuchon2') ||
          key.includes('tuchon2') || key.includes('monthi2') || key.includes('mondk2') || key.includes('baithi2')
        ) {
          const res = this.resolveSubject(strVal);
          if (res) mon2 = res;
        }
        // 12. Nếu có cột đơn "Môn tự chọn" chứa cả 2 môn
        else if (key.includes('montuchon') || key.includes('tuchon') || key.includes('mondk') || key.includes('tohop')) {
          const pair = this.parseCombinedSubjects(strVal);
          if (pair) {
            mon1 = pair[0];
            mon2 = pair[1];
          } else {
            const single = this.resolveSubject(strVal);
            if (single && !mon1) mon1 = single;
            else if (single && !mon2) mon2 = single;
          }
        }
      });

      // Nếu chỉ tìm thấy 1 môn hoặc chưa tìm thấy:
      if (!mon1 && !mon2) {
        mon1 = 'Vật lí';
        mon2 = 'Hóa học';
      } else if (mon1 && !mon2) {
        mon2 = ((mon1 as string) === 'Hóa học' ? 'Vật lí' : ((mon1 as string) === 'Lịch sử' ? 'Địa lí' : 'Hóa học'));
      } else if (!mon1 && mon2) {
        mon1 = ((mon2 as string) === 'Vật lí' ? 'Hóa học' : 'Vật lí');
      }

      // Xử lý nếu 2 môn vô tình trùng nhau
      if (mon1 && mon2 && (mon1 as string) === (mon2 as string)) {
        if ((mon1 as string) === 'Vật lí') mon2 = 'Hóa học';
        else if ((mon1 as string) === 'Lịch sử') mon2 = 'Địa lí';
        else mon2 = 'Vật lí';
        errors.push({ 
          row: rowNum, 
          field: 'Môn tự chọn', 
          value: `${mon1}`, 
          message: `Dòng ${rowNum} (${hoTen}): Tự động điều chỉnh môn tự chọn 2 thành "${mon2}" để tránh trùng lặp.`, 
          severity: 'warning' 
        });
      }

      // VALIDATION
      if (!hoTen) {
        errors.push({ row: rowNum, field: 'Họ tên', value: hoTen, message: 'Họ tên thí sinh không được để trống.', severity: 'error' });
        return;
      }

      if (!lop) {
        lop = '12A1';
      }

      // Điểm số an toàn
      if (isNaN(tb10) || tb10 < 0 || tb10 > 10) tb10 = 0;
      if (isNaN(tb11) || tb11 < 0 || tb11 > 10) tb11 = 0;
      if (isNaN(tb12) || tb12 < 0 || tb12 > 10) tb12 = 0;
      if (isNaN(khuyenKhich)) khuyenKhich = 0;
      if (isNaN(uuTien)) uuTien = 0;

      // SBD
      if (sbd && sbdSet.has(sbd)) {
        errors.push({ row: rowNum, field: 'Số báo danh', value: sbd, message: `SBD "${sbd}" đã tồn tại trong danh sách. Sẽ cập nhật dữ liệu.`, severity: 'warning' });
      }
      if (sbd) sbdSet.add(sbd);

      validStudents.push({
        id: `st-imp-${Date.now()}-${index}`,
        truong_id: truongId,
        sbd: sbd || '',
        ho_ten: hoTen,
        ngay_sinh: ngaySinh || '2007-01-01',
        lop,
        gioi_tinh: gioiTinh,
        noi_sinh: noiSinh,
        dan_toc: danToc,
        tb_lop_10: tb10,
        tb_lop_11: tb11,
        tb_lop_12: tb12,
        mon_tu_chon_1: mon1!,
        mon_tu_chon_2: mon2!,
        khuyen_khich: khuyenKhich,
        uu_tien: uuTien
      });
    });

    return {
      validStudents,
      errors,
      totalRows: rows.length
    };
  }

  /**
   * Import Điểm thi từ Excel (nhận diện alias cột đa dạng)
   */
  static parseScoresExcel(
    rows: any[],
    truongId: string,
    existingStudents: Student[]
  ): ScoreImportResult {
    const validScores: ExamScore[] = [];
    const errors: ImportError[] = [];
    const studentSbdMap = new Map(existingStudents.map(s => [s.sbd, s]));

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      let sbd = '';
      let toan: number | null = null;
      let van: number | null = null;
      let mon1: number | null = null;
      let mon2: number | null = null;
      let khuyenKhich: number | undefined = undefined;
      let uuTien: number | undefined = undefined;

      Object.entries(row).forEach(([rawKey, val]) => {
        const key = this.normalizeHeader(rawKey);
        const strVal = String(val).trim();
        if (strVal === '' || val === null || val === undefined) return;

        const numVal = parseFloat(strVal.replace(',', '.'));

        // Alias matching for SBD
        if (key === 'sbd' || key.includes('sobaodanh') || key.includes('sobd') || key === 'sbd_ts') {
          sbd = strVal;
        }
        // Alias matching for Toán
        else if (key === 'toan' || key.includes('toan') || key === 'math') {
          toan = !isNaN(numVal) ? numVal : null;
        }
        // Alias matching for Ngữ văn
        else if (key === 'van' || key.includes('nguvan') || key.includes('van') || key === 'literature') {
          van = !isNaN(numVal) ? numVal : null;
        }
        // Alias matching for Môn 1
        else if (key === 'mon1' || key.includes('montuchon1') || key.includes('mon1')) {
          mon1 = !isNaN(numVal) ? numVal : null;
        }
        // Alias matching for Môn 2
        else if (key === 'mon2' || key.includes('montuchon2') || key.includes('mon2')) {
          mon2 = !isNaN(numVal) ? numVal : null;
        }
        // Alias matching for Khuyến khích & Ưu tiên
        else if (key.includes('khuyenkhich') || key === 'kk') {
          khuyenKhich = !isNaN(numVal) ? numVal : 0;
        }
        else if (key.includes('uutien') || key === 'ut') {
          uuTien = !isNaN(numVal) ? numVal : 0;
        }
      });

      if (!sbd) {
        errors.push({ row: rowNum, field: 'Số báo danh', value: '', message: 'Không tìm thấy Số báo danh ở dòng này.', severity: 'error' });
        return;
      }

      if (!studentSbdMap.has(sbd)) {
        errors.push({ row: rowNum, field: 'Số báo danh', value: sbd, message: `SBD "${sbd}" không có trong danh sách thí sinh của trường.`, severity: 'warning' });
      }

      // Check valid score range (0 - 10)
      const validateScore = (name: string, val: number | null) => {
        if (val !== null && (val < 0 || val > 10)) {
          errors.push({ row: rowNum, field: name, value: val, message: `Điểm ${name} (${val}) không hợp lệ (phải từ 0 đến 10).`, severity: 'error' });
        }
      };

      validateScore('Toán', toan);
      validateScore('Ngữ văn', van);
      validateScore('Môn tự chọn 1', mon1);
      validateScore('Môn tự chọn 2', mon2);

      validScores.push({
        id: `sc-imp-${Date.now()}-${index}`,
        truong_id: truongId,
        sbd,
        toan,
        van,
        mon_1: mon1,
        mon_2: mon2,
        khuyen_khich: khuyenKhich,
        uu_tien: uuTien
      });
    });

    return {
      validScores,
      errors,
      totalRows: rows.length
    };
  }

  /**
   * Tạo và tải file Excel mẫu nhập thí sinh (Không cần SBD - SBD sẽ tự sinh sau khi chốt danh sách)
   */
  static downloadStudentSampleTemplate(): void {
    const data = [
      {
        'Họ tên': 'Nguyễn Văn An',
        'Ngày sinh': '15/03/2007',
        'Lớp': '12A1',
        'Giới tính': 'Nam',
        'Nơi sinh': 'Cà Mau',
        'Dân tộc': 'Kinh',
        'TB Lớp 10': 8.5,
        'TB Lớp 11': 8.7,
        'TB Lớp 12': 9.0,
        'Môn tự chọn 1': 'Vật lí',
        'Môn tự chọn 2': 'Hóa học',
        'Khuyến khích': 1.5,
        'Ưu tiên': 0.5
      },
      {
        'Họ tên': 'Trần Thị Bình',
        'Ngày sinh': '20/05/2007',
        'Lớp': '12A1',
        'Giới tính': 'Nữ',
        'Nơi sinh': 'Cà Mau',
        'Dân tộc': 'Kinh',
        'TB Lớp 10': '',
        'TB Lớp 11': '',
        'TB Lớp 12': '',
        'Môn tự chọn 1': 'Vật lí',
        'Môn tự chọn 2': 'Tiếng Anh',
        'Khuyến khích': '',
        'Ưu tiên': ''
      },
      {
        'Họ tên': 'Lê Hoàng Cường',
        'Ngày sinh': '11/10/2007',
        'Lớp': '12A2',
        'Giới tính': 'Nam',
        'Nơi sinh': 'Cà Mau',
        'Dân tộc': 'Kinh',
        'TB Lớp 10': '',
        'TB Lớp 11': '',
        'TB Lớp 12': '',
        'Môn tự chọn 1': 'Lịch sử',
        'Môn tự chọn 2': 'Địa lí',
        'Khuyến khích': 0,
        'Ưu tiên': 0
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Thi_Sinh');
    XLSX.writeFile(wb, 'Mau_Nhap_Thi_Sinh_THPT.xlsx');
  }

  /**
   * Tạo và tải file Excel mẫu nhập điểm thi
   */
  static downloadScoreSampleTemplate(): void {
    const data = [
      {
        'Số báo danh': '010001',
        'Toán': 8.4,
        'Ngữ văn': 7.5,
        'Môn 1': 8.75,
        'Môn 2': 9.0,
        'Khuyến khích': 1.5,
        'Ưu tiên': 0.5
      },
      {
        'Số báo danh': '010002',
        'Toán': 7.6,
        'Ngữ văn': 8.0,
        'Môn 1': 7.5,
        'Môn 2': 8.2,
        'Khuyến khích': 1.0,
        'Ưu tiên': 0
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Diem_Thi');
    XLSX.writeFile(wb, 'Mau_Nhap_Diem_Thi_THPT.xlsx');
  }

  private static resolveSubject(str: string): Subject | null {
    if (!str || str.trim() === '') return null;
    const clean = this.normalizeHeader(str);
    if (!clean) return null;

    // 1. Tiếng Anh / Ngoại ngữ
    if (clean.includes('tienganh') || clean.includes('anh') || clean.includes('english') || clean.includes('ngoainngu') || clean === 'ta' || clean === 'nn') return 'Tiếng Anh';
    // 2. Địa lí / Địa lý / Địa (phải trước các kiểm tra khác)
    if (clean.includes('diali') || clean.includes('dialy') || clean.includes('dia') || clean === 'dl') return 'Địa lí';
    // 3. Lịch sử / Sử
    if (clean.includes('lichsu') || clean.includes('su') || clean === 'ls') return 'Lịch sử';
    // 4. Sinh học / Sinh
    if (clean.includes('sinhhoc') || clean.includes('sinh') || clean === 'sh') return 'Sinh học';
    // 5. Hóa học / Hóa
    if (clean.includes('hoahoc') || clean.includes('hoa') || clean === 'hh') return 'Hóa học';
    // 6. GDKT&PL / GDCD / Pháp luật / Kinh tế
    if (clean.includes('gdkt') || clean.includes('ktpl') || clean.includes('gdcd') || clean.includes('phapluat') || clean.includes('kinhte') || clean === 'gd') return 'GDKT&PL';
    // 7. Tin học / Tin
    if (clean.includes('tinhoc') || clean.includes('tin') || clean === 'th' || clean === 'it') return 'Tin học';
    // 8. Vật lí / Vật lý / Lý
    if (clean.includes('vatli') || clean.includes('vatly') || clean.includes('vat') || clean === 'ly' || clean === 'vl') return 'Vật lí';
    // 9. Công nghệ
    if (clean.includes('congnghecongnghiep') || clean.includes('cncn') || clean.includes('congnghiep')) return 'Công nghệ Công nghiệp';
    if (clean.includes('congnghenongnghiep') || clean.includes('cnnn') || clean.includes('nongnghiep')) return 'Công nghệ Nông nghiệp';
    if (clean.includes('congnghe') || clean === 'cn') return 'Công nghệ Công nghiệp';

    return null;
  }
}
