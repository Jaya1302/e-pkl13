-- ==============================================================================
-- E-PKL NSC — PHASE 9: CERTIFICATES & QR VERIFICATION SCHEMA
-- ==============================================================================

-- 1. Create Enums for Certificate Status
DO $$ BEGIN
    CREATE TYPE certificate_status_enum AS ENUM (
        'draft',
        'valid',
        'revoked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CERTIFICATES TABLE (Penerbitan Sertifikat Digital PKL)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.pkl_placements(id) ON DELETE CASCADE UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    serial_number INT NOT NULL,
    issue_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Nilai & Predikat Resmi
    final_score NUMERIC(5, 2) NOT NULL,
    predicate VARCHAR(5) NOT NULL,
    
    -- Pejabat Penandatangan
    principal_name VARCHAR(150) NOT NULL DEFAULT 'Drs. H. Dedi Indrayana, M.Pd.',
    principal_nip VARCHAR(50) DEFAULT '196805121994031008',
    principal_title VARCHAR(100) DEFAULT 'Kepala SMK Negeri 13 Bandung',
    
    -- Keaslian & Status
    verification_code VARCHAR(64) NOT NULL UNIQUE,
    qr_code_url TEXT,
    pdf_url TEXT,
    status certificate_status_enum NOT NULL DEFAULT 'valid',
    revoked_reason TEXT,
    revoked_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);

-- 3. Storage Bucket for Certificate PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Read policies: Public & Authenticated can view valid certificates for verification
CREATE POLICY "Public read valid certificates" ON public.certificates 
    FOR SELECT USING (true);

-- Write policies:
CREATE POLICY "Certificates write policy" ON public.certificates 
    FOR ALL TO authenticated USING (true);
