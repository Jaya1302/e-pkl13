import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// Demo profiles mirroring the Supabase seed database
const DEMO_USERS: Record<UserRole, UserProfile> = {
  super_admin: {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'superadmin@smkn13bdg.sch.id',
    name: 'Super Administrator (IT SMKN 13 Bandung)',
    role: 'super_admin',
    phone_number: '081234567890',
    is_active: true,
  },
  admin_pkl: {
    id: 'a2222222-2222-2222-2222-222222222222',
    email: 'hubin@smkn13bdg.sch.id',
    name: 'Koordinator Hubinmas & PKL',
    role: 'admin_pkl',
    phone_number: '081234567891',
    is_active: true,
  },
  kepala_sekolah: {
    id: 'demo-kepsek',
    email: 'kepsek@smkn13bdg.sch.id',
    name: 'Drs. H. Dedi Indrayana, M.Pd.',
    role: 'kepala_sekolah',
    phone_number: '081234567892',
    is_active: true,
  },
  wakasek: {
    id: 'demo-wakasek',
    email: 'wakasek.hubin@smkn13bdg.sch.id',
    name: 'Wakil Kepala Sekolah Bid. Hubinmas',
    role: 'wakasek',
    phone_number: '081234567893',
    is_active: true,
  },
  guru_pembimbing: {
    id: 'a3333333-3333-3333-3333-333333333333',
    email: 'guru.fauzi@smkn13bdg.sch.id',
    name: 'Ahmad Fauzi, S.Kom (Guru Pembimbing)',
    role: 'guru_pembimbing',
    phone_number: '081234567801',
    is_active: true,
  },
  siswa: {
    id: 'a5555555-5555-5555-5555-555555555555',
    email: 'siswa.rizky@smkn13bdg.sch.id',
    name: 'Muhammad Rizky Pratama',
    role: 'siswa',
    phone_number: '081234567890',
    is_active: true,
  },
  pembimbing_industri: {
    id: 'a4444444-4444-4444-4444-444444444444',
    email: 'mentor.telkom@smkn13bdg.sch.id',
    name: 'Hendri Gunawan (PT Telkom Indonesia)',
    role: 'pembimbing_industri',
    phone_number: '081299887766',
    is_active: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('epkl_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize and listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const session = await authService.getSession();
          if (session?.user && mounted) {
            const profile = await authService.getProfile(session.user.id);
            if (profile) {
              setUser(profile);
            }
          }
        }
      } catch (err) {
        console.warn('Supabase session init fallback:', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    initializeAuth();

    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await authService.getProfile(session.user.id);
        if (profile) {
          setUser(profile);
          localStorage.setItem('epkl_user_profile', JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        // Keep local user or clear depending on preference
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('epkl_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('epkl_user_profile');
    }
  }, [user]);

  const login = async (email: string, password?: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!password) {
        throw new Error('Harap masukkan kata sandi Anda.');
      }

      if (isSupabaseConfigured) {
        try {
          const res = await authService.signIn(cleanEmail, password);
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('epkl_user_profile', JSON.stringify(res.user));
            return;
          }
        } catch (authErr) {
          console.warn('Supabase auth attempt failed, falling back to local demo profile:', authErr);
        }
      }

      // Fallback jika offline / mode lokal / demo
      const matchedKey = (Object.keys(DEMO_USERS) as UserRole[]).find(
        (k) => DEMO_USERS[k].email.toLowerCase() === cleanEmail
      );
      
      let targetRole: UserRole | undefined = matchedKey || role;

      if (!targetRole) {
        if (cleanEmail.includes('superadmin') || cleanEmail.includes('admin')) {
          targetRole = 'super_admin';
        } else if (cleanEmail.includes('hubin')) {
          targetRole = 'admin_pkl';
        } else if (cleanEmail.includes('guru') || cleanEmail.includes('fauzi')) {
          targetRole = 'guru_pembimbing';
        } else if (cleanEmail.includes('mentor') || cleanEmail.includes('telkom')) {
          targetRole = 'pembimbing_industri';
        } else if (cleanEmail.includes('siswa') || cleanEmail.includes('rizky')) {
          targetRole = 'siswa';
        } else {
          targetRole = 'super_admin';
        }
      }

      const matchedDemo = DEMO_USERS[targetRole] || DEMO_USERS.super_admin;
      const newUser: UserProfile = {
        ...matchedDemo,
        email: cleanEmail,
      };
      setUser(newUser);
      localStorage.setItem('epkl_user_profile', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = useCallback((newRole: UserRole) => {
    const demo = DEMO_USERS[newRole];
    setUser(demo);
  }, []);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    if (isSupabaseConfigured) {
      await authService.upsertProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isInitializing,
        login,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
