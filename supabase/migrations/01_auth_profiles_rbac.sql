-- ==============================================================================
-- E-PKL NSC — PHASE 2: AUTHENTICATION, PROFILES & RBAC SCHEMA
-- ==============================================================================

-- 1. Create Enum for User Roles
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (Linked to auth.users)
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

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Trigger for Automatic Updated At
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Trigger for Auto Profile Creation on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role user_role_type;
    user_name TEXT;
BEGIN
    -- Extract role from user_metadata or default to 'siswa'
    default_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role_type, 'siswa');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

    INSERT INTO public.profiles (id, email, name, role, phone_number, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        default_role,
        NEW.raw_user_meta_data->>'phone_number',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Helper Function to Get Current User Role in SQL / RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_type AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Read: Users can read their own profile, Super Admin & Admin PKL can read all profiles
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR public.get_current_user_role() IN ('super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek')
    );

-- Update: Users can update their own non-role fields, Admins can update all
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id
        OR public.get_current_user_role() IN ('super_admin', 'admin_pkl')
    );

-- Insert: Service role / trigger / Admin can insert
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id
        OR public.get_current_user_role() IN ('super_admin', 'admin_pkl')
    );
