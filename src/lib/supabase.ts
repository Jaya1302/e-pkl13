import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbdmjhnumdsmcldrmxgt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZG1qaG51bWRzbWNsZHJteGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NTU2MDcsImV4cCI6MjEwNTUzMTYwN30.E_xeWtCt5HEPf1YmNExogmeYIYU1GJsjXzXYa1Xzyic';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

// Jika remote Supabase belum dimigrasi (mengembalikan 400/404 pada tabel E-PKL),
// aplikasi menggunakan data lokal high-fidelity agar tidak membanjiri console dengan error 400/404.
// Untuk mengaktifkan mode live remote Supabase, set VITE_USE_LIVE_SUPABASE=true di .env setelah menjalankan skema SQL.
export const isSupabaseConfigured =
  import.meta.env.VITE_USE_LIVE_SUPABASE !== 'false' &&
  Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey !== 'your-supabase-anon-key'
  );

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://demo-epkl.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(safeUrl, safeKey);
