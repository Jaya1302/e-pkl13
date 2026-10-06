-- ==============================================================================
-- E-PKL NSC — PHASE 5: ATTENDANCE & JOURNALS SCHEMA & STORAGE
-- ==============================================================================

-- 1. Create Enums for Attendance & Journal Status
DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM (
        'hadir',
        'izin',
        'sakit',
        'alpa'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE journal_status_type AS ENUM (
        'draft',
        'submitted',
        'verified',
        'revision'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ATTENDANCE TABLE (Presensi Harian Siswa)
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

    -- 1 Student 1 Record per Day Constraint
    CONSTRAINT uq_student_attendance_date UNIQUE (student_id, date)
);

-- Indexing for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_placement ON public.attendance(placement_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- 3. JOURNALS TABLE (Jurnal Harian Kegiatan PKL)
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity TEXT NOT NULL,
    competency TEXT NOT NULL,
    duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 8.0,
    obstacles TEXT,
    solution TEXT,
    photo_url TEXT,
    status journal_status_type NOT NULL DEFAULT 'draft',
    teacher_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for journals
CREATE INDEX IF NOT EXISTS idx_journals_student ON public.journals(student_id);
CREATE INDEX IF NOT EXISTS idx_journals_placement ON public.journals(placement_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.journals(date);
CREATE INDEX IF NOT EXISTS idx_journals_status ON public.journals(status);

-- 4. Enable RLS on Attendance and Journals
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Read policies: authenticated users can read
CREATE POLICY "Attendance read policy" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Journals read policy" ON public.journals FOR SELECT TO authenticated USING (true);

-- Write policies:
CREATE POLICY "Attendance student insert/update" ON public.attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Journals student insert/update" ON public.journals FOR ALL TO authenticated USING (true);

-- 5. Storage Buckets for Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('attendance-photos', 'attendance-photos', true),
    ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public attendance photos access" ON storage.objects FOR SELECT USING (bucket_id = 'attendance-photos');
CREATE POLICY "Public attendance photos upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendance-photos');

CREATE POLICY "Public journal photos access" ON storage.objects FOR SELECT USING (bucket_id = 'journal-photos');
CREATE POLICY "Public journal photos upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'journal-photos');
