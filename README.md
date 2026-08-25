# HỆ THỐNG QUẢN LÝ KỲ THI THỬ TỐT NGHIỆP THPT

> **SỞ GIÁO DỤC VÀ ĐÀO TẠO CÀ MAU — TRƯỜNG THPT CÀ MAU**  
> Phần mềm Web App chuyên dụng phục vụ công tác tổ chức, xếp phòng thi, nhập điểm, xét tốt nghiệp và phân tích thống kê kỳ thi tốt nghiệp THPT theo Chương trình Giáo dục phổ thông 2018 (**Thông tư 24/2024/TT-BGDĐT**).

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT

### 1. 🎯 Quản Lý Nhiều Kỳ Thi (Multi-Exam Lifecycle)
- **Tạo không giới hạn kỳ thi**: Hỗ trợ tổ chức nhiều đợt thi trong năm (*Kỳ thi thử Lần 1, Lần 2, Thi Khảo sát 12, Kỳ thi TN THPT Chính thức...*).
- **Cô lập dữ liệu 100%**: Thí sinh, điểm thi, phòng thi và kết quả phân bổ của mỗi kỳ thi được quản lý độc lập, không bị ghi đè hay mất dữ liệu khi tạo kỳ thi mới.
- **Xóa & Reset Dữ Liệu Sạch Sẽ**: Khi xóa danh sách thí sinh hoặc chọn *Sửa & Reset Dữ Liệu*, toàn bộ dữ liệu của kỳ thi đó được làm mới an toàn.

### 2. 🔑 Bảo Vệ Bản Quyền Bằng Mã Mời (Invite Code Gate)
- **Cổng kích hoạt bản quyền**: Khi chia sẻ hệ thống cho các trường hoặc giáo viên, người dùng cần nhập đúng **Mã Mời** được cấp để mở khóa phần mềm.
- **Vai trò duy nhất Super Admin**: Tối ưu bảo mật và thao tác quản trị.
- **Quản lý & Thu hồi mã mời**:
  - Super Admin có thể xem, sao chép, tạo thêm mã mời mới.
  - Hỗ trợ **Thu hồi mã tức thì (Revoke)**: Người dùng đang sử dụng mã bị thu hồi sẽ lập tức bị khóa quyền truy cập.
  - Nút **Khóa lại phần mềm** chủ động khi rời máy.

### 3. 👥 Quản Lý Thí Sinh & Đánh Số Báo Danh Tự Động
- **Nhập từ Excel thông minh**: Tự động nhận diện mọi định dạng cột (`Họ tên`, `Ngày sinh`, `Lớp`, `Môn TC 1`, `Môn TC 2`, `TB 10`, `TB 11`, `TB 12`, `KK`, `UT`...).
- **Tự sinh Số Báo Danh (SBD) chuẩn Bộ GD&ĐT**: Sắp xếp chuẩn theo `Lớp` $\to$ `Tên A-Z` $\to$ `Họ đệm` $\to$ `Ngày sinh` và cấp SBD theo tiền tố trường.
- **Xuất danh sách 3 định dạng**: Xuất trực tiếp ra Excel (.xlsx), PDF (.pdf), Word (.docx).

### 4. 🏢 Xếp Phòng Thi Thuật Toán Chuẩn Khảo Thí & Module AI
- **Thuật toán xếp phòng tối ưu**:
  - Tự động gom thí sinh theo môn tự chọn, đảm bảo mỗi phòng tối đa 24 thí sinh (tùy chỉnh 10–40).
  - Tối ưu số ca thi/phòng, phân bổ giám thị và triệt tiêu xung đột môn thi.
- **Module AI song song**: Chạy song song thuật toán AI để so sánh phương án xếp phòng trực quan (Side-by-side).

### 5. 📊 Tính Điểm Xét Tốt Nghiệp Chuẩn Thông Tư 24/2024/TT-BGDĐT
- **Điểm trung bình các năm học THPT (ĐTB các năm học)**:
  $$\text{ĐTB các năm học} = \frac{(\text{ĐTB lớp 10} \times 1) + (\text{ĐTB lớp 11} \times 2) + (\text{ĐTB lớp 12} \times 3)}{6}$$
- **Điểm xét tốt nghiệp (ĐXTN)**:
  $$\text{ĐXTN} = \frac{\frac{\text{Tổng điểm 4 bài thi} + \text{Điểm Khuyến khích}}{4} + \text{ĐTB các năm học}}{2} + \text{Điểm Ưu tiên}$$
- **Điều kiện tốt nghiệp**: ĐXTN $\ge 5.0$ và tất cả các môn thi $> 1.0$ (không bị điểm liệt).

### 6. 🏆 Tổ Hợp Xét Tuyển Đại Học & Chi Tiết Điểm Môn
- Đầy đủ các khối xét tuyển: Khối A (A00-A10), Khối B (B00-B13), Khối C (C00-C19), Khối D (D01-D96), Khối X (X05-X27).
- Hiển thị chi tiết điểm từng môn thành phần và vinh danh thủ khoa từng tổ hợp.

### 7. 📄 Hệ Thống 11 Báo Cáo Chuẩn Thể Thức (Trang In Riêng Biệt)
- **Nhóm Chuẩn Bị Thi**:
  1. Danh sách thí sinh theo lớp *(Mỗi lớp 1 trang in)*
  2. Danh sách thí sinh theo phòng thi *(Mỗi phòng 1 trang in)*
  3. Danh sách thí sinh theo môn tự chọn
  4. Số liệu đăng ký dự thi theo phòng
  5. Bảng ghi tên ghi điểm (bản trống nộp phòng thi)
  6. Phiếu thu bài thi
- **Nhóm Kết Quả & Thống Kê**:
  7. Kết quả tốt nghiệp (toàn trường)
  8. Kết quả tốt nghiệp theo lớp *(Mỗi lớp 1 trang in)*
  9. Thống kê điểm thi theo các mốc tùy chỉnh ($\le 1$, $1-5$, $5-7$, $>7$)
  10. Thống kê điểm theo từng môn học
  11. Top thí sinh theo tổ hợp xét tuyển ĐH
- **Xuất 3 định dạng**: Excel (.xlsx), PDF (.pdf in chuẩn A4 dọc/ngang), Word (.docx thể thức hành chính).

---

## 🚀 HƯỚNG DẪN DEPLOY LÊN WEB & QUẢN LÝ DỮ LIỆU

Dự án được xây dựng dưới dạng **Single Page Application (SPA)** hiện đại bằng **React 18 + TypeScript + Vite + Tailwind CSS**, hỗ trợ triển khai nhanh chóng lên mọi nền tảng lưu trữ Web tĩnh (Static Hosting).

### Cách 1: Deploy Lên Vercel (Khuyến nghị — Nhanh nhất)
1. Đẩy mã nguồn dự án lên GitHub / GitLab:
   ```bash
   git init
   git add .
   git commit -m "feat: Release THPT Ca Mau Exam Manager"
   git remote add origin https://github.com/your-username/da-ai-thi-thu.git
   git push -u origin main
   ```
2. Truy cập [Vercel](https://vercel.com) $\to$ Chọn **Add New Project** $\to$ Import repository vừa tạo.
3. Vercel tự động nhận diện Vite Framework:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Nhấn **Deploy** $\to$ Hệ thống sẽ cung cấp link truy cập dạng `https://your-project.vercel.app`.

### Cách 2: Deploy Lên Netlify
1. Truy cập [Netlify](https://app.netlify.com) $\to$ **Add new site** $\to$ **Import an existing project**.
2. Cấu hình Build:
   - **Base directory**: để trống
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Nhấn **Deploy site**.

### Cách 3: Deploy Lên Cloudflare Pages
1. Truy cập Cloudflare Dashboard $\to$ **Workers & Pages** $\to$ **Create Application** $\to$ **Pages**.
2. Kết nối với kho mã nguồn GitHub.
3. Cấu hình:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Nhấn **Save and Deploy**.

### Cách 4: Chạy Cục Bộ (Offline) Tại Trường Học
Phần mềm hoàn toàn có thể chạy ngoại tuyến (offline) trong mạng LAN của trường mà không cần Internet:
```bash
# 1. Cài đặt các thư viện
npm install

# 2. Chạy máy chủ nội bộ
npm run dev -- --host
```
*Truy cập theo địa chỉ IP hiển thị trên màn hình terminal (Ví dụ: `http://192.168.1.100:5173`).*

---

## 💾 CƠ CHẾ LƯU TRỮ & AN TOÀN DỮ LIỆU

- **Lưu trữ Cục bộ (Local Persistence)**: Toàn bộ dữ liệu Thí sinh, Điểm thi, Cấu hình kỳ thi, Phân bổ phòng và Nhật ký Audit được tự động lưu trữ tức thời trong `localStorage` của trình duyệt.
- **An toàn & Riêng tư**: Dữ liệu không bị truyền lên máy chủ bên thứ ba, đảm bảo bí mật kỳ thi và thông tin học sinh 100%.
- **Sao lưu & Phục hồi**:
  - Xuất ra file Excel danh sách thí sinh và điểm thi để lưu trữ dự phòng.
  - Khi cần nhập vào máy tính khác, chỉ cần dùng chức năng **Import Excel** trong 1 giây.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Xử lý tài liệu**:
  - `xlsx` & `exceljs`: Đọc & tạo bảng tính Excel chuyên nghiệp
  - `jspdf` & `jspdf-autotable`: Xuất tài liệu PDF chuẩn A4
  - `docx`: Tạo văn bản Word (.docx) chuẩn thể thức hành chính
- **AI Khảo Thí**: Tích hợp Google Gemini, OpenRouter & DeepSeek API.
