# MASTER PROMPT: Phần Mềm Quản Lý Kỳ Thi THPT (Web App)

> Tài liệu này dùng để đưa vào AI coding agent (OpenCode/Kilo) để triển khai dự án. Viết lại toàn bộ phần mềm desktop WPF "Quản Lý Kỳ Thi THPT" (THPT Cà Mau) thành web app, kế thừa kiến trúc và kinh nghiệm vận hành từ dự án ThiDua.

---

## 1. Bối cảnh & Mục tiêu

Phần mềm gốc là ứng dụng desktop WPF (.NET 8, MVVM, lưu JSON local) phục vụ tổ chức kỳ thi tốt nghiệp THPT tại một trường: quản lý thí sinh, xếp phòng thi, nhập điểm, tính kết quả tốt nghiệp, xuất báo cáo hành chính.

Mục tiêu lần viết lại này:
1. Chuyển toàn bộ sang **web app** (không còn cài đặt desktop), dùng được trên nhiều thiết bị, nhiều người dùng đồng thời.
2. **Chuẩn hóa CRUD**: mọi loại dữ liệu (thí sinh, phòng thi, điểm, cấu hình) đều phải có đủ Thêm – Sửa – Xóa, không chỉ nhập một chiều.
3. **Nhập liệu kép**: mọi luồng import đều có 2 lựa chọn — tải file Excel HOẶC nhập tay qua form — cho cùng một loại dữ liệu.
4. **Xuất đa định dạng**: mọi báo cáo đều xuất được cả Excel, PDF, và Word.
5. **Bổ sung module AI**:
   - Xếp phòng thi bằng AI chạy song song với thuật toán ràng buộc hiện có, để so sánh và đề xuất phương án tối ưu hơn.
   - Thống kê/phân tích kết quả thi bằng AI (nhận xét xu hướng, điểm mạnh/yếu theo môn/lớp).
6. Thiết kế đủ tổng quát để sau này triển khai cho trường khác, nhưng **khởi động với THPT Cà Mau làm trường mặc định/admin**.

---

## 2. Kiến trúc kỹ thuật (đề xuất)

Kế thừa stack đã dùng thành công ở ThiDua và hệ LMS autograding để tận dụng kinh nghiệm vận hành sẵn có:

- **Frontend**: React + TypeScript + Vite, PWA (cài được như app di động/desktop)
- **Backend/DB**: Supabase (Postgres + Auth + Storage + Edge Functions + Row-Level Security)
- **Excel**: `exceljs` hoặc `SheetJS (xlsx)` — đọc/ghi, giữ được định dạng hành chính (font, màu header, merge cell)
- **PDF**: `pdf-lib` hoặc render HTML→PDF (Puppeteer trên Edge Function, hoặc `@react-pdf/renderer` phía client) — phải tái tạo đúng layout Sở/Trường | CHXHCN, Times New Roman
- **Word**: thư viện `docx` (npm) để tạo file .docx có thể chỉnh sửa tiếp
- **AI Edge Functions**: gọi Gemini → OpenRouter → DeepSeek theo thứ tự fallback (chi tiết ở mục 6)
- **Hosting đề xuất**: Vercel hoặc Netlify cho frontend (build tĩnh + serverless), Supabase cloud cho backend — giống mô hình ThiDua đang chạy, chi phí thấp/miễn phí ở quy mô 1 trường, dễ scale ngang khi thêm trường. Agent có thể đề xuất lại nếu phát sinh ràng buộc kỹ thuật khi triển khai (VD giới hạn Edge Function runtime cho tác vụ tạo PDF nặng).

### Đa trường (multi-tenant) từ đầu
- Thêm bảng `truong` (id, ten_truong, ma_truong, so_gd, dia_chi...) và cột `truong_id` trên mọi bảng nghiệp vụ.
- RLS Supabase: mỗi user chỉ thấy dữ liệu của `truong_id` mình thuộc về.
- Seed sẵn 1 trường mặc định: **THPT Cà Mau** làm tenant admin đầu tiên.
- Vai trò: `super_admin` (quản trị toàn hệ thống, tạo trường mới), `admin_truong` (quản trị 1 trường), `giam_thi`/`giao_vien` (nhập điểm, xem báo cáo — tùy mức phân quyền cần bổ sung thêm nếu có).

---

## 3. Mô hình dữ liệu (kế thừa từ hệ thống cũ, bổ sung CRUD đầy đủ)

### 3.1 Thí sinh (`thi_sinh`)
Họ tên, Ngày sinh, Lớp, Điểm TB lớp 10/11/12, Môn tự chọn 1, Môn tự chọn 2, Khuyến khích, Ưu tiên, Giới tính, Nơi sinh, Dân tộc, Số báo danh (tự sinh), `truong_id`.
- CRUD đầy đủ qua UI bảng (thêm/sửa/xóa từng dòng + xóa hàng loạt).
- Import Excel theo đúng thứ tự cột đã định nghĩa trong `HUONG_DAN_NHAP_EXCEL.md` (Họ tên, Ngày sinh dd/MM/yyyy, Lớp, TB10, TB11, TB12, Môn 1, Môn 2, + cột tùy chọn Khuyến khích/Ưu tiên/Giới tính/Nơi sinh/Dân tộc).
- Import thủ công: form thêm từng thí sinh với validate ngay (ngày sinh hợp lệ, điểm 0–10, môn tự chọn nằm trong danh mục môn).
- Tự động đánh số báo danh khi tạo, xử lý trùng tên bằng cảnh báo (không tự đổi số báo danh khi sửa).

### 3.2 Phòng thi (`phong_thi`, `phong_thi_thi_sinh`)
- CRUD phòng thi: tạo/sửa/xóa phòng, đổi tên phòng, sức chứa tối đa.
- CRUD gán thí sinh vào phòng: kéo-thả hoặc chọn thủ công di chuyển giữa các phòng, không chỉ xếp tự động một lần.
- Ràng buộc giữ nguyên: mỗi ca ≤ 3 môn, tổng 2 ca ≤ 5 môn, không trùng môn giữa 2 ca.

### 3.3 Điểm thi (`diem_thi`)
Số báo danh, Toán, Văn, Môn 1, Môn 2, Khuyến khích, Ưu tiên.
- CRUD từng ô điểm (sửa điểm 1 thí sinh, xóa điểm để nhập lại).
- Import Excel: nhận diện cột theo tên (không cần đúng thứ tự) — giữ đúng danh sách alias đã có trong `HUONG_DAN_NHAP_DIEM_EXCEL.md` (SBD/Số báo danh/So bao danh/Số BD; Toán/Toan; Văn/Van/Ngữ Văn/Ngu Van; Môn 1/Mon 1/Môn tự chọn 1; Môn 2 tương tự).
- Import thủ công: bảng nhập điểm trực tiếp trên giao diện (giống "Nhập điểm trực tiếp" cũ), lưu theo từng trường/ô, có thể nhập từng phần rồi bổ sung sau.
- Nhập/cập nhật Ưu tiên & Khuyến khích: luồng riêng như bản cũ, dò theo SBD để cập nhật, không ghi đè điểm thi chính.

### 3.4 Cấu hình hệ thống (`cau_hinh`)
Tên kỳ thi, ngày thi, mã trường, số thí sinh tối đa/phòng, tiền tố số báo danh — CRUD qua form cấu hình, có lịch sử thay đổi (audit log) nếu khả thi.

---

## 4. Yêu cầu Import — chuẩn hóa cho MỌI loại dữ liệu

Với **mỗi** loại dữ liệu (thí sinh, phòng thi, điểm thi, ưu tiên/khuyến khích, cấu hình môn tự chọn):
1. Nút "Nhập từ Excel" → chọn file → preview kết quả trước khi lưu → hiển thị danh sách lỗi dòng-theo-dòng (giữ logic validate cũ: SBD không khớp, điểm ngoài 0–10, thiếu cột bắt buộc, sai định dạng ngày/số).
2. Nút "Nhập thủ công" → mở form/bảng nhập trực tiếp trên UI, validate tức thời, lưu từng dòng hoặc lưu hàng loạt.
3. Cả hai luồng dùng chung 1 tầng validate (service layer), tránh trùng logic.
4. Tải file mẫu Excel cho từng loại (giữ tính năng "Tải mẫu" như bản cũ).

---

## 5. Yêu cầu Export — tách 2 nhóm riêng biệt, 3 định dạng, chuẩn in ấn

Toàn bộ báo cáo xuất ra được chia thành **2 khu vực riêng trên giao diện** (2 tab/menu con khác nhau trong màn hình Báo Cáo), để tránh nhầm lẫn giữa giai đoạn trước và sau khi thi:

### 5.1 Nhóm "Danh sách chuẩn bị thi" (dùng trước ngày thi)
- Danh sách thí sinh theo lớp
- Danh sách thí sinh theo phòng thi
- Danh sách thí sinh theo môn (đăng ký môn tự chọn)
- Số liệu đăng ký dự thi (thống kê môn tự chọn từng phòng)
- Bảng ghi tên ghi điểm (bản trống, chưa có điểm — dùng tại phòng thi)
- Phiếu thu bài

### 5.2 Nhóm "Kết quả thi" (dùng sau khi có điểm)
- Kết quả tốt nghiệp (toàn trường)
- Kết quả tốt nghiệp theo lớp
- Thống kê điểm thi theo mốc (≤1, 1–5, 5–7, >7)
- Thống kê điểm theo môn (chi tiết theo `HUONG_DAN_THONG_KE_DIEM.md`: số người thi, phân loại điểm, trung bình/thấp nhất/cao nhất, tỉ lệ đạt)
- Top thí sinh theo các tổ hợp xét tuyển đại học (danh mục tổ hợp chi tiết ở **mục 8**, không hardcode chỉ 6 tổ hợp như bản cũ)

### 5.3 Định dạng xuất — áp dụng cho MỌI báo cáo ở cả 2 nhóm
Mỗi báo cáo có 3 nút xuất, dùng chung 1 template dữ liệu để đảm bảo nội dung khớp nhau giữa 3 định dạng:
- **Excel**: giữ định dạng hành chính hiện có (header Sở/Trường | CHXHCN, header cột nền #003366 chữ trắng, Times New Roman size 11, tiêu đề nền LightBlue size 14 đậm, sắp xếp theo SBD tăng dần).
- **PDF**: layout in ấn giống hệt bản Excel (cùng header hành chính), sẵn sàng in trực tiếp, không bị vỡ layout.
- **Word (.docx)**: cùng nội dung, ở dạng chỉnh sửa được (dùng khi cần thêm chữ ký, ghi chú tay trước khi in chính thức).

### 5.4 Yêu cầu bắt buộc để "sẵn sàng in ấn" (áp dụng cả 3 định dạng)
- Khổ giấy **A4**, lề chuẩn văn bản hành chính (trên/dưới 2cm, trái 3cm, phải 2cm); tự chọn khổ dọc/ngang phù hợp theo số cột của từng báo cáo (bảng nhiều cột như "kết quả tốt nghiệp theo lớp" nên mặc định ngang).
- Font **Times New Roman**, cỡ chữ 11–13 tùy loại báo cáo, không cho phép font khác lọt vào khi xuất.
- Header hành chính cố định trên mọi trang khi in nhiều trang: SỞ GD&ĐT CÀ MAU | CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM, dòng dưới TRƯỜNG THPT CÀ MAU | Độc lập – Tự do – Hạnh phúc.
- Có đánh **số trang** khi báo cáo dài hơn 1 trang (Excel: header lặp lại + print area; PDF/Word: page number ở footer).
- Bảng không bị cắt cột giữa trang khi in — kiểm tra tổng độ rộng cột theo khổ giấy đã chọn trước khi xuất.
- Có dòng ký tên cuối trang cho các báo cáo cần xác nhận (kết quả tốt nghiệp, phiếu thu bài): "Người lập bảng / Hiệu trưởng" theo đúng mẫu văn bản hành chính đang dùng.
- Đặt tên file theo quy ước cũ: `TenBaoCao_YYYYMMDD_HHmmss.<ext>`.

---

## 6. Module AI mới

### 6.1 Chuỗi gọi API AI (áp dụng cho cả 2 module AI bên dưới)
Thứ tự thử lần lượt, chuyển sang provider kế tiếp khi gặp lỗi/hết quota/timeout:
1. **Gemini** (API key chính)
2. **OpenRouter** (fallback 1 — chọn model free-tier phù hợp)
3. **DeepSeek** (fallback 2)

Cài đặt qua Supabase Edge Function dùng chung 1 module `ai-client` để không lặp code gọi API ở nhiều nơi. Log lại provider nào thực sự được dùng cho mỗi lần gọi (phục vụ debug/chi phí). API key lưu trong Supabase secrets, không lộ ra frontend.

### 6.2 Xếp phòng thi có AI hỗ trợ (chạy song song)
- Thuật toán ràng buộc hiện có (constraint-based) vẫn chạy trước và là kết quả mặc định.
- Đồng thời gửi dữ liệu thí sinh + ràng buộc cho AI, yêu cầu AI đề xuất **một phương án xếp phòng độc lập**.
- Hiển thị 2 phương án song song cho người dùng so sánh (số phòng dùng, mức cân bằng số thí sinh/môn giữa các phòng, có vi phạm ràng buộc nào không).
- Người dùng chọn dùng phương án thuật toán, phương án AI, hoặc chỉnh tay từ 1 trong 2 rồi lưu — không tự động ghi đè.
- Nếu AI trả lời không hợp lệ (vi phạm ràng buộc cứng), hiển thị cảnh báo rõ ràng, không cho chọn thẳng làm phương án chính thức.

### 6.3 Thống kê & phân tích bằng AI
- Sau khi có dữ liệu ở tab Báo Cáo (thống kê điểm theo môn hiện có), thêm nút "Phân tích bằng AI".
- AI nhận bảng thống kê (số người thi, phân bố mốc điểm, trung bình, tỉ lệ đạt theo từng môn/lớp) và trả về nhận xét bằng văn bản: môn/lớp nào yếu cần chú ý, xu hướng so với kỳ trước (nếu có dữ liệu lịch sử), gợi ý hướng cải thiện giảng dạy.
- Kết quả phân tích lưu lại kèm timestamp, có thể xuất kèm vào báo cáo Word/PDF như một mục "Nhận xét, đánh giá" (không bắt buộc, tùy chọn khi xuất).

---

## 7. Công thức tính điểm (giữ nguyên)

```
TB_3năm = (Điểm TB 10 × 1 + Điểm TB 11 × 2 + Điểm TB 12 × 3) / 6

ĐXTN = ((Toán + Văn + Môn 1 + Môn 2) / 4 + Khuyến khích / 4 + TB_3năm) / 2 + Ưu tiên

Đậu: ĐXTN ≥ 5.0 và tất cả các môn > 1.0
Rớt: ngược lại
```

---

## 8. Danh mục tổ hợp xét tuyển đại học (khối A, B, C, D, X)

Mở rộng danh mục tổ hợp dùng cho báo cáo "Top thí sinh theo tổ hợp xét tuyển" (mục 5.2), thay vì hardcode 6 tổ hợp như bản cũ (A00, A01, B00, C00, D01, D07).

**Lưu ý kỹ thuật quan trọng**: từ kỳ thi 2025 trở đi (theo Chương trình GDPT 2018, Thông tư 24/2024/TT-BGDĐT), bài thi tốt nghiệp gồm Toán + Văn + 2 môn tự chọn (trong 9 môn: Lý, Hóa, Sinh, Sử, Địa, GDKTPL, Tin học, Công nghệ, Ngoại ngữ). Nhóm tổ hợp **X** là nhóm mới xuất hiện do có các môn mới (Tin học, Công nghệ, GDKTPL) tham gia tổ hợp, và **mã tổ hợp X chưa hoàn toàn thống nhất giữa các trường đại học** (khác với A/B/C/D vốn đã ổn định nhiều năm). Vì vậy:
- Không hardcode danh mục tổ hợp trong code — tạo bảng `to_hop_xet_tuyen` (mã, tên 3 môn, khối A/B/C/D/X, ghi chú) và cho phép **CRUD đầy đủ** (thêm/sửa/xóa tổ hợp) như mọi loại dữ liệu khác trong hệ thống, đúng nguyên tắc ở mục 1.2.
- Seed sẵn danh sách bên dưới làm dữ liệu khởi tạo, admin trường có thể chỉnh sửa/bổ sung mỗi năm theo công bố thực tế của Bộ GD&ĐT và đề án tuyển sinh từng trường ĐH.

### Khối A (trục Toán – Tự nhiên)
1. A00 – Toán, Vật Lý, Hóa học
2. A01 – Toán, Vật Lý, Tiếng Anh
3. A02 – Toán, Vật Lý, Sinh học
4. A03 – Toán, Vật Lý, Lịch sử
5. A04 – Toán, Vật Lý, Địa lý
6. A05 – Toán, Hóa học, Lịch sử
7. A06 – Toán, Hóa học, Địa lý
8. A07 – Toán, Lịch sử, Địa lý
9. A09 – Toán, Địa lý, GDKTPL
10. A10 – Toán, Vật Lý, GDKTPL

### Khối B (trục Toán – Hóa/Sinh, hướng Y Dược – Nông Lâm)
1. B00 – Toán, Hóa học, Sinh học
2. B01 – Toán, Sinh học, Lịch sử
3. B02 – Toán, Sinh học, Địa lý
4. B03 – Toán, Sinh học, Ngữ văn
5. B04 – Toán, Sinh học, GDKTPL
6. B08 – Toán, Sinh học, Tiếng Anh
7. B10 – Toán, Hóa học, GDKTPL
8. B11 – Toán, Sinh học, Công nghệ Nông nghiệp
9. B12 – Toán, Sinh học, Công nghệ Công nghiệp
10. B13 – Toán, Hóa học, Công nghệ Nông nghiệp

### Khối C (trục Ngữ văn – Xã hội)
1. C00 – Ngữ văn, Lịch sử, Địa lý
2. C01 – Ngữ văn, Toán, Vật Lý
3. C02 – Ngữ văn, Toán, Hóa học
4. C03 – Ngữ văn, Toán, Lịch sử
5. C04 – Ngữ văn, Toán, Địa lý
6. C05 – Ngữ văn, Vật Lý, Hóa học
7. C07 – Ngữ văn, Vật Lý, Lịch sử
8. C08 – Ngữ văn, Hóa học, Sinh học
9. C14 – Ngữ văn, Toán, GDKTPL
10. C19 – Ngữ văn, Lịch sử, GDKTPL

### Khối D (trục Ngoại ngữ)
1. D01 – Toán, Ngữ văn, Tiếng Anh
2. D07 – Toán, Hóa học, Tiếng Anh
3. D08 – Toán, Sinh học, Tiếng Anh
4. D09 – Toán, Lịch sử, Tiếng Anh
5. D10 – Toán, Địa lý, Tiếng Anh
6. D11 – Ngữ văn, Vật Lý, Tiếng Anh
7. D14 – Ngữ văn, Lịch sử, Tiếng Anh
8. D15 – Ngữ văn, Địa lý, Tiếng Anh
9. D66 – Ngữ văn, GDKTPL, Tiếng Anh
10. D96 – Toán, GDKTPL, Tiếng Anh

### Khối X (tổ hợp mới có Tin học/Công nghệ — theo chương trình 2018, cần rà soát hằng năm)
1. X05 – Toán, Vật Lý, GDKTPL
2. X06 – Toán, Vật Lý, Tin học
3. X07 – Toán, Vật Lý, Công nghệ Công nghiệp
4. X09 – Toán, Hóa học, GDKTPL
5. X10 – Toán, Hóa học, Tin học
6. X11 – Toán, Hóa học, Công nghệ Công nghiệp
7. X12 – Toán, Hóa học, Công nghệ Nông nghiệp
8. X13 – Toán, Sinh học, GDKTPL
9. X26 – Toán, Tiếng Anh, Tin học
10. X27 – Toán, Sinh học, Tin học

---

## 9. Yêu cầu phi chức năng
- PWA: dùng được offline cho các thao tác xem dữ liệu đã tải; đồng bộ khi có mạng.
- Phân quyền theo `truong_id` + vai trò (mục 2).
- Toàn bộ thao tác ghi (thêm/sửa/xóa) đều có xác nhận trước khi lưu, và có thể xem lại lịch sử thay đổi tối thiểu ở mức "sửa lần cuối bởi ai, khi nào" nếu khả thi trong phạm vi dự án.
- Giao diện tiếng Việt hoàn toàn, giữ đúng thuật ngữ nghiệp vụ đã dùng trong tài liệu gốc (Số báo danh, Điểm xét tốt nghiệp, Ưu tiên/Khuyến khích...).

---

## 9. Gợi ý trình tự triển khai cho AI coding agent

1. Khởi tạo project (Vite + React + TS + Supabase client), schema DB đa trường + seed THPT Cà Mau.
2. Module Thí sinh: CRUD + import kép + export 3 định dạng (làm mẫu chuẩn cho các module sau).
3. Module Phòng thi: CRUD + thuật toán xếp phòng gốc.
4. Module Điểm thi + Ưu tiên/Khuyến khích: CRUD + import kép.
5. Module Báo cáo/Thống kê: dựng lại toàn bộ danh sách báo cáo với export 3 định dạng.
6. Module AI: `ai-client` dùng chung (fallback Gemini→OpenRouter→DeepSeek), rồi tích hợp vào (a) xếp phòng song song, (b) phân tích thống kê.
7. Phân quyền, RLS, kiểm thử luồng multi-tenant với trường thứ 2 giả lập để xác nhận cách ly dữ liệu đúng.
