import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  principalName: string;
  principalNip: string;
  pokjaContact: string;
}

export interface GpsSettings {
  gpsRadiusMeters: number;
  checkInStartTime: string;
  checkInEndTime: string;
  checkOutStartTime: string;
  checkOutEndTime: string;
  journalDeadlineTime: string;
  requireSelfiePhoto: boolean;
}

export interface GradingSettings {
  industryWeight: number;
  teacherWeight: number;
  passingGrade: number;
  monitoringStagesTarget: number;
  certificatePrefix: string;
}

const SCHOOL_PROFILE_KEY = 'epkl_school_profile_v1';
const GPS_SETTINGS_KEY = 'epkl_gps_settings_v1';
const GRADING_SETTINGS_KEY = 'epkl_grading_settings_v1';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  schoolName: 'SMK NEGERI 13 BANDUNG',
  npsn: '20219149',
  address: 'Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu, Kota Bandung, Jawa Barat 40286',
  website: 'https://smkn13bdg.sch.id',
  phone: '(022) 7318960',
  email: 'info@smkn13bdg.sch.id',
  principalName: 'Drs. H. Dedi Indrayana, M.Pd.',
  principalNip: '196805121994031008',
  pokjaContact: '081223344556 (Ketua Hubin / Pokja PKL)',
};

export const DEFAULT_GPS_SETTINGS: GpsSettings = {
  gpsRadiusMeters: 100,
  checkInStartTime: '06:30',
  checkInEndTime: '08:00',
  checkOutStartTime: '16:00',
  checkOutEndTime: '18:00',
  journalDeadlineTime: '23:59',
  requireSelfiePhoto: true,
};

export const DEFAULT_GRADING_SETTINGS: GradingSettings = {
  industryWeight: 40,
  teacherWeight: 60,
  passingGrade: 75.0,
  monitoringStagesTarget: 3,
  certificatePrefix: 'PKL/SMKN13BDG',
};

export const settingsService = {
  /**
   * Get School Profile Settings
   */
  getSchoolProfile(): SchoolProfile {
    try {
      const saved = localStorage.getItem(SCHOOL_PROFILE_KEY);
      if (saved) {
        return { ...DEFAULT_SCHOOL_PROFILE, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SCHOOL_PROFILE;
  },

  /**
   * Save School Profile Settings
   */
  async saveSchoolProfile(profile: SchoolProfile): Promise<SchoolProfile> {
    try {
      localStorage.setItem(SCHOOL_PROFILE_KEY, JSON.stringify(profile));
    } catch {}
    return profile;
  },

  /**
   * Get GPS & Presensi Settings
   */
  getGpsSettings(): GpsSettings {
    try {
      const saved = localStorage.getItem(GPS_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_GPS_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_GPS_SETTINGS;
  },

  /**
   * Save GPS & Presensi Settings
   */
  async saveGpsSettings(settings: GpsSettings): Promise<GpsSettings> {
    try {
      localStorage.setItem(GPS_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
    return settings;
  },

  /**
   * Get Grading Settings
   */
  getGradingSettings(): GradingSettings {
    try {
      const saved = localStorage.getItem(GRADING_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_GRADING_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_GRADING_SETTINGS;
  },

  /**
   * Save Grading Settings
   */
  async saveGradingSettings(settings: GradingSettings): Promise<GradingSettings> {
    try {
      localStorage.setItem(GRADING_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
    return settings;
  },
};
