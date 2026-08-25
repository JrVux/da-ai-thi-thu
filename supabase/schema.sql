-- =========================================================================
-- DATABASE SCHEMA: PHẦN MỀM QUẢN LÝ KỲ THI THPT (WEB APP) - MULTI-TENANT
-- =========================================================================

-- 1. Bảng Trường Học (Multi-Tenant root)
CREATE TABLE IF NOT EXISTS truong (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_truong VARCHAR(255) NOT NULL,
    ma_truong VARCHAR(50) NOT NULL UNIQUE,
    so_gd VARCHAR(255) NOT NULL DEFAULT 'SỞ GD&ĐT CÀ MAU',
    dia_chi TEXT,
    so_dien_thoai VARCHAR(50),
    hieu_truong VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Cấu Hình Kỳ Thi
CREATE TABLE IF NOT EXISTS cau_hinh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID NOT NULL REFERENCES truong(id) ON DELETE CASCADE,
    ten_ky_thi VARCHAR(255) NOT NULL,
    nam INTEGER NOT NULL DEFAULT 2025,
    truong VARCHAR(255) NOT NULL,
    so_phong INTEGER NOT NULL DEFAULT 10,
    so_hoc_sinh_phong INTEGER NOT NULL DEFAULT 24,
    thu_muc_du_lieu TEXT,
    truong_diem_thi VARCHAR(100),
    ghi_chu TEXT,
    ngay_thi DATE,
    tien_to_sbd VARCHAR(10) DEFAULT '01',
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nguoi_cap_nhat VARCHAR(100) DEFAULT 'Admin'
);

-- 3. Bảng Thí Sinh
CREATE TABLE IF NOT EXISTS thi_sinh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID NOT NULL REFERENCES truong(id) ON DELETE CASCADE,
    sbd VARCHAR(20) NOT NULL,
    ho_ten VARCHAR(150) NOT NULL,
    ngay_sinh DATE NOT NULL,
    lop VARCHAR(50) NOT NULL,
    gioi_tinh VARCHAR(10) DEFAULT 'Nam',
    noi_sinh VARCHAR(150),
    dan_toc VARCHAR(50) DEFAULT 'Kinh',
    tb_lop_10 NUMERIC(4,2) DEFAULT 0,
    tb_lop_11 NUMERIC(4,2) DEFAULT 0,
    tb_lop_12 NUMERIC(4,2) DEFAULT 0,
    mon_tu_chon_1 VARCHAR(50) NOT NULL,
    mon_tu_chon_2 VARCHAR(50) NOT NULL,
    khuyen_khich NUMERIC(4,2) DEFAULT 0,
    uu_tien NUMERIC(4,2) DEFAULT 0,
    phong_thi_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_sbd_truong UNIQUE (truong_id, sbd)
);

-- 4. Bảng Phòng Thi
CREATE TABLE IF NOT EXISTS phong_thi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID NOT NULL REFERENCES truong(id) ON DELETE CASCADE,
    ma_phong VARCHAR(50) NOT NULL,
    ten_phong VARCHAR(150) NOT NULL,
    suc_chua INTEGER DEFAULT 24 NOT NULL,
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_maphong_truong UNIQUE (truong_id, ma_phong)
);

-- 5. Bảng Điểm Thi
CREATE TABLE IF NOT EXISTS diem_thi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID NOT NULL REFERENCES truong(id) ON DELETE CASCADE,
    sbd VARCHAR(20) NOT NULL,
    toan NUMERIC(4,2),
    van NUMERIC(4,2),
    mon_1 NUMERIC(4,2),
    mon_2 NUMERIC(4,2),
    khuyen_khich NUMERIC(4,2) DEFAULT 0,
    uu_tien NUMERIC(4,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by VARCHAR(100),
    CONSTRAINT uq_diem_sbd_truong UNIQUE (truong_id, sbd)
);

-- 6. Bảng Tổ Hợp Xét Tuyển Đại Học (Khối A, B, C, D, X)
CREATE TABLE IF NOT EXISTS to_hop_xet_tuyen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID REFERENCES truong(id) ON DELETE CASCADE,
    ma_to_hop VARCHAR(10) NOT NULL,
    ten_to_hop VARCHAR(255) NOT NULL,
    khoi VARCHAR(10) NOT NULL,
    mon_1 VARCHAR(50) NOT NULL,
    mon_2 VARCHAR(50) NOT NULL,
    mon_3 VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Bảng Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truong_id UUID NOT NULL REFERENCES truong(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE truong ENABLE ROW LEVEL SECURITY;
ALTER TABLE cau_hinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE thi_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE phong_thi ENABLE ROW LEVEL SECURITY;
ALTER TABLE diem_thi ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_hop_xet_tuyen ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Default Policy: Users access rows matching their truong_id claim
CREATE POLICY "Tenant isolation for cau_hinh" ON cau_hinh
    FOR ALL USING (truong_id = (current_setting('app.current_truong_id', true))::uuid);

CREATE POLICY "Tenant isolation for thi_sinh" ON thi_sinh
    FOR ALL USING (truong_id = (current_setting('app.current_truong_id', true))::uuid);

CREATE POLICY "Tenant isolation for phong_thi" ON phong_thi
    FOR ALL USING (truong_id = (current_setting('app.current_truong_id', true))::uuid);

CREATE POLICY "Tenant isolation for diem_thi" ON diem_thi
    FOR ALL USING (truong_id = (current_setting('app.current_truong_id', true))::uuid);

CREATE POLICY "Tenant isolation for audit_logs" ON audit_logs
    FOR ALL USING (truong_id = (current_setting('app.current_truong_id', true))::uuid);

-- =========================================================================
-- SEED DATA: TRƯỜNG THPT CÀ MAU (MẶC ĐỊNH)
-- =========================================================================
INSERT INTO truong (id, ten_truong, ma_truong, so_gd, dia_chi, so_dien_thoai, hieu_truong)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'TRƯỜNG THPT CÀ MAU',
    'CM01',
    'SỞ GD&ĐT CÀ MAU',
    'Số 01 Đường Lý Thường Kiệt, Phường 6, TP. Cà Mau',
    '0290 3831 234',
    'Nguyễn Văn A'
) ON CONFLICT (ma_truong) DO NOTHING;
