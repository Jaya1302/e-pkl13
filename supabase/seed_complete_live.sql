-- ==============================================================================
-- E-PKL SMKN 13 BANDUNG — MASTER SEED & LIVE DATABASE SETUP
-- Jalankan script ini di Supabase SQL Editor untuk inisialisasi schema & 5 role live
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM (
        'super_admin',
        'admin_pkl',
        'kepala_sekolah',
        'wakasek',
        'guru_pembimbing',
        'siswa',
        'pembimbing_industri'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE placement_status_type AS ENUM ('belum_mulai', 'aktif', 'selesai', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM ('hadir', 'izin', 'sakit', 'alpa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE journal_status_type AS ENUM ('draft', 'submitted', 'verified', 'revision');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE evaluator_type_enum AS ENUM ('industry', 'teacher');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 2. TABEL DASAR & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'siswa',
    phone_number TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. MASTER DATA TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.dudi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.industry_mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nis TEXT NOT NULL UNIQUE,
    nisn TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    address TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    pkl_status TEXT NOT NULL DEFAULT 'belum_ditempatkan',
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. PERIODE & PENEMPATAN
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pkl_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pkl_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.pkl_periods(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
    industry_mentor_id UUID REFERENCES public.industry_mentors(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status placement_status_type NOT NULL DEFAULT 'aktif',
    letter_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_period_placement UNIQUE (student_id, period_id)
);

-- ------------------------------------------------------------------------------
-- 5. PRESENSI & JURNAL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME,
    check_out_time TIME,
    status attendance_status_type NOT NULL DEFAULT 'hadir',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    is_gps_valid BOOLEAN DEFAULT true,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_attendance_date UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_title TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    competency_type TEXT DEFAULT 'Teknis & Praktik',
    photo_url TEXT,
    status journal_status_type NOT NULL DEFAULT 'submitted',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. MONITORING & PENILAIAN
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE RESTRICT,
    monitoring_stage INT NOT NULL DEFAULT 1,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_score INT NOT NULL DEFAULT 4,
    discipline_score INT NOT NULL DEFAULT 4,
    attitude_score INT NOT NULL DEFAULT 4,
    competency_score INT NOT NULL DEFAULT 4,
    communication_score INT NOT NULL DEFAULT 4,
    overall_rating TEXT NOT NULL DEFAULT 'baik',
    student_condition TEXT,
    industry_feedback TEXT,
    obstacles TEXT,
    recommendation TEXT,
    documentation_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE UNIQUE,
    industry_score NUMERIC(5, 2),
    industry_weight NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    industry_evaluated_by UUID REFERENCES public.industry_mentors(id) ON DELETE SET NULL,
    industry_evaluated_at TIMESTAMPTZ,
    industry_notes TEXT,
    teacher_score NUMERIC(5, 2),
    teacher_weight NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    teacher_evaluated_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_evaluated_at TIMESTAMPTZ,
    teacher_notes TEXT,
    final_score NUMERIC(5, 2),
    predicate TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. SEED DATA AKUN SUPABASE AUTH & PROFILES (5 ROLES LENGKAP)
-- Password untuk semua akun demo ini: password123
-- ==============================================================================

-- Helper function to safely create auth user if not exists
CREATE OR REPLACE FUNCTION create_demo_auth_user(
    p_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_role user_role_type,
    p_password TEXT DEFAULT 'password123'
) RETURNS VOID AS $$
BEGIN
    -- 1. Insert or update auth.users with encrypted password
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token
        ) VALUES (
            p_id,
            '00000000-0000-0000-0000-000000000000',
            p_email,
            crypt(p_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', p_name, 'role', p_role),
            now(),
            now(),
            'authenticated',
            'authenticated',
            ''
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = jsonb_build_object('name', p_name, 'role', p_role),
            updated_at = now()
        WHERE email = p_email;
    END IF;

    -- 2. Insert into auth.identities for GoTrue Auth password verification
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = p_id) THEN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            p_id,
            p_id,
            jsonb_build_object('sub', p_id::text, 'email', p_email),
            'email',
            p_id::text,
            now(),
            now(),
            now()
        );
    END IF;

    -- 3. Ensure public.profiles has matching entry
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (p_id, p_email, p_name, p_role, true)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;
END;
$$ LANGUAGE plpgsql;

-- 1. Super Admin
SELECT create_demo_auth_user('a1111111-1111-1111-1111-111111111111'::UUID, 'superadmin@smkn13bdg.sch.id', 'Super Administrator (IT SMKN 13 Bandung)', 'super_admin');

-- 2. Hubin / Admin PKL
SELECT create_demo_auth_user('a2222222-2222-2222-2222-222222222222'::UUID, 'hubin@smkn13bdg.sch.id', 'Koordinator Hubinmas & PKL', 'admin_pkl');

-- 3. Guru Pembimbing
SELECT create_demo_auth_user('a3333333-3333-3333-3333-333333333333'::UUID, 'guru.fauzi@smkn13bdg.sch.id', 'Ahmad Fauzi, S.Kom (Guru Pembimbing)', 'guru_pembimbing');

-- 4. Pembimbing Industri (DUDI)
SELECT create_demo_auth_user('a4444444-4444-4444-4444-444444444444'::UUID, 'mentor.telkom@smkn13bdg.sch.id', 'Hendri Gunawan (PT Telkom Bandung)', 'pembimbing_industri');

-- 5. Siswa PKL
SELECT create_demo_auth_user('a5555555-5555-5555-5555-555555555555'::UUID, 'siswa.rizky@smkn13bdg.sch.id', 'Muhammad Rizky Pratama', 'siswa');

-- ==============================================================================
-- 8. SEED MASTER DATA RELASIONAL
-- ==============================================================================

-- Jurusan
INSERT INTO public.majors (id, code, name, description)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'RPL', 'Rekayasa Perangkat Lunak', 'Pengembangan aplikasi web, mobile, cloud computing'),
    ('10000000-0000-0000-0000-000000000002', 'APL', 'Analisis Pengujian Laboratorium', 'Kimia analisis terpadu, instrumen lab, dan kendali mutu'),
    ('10000000-0000-0000-0000-000000000003', 'TKJ', 'Teknik Komputer dan Jaringan', 'Infrastruktur jaringan, fiber optik, dan server'),
    ('10000000-0000-0000-0000-000000000004', 'FI', 'Farmasi Industri', 'Formulasi sediaan obat dan produksi farmasi CPOB')
ON CONFLICT (code) DO NOTHING;

-- Guru
INSERT INTO public.teachers (id, user_id, nip, name, email, phone_number, major_id)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', '197505122005011002', 'Ahmad Fauzi, S.Kom', 'guru.fauzi@smkn13bdg.sch.id', '081234567801', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', NULL, '198003152008011003', 'Dr. Budi Santoso, M.Si', 'budi.santoso@smkn13bdg.sch.id', '081234567802', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (email) DO NOTHING;

-- Kelas
INSERT INTO public.classes (id, name, level, major_id, homeroom_teacher_id)
VALUES 
    ('30000000-0000-0000-0000-000000000001', 'XI RPL 1', 'XI', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'XI APL 1', 'XI', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (name) DO NOTHING;

-- DUDI Mitra
INSERT INTO public.dudi (id, name, sector, address, city, contact_person, phone_number, email, quota, latitude, longitude, radius_meters)
VALUES 
    ('40000000-0000-0000-0000-000000000001', 'PT Telkom Indonesia (Witel Bandung)', 'Teknologi Informasi & Jaringan', 'Jl. Lembong No. 11, Braga', 'Bandung', 'Hendri Gunawan', '022-4521000', 'pkl.bandung@telkom.co.id', 12, -6.9175, 107.6111, 150),
    ('40000000-0000-0000-0000-000000000002', 'PT Bio Farma (Persero)', 'Farmasi & Bioteknologi', 'Jl. Pasteur No. 28, Sukajadi', 'Bandung', 'Dr. Bambang Sudarsono', '022-2033755', 'hrd.internship@biofarma.co.id', 10, -6.8992, 107.5986, 200)
ON CONFLICT DO NOTHING;

-- Pembimbing Industri
INSERT INTO public.industry_mentors (id, user_id, dudi_id, name, position, email, phone_number)
VALUES 
    ('50000000-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', '40000000-0000-0000-0000-000000000001', 'Hendri Gunawan', 'Leader Software & Infrastructure', 'mentor.telkom@smkn13bdg.sch.id', '081299887766')
ON CONFLICT (email) DO NOTHING;

-- Siswa
INSERT INTO public.students (id, user_id, nis, nisn, name, gender, class_id, email, phone_number, pkl_status)
VALUES 
    ('60000000-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', '222310001', '0061234567', 'Muhammad Rizky Pratama', 'L', '30000000-0000-0000-0000-000000000001', 'siswa.rizky@smkn13bdg.sch.id', '081234567890', 'sedang_pkl')
ON CONFLICT (email) DO NOTHING;

-- Periode PKL
INSERT INTO public.pkl_periods (id, name, academic_year, start_date, end_date, is_active, description)
VALUES 
    ('70000000-0000-0000-0000-000000000001', 'PKL Gelombang 1 TA 2026/2027', '2026/2027', '2026-07-01', '2026-12-31', true, 'Periode semester ganjil kelas XI')
ON CONFLICT DO NOTHING;

-- Penempatan PKL (Menghubungkan Siswa Rizky -> PT Telkom -> Guru Fauzi & Mentor Hendri)
INSERT INTO public.pkl_placements (id, period_id, student_id, dudi_id, teacher_id, industry_mentor_id, start_date, end_date, status)
VALUES 
    ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-07-01', '2026-12-31', 'aktif')
ON CONFLICT DO NOTHING;

-- Presensi Hari Ini untuk Siswa Rizky
INSERT INTO public.attendance (id, placement_id, student_id, date, check_in_time, status, distance_meters, is_gps_valid, notes)
VALUES 
    ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', CURRENT_DATE, '07:25:00', 'hadir', 45, true, 'Hadir tepat waktu di Telkom Bandung')
ON CONFLICT (student_id, date) DO NOTHING;

-- Jurnal Kegiatan Kemarin
INSERT INTO public.journals (id, placement_id, student_id, date, activity_title, activity_description, competency_type, status)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Pemeliharaan Jaringan Switch & Server', 'Melakukan pengecekan koneksi uplink switch dan crimping ulang kabel LAN patch cord yang longgar.', 'Teknis & Infrastruktur IT', 'submitted')
ON CONFLICT DO NOTHING;

-- Aktifkan RLS Policies dasar untuk publik/anon jika dibutuhkan
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
CREATE POLICY "Public update profiles" ON public.profiles FOR ALL USING (true);

ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select majors" ON public.majors;
CREATE POLICY "Public select majors" ON public.majors FOR ALL USING (true);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select teachers" ON public.teachers;
CREATE POLICY "Public select teachers" ON public.teachers FOR ALL USING (true);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select classes" ON public.classes;
CREATE POLICY "Public select classes" ON public.classes FOR ALL USING (true);

ALTER TABLE public.dudi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select dudi" ON public.dudi;
CREATE POLICY "Public select dudi" ON public.dudi FOR ALL USING (true);

ALTER TABLE public.industry_mentors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select industry_mentors" ON public.industry_mentors;
CREATE POLICY "Public select industry_mentors" ON public.industry_mentors FOR ALL USING (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select students" ON public.students;
CREATE POLICY "Public select students" ON public.students FOR ALL USING (true);

ALTER TABLE public.pkl_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select pkl_periods" ON public.pkl_periods;
CREATE POLICY "Public select pkl_periods" ON public.pkl_periods FOR ALL USING (true);

ALTER TABLE public.pkl_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select pkl_placements" ON public.pkl_placements;
CREATE POLICY "Public select pkl_placements" ON public.pkl_placements FOR ALL USING (true);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select attendance" ON public.attendance;
CREATE POLICY "Public select attendance" ON public.attendance FOR ALL USING (true);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select journals" ON public.journals;
CREATE POLICY "Public select journals" ON public.journals FOR ALL USING (true);

ALTER TABLE public.monitoring ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select monitoring" ON public.monitoring;
CREATE POLICY "Public select monitoring" ON public.monitoring FOR ALL USING (true);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select assessments" ON public.assessments;
CREATE POLICY "Public select assessments" ON public.assessments FOR ALL USING (true);
