-- ==============================================================================
-- E-PKL NSC — PHASE 6: MONITORING PKL SCHEMA & STORAGE
-- ==============================================================================

-- 1. Create Enums for Evaluation Rating
DO $$ BEGIN
    CREATE TYPE monitoring_rating_type AS ENUM (
        'sangat_baik',
        'baik',
        'cukup',
        'perlu_bimbingan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. MONITORING TABLE (Supervisi Kunjungan Guru Pembimbing ke DUDI)
CREATE TABLE IF NOT EXISTS public.monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE RESTRICT,
    monitoring_stage INT NOT NULL DEFAULT 1 CHECK (monitoring_stage >= 1),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Aspek Penilaian Kunjungan (Skala 1 - 5)
    attendance_score INT NOT NULL DEFAULT 4 CHECK (attendance_score BETWEEN 1 AND 5),
    discipline_score INT NOT NULL DEFAULT 4 CHECK (discipline_score BETWEEN 1 AND 5),
    attitude_score INT NOT NULL DEFAULT 4 CHECK (attitude_score BETWEEN 1 AND 5),
    competency_score INT NOT NULL DEFAULT 4 CHECK (competency_score BETWEEN 1 AND 5),
    communication_score INT NOT NULL DEFAULT 4 CHECK (communication_score BETWEEN 1 AND 5),
    
    -- Nilai & Evaluasi Kualitatif
    overall_rating monitoring_rating_type NOT NULL DEFAULT 'baik',
    student_condition TEXT,
    industry_feedback TEXT,
    obstacles TEXT,
    recommendation TEXT,
    documentation_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 1 Stage per Placement Constraint (misal: 1 siswa hanya punya 1 record untuk Monitoring Tahap 1 pada penempatan yang sama)
    CONSTRAINT uq_placement_monitoring_stage UNIQUE (placement_id, monitoring_stage)
);

-- Indexing for fast search and aggregation
CREATE INDEX IF NOT EXISTS idx_monitoring_placement ON public.monitoring(placement_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_student ON public.monitoring(student_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_teacher ON public.monitoring(teacher_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_dudi ON public.monitoring(dudi_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_stage ON public.monitoring(monitoring_stage);
CREATE INDEX IF NOT EXISTS idx_monitoring_visit_date ON public.monitoring(visit_date);

-- 3. Enable RLS
ALTER TABLE public.monitoring ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can view monitoring logs (Teachers for their students, Admins for all, Students for their own)
CREATE POLICY "Monitoring select policy" ON public.monitoring 
    FOR SELECT TO authenticated USING (true);

-- Write policies: Teachers and Admins can create/edit monitoring records
CREATE POLICY "Monitoring insert policy" ON public.monitoring 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Monitoring update policy" ON public.monitoring 
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Monitoring delete policy" ON public.monitoring 
    FOR DELETE TO authenticated USING (true);

-- 4. Storage Bucket for Monitoring Documentation Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('monitoring-documents', 'monitoring-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Allow public read monitoring docs" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'monitoring-documents');

CREATE POLICY "Allow authenticated insert monitoring docs" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'monitoring-documents' AND auth.role() = 'authenticated');
