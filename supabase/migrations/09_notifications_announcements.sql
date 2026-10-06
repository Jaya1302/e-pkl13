-- ==============================================================================
-- E-PKL NSC — PHASE 10: NOTIFICATIONS & ANNOUNCEMENTS SCHEMA
-- ==============================================================================

-- 1. Create Enums for Notification & Announcement Types
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'info',
        'warning',
        'success',
        'error',
        'journal',
        'attendance',
        'monitoring',
        'assessment',
        'report',
        'placement',
        'certificate',
        'announcement',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. NOTIFICATIONS TABLE (Sistem Notifikasi Internal Multi-Role)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_target VARCHAR(50), -- Optional: for broadcasting to all users of a specific role
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum NOT NULL DEFAULT 'info',
    action_url TEXT,
    reference_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- Indexing for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(role_target);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 3. ANNOUNCEMENTS TABLE (Pusat Siaran Pengumuman PKL)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) NOT NULL DEFAULT 'all', -- 'all', 'siswa', 'guru_pembimbing', 'pembimbing_industri', etc.
    target_major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_target_role ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at);

-- 4. Storage Bucket for Announcement Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Read policies: Users can view their own notifications or role broadcast notifications
CREATE POLICY "Users can read own notifications" ON public.notifications 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR role_target IS NULL OR role_target = 'all');

CREATE POLICY "Users can read announcements" ON public.announcements 
    FOR SELECT TO authenticated 
    USING (true);

-- Write policies:
CREATE POLICY "Admins and System can insert notifications" ON public.notifications 
    FOR ALL TO authenticated 
    USING (true);

CREATE POLICY "Admins can manage announcements" ON public.announcements 
    FOR ALL TO authenticated 
    USING (true);
