-- ==============================================================================
-- FIX: DROP CONFLICTING TRIGGERS ON STUDENTS & TEACHERS TABLES
-- Jalankan script SQL ini di Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Hapus semua trigger bermasalah pada tabel students yang memicu insert profiles
DO $$ 
DECLARE 
    trg RECORD;
BEGIN 
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
          AND event_object_table = 'students'
    LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.students CASCADE;', trg.trigger_name);
        RAISE NOTICE 'Dropped trigger % on public.students', trg.trigger_name;
    END LOOP; 
END $$;

-- 2. Hapus semua trigger bermasalah pada tabel teachers jika ada
DO $$ 
DECLARE 
    trg RECORD;
BEGIN 
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
          AND event_object_table = 'teachers'
    LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.teachers CASCADE;', trg.trigger_name);
        RAISE NOTICE 'Dropped trigger % on public.teachers', trg.trigger_name;
    END LOOP; 
END $$;

-- 3. Pastikan RLS Policy pada tabel students dan dudi terbuka untuk Admin PKL / Full Access
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select students" ON public.students;
DROP POLICY IF EXISTS "Public all students" ON public.students;
DROP POLICY IF EXISTS "Students write policy" ON public.students;
DROP POLICY IF EXISTS "Students read policy" ON public.students;

CREATE POLICY "Allow all operations on students" 
ON public.students 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Pastikan RLS Policy pada pkl_placements dan dudi juga terbuka
ALTER TABLE public.dudi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on dudi" ON public.dudi;
CREATE POLICY "Allow all operations on dudi" 
ON public.dudi 
FOR ALL 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.pkl_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on pkl_placements" ON public.pkl_placements;
CREATE POLICY "Allow all operations on pkl_placements" 
ON public.pkl_placements 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Selesai! Sekarang tabel students siap menerima import data Excel tanpa hambatan trigger.
