import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { calculateDistanceMeters } from '../utils/geoUtils';
import { masterService } from './masterService';
import { pklService } from './pklService';

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    placement_id: 'p-1',
    student_id: 's-1',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '07:28:15',
    check_out_time: null,
    status: 'hadir',
    latitude: -6.3051,
    longitude: 107.2995,
    distance_meters: 45,
    is_gps_valid: true,
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    notes: 'Presensi masuk di kantor Telkom Karawang',
  },
  {
    id: 'att-2',
    placement_id: 'p-2',
    student_id: 's-2',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '07:35:10',
    check_out_time: null,
    status: 'hadir',
    latitude: -6.3053,
    longitude: 107.2992,
    distance_meters: 60,
    is_gps_valid: true,
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
    notes: 'Presensi shift pagi',
  },
  {
    id: 'att-3',
    placement_id: 'p-3',
    student_id: 's-3',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '07:15:00',
    check_out_time: '16:05:22',
    status: 'hadir',
    latitude: -6.3562,
    longitude: 107.2798,
    distance_meters: 80,
    is_gps_valid: true,
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
    notes: 'Lembur 30 menit perbaikan mesin line 2',
  },
];

export const attendanceService = {
  async getAttendanceRecords(filter?: {
    date?: string;
    studentId?: string;
    placementId?: string;
  }): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('attendance')
          .select(`
            *,
            placement:pkl_placements(*, dudi:dudi(*), teacher:teachers(*)),
            student:students(*, class:classes(*))
          `)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (filter?.date) query = query.eq('date', filter.date);
        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.placementId) query = query.eq('placement_id', filter.placementId);

        const { data, error } = await query;
        if (!error && data) return data as AttendanceRecord[];
      } catch (err) {
        console.warn('Supabase getAttendanceRecords fallback:', err);
      }
    }

    const [students, placements] = await Promise.all([
      masterService.getStudents(),
      pklService.getPlacements(),
    ]);

    let filtered = [...INITIAL_ATTENDANCE];
    if (filter?.date) filtered = filtered.filter((a) => a.date === filter.date);
    if (filter?.studentId) filtered = filtered.filter((a) => a.student_id === filter.studentId);
    if (filter?.placementId) filtered = filtered.filter((a) => a.placement_id === filter.placementId);

    return filtered.map((a) => ({
      ...a,
      student: students.find((s) => s.id === a.student_id) || null,
      placement: placements.find((p) => p.id === a.placement_id) || null,
    }));
  },

  async getTodayAttendance(studentId: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const records = await this.getAttendanceRecords({ date: today, studentId });
    return records.length > 0 ? records[0] : null;
  },

  async checkIn(params: {
    placement_id: string;
    student_id: string;
    latitude?: number;
    longitude?: number;
    photo_url?: string;
    notes?: string;
    isGpsEnforced?: boolean;
  }): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getTodayAttendance(params.student_id);
    if (existing) {
      throw new Error('Anda sudah melakukan presensi hari ini.');
    }

    const nowTime = new Date().toTimeString().split(' ')[0]; // HH:mm:ss

    // GPS Geofence validation
    let isGpsValid = true;
    let distanceMeters = 0;

    if (params.latitude && params.longitude) {
      const placements = await pklService.getPlacements();
      const pl = placements.find((p) => p.id === params.placement_id);
      if (pl && pl.dudi && pl.dudi.latitude && pl.dudi.longitude) {
        distanceMeters = calculateDistanceMeters(
          params.latitude,
          params.longitude,
          pl.dudi.latitude,
          pl.dudi.longitude
        );

        if (params.isGpsEnforced && distanceMeters > pl.dudi.radius_meters) {
          throw new Error(
            `Posisi Anda berada di luar radius kantor (${distanceMeters}m dari batas ${pl.dudi.radius_meters}m). Pastikan Anda berada di lokasi DUDI.`
          );
        }
        isGpsValid = distanceMeters <= pl.dudi.radius_meters;
      }
    }

    if (isSupabaseConfigured) {
      try {
        const payload = {
          placement_id: params.placement_id,
          student_id: params.student_id,
          date: today,
          check_in_time: nowTime,
          status: 'hadir',
          latitude: params.latitude || null,
          longitude: params.longitude || null,
          distance_meters: distanceMeters,
          is_gps_valid: isGpsValid,
          photo_url: params.photo_url || null,
          notes: params.notes || null,
        };
        const { data, error } = await supabase.from('attendance').insert(payload).select().single();
        if (!error && data) return data as AttendanceRecord;
        if (error) console.warn('Supabase attendance insert error:', error.message);
      } catch (err: any) {
        console.warn('Supabase checkIn error:', err);
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      placement_id: params.placement_id,
      student_id: params.student_id,
      date: today,
      check_in_time: nowTime,
      check_out_time: null,
      status: 'hadir',
      latitude: params.latitude || null,
      longitude: params.longitude || null,
      distance_meters: distanceMeters,
      is_gps_valid: isGpsValid,
      photo_url: params.photo_url || null,
      notes: params.notes || null,
    };

    INITIAL_ATTENDANCE.unshift(newRecord);
    return newRecord;
  },

  async checkOut(attendanceId: string, notes?: string): Promise<AttendanceRecord> {
    const nowTime = new Date().toTimeString().split(' ')[0];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update({ check_out_time: nowTime, notes: notes || undefined, updated_at: new Date().toISOString() })
          .eq('id', attendanceId)
          .select()
          .single();
        if (!error && data) return data as AttendanceRecord;
      } catch (err) {
        console.warn('Supabase checkOut error:', err);
      }
    }

    const idx = INITIAL_ATTENDANCE.findIndex((a) => a.id === attendanceId);
    if (idx !== -1) {
      INITIAL_ATTENDANCE[idx].check_out_time = nowTime;
      if (notes) INITIAL_ATTENDANCE[idx].notes = notes;
      return INITIAL_ATTENDANCE[idx];
    }
    throw new Error('Data presensi tidak ditemukan.');
  },

  async submitLeave(params: {
    placement_id: string;
    student_id: string;
    status: 'izin' | 'sakit';
    notes: string;
    photo_url?: string;
  }): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getTodayAttendance(params.student_id);
    if (existing) {
      throw new Error('Anda sudah melakukan pengajuan kehadiran/izin untuk hari ini.');
    }

    if (isSupabaseConfigured) {
      try {
        const payload = {
          placement_id: params.placement_id,
          student_id: params.student_id,
          date: today,
          check_in_time: null,
          check_out_time: null,
          status: params.status,
          is_gps_valid: true,
          photo_url: params.photo_url || null,
          notes: params.notes,
        };
        const { data, error } = await supabase.from('attendance').insert(payload).select().single();
        if (!error && data) return data as AttendanceRecord;
        if (error) console.warn('Supabase submitLeave error:', error.message);
      } catch (err) {
        console.warn('Supabase submitLeave error:', err);
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      placement_id: params.placement_id,
      student_id: params.student_id,
      date: today,
      check_in_time: null,
      check_out_time: null,
      status: params.status,
      is_gps_valid: true,
      photo_url: params.photo_url || null,
      notes: params.notes,
    };

    INITIAL_ATTENDANCE.unshift(newRecord);
    return newRecord;
  },

  async uploadPhoto(file: File, bucket = 'attendance-photos'): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (!uploadError) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
          return data.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase photo upload error, fallback to data URI:', err);
      }
    }

    // Fallback convert to base64 Data URI for offline development
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
