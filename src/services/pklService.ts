import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PklPeriod, PklPlacement, PlacementStatus } from '../types';
import { masterService } from './masterService';

// Initial Mock Seed Data for Periods and Placements
const INITIAL_PERIODS: PklPeriod[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Gelombang 1 — Ganjil 2026/2027',
    academic_year: '2026/2027',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    is_active: true,
    description: 'Pelaksanaan Praktik Kerja Lapangan 3 Bulan Gelombang Pertama',
  },
  {
    id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Gelombang 2 — Genap 2026/2027',
    academic_year: '2026/2027',
    start_date: '2027-01-10',
    end_date: '2027-04-10',
    is_active: false,
    description: 'Pelaksanaan Praktik Kerja Lapangan 3 Bulan Gelombang Kedua',
  },
];

const INITIAL_PLACEMENTS: PklPlacement[] = [
  {
    id: 'p-1',
    period_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    student_id: 's-1',
    dudi_id: 'd-2',
    teacher_id: 't-1',
    industry_mentor_id: 'm-2',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Network Operations & FTTH Access',
    status: 'aktif',
    notes: 'Penempatan di kantor Witel Karawang Barat',
  },
  {
    id: 'p-2',
    period_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    student_id: 's-2',
    dudi_id: 'd-2',
    teacher_id: 't-1',
    industry_mentor_id: 'm-2',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Data Center & Server Support',
    status: 'aktif',
    notes: 'Shift Pagi (08.00 - 16.00 WIB)',
  },
  {
    id: 'p-3',
    period_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    student_id: 's-3',
    dudi_id: 'd-1',
    teacher_id: 't-2',
    industry_mentor_id: 'm-1',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Maintenance & Assembly Line',
    status: 'aktif',
    notes: 'Kawasan KIIC Karawang Barat',
  },
  {
    id: 'p-4',
    period_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    student_id: 's-5',
    dudi_id: 'd-5',
    teacher_id: 't-5',
    industry_mentor_id: null,
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Quality Control Pengolahan Pangan',
    status: 'aktif',
    notes: 'Pabrik Kosambi Klari',
  },
];

export const pklService = {
  // ==========================================================================
  // PERIODE PKL
  // ==========================================================================
  async getPeriods(): Promise<PklPeriod[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pkl_periods')
          .select('*')
          .order('start_date', { ascending: false });
        if (!error && data) return data as PklPeriod[];
      } catch (err) {
        console.warn('Supabase getPeriods fallback:', err);
      }
    }
    return INITIAL_PERIODS;
  },

  async createPeriod(period: Omit<PklPeriod, 'id'>): Promise<PklPeriod> {
    if (new Date(period.end_date) < new Date(period.start_date)) {
      throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
    }

    if (isSupabaseConfigured) {
      try {
        if (period.is_active) {
          await supabase.from('pkl_periods').update({ is_active: false }).neq('id', 'dummy');
        }
        const { data, error } = await supabase.from('pkl_periods').insert(period).select().single();
        if (!error && data) return data as PklPeriod;
      } catch (err) {
        console.warn('Supabase createPeriod fallback:', err);
      }
    }

    if (period.is_active) {
      INITIAL_PERIODS.forEach((p) => (p.is_active = false));
    }
    const newPeriod = { id: `p-${Date.now()}`, ...period };
    INITIAL_PERIODS.unshift(newPeriod);
    return newPeriod;
  },

  async updatePeriod(id: string, period: Partial<PklPeriod>): Promise<PklPeriod> {
    if (period.start_date && period.end_date && new Date(period.end_date) < new Date(period.start_date)) {
      throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
    }

    if (isSupabaseConfigured) {
      try {
        if (period.is_active) {
          await supabase.from('pkl_periods').update({ is_active: false }).neq('id', id);
        }
        const { data, error } = await supabase.from('pkl_periods').update(period).eq('id', id).select().single();
        if (!error && data) return data as PklPeriod;
      } catch (err) {
        console.warn('Supabase updatePeriod fallback:', err);
      }
    }

    const idx = INITIAL_PERIODS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      if (period.is_active) {
        INITIAL_PERIODS.forEach((p) => (p.is_active = false));
      }
      INITIAL_PERIODS[idx] = { ...INITIAL_PERIODS[idx], ...period };
      return INITIAL_PERIODS[idx];
    }
    throw new Error('Periode PKL tidak ditemukan.');
  },

  async deletePeriod(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('pkl_periods').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletePeriod fallback:', err);
      }
    }
    const idx = INITIAL_PERIODS.findIndex((p) => p.id === id);
    if (idx !== -1) INITIAL_PERIODS.splice(idx, 1);
  },

  // ==========================================================================
  // PENEMPATAN SISWA PKL
  // ==========================================================================
  async getPlacements(): Promise<PklPlacement[]> {
    const [periods, students, dudiList, teachers, mentors] = await Promise.all([
      this.getPeriods(),
      masterService.getStudents(),
      masterService.getDudi(),
      masterService.getTeachers(),
      masterService.getMentors(),
    ]);

    let rawList: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: dbData, error: dbErr } = await supabase
          .from('pkl_placements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!dbErr && dbData) {
          rawList = [...dbData];
        }

        // Auto-heal / Auto-sync: Find any students in students list who have pkl_status === 'sedang_pkl' but no placement record
        const placedStudents = students.filter((s) => s.pkl_status === 'sedang_pkl');
        const existingStudentIds = new Set(rawList.map((p) => p.student_id));
        const missingStudents = placedStudents.filter((s) => !existingStudentIds.has(s.id));

        if (missingStudents.length > 0) {
          const activePeriod = periods.find((p) => p.is_active) || periods[0];
          const defaultDudi = dudiList[0];
          const defaultTeacher = teachers[0];

          if (activePeriod && defaultDudi && defaultTeacher) {
            for (const s of missingStudents) {
              const newPlacementRow = {
                period_id: activePeriod.id,
                student_id: s.id,
                dudi_id: defaultDudi.id,
                teacher_id: defaultTeacher.id,
                start_date: activePeriod.start_date || '2026-07-15',
                end_date: activePeriod.end_date || '2026-10-15',
                division: 'Praktik Industri',
                status: 'aktif' as PlacementStatus,
                notes: 'Penempatan otomatis dari sinkronisasi data siswa',
              };

              try {
                const { data: inserted, error: insErr } = await supabase
                  .from('pkl_placements')
                  .insert([newPlacementRow])
                  .select('*')
                  .single();

                if (!insErr && inserted) {
                  rawList.unshift(inserted);
                } else {
                  rawList.unshift({ id: `p-auto-${Date.now()}-${s.id}`, ...newPlacementRow });
                }
              } catch {
                rawList.unshift({ id: `p-auto-${Date.now()}-${s.id}`, ...newPlacementRow });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase getPlacements error:', err);
      }
    }

    if (rawList.length === 0) {
      rawList = INITIAL_PLACEMENTS;
    }

    // Enrich with joined models
    return rawList.map((p) => ({
      id: p.id,
      period_id: p.period_id,
      student_id: p.student_id,
      dudi_id: p.dudi_id,
      teacher_id: p.teacher_id,
      industry_mentor_id: p.industry_mentor_id || null,
      start_date: p.start_date,
      end_date: p.end_date,
      division: p.division,
      status: p.status,
      notes: p.notes,
      period: periods.find((per) => per.id === p.period_id) || null,
      student: students.find((s) => s.id === p.student_id) || null,
      dudi: dudiList.find((d) => d.id === p.dudi_id) || null,
      teacher: teachers.find((t) => t.id === p.teacher_id) || null,
      industry_mentor: mentors.find((m) => m.id === p.industry_mentor_id) || null,
    }));
  },

  async createPlacement(placement: Omit<PklPlacement, 'id'>): Promise<PklPlacement> {
    // 1. Validate dates
    if (new Date(placement.end_date) < new Date(placement.start_date)) {
      throw new Error('Tanggal selesai PKL tidak boleh lebih awal dari tanggal mulai.');
    }

    // 2. Validate student uniqueness in period
    const existing = INITIAL_PLACEMENTS.find(
      (p) => p.student_id === placement.student_id && p.period_id === placement.period_id
    );
    if (existing) {
      throw new Error('Siswa ini sudah memiliki penempatan aktif pada periode yang dipilih.');
    }

    // 3. Validate DUDI quota
    const dudiPlacements = INITIAL_PLACEMENTS.filter(
      (p) => p.dudi_id === placement.dudi_id && p.period_id === placement.period_id && p.status !== 'dibatalkan'
    );
    const dudiList = await masterService.getDudi();
    const targetDudi = dudiList.find((d) => d.id === placement.dudi_id);
    if (targetDudi && dudiPlacements.length >= targetDudi.quota) {
      throw new Error(`Kuota untuk DUDI ${targetDudi.name} sudah penuh (${targetDudi.quota} siswa).`);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pkl_placements')
          .insert(placement)
          .select(`
            *,
            period:pkl_periods(*),
            student:students(*, class:classes(*, major:majors(*))),
            dudi:dudi(*),
            teacher:teachers(*),
            industry_mentor:industry_mentors(*)
          `)
          .single();
        if (!error && data) {
          // Update student pkl status
          await supabase.from('students').update({ pkl_status: 'sedang_pkl' }).eq('id', placement.student_id);
          return data as PklPlacement;
        }
      } catch (err: any) {
        throw new Error(err.message || 'Gagal menyimpan penempatan ke database');
      }
    }

    const newPlacement = { id: `p-${Date.now()}`, ...placement };
    INITIAL_PLACEMENTS.unshift(newPlacement);

    // Update mock student status
    await masterService.updateStudent(placement.student_id, {
      pkl_status: placement.status === 'aktif' ? 'sedang_pkl' : 'proses_penempatan',
    });

    const [students, teachers, mentors] = await Promise.all([
      masterService.getStudents(),
      masterService.getTeachers(),
      masterService.getMentors(),
    ]);

    return {
      ...newPlacement,
      period: INITIAL_PERIODS.find((per) => per.id === newPlacement.period_id) || null,
      student: students.find((s) => s.id === newPlacement.student_id) || null,
      dudi: dudiList.find((d) => d.id === newPlacement.dudi_id) || null,
      teacher: teachers.find((t) => t.id === newPlacement.teacher_id) || null,
      industry_mentor: mentors.find((m) => m.id === newPlacement.industry_mentor_id) || null,
    };
  },

  async updatePlacement(id: string, placement: Partial<PklPlacement>): Promise<PklPlacement> {
    if (placement.start_date && placement.end_date && new Date(placement.end_date) < new Date(placement.start_date)) {
      throw new Error('Tanggal selesai PKL tidak boleh lebih awal dari tanggal mulai.');
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pkl_placements')
          .update(placement)
          .eq('id', id)
          .select(`
            *,
            period:pkl_periods(*),
            student:students(*, class:classes(*, major:majors(*))),
            dudi:dudi(*),
            teacher:teachers(*),
            industry_mentor:industry_mentors(*)
          `)
          .single();
        if (!error && data) return data as PklPlacement;
      } catch (err: any) {
        throw new Error(err.message || 'Gagal memperbarui data penempatan.');
      }
    }

    const idx = INITIAL_PLACEMENTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      INITIAL_PLACEMENTS[idx] = { ...INITIAL_PLACEMENTS[idx], ...placement };
      const [students, dudiList, teachers, mentors] = await Promise.all([
        masterService.getStudents(),
        masterService.getDudi(),
        masterService.getTeachers(),
        masterService.getMentors(),
      ]);
      return {
        ...INITIAL_PLACEMENTS[idx],
        period: INITIAL_PERIODS.find((per) => per.id === INITIAL_PLACEMENTS[idx].period_id) || null,
        student: students.find((s) => s.id === INITIAL_PLACEMENTS[idx].student_id) || null,
        dudi: dudiList.find((d) => d.id === INITIAL_PLACEMENTS[idx].dudi_id) || null,
        teacher: teachers.find((t) => t.id === INITIAL_PLACEMENTS[idx].teacher_id) || null,
        industry_mentor: mentors.find((m) => m.id === INITIAL_PLACEMENTS[idx].industry_mentor_id) || null,
      };
    }
    throw new Error('Penempatan tidak ditemukan.');
  },

  async deletePlacement(id: string): Promise<void> {
    const target = INITIAL_PLACEMENTS.find((p) => p.id === id);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('pkl_placements').delete().eq('id', id);
        if (target) {
          await supabase.from('students').update({ pkl_status: 'belum_ditempatkan' }).eq('id', target.student_id);
        }
      } catch (err) {
        console.warn('Supabase deletePlacement fallback:', err);
      }
    }
    const idx = INITIAL_PLACEMENTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const removed = INITIAL_PLACEMENTS.splice(idx, 1)[0];
      await masterService.updateStudent(removed.student_id, { pkl_status: 'belum_ditempatkan' });
    }
  },

  /**
   * Bulk Assignment: Assign multiple students to a DUDI, Teacher & Period at once
   */
  async bulkAssignPlacements(params: {
    studentIds: string[];
    periodId: string;
    dudiId: string;
    teacherId: string;
    industryMentorId?: string;
    startDate: string;
    endDate: string;
    division?: string;
  }): Promise<{ successCount: number; errors: string[] }> {
    let successCount = 0;
    const errors: string[] = [];

    for (const studentId of params.studentIds) {
      try {
        await this.createPlacement({
          period_id: params.periodId,
          student_id: studentId,
          dudi_id: params.dudiId,
          teacher_id: params.teacherId,
          industry_mentor_id: params.industryMentorId || null,
          start_date: params.startDate,
          end_date: params.endDate,
          division: params.division || 'Peserta PKL',
          status: 'aktif',
          notes: 'Penugasan massal (Bulk Assignment)',
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Siswa ID ${studentId}: ${err.message}`);
      }
    }

    return { successCount, errors };
  },

  /**
   * Get dynamic PKL Placement Summary Statistics for Dashboard
   */
  async getPlacementSummary() {
    const [students, placements] = await Promise.all([
      masterService.getStudents(),
      this.getPlacements(),
    ]);

    const totalStudents = students.length;
    const placedCount = students.filter((s) => s.pkl_status !== 'belum_ditempatkan').length;
    const unplacedCount = totalStudents - placedCount;
    const activePkl = placements.filter((p) => p.status === 'aktif').length;
    const completedPkl = placements.filter((p) => p.status === 'selesai').length;

    return {
      totalStudents,
      placedCount,
      unplacedCount,
      activePkl,
      completedPkl,
    };
  },
};
