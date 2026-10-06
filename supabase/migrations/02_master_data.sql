-- ==============================================================================
-- E-PKL NSC — PHASE 3: MASTER DATA SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. MAJORS (Program Keahlian / Jurusan)
CREATE TABLE IF NOT EXISTS public.majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TEACHERS (Guru & Pembimbing Sekolah)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nip TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CLASSES (Rombel / Kelas Siswa)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL CHECK (level IN ('X', 'XI', 'XII')),
    major_id UUID NOT NULL REFERENCES public.majors(id) ON DELETE RESTRICT,
    homeroom_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DUDI (Dunia Usaha & Dunia Industri Mitra)
CREATE TABLE IF NOT EXISTS public.dudi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT NOT NULL, -- Bidang usaha (cth: Otomotif, Jaringan, Manufaktur)
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Karawang',
    contact_person TEXT,
    phone_number TEXT,
    email TEXT,
    quota INTEGER NOT NULL DEFAULT 5,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. INDUSTRY MENTORS (Pembimbing / Instruktur Lapangan DUDI)
CREATE TABLE IF NOT EXISTS public.industry_mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    email TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. STUDENTS (Siswa Peserta PKL)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nis TEXT NOT NULL UNIQUE,
    nisn TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    email TEXT UNIQUE,
    phone_number TEXT,
    address TEXT,
    pkl_status TEXT NOT NULL DEFAULT 'belum_ditempatkan' 
        CHECK (pkl_status IN ('belum_ditempatkan', 'proses_penempatan', 'sedang_pkl', 'selesai_pkl', 'batal')),
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for high-performance filters
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(pkl_status);
CREATE INDEX IF NOT EXISTS idx_classes_major ON public.classes(major_id);
CREATE INDEX IF NOT EXISTS idx_teachers_major ON public.teachers(major_id);
CREATE INDEX IF NOT EXISTS idx_industry_mentors_dudi ON public.industry_mentors(dudi_id);

-- Enable RLS
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dudi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Read policies: All authenticated users can view master data
CREATE POLICY "Majors read policy" ON public.majors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers read policy" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Classes read policy" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Dudi read policy" ON public.dudi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mentors read policy" ON public.industry_mentors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students read policy" ON public.students FOR SELECT TO authenticated USING (true);

-- Write policies: Only Super Admin and Admin PKL can modify master data
CREATE POLICY "Majors write policy" ON public.majors FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Teachers write policy" ON public.teachers FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Classes write policy" ON public.classes FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Dudi write policy" ON public.dudi FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Mentors write policy" ON public.industry_mentors FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Students write policy" ON public.students FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================
INSERT INTO public.majors (id, code, name, description)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'TKRO', 'Teknik Kendaraan Ringan Otomotif', 'Program keahlian teknik otomotif dan perawatan mesin kendaraan ringan'),
    ('22222222-2222-2222-2222-222222222222', 'TP', 'Teknik Pemesinan', 'Program keahlian permesinan bubut, milling, CNC, dan fabrikasi logam'),
    ('33333333-3333-3333-3333-333333333333', 'TKJ', 'Teknik Komputer dan Jaringan', 'Program keahlian infrastruktur jaringan komputer, fiber optik, dan server'),
    ('44444444-4444-4444-4444-444444444444', 'APAT', 'Agribisnis Perikanan Air Tawar', 'Program keahlian budidaya perikanan air tawar dan manajemen tambak'),
    ('55555555-5555-5555-5555-555555555555', 'APHP', 'Agribisnis Pengolahan Hasil Pertanian', 'Program keahlian pengolahan pangan dan hasil pertanian modern')
ON CONFLICT (code) DO NOTHING;
