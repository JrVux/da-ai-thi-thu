import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  TextRun, 
  WidthType, 
  AlignmentType, 
  BorderStyle, 
  Header, 
  Footer, 
  PageNumber
} from 'docx';
import { School, ExamConfig } from '../types';

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ExportReportData {
  reportTitle: string;
  subTitle?: string;
  school: School;
  examConfig: ExamConfig;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  pages?: { title?: string; subTitle?: string; rows: Record<string, any>[] }[];
  landscape?: boolean;
  notes?: string[];
  aiAnalysisText?: string;
}

export class ExportService {
  /**
   * Tạo timestamp theo chuẩn TenBaoCao_YYYYMMDD_HHmmss.ext
   */
  static getFormattedFilename(reportTitle: string, ext: 'xlsx' | 'pdf' | 'docx'): string {
    const cleanTitle = reportTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const hhmmss = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return `${cleanTitle}_${yyyymmdd}_${hhmmss}.${ext}`;
  }

  // ==========================================
  // 1. EXCEL EXPORT (exceljs) - CHUẨN HÀNH CHÍNH
  // ==========================================
  static async exportToExcel(data: ExportReportData): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Phần Mềm Quản Lý Kỳ Thi THPT';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Bao_Cao', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: data.landscape ? 'landscape' : 'portrait',
        margins: {
          top: 0.78, // ~2cm
          bottom: 0.78,
          left: 1.18, // ~3cm
          right: 0.78,
          header: 0.3,
          footer: 0.3
        },
        printTitlesRow: '7:7' // Lặp lại dòng tiêu đề bảng khi in
      }
    });

    const fontTimes = { name: 'Times New Roman' };

    // Dòng 1: Header Hành chính trái & phải
    worksheet.mergeCells('A1:D1');
    worksheet.mergeCells('E1:I1');
    
    const cellSoGd = worksheet.getCell('A1');
    cellSoGd.value = data.school.so_gd.toUpperCase();
    cellSoGd.font = { ...fontTimes, size: 10, bold: true };
    cellSoGd.alignment = { horizontal: 'center' };

    const cellQuocHieu = worksheet.getCell('E1');
    cellQuocHieu.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    cellQuocHieu.font = { ...fontTimes, size: 10, bold: true };
    cellQuocHieu.alignment = { horizontal: 'center' };

    // Dòng 2: Tên trường & Tiêu ngữ
    worksheet.mergeCells('A2:D2');
    worksheet.mergeCells('E2:I2');

    const cellTruong = worksheet.getCell('A2');
    cellTruong.value = data.school.ten_truong.toUpperCase();
    cellTruong.font = { ...fontTimes, size: 10, bold: true };
    cellTruong.alignment = { horizontal: 'center' };

    const cellTieuNgu = worksheet.getCell('E2');
    cellTieuNgu.value = 'Độc lập - Tự do - Hạnh phúc';
    cellTieuNgu.font = { ...fontTimes, size: 10, bold: true, underline: true };
    cellTieuNgu.alignment = { horizontal: 'center' };

    // Dòng 4: Tiêu đề báo cáo (Nền LightBlue, Size 14, Đậm)
    const endColLetter = String.fromCharCode(65 + Math.max(data.columns.length - 1, 8));
    worksheet.mergeCells(`A4:${endColLetter}4`);
    const cellTitle = worksheet.getCell('A4');
    cellTitle.value = data.reportTitle.toUpperCase();
    cellTitle.font = { ...fontTimes, size: 14, bold: true, color: { argb: 'FF003366' } };
    cellTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F0FA' } // LightBlue
    };
    cellTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(4).height = 30;

    // Dòng 5: Subtitle (Tên kỳ thi / Năm học)
    worksheet.mergeCells(`A5:${endColLetter}5`);
    const cellSubTitle = worksheet.getCell('A5');
    cellSubTitle.value = data.subTitle || `${data.examConfig.ten_ky_thi} - Năm học ${data.examConfig.nam}`;
    cellSubTitle.font = { ...fontTimes, size: 11, italic: true };
    cellSubTitle.alignment = { horizontal: 'center' };

    // Dòng 7: Header Bảng dữ liệu (Nền #003366, Chữ trắng, Bold)
    const headerRow = worksheet.getRow(7);
    data.columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { ...fontTimes, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003366' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      worksheet.getColumn(idx + 1).width = col.width || 15;
    });
    headerRow.height = 26;

    // Các dòng dữ liệu
    let currentRowIndex = 8;
    data.rows.forEach((row, rIdx) => {
      const rowObj = worksheet.getRow(currentRowIndex);
      data.columns.forEach((col, colIdx) => {
        const cell = rowObj.getCell(colIdx + 1);
        cell.value = row[col.key] ?? '';
        cell.font = { ...fontTimes, size: 10 };
        cell.alignment = {
          horizontal: col.align || 'left',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        // Zebra striping
        if (rIdx % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
      rowObj.height = 20;
      currentRowIndex++;
    });

    // Phần Nhận xét AI (nếu có)
    if (data.aiAnalysisText) {
      currentRowIndex += 2;
      worksheet.mergeCells(`A${currentRowIndex}:${endColLetter}${currentRowIndex}`);
      const aiCell = worksheet.getCell(`A${currentRowIndex}`);
      aiCell.value = `NHẬN XÉT & PHÂN TÍCH CHUYÊN MÔN (AI):\n${data.aiAnalysisText}`;
      aiCell.font = { ...fontTimes, size: 10, italic: true };
      aiCell.alignment = { wrapText: true };
      worksheet.getRow(currentRowIndex).height = 60;
    }

    // Phần Chữ ký hành chính cuối trang
    currentRowIndex += 2;
    const now = new Date();
    const dateStr = `Cà Mau, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    worksheet.mergeCells(`G${currentRowIndex}:${endColLetter}${currentRowIndex}`);
    const cellDate = worksheet.getCell(`G${currentRowIndex}`);
    cellDate.value = dateStr;
    cellDate.font = { ...fontTimes, size: 11, italic: true };
    cellDate.alignment = { horizontal: 'center' };

    currentRowIndex++;
    worksheet.mergeCells(`A${currentRowIndex}:D${currentRowIndex}`);
    const cellNguoiLap = worksheet.getCell(`A${currentRowIndex}`);
    cellNguoiLap.value = 'NGƯỜI LẬP BẢNG';
    cellNguoiLap.font = { ...fontTimes, size: 11, bold: true };
    cellNguoiLap.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`G${currentRowIndex}:${endColLetter}${currentRowIndex}`);
    const cellHieuTruong = worksheet.getCell(`G${currentRowIndex}`);
    cellHieuTruong.value = 'HIỆU TRƯỞNG / TRƯỞNG ĐIỂM THI';
    cellHieuTruong.font = { ...fontTimes, size: 11, bold: true };
    cellHieuTruong.alignment = { horizontal: 'center' };

    currentRowIndex += 4;
    const cellTenHT = worksheet.getCell(`G${currentRowIndex}`);
    cellTenHT.value = data.examConfig.truong_diem_thi || data.school.hieu_truong || '';
    cellTenHT.font = { ...fontTimes, size: 11, bold: true };
    cellTenHT.alignment = { horizontal: 'center' };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      this.getFormattedFilename(data.reportTitle, 'xlsx')
    );
  }

  // ==========================================
  // 2. PDF & PRINT EXPORT - CHUẨN TIẾNG VIỆT 100% (MỖI PHÒNG/LỚP NẰM TRÊN 1 TRANG IN)
  // ==========================================
  static exportToPdf(data: ExportReportData): void {
    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở cửa sổ popup để in hoặc xuất file PDF.');
      return;
    }

    const now = new Date();
    const dateStr = `Cà Mau, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    const tableHeadersHtml = data.columns
      .map(col => `<th style="width:${col.width ? col.width * 7 : 'auto'}px;" class="align-center">${col.header}</th>`)
      .join('');

    const renderPageHtml = (title: string, sub: string, rows: Record<string, any>[]) => {
      const tableRowsHtml = rows
        .map((row) => {
          const cells = data.columns
            .map(col => `<td class="align-${col.align || 'left'}">${row[col.key] ?? ''}</td>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `
      <div class="print-page">
        <table class="header-table">
          <tr>
            <td style="width:45%;">
              <div class="so-gd">${data.school.so_gd}</div>
              <div class="truong">${data.school.ten_truong}</div>
            </td>
            <td style="width:55%;">
              <div class="quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="tieu-ngu">Độc lập - Tự do - Hạnh phúc</div>
            </td>
          </tr>
        </table>

        <div class="title">${title}</div>
        <div class="sub-title">${sub}</div>

        <table class="data-table">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <table class="signature-table">
          <tr>
            <td></td>
            <td>
              <div class="date-line">${dateStr}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="sign-role">NGƯỜI LẬP BẢNG</div>
              <div class="sign-name">(Ký và ghi rõ họ tên)</div>
            </td>
            <td>
              <div class="sign-role">TRƯỞNG ĐIỂM THI / HIỆU TRƯỞNG</div>
              <div class="sign-name">${data.examConfig.truong_diem_thi || data.school.hieu_truong || ''}</div>
            </td>
          </tr>
        </table>
      </div>
      `;
    };

    let allPagesHtml = '';
    if (data.pages && data.pages.length > 0) {
      allPagesHtml = data.pages
        .map(p => renderPageHtml(p.title || data.reportTitle, p.subTitle || data.subTitle || `${data.examConfig.ten_ky_thi} - Năm học ${data.examConfig.nam}`, p.rows))
        .join('');
    } else {
      allPagesHtml = renderPageHtml(data.reportTitle, data.subTitle || `${data.examConfig.ten_ky_thi} - Năm học ${data.examConfig.nam}`, data.rows);
    }

    const aiSectionHtml = data.aiAnalysisText
      ? `<div class="ai-box">
          <strong>NHẬN XÉT & PHÂN TÍCH CHUYÊN MÔN (AI):</strong><br />
          ${data.aiAnalysisText.replace(/\n/g, '<br />')}
        </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${data.reportTitle} - ${data.school.ten_truong}</title>
  <style>
    @page {
      size: ${data.landscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 6mm 8mm 6mm 8mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9.5pt;
      line-height: 1.22;
      color: #111;
      margin: 0;
      padding: 12px;
      background: #f8fafc;
    }
    .print-page {
      background: #fff;
      max-width: ${data.landscape ? '1080px' : '820px'};
      margin: 0 auto 24px auto;
      padding: 18px 22px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-radius: 6px;
      page-break-inside: avoid;
      page-break-after: always;
      break-after: page;
    }
    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
      margin-bottom: 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .header-table td {
      vertical-align: top;
      text-align: center;
      padding: 1px;
    }
    .so-gd { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
    .truong { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
    .quoc-hieu { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
    .tieu-ngu { font-size: 9pt; font-weight: bold; text-decoration: underline; }
    .title {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      color: #003366;
      margin-top: 4px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .sub-title {
      text-align: center;
      font-size: 9.5pt;
      font-style: italic;
      color: #444;
      margin-bottom: 8px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 8.5pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #333;
      padding: 2px 3.5px;
      line-height: 1.18;
    }
    .data-table th {
      background-color: #003366 !important;
      color: #ffffff !important;
      font-weight: bold;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .data-table tr:nth-child(even) {
      background-color: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .align-left { text-align: left; }
    .align-center { text-align: center; }
    .align-right { text-align: right; }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .signature-table td {
      text-align: center;
      vertical-align: top;
      width: 50%;
      padding: 1px;
    }
    .date-line { font-style: italic; font-size: 9pt; margin-bottom: 2px; }
    .sign-role { font-weight: bold; font-size: 9pt; text-transform: uppercase; }
    .sign-name { font-weight: bold; font-size: 9pt; margin-top: 32px; }
    .ai-box {
      border: 1px dashed #4f46e5;
      background: #f5f3ff;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 8.5pt;
      font-style: italic;
      border-radius: 6px;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .control-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #0369a1;
    }
    @media print {
      html, body {
        background: #fff;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-page {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        page-break-inside: avoid !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .print-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .control-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="control-bar">
    <div>
      <span style="font-size:14px;font-weight:bold;">📄 Xem Bản In & Xuất File PDF Tiếng Việt (Unicode 100%)</span>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
        💡 Chọn máy in thực tế hoặc chọn <strong>"Lưu dưới dạng PDF" / "Save as PDF"</strong> trong hộp thoại in.
      </div>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ In / Lưu PDF Ngay
    </button>
  </div>

  ${aiSectionHtml}
  ${allPagesHtml}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // ==========================================
  // 3. WORD EXPORT (.docx) - CHỈNH SỬA ĐƯỢC
  // ==========================================
  static async exportToWord(data: ExportReportData): Promise<void> {
    const tableHeaderCells = data.columns.map(col => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: col.header, bold: true, color: 'FFFFFF', font: 'Times New Roman', size: 20 })],
        alignment: AlignmentType.CENTER
      })],
      shading: { fill: '003366' },
      width: { size: col.width ? col.width * 50 : 1500, type: WidthType.DXA }
    }));

    const tableRows = [
      new TableRow({ children: tableHeaderCells, tableHeader: true }),
      ...data.rows.map(row => new TableRow({
        children: data.columns.map(col => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: String(row[col.key] ?? ''), font: 'Times New Roman', size: 20 })],
            alignment: col.align === 'center' ? AlignmentType.CENTER : col.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
          })]
        }))
      }))
    ];

    const now = new Date();
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 }, // A4 margins 2cm top/bottom, 3cm left
            size: {
              orientation: data.landscape ? 'landscape' : 'portrait'
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${data.school.so_gd.toUpperCase()} - ${data.school.ten_truong.toUpperCase()}`, font: 'Times New Roman', size: 18, color: '666666' })
                ],
                alignment: AlignmentType.LEFT
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Trang ', font: 'Times New Roman', size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 18 })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        children: [
          // Tiêu đề văn bản
          new Paragraph({
            children: [
              new TextRun({ text: data.reportTitle.toUpperCase(), bold: true, size: 28, font: 'Times New Roman', color: '003366' })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: data.subTitle || `${data.examConfig.ten_ky_thi} - Năm ${data.examConfig.nam}`, italics: true, size: 22, font: 'Times New Roman' })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          // Bảng dữ liệu
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),
          // Nhận xét AI nếu có
          ...(data.aiAnalysisText ? [
            new Paragraph({
              children: [
                new TextRun({ text: '\nNHẬN XÉT, ĐÁNH GIÁ CHUYÊN MÔN (AI):', bold: true, font: 'Times New Roman', size: 22, color: '003366' }),
                new TextRun({ text: `\n${data.aiAnalysisText}`, italics: true, font: 'Times New Roman', size: 20 })
              ],
              spacing: { before: 200, after: 200 }
            })
          ] : []),
          // Chữ ký
          new Paragraph({
            children: [
              new TextRun({ text: `\nCà Mau, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`, italics: true, font: 'Times New Roman', size: 22 })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300 }
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'NGƯỜI LẬP BẢNG', bold: true, font: 'Times New Roman', size: 22 })], alignment: AlignmentType.CENTER })],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'TRƯỞNG ĐIỂM THI / HIỆU TRƯỞNG', bold: true, font: 'Times New Roman', size: 22 })], alignment: AlignmentType.CENTER })],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\n\n' })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `\n\n\n${data.examConfig.truong_diem_thi || data.school.hieu_truong || ''}`, bold: true, font: 'Times New Roman', size: 22 })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })
                ]
              })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    this.triggerDownload(blob, this.getFormattedFilename(data.reportTitle, 'docx'));
  }

  // =========================================================================
  // 4. OFFICIAL MULTI-SHEET EXCEL EXPORTS (THEO ĐÚNG CÁC MẪU TRONG NEW FOLDER)
  // =========================================================================

  /**
   * Helper chung để tạo header hành chính cho 1 worksheet
   */
  private static setupWorksheetHeader(
    ws: ExcelJS.Worksheet,
    school: School,
    examConfig: ExamConfig,
    title: string,
    columns: ReportColumn[],
    landscape = false
  ): number {
    ws.pageSetup = {
      paperSize: 9,
      orientation: landscape ? 'landscape' : 'portrait',
      margins: { top: 0.78, bottom: 0.78, left: 1.18, right: 0.78, header: 0.3, footer: 0.3 }
    };

    const fontTimes = { name: 'Times New Roman' };
    const endColLetter = String.fromCharCode(65 + Math.max(columns.length - 1, 7));

    // Dòng 1: Sở GD & Quốc hiệu
    ws.mergeCells('A1:C1');
    ws.mergeCells(`D1:${endColLetter}1`);
    const c1 = ws.getCell('A1');
    c1.value = school.so_gd.toUpperCase();
    c1.font = { ...fontTimes, size: 10, bold: true };
    c1.alignment = { horizontal: 'center' };

    const c2 = ws.getCell('D1');
    c2.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    c2.font = { ...fontTimes, size: 10, bold: true };
    c2.alignment = { horizontal: 'center' };

    // Dòng 2: Trường & Tiêu ngữ
    ws.mergeCells('A2:C2');
    ws.mergeCells(`D2:${endColLetter}2`);
    const c3 = ws.getCell('A2');
    c3.value = school.ten_truong.toUpperCase();
    c3.font = { ...fontTimes, size: 10, bold: true };
    c3.alignment = { horizontal: 'center' };

    const c4 = ws.getCell('D2');
    c4.value = 'Độc lập - Tự do - Hạnh phúc';
    c4.font = { ...fontTimes, size: 10, bold: true, underline: true };
    c4.alignment = { horizontal: 'center' };

    // Dòng 3: Tên kỳ thi
    ws.mergeCells(`A3:${endColLetter}3`);
    const c5 = ws.getCell('A3');
    c5.value = `${examConfig.ten_ky_thi} - Năm học ${examConfig.nam}`;
    c5.font = { ...fontTimes, size: 11, italic: true };
    c5.alignment = { horizontal: 'center' };

    // Dòng 4: Tiêu đề Bảng
    ws.mergeCells(`A4:${endColLetter}4`);
    const c6 = ws.getCell('A4');
    c6.value = title.toUpperCase();
    c6.font = { ...fontTimes, size: 13, bold: true, color: { argb: 'FF003366' } };
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c6.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(4).height = 26;

    // Dòng 6: Header Table
    const headerRow = ws.getRow(6);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { ...fontTimes, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      ws.getColumn(idx + 1).width = col.width || 14;
    });
    headerRow.height = 24;

    return 7; // Dòng bắt đầu ghi data
  }

  /**
   * Helper chung để ghi dữ liệu và chữ ký cuối trang
   */
  private static fillDataAndSignature(
    ws: ExcelJS.Worksheet,
    startRow: number,
    columns: ReportColumn[],
    rows: Record<string, any>[],
    school: School,
    examConfig: ExamConfig
  ): void {
    const fontTimes = { name: 'Times New Roman' };
    let curr = startRow;

    rows.forEach(r => {
      const row = ws.getRow(curr);
      columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = r[col.key] ?? '';
        cell.font = { ...fontTimes, size: 10 };
        cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
      curr++;
    });

    // Chữ ký
    curr += 2;
    const now = new Date();
    const endColLetter = String.fromCharCode(65 + Math.max(columns.length - 1, 7));
    const midColLetter = String.fromCharCode(65 + Math.floor((columns.length - 1) / 2));

    ws.mergeCells(`${midColLetter}${curr}:${endColLetter}${curr}`);
    const cDate = ws.getCell(`${midColLetter}${curr}`);
    cDate.value = `Cà Mau, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    cDate.font = { ...fontTimes, size: 10, italic: true };
    cDate.alignment = { horizontal: 'center' };

    curr++;
    ws.mergeCells(`A${curr}:C${curr}`);
    const cLap = ws.getCell(`A${curr}`);
    cLap.value = 'NGƯỜI LẬP BẢNG';
    cLap.font = { ...fontTimes, size: 10, bold: true };
    cLap.alignment = { horizontal: 'center' };

    ws.mergeCells(`${midColLetter}${curr}:${endColLetter}${curr}`);
    const cTruong = ws.getCell(`${midColLetter}${curr}`);
    cTruong.value = 'TRƯỞNG ĐIỂM THI';
    cTruong.font = { ...fontTimes, size: 10, bold: true };
    cTruong.alignment = { horizontal: 'center' };

    curr += 4;
    const cTenTruong = ws.getCell(`${midColLetter}${curr}`);
    cTenTruong.value = examConfig.truong_diem_thi || school.hieu_truong || '';
    cTenTruong.font = { ...fontTimes, size: 10, bold: true };
    cTenTruong.alignment = { horizontal: 'center' };
  }

  /**
   * 1. Xuất DanhSachTheoPhong.xlsx (Mỗi phòng thi 1 Sheet: Phòng 001, Phòng 002, ...)
   */
  static async exportOfficialDanhSachTheoPhongExcel(
    rooms: any[],
    assignments: Record<string, string[]>,
    students: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const studentMap = new Map(students.map((s: any) => [s.id, s]));

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
      { header: 'Họ và tên', key: 'ho_ten', width: 24, align: 'left' },
      { header: 'Ngày sinh', key: 'ngay_sinh', width: 14, align: 'center' },
      { header: 'Giới tính', key: 'gioi_tinh', width: 10, align: 'center' },
      { header: 'Lớp', key: 'lop', width: 10, align: 'center' },
      { header: 'Môn tự chọn 1', key: 'mon1', width: 16, align: 'left' },
      { header: 'Môn tự chọn 2', key: 'mon2', width: 16, align: 'left' },
      { header: 'Ký tên / Ghi chú', key: 'ghi_chu', width: 16, align: 'center' }
    ];

    rooms.forEach(room => {
      const sheetName = room.ten_phong || room.ma_phong;
      const ws = workbook.addWorksheet(sheetName.substring(0, 30));
      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `DANH SÁCH THÍ SINH PHÒNG THI: ${sheetName}`,
        columns
      );

      const assignedStudents = (assignments[room.id] || [])
        .map(id => studentMap.get(id))
        .filter(Boolean);

      const rows = assignedStudents.map((st: any, idx: number) => ({
        stt: idx + 1,
        sbd: st.sbd,
        ho_ten: st.ho_ten,
        ngay_sinh: st.ngay_sinh,
        gioi_tinh: st.gioi_tinh,
        lop: st.lop,
        mon1: st.mon_tu_chon_1,
        mon2: st.mon_tu_chon_2,
        ghi_chu: ''
      }));

      this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'DanhSachTheoPhong.xlsx'
    );
  }

  /**
   * 2. Xuất DanhSachTheoLop.xlsx (Mỗi lớp 1 Sheet: 12A1, 12A2, ...)
   */
  static async exportOfficialDanhSachTheoLopExcel(
    students: any[],
    assignments: Record<string, string[]>,
    rooms: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const studentToRoomMap = new Map<string, string>();
    rooms.forEach(r => {
      (assignments[r.id] || []).forEach(sid => {
        studentToRoomMap.set(sid, r.ten_phong || r.ma_phong);
      });
    });

    const classList = Array.from(new Set(students.map((s: any) => s.lop))).sort();

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
      { header: 'Họ và tên', key: 'ho_ten', width: 24, align: 'left' },
      { header: 'Ngày sinh', key: 'ngay_sinh', width: 14, align: 'center' },
      { header: 'Giới tính', key: 'gioi_tinh', width: 10, align: 'center' },
      { header: 'Phòng thi', key: 'phong', width: 16, align: 'center' },
      { header: 'Môn tự chọn 1', key: 'mon1', width: 16, align: 'left' },
      { header: 'Môn tự chọn 2', key: 'mon2', width: 16, align: 'left' }
    ];

    classList.forEach((lopName: string) => {
      const ws = workbook.addWorksheet(lopName.substring(0, 30));
      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `DANH SÁCH THÍ SINH DỰ THI - LỚP: ${lopName}`,
        columns
      );

      const classStudents = students.filter((s: any) => s.lop === lopName);
      const rows = classStudents.map((st: any, idx: number) => ({
        stt: idx + 1,
        sbd: st.sbd,
        ho_ten: st.ho_ten,
        ngay_sinh: st.ngay_sinh,
        gioi_tinh: st.gioi_tinh,
        phong: studentToRoomMap.get(st.id) || 'Chưa xếp',
        mon1: st.mon_tu_chon_1,
        mon2: st.mon_tu_chon_2
      }));

      this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'DanhSachTheoLop.xlsx'
    );
  }

  /**
   * 3. Xuất DanhSachTheoMon.xlsx (Mỗi môn thi 1 Sheet: Toán, Văn, Lý, Hóa...)
   */
  static async exportOfficialDanhSachTheoMonExcel(
    students: any[],
    assignments: Record<string, string[]>,
    rooms: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const studentToRoomMap = new Map<string, string>();
    rooms.forEach(r => {
      (assignments[r.id] || []).forEach(sid => {
        studentToRoomMap.set(sid, r.ten_phong || r.ma_phong);
      });
    });

    const allSubjects = [
      'Toán', 'Ngữ văn', 'Vật lí', 'Hóa học', 'Sinh học',
      'Lịch sử', 'Địa lí', 'GDKT&PL', 'Tin học',
      'Công nghệ Công nghiệp', 'Công nghệ Nông nghiệp', 'Tiếng Anh'
    ];

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
      { header: 'Họ và tên', key: 'ho_ten', width: 24, align: 'left' },
      { header: 'Ngày sinh', key: 'ngay_sinh', width: 14, align: 'center' },
      { header: 'Lớp', key: 'lop', width: 10, align: 'center' },
      { header: 'Phòng thi', key: 'phong', width: 16, align: 'center' },
      { header: 'Ca thi', key: 'ca_thi', width: 12, align: 'center' },
      { header: 'Ký tên', key: 'ky_ten', width: 14, align: 'center' }
    ];

    allSubjects.forEach(sub => {
      const ws = workbook.addWorksheet(sub.substring(0, 30));
      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `DANH SÁCH THÍ SINH DỰ THI MÔN: ${sub.toUpperCase()}`,
        columns
      );

      let subjectStudents = students;
      if (sub !== 'Toán' && sub !== 'Ngữ văn') {
        subjectStudents = students.filter((s: any) => s.mon_tu_chon_1 === sub || s.mon_tu_chon_2 === sub);
      }

      const rows = subjectStudents.map((st: any, idx: number) => ({
        stt: idx + 1,
        sbd: st.sbd,
        ho_ten: st.ho_ten,
        ngay_sinh: st.ngay_sinh,
        lop: st.lop,
        phong: studentToRoomMap.get(st.id) || 'Chưa xếp',
        ca_thi: (sub === 'Toán' || sub === 'Ngữ văn') ? 'Chung' : (st.mon_tu_chon_1 === sub ? 'Ca 1' : 'Ca 2'),
        ky_ten: ''
      }));

      this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'DanhSachTheoMon.xlsx'
    );
  }

  /**
   * 4. Xuất PhieuThuBai.xlsx (40 Sheets: Phiếu Thu Bài - Phòng 001, ...)
   */
  static async exportOfficialPhieuThuBaiExcel(
    rooms: any[],
    assignments: Record<string, string[]>,
    students: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const studentMap = new Map(students.map((s: any) => [s.id, s]));

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
      { header: 'Họ và tên', key: 'ho_ten', width: 24, align: 'left' },
      { header: 'Ngày sinh', key: 'ngay_sinh', width: 14, align: 'center' },
      { header: 'Giới tính', key: 'gioi_tinh', width: 10, align: 'center' },
      { header: 'Lớp', key: 'lop', width: 10, align: 'center' },
      { header: 'Số tờ', key: 'so_to', width: 10, align: 'center' },
      { header: 'Mã đề', key: 'ma_de', width: 12, align: 'center' },
      { header: 'Ký tên', key: 'ky_ten', width: 14, align: 'center' }
    ];

    rooms.forEach(room => {
      const sheetName = `Phiếu Thu Bài - ${room.ma_phong}`;
      const ws = workbook.addWorksheet(sheetName.substring(0, 30));
      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `PHIẾU THU BÀI THI - ${room.ten_phong || room.ma_phong}`,
        columns
      );

      const assignedStudents = (assignments[room.id] || [])
        .map(id => studentMap.get(id))
        .filter(Boolean);

      const rows = assignedStudents.map((st: any, idx: number) => ({
        stt: idx + 1,
        sbd: st.sbd,
        ho_ten: st.ho_ten,
        ngay_sinh: st.ngay_sinh,
        gioi_tinh: st.gioi_tinh,
        lop: st.lop,
        so_to: '',
        ma_de: '',
        ky_ten: ''
      }));

      this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'PhieuThuBai.xlsx'
    );
  }

  /**
   * 5. Xuất KetQuaTotNghiepTheoLop.xlsx & KetQuaTotNghiep.xlsx
   */
  static async exportOfficialKetQuaTotNghiepTheoLopExcel(
    students: any[],
    scores: any[],
    assignments: Record<string, string[]>,
    rooms: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const scoreMap = new Map(scores.map((s: any) => [s.sbd, s]));
    const studentToRoomMap = new Map<string, string>();
    rooms.forEach(r => {
      (assignments[r.id] || []).forEach(sid => {
        studentToRoomMap.set(sid, r.ten_phong || r.ma_phong);
      });
    });

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Họ tên', key: 'ho_ten', width: 24, align: 'left' },
      { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
      { header: 'Phòng thi', key: 'phong', width: 14, align: 'center' },
      { header: 'Toán', key: 'toan', width: 8, align: 'right' },
      { header: 'Văn', key: 'van', width: 8, align: 'right' },
      { header: 'Môn 1', key: 'mon1', width: 8, align: 'right' },
      { header: 'Môn 2', key: 'mon2', width: 8, align: 'right' },
      { header: 'Khuyến khích', key: 'kk', width: 10, align: 'right' },
      { header: 'Ưu tiên', key: 'ut', width: 8, align: 'right' },
      { header: 'TB 3 năm', key: 'tb3', width: 10, align: 'right' },
      { header: 'ĐXTN', key: 'dxtn', width: 10, align: 'right' },
      { header: 'Kết quả', key: 'ket_qua', width: 12, align: 'center' }
    ];

    const classList = Array.from(new Set(students.map((s: any) => s.lop))).sort();

    classList.forEach((lopName: string) => {
      const ws = workbook.addWorksheet(lopName.substring(0, 30));
      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `KẾT QUẢ TỐT NGHIỆP THPT - LỚP ${lopName}`,
        columns,
        true
      );

      const classStudents = students.filter((s: any) => s.lop === lopName);
      const rows = classStudents.map((st: any, idx: number) => {
        const sc = scoreMap.get(st.sbd);
        const toan = sc?.toan ?? 0;
        const van = sc?.van ?? 0;
        const m1 = sc?.mon_1 ?? 0;
        const m2 = sc?.mon_2 ?? 0;
        const kk = sc?.khuyen_khich ?? st.khuyen_khich ?? 0;
        const ut = sc?.uu_tien ?? st.uu_tien ?? 0;
        const tb3 = Number(((st.tb_lop_10 + st.tb_lop_11 * 2 + st.tb_lop_12 * 3) / 6).toFixed(2));
        const dxtn = Number((((toan + van + m1 + m2) / 4 + kk / 4 + tb3) / 2 + ut).toFixed(2));
        const isPass = sc?.toan !== null && dxtn >= 5.0 && toan > 1.0 && van > 1.0 && m1 > 1.0 && m2 > 1.0;

        return {
          stt: idx + 1,
          ho_ten: st.ho_ten,
          sbd: st.sbd,
          phong: studentToRoomMap.get(st.id) || 'Chưa xếp',
          toan: sc?.toan ?? '-',
          van: sc?.van ?? '-',
          mon1: sc?.mon_1 ?? '-',
          mon2: sc?.mon_2 ?? '-',
          kk: kk || 0,
          ut: ut || 0,
          tb3,
          dxtn: sc?.toan !== null ? dxtn : '-',
          ket_qua: sc?.toan !== null ? (isPass ? 'Đậu' : 'Rớt') : 'Chưa thi'
        };
      });

      this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'KetQuaTotNghiepTheoLop.xlsx'
    );
  }

  /**
   * 6. Xuất Top10KhoiDaiHoc.xlsx (5 Sheets: Khối A, Khối A1, Khối B, Khối C, Khối D)
   */
  static async exportOfficialTop10KhoiDaiHocExcel(
    students: any[],
    scores: any[],
    combinations: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const scoreMap = new Map(scores.map((s: any) => [s.sbd, s]));

    const defaultKhoi = [
      { name: 'Khối A', mon1: 'Toán', mon2: 'Vật lí', mon3: 'Hóa học' },
      { name: 'Khối A1', mon1: 'Toán', mon2: 'Vật lí', mon3: 'Tiếng Anh' },
      { name: 'Khối B', mon1: 'Toán', mon2: 'Hóa học', mon3: 'Sinh học' },
      { name: 'Khối C', mon1: 'Ngữ văn', mon2: 'Lịch sử', mon3: 'Địa lí' },
      { name: 'Khối D', mon1: 'Toán', mon2: 'Ngữ văn', mon3: 'Tiếng Anh' },
    ];

    defaultKhoi.forEach(khoi => {
      const ws = workbook.addWorksheet(khoi.name);
      const columns: ReportColumn[] = [
        { header: 'STT', key: 'stt', width: 6, align: 'center' },
        { header: 'Họ tên', key: 'ho_ten', width: 24, align: 'left' },
        { header: 'Số báo danh', key: 'sbd', width: 14, align: 'center' },
        { header: 'Lớp', key: 'lop', width: 10, align: 'center' },
        { header: khoi.mon1, key: 'm1', width: 10, align: 'right' },
        { header: khoi.mon2, key: 'm2', width: 10, align: 'right' },
        { header: khoi.mon3, key: 'm3', width: 10, align: 'right' },
        { header: 'Tổng điểm', key: 'tong', width: 12, align: 'right' },
        { header: 'ĐXTN', key: 'dxtn', width: 10, align: 'right' }
      ];

      const startRow = this.setupWorksheetHeader(
        ws,
        school,
        examConfig,
        `TOP THÍ SINH ĐIỂM CAO - ${khoi.name.toUpperCase()} (${khoi.mon1} - ${khoi.mon2} - ${khoi.mon3})`,
        columns
      );

      // Tính điểm tổ hợp
      const studentScores = students.map((st: any) => {
        const sc = scoreMap.get(st.sbd);
        const getScore = (m: string) => {
          if (!sc) return null;
          if (m === 'Toán') return sc.toan;
          if (m === 'Ngữ văn') return sc.van;
          if (st.mon_tu_chon_1 === m) return sc.mon_1;
          if (st.mon_tu_chon_2 === m) return sc.mon_2;
          return null;
        };

        const s1 = getScore(khoi.mon1);
        const s2 = getScore(khoi.mon2);
        const s3 = getScore(khoi.mon3);

        if (s1 !== null && s2 !== null && s3 !== null) {
          const total = Number((s1 + s2 + s3).toFixed(2));
          const tb3 = Number(((st.tb_lop_10 + st.tb_lop_11 * 2 + st.tb_lop_12 * 3) / 6).toFixed(2));
          const toan = sc?.toan ?? 0;
          const van = sc?.van ?? 0;
          const m1 = sc?.mon_1 ?? 0;
          const m2 = sc?.mon_2 ?? 0;
          const kk = sc?.khuyen_khich ?? st.khuyen_khich ?? 0;
          const ut = sc?.uu_tien ?? st.uu_tien ?? 0;
          const dxtn = Number((((toan + van + m1 + m2) / 4 + kk / 4 + tb3) / 2 + ut).toFixed(2));

          return {
            ho_ten: st.ho_ten,
            sbd: st.sbd,
            lop: st.lop,
            m1: s1,
            m2: s2,
            m3: s3,
            tong: total,
            dxtn
          };
        }
        return null;
      }).filter(Boolean);

      studentScores.sort((a: any, b: any) => b.tong - a.tong);
      const top10 = studentScores.slice(0, 10).map((item: any, idx: number) => ({
        stt: idx + 1,
        ...item
      }));

      this.fillDataAndSignature(ws, startRow, columns, top10, school, examConfig);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'Top10KhoiDaiHoc.xlsx'
    );
  }

  /**
   * 7. Xuất DangKyDuThi.xlsx (Theo Mẫu Danh Sách Đăng Ký Dự Thi Chuẩn: STT | Phòng thi | Số thí sinh | Ca 1 | Ca 2)
   */
  static async exportOfficialDangKyDuThiExcel(
    rooms: any[],
    assignments: Record<string, string[]>,
    students: any[],
    school: School,
    examConfig: ExamConfig
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Đăng ký dự thi');
    const studentMap = new Map(students.map((s: any) => [s.id, s]));

    const columns: ReportColumn[] = [
      { header: 'STT', key: 'stt', width: 6, align: 'center' },
      { header: 'Phòng thi', key: 'phong', width: 16, align: 'left' },
      { header: 'Số thí sinh dự thi', key: 'so_luong', width: 20, align: 'center' },
      { header: 'Ca 1 (Môn tự chọn 1)', key: 'ca_1', width: 34, align: 'left' },
      { header: 'Ca 2 (Môn tự chọn 2)', key: 'ca_2', width: 34, align: 'left' }
    ];

    const startRow = this.setupWorksheetHeader(
      ws,
      school,
      examConfig,
      'DANH SÁCH ĐĂNG KÝ DỰ THI',
      columns,
      false
    );

    const getShortSubjectName = (sub: string): string => {
      switch (sub) {
        case 'Vật lí': return 'Lý';
        case 'Hóa học': return 'Hóa';
        case 'Sinh học': return 'Sinh';
        case 'Lịch sử': return 'Sử';
        case 'Địa lí': return 'Địa';
        case 'GDKT&PL': return 'GDKT-PL';
        case 'Tin học': return 'Tin';
        case 'Công nghệ Công nghiệp': return 'CNCN';
        case 'Công nghệ Nông nghiệp': return 'CNNN';
        case 'Tiếng Anh': return 'TA';
        default: return sub;
      }
    };

    const rows = rooms.map((r: any, idx: number) => {
      const studentIds = assignments[r.id] || [];
      const roomStudents = studentIds.map((id: string) => studentMap.get(id)).filter(Boolean);

      const countMap1 = new Map<string, number>();
      const countMap2 = new Map<string, number>();

      roomStudents.forEach((st: any) => {
        const m1 = st.mon_tu_chon_1;
        const m2 = st.mon_tu_chon_2;
        if (m1) {
          const s1 = getShortSubjectName(m1);
          countMap1.set(s1, (countMap1.get(s1) || 0) + 1);
        }
        if (m2) {
          const s2 = getShortSubjectName(m2);
          countMap2.set(s2, (countMap2.get(s2) || 0) + 1);
        }
      });

      const ca1Summary = Array.from(countMap1.entries())
        .map(([name, count]) => `${name} (${count})`)
        .join('; ');

      const ca2Summary = Array.from(countMap2.entries())
        .map(([name, count]) => `${name} (${count})`)
        .join('; ');

      return {
        stt: idx + 1,
        phong: r.ten_phong || `Phòng ${String(idx + 1).padStart(2, '0')}`,
        so_luong: roomStudents.length,
        ca_1: ca1Summary || '-',
        ca_2: ca2Summary || '-'
      };
    });

    this.fillDataAndSignature(ws, startRow, columns, rows, school, examConfig);

    const buffer = await workbook.xlsx.writeBuffer();
    this.triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'DangKyDuThi.xlsx'
    );
  }

  private static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
