-- ==============================================================================
-- E-PKL NSC — PHASE 7: ASSESSMENTS & DYNAMIC RUBRICS SCHEMA
-- ==============================================================================

-- 1. Create Enums for Evaluator & Assessment Status
DO $$ BEGIN
    CREATE TYPE evaluator_type_enum AS ENUM ('industry', 'teacher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_status_enum AS ENUM ('draft', 'submitted', 'locked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ASSESSMENT CATEGORIES TABLE (Rubrik Butir Penilaian Dinamis)
CREATE TABLE IF NOT EXISTS public.assessment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluator_type evaluator_type_enum NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for categories
CREATE INDEX IF NOT EXISTS idx_assessment_categories_evaluator ON public.assessment_categories(evaluator_type);
CREATE INDEX IF NOT EXISTS idx_assessment_categories_active ON public.assessment_categories(is_active);

-- 3. ASSESSMENT SETTINGS TABLE (Bobot Komponen & Aturan Kelulusan)
CREATE TABLE IF NOT EXISTS public.assessment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_weight NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    teacher_weight NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    passing_grade NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    is_assessment_open BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ASSESSMENTS HEADER TABLE (Header Nilai Siswa PKL)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE UNIQUE,
    
    -- Nilai & Evaluator Industri
    industry_score NUMERIC(5, 2),
    industry_weight NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    industry_evaluated_by UUID REFERENCES public.industry_mentors(id) ON DELETE SET NULL,
    industry_evaluated_at TIMESTAMPTZ,
    industry_notes TEXT,
    
    -- Nilai & Evaluator Guru
    teacher_score NUMERIC(5, 2),
    teacher_weight NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    teacher_evaluated_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_evaluated_at TIMESTAMPTZ,
    teacher_notes TEXT,
    
    -- Nilai Akhir & Predikat
    final_score NUMERIC(5, 2),
    predicate VARCHAR(5) CHECK (predicate IN ('A', 'B', 'C', 'D')),
    
    -- Status Penilaian
    status assessment_status_enum NOT NULL DEFAULT 'draft',
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for assessments
CREATE INDEX IF NOT EXISTS idx_assessments_placement ON public.assessments(placement_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_final_score ON public.assessments(final_score);

-- 5. ASSESSMENT DETAILS TABLE (Rincian Skor Per Butir Aspek Rubrik)
CREATE TABLE IF NOT EXISTS public.assessment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.assessment_categories(id) ON DELETE RESTRICT,
    score NUMERIC(5, 2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 1 Score per Category per Assessment
    CONSTRAINT uq_assessment_category_score UNIQUE (assessment_id, category_id)
);

-- Indexing for details
CREATE INDEX IF NOT EXISTS idx_assessment_details_assessment ON public.assessment_details(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_details_category ON public.assessment_details(category_id);

-- 6. Initial Seed Data for Rubric Categories (Default Aspects)
INSERT INTO public.assessment_categories (evaluator_type, code, name, description, order_index, is_active)
VALUES
    -- Aspek Industri
    ('industry', 'IND_DISIPLIN', 'Disiplin Kerja & Kepatuhan Waktu', 'Ketepatan waktu kehadiran, kepatuhan jam kerja dan SOP industri.', 1, true),
    ('industry', 'IND_TANGGUNG_JAWAB', 'Tanggung Jawab & Kemandirian', 'Kesungguhan dalam menuntaskan tugas pekerjaan yang diinstruksikan.', 2, true),
    ('industry', 'IND_KERJA_SAMA', 'Kerja Sama & Interaksi Tim', 'Kemampuan berkoordinasi dan membantu rekan kerja di lingkungan kerja.', 3, true),
    ('industry', 'IND_KOMUNIKASI', 'Komunikasi & Adaptasi', 'Keterbukaan dalam berdiskusi, sopan santun, dan responsif terhadap arahan.', 4, true),
    ('industry', 'IND_KOMPETENSI', 'Penguasaan Kompetensi Teknis', 'Kemampuan teknis, keterampilan praktikum, serta kualitas hasil kerja.', 5, true),
    ('industry', 'IND_SIKAP', 'Sikap, Etika & Kejujuran', 'Integritas, etos kerja profesional, dan kepedulian terhadap lingkungan kerja.', 6, true),

    -- Aspek Guru
    ('teacher', 'GUR_KEHADIRAN', 'Kehadiran & Rekap Presensi', 'Tingkat presensi dan kedisiplinan absensi GPS selama periode PKL.', 1, true),
    ('teacher', 'GUR_JURNAL', 'Jurnal Kegiatan Harian (Logbook)', 'Kelengkapan, konsistensi pengisian logbook harian, dan dokumentasi foto.', 2, true),
    ('teacher', 'GUR_SIKAP', 'Sikap, Etika & Respon Bimbingan', 'Keaktifan dalam bimbingan, sopan santun, dan ketaatan terhadap norma sekolah.', 3, true),
    ('teacher', 'GUR_LAPORAN', 'Naskah Laporan Akhir PKL', 'Kerapian, kesesuaian format, dan ketepatan waktu pengumpulan laporan PKL.', 4, true),
    ('teacher', 'GUR_KOMPETENSI', 'Ujian / Presentasi Kompetensi PKL', 'Penguasaan materi hasil praktik industri saat monitoring / ujian PKL.', 5, true)
ON CONFLICT (code) DO NOTHING;

-- Initial Seed for Settings
INSERT INTO public.assessment_settings (industry_weight, teacher_weight, passing_grade, is_assessment_open)
VALUES (40.0, 60.0, 75.0, true)
ON CONFLICT DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_details ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can view categories, settings & assessments
CREATE POLICY "Categories read policy" ON public.assessment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings read policy" ON public.assessment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Assessments read policy" ON public.assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Details read policy" ON public.assessment_details FOR SELECT TO authenticated USING (true);

-- Write policies:
CREATE POLICY "Categories write policy" ON public.assessment_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Settings write policy" ON public.assessment_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Assessments write policy" ON public.assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Details write policy" ON public.assessment_details FOR ALL TO authenticated USING (true);
