-- ==============================================================================
-- E-PKL NSC — PHASE 4: PERIODE PKL & PENEMPATAN SCHEMA & VALIDATION
-- ==============================================================================

-- 1. Create Enum for Placement Status
DO $$ BEGIN
    CREATE TYPE placement_status_type AS ENUM (
        'belum_mulai',
        'aktif',
        'selesai',
        'dibatalkan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PKL_PERIODS (Periode / Gelombang PKL)
CREATE TABLE IF NOT EXISTS public.pkl_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_period_dates CHECK (end_date >= start_date)
);

-- 3. Trigger to ensure only ONE active period at a time
CREATE OR REPLACE FUNCTION public.handle_single_active_period()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.pkl_periods
        SET is_active = false
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_active_period ON public.pkl_periods;
CREATE TRIGGER trg_single_active_period
    BEFORE INSERT OR UPDATE OF is_active ON public.pkl_periods
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION public.handle_single_active_period();

-- 4. PKL_PLACEMENTS (Penempatan Siswa di DUDI)
CREATE TABLE IF NOT EXISTS public.pkl_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.pkl_periods(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    dudi_id UUID NOT NULL REFERENCES public.dudi(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
    industry_mentor_id UUID REFERENCES public.industry_mentors(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    division TEXT, -- Posisi / Bagian (cth: Network Administrator, QC Mekanik)
    status placement_status_type NOT NULL DEFAULT 'belum_mulai',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_placement_dates CHECK (end_date >= start_date),
    CONSTRAINT uq_placement_student_period UNIQUE (student_id, period_id)
);

-- Indexing for high speed filtering
CREATE INDEX IF NOT EXISTS idx_placements_period ON public.pkl_placements(period_id);
CREATE INDEX IF NOT EXISTS idx_placements_student ON public.pkl_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_dudi ON public.pkl_placements(dudi_id);
CREATE INDEX IF NOT EXISTS idx_placements_teacher ON public.pkl_placements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON public.pkl_placements(status);

-- 5. Trigger to automatically sync student pkl_status when placement is updated
CREATE OR REPLACE FUNCTION public.sync_student_pkl_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.status = 'aktif' THEN
            UPDATE public.students SET pkl_status = 'sedang_pkl' WHERE id = NEW.student_id;
        ELSIF NEW.status = 'selesai' THEN
            UPDATE public.students SET pkl_status = 'selesai_pkl' WHERE id = NEW.student_id;
        ELSIF NEW.status = 'dibatalkan' THEN
            UPDATE public.students SET pkl_status = 'batal' WHERE id = NEW.student_id;
        ELSIF NEW.status = 'belum_mulai' THEN
            UPDATE public.students SET pkl_status = 'proses_penempatan' WHERE id = NEW.student_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.students SET pkl_status = 'belum_ditempatkan' WHERE id = OLD.student_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_student_status ON public.pkl_placements;
CREATE TRIGGER trg_sync_student_status
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.pkl_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_student_pkl_status();

-- 6. Enable RLS
ALTER TABLE public.pkl_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pkl_placements ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can read periods and placements
CREATE POLICY "Periods read policy" ON public.pkl_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Placements read policy" ON public.pkl_placements FOR SELECT TO authenticated USING (true);

-- Write policies: Super Admin & Admin PKL can manage placements and periods
CREATE POLICY "Periods write policy" ON public.pkl_periods FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));
CREATE POLICY "Placements write policy" ON public.pkl_placements FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'admin_pkl'));

-- 7. Seed Active Period for 2026/2027
INSERT INTO public.pkl_periods (id, name, academic_year, start_date, end_date, is_active, description)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Gelombang 1 — Ganjil 2026/2027',
    '2026/2027',
    '2026-07-15',
    '2026-10-15',
    true,
    'Pelaksanaan Praktik Kerja Lapangan 3 Bulan Gelombang Pertama'
) ON CONFLICT DO NOTHING;
