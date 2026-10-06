-- ==============================================================================
-- E-PKL NSC — PHASE 8: PKL REPORTS & OFFICIAL DOCUMENTS SCHEMA
-- ==============================================================================

-- 1. Create Enums for Report Status & Document Type
DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'draft',
        'submitted',
        'in_review',
        'revision_required',
        'approved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM (
        'surat_pengantar',
        'surat_permohonan',
        'surat_tugas',
        'surat_penerimaan',
        'surat_monitoring',
        'surat_selesai'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PKL REPORTS TABLE (Naskah Laporan Akhir Siswa)
CREATE TABLE IF NOT EXISTS public.pkl_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    status report_status_enum NOT NULL DEFAULT 'draft',
    teacher_feedback TEXT,
    reviewed_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 1 Active Report Header per Placement
    CONSTRAINT uq_placement_report UNIQUE (placement_id)
);

-- Indexing for pkl_reports
CREATE INDEX IF NOT EXISTS idx_pkl_reports_placement ON public.pkl_reports(placement_id);
CREATE INDEX IF NOT EXISTS idx_pkl_reports_student ON public.pkl_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_pkl_reports_status ON public.pkl_reports(status);

-- 3. REPORT REVISIONS TABLE (Riwayat Versi File Laporan)
CREATE TABLE IF NOT EXISTS public.report_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.pkl_reports(id) ON DELETE CASCADE,
    version INT NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    notes TEXT,
    teacher_feedback TEXT,
    status report_status_enum NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for revisions
CREATE INDEX IF NOT EXISTS idx_report_revisions_report ON public.report_revisions(report_id);

-- 4. DOCUMENT TEMPLATES TABLE (Template Surat Resmi)
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    type document_type_enum NOT NULL,
    template_body TEXT NOT NULL,
    header_title VARCHAR(255) DEFAULT 'PEMERINTAH DAERAH PROVINSI JAWA BARAT',
    school_name VARCHAR(255) DEFAULT 'SMK NEGERI 13 BANDUNG',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. GENERATED LETTERS TABLE (Arsip Surat yang Diterbitkan)
CREATE TABLE IF NOT EXISTS public.generated_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_number VARCHAR(100) NOT NULL UNIQUE,
    template_type document_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    placement_id UUID REFERENCES public.pkl_placements(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    dudi_id UUID REFERENCES public.dudi(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    content_html TEXT NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    signer_name VARCHAR(150) NOT NULL DEFAULT 'Drs. H. Dedi Indrayana, M.Pd.',
    signer_nip VARCHAR(50) DEFAULT '196805121994031008',
    signer_title VARCHAR(100) DEFAULT 'Kepala SMK Negeri 13 Bandung',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for generated letters
CREATE INDEX IF NOT EXISTS idx_generated_letters_type ON public.generated_letters(template_type);
CREATE INDEX IF NOT EXISTS idx_generated_letters_student ON public.generated_letters(student_id);

-- 6. Storage Bucket for PKL Reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pkl-reports', 'pkl-reports', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.pkl_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_letters ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can read
CREATE POLICY "Reports read policy" ON public.pkl_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Revisions read policy" ON public.report_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Templates read policy" ON public.document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Letters read policy" ON public.generated_letters FOR SELECT TO authenticated USING (true);

-- Write policies:
CREATE POLICY "Reports write policy" ON public.pkl_reports FOR ALL TO authenticated USING (true);
CREATE POLICY "Revisions write policy" ON public.report_revisions FOR ALL TO authenticated USING (true);
CREATE POLICY "Templates write policy" ON public.document_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Letters write policy" ON public.generated_letters FOR ALL TO authenticated USING (true);
