import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  MonitoringRecord,
  MonitoringRating,
  StudentMonitoringSummary,
  MonitoringFilter,
  PklPlacement,
  Student,
  Teacher,
  Dudi
} from '../types';
import { pklService } from './pklService';
import { masterService } from './masterService';

const MONITORING_STORAGE_KEY = 'epkl_monitoring_records_v1';
const STAGE_TARGET_STORAGE_KEY = 'epkl_monitoring_target_stages';

const INITIAL_MONITORING: MonitoringRecord[] = [
  {
    id: 'mon-1',
    placement_id: 'p-1',
    student_id: 's-1',
    teacher_id: 't-1',
    dudi_id: 'd-1',
    monitoring_stage: 1,
    visit_date: '2026-08-05',
    attendance_score: 5,
    discipline_score: 5,
    attitude_score: 5,
    competency_score: 4,
    communication_score: 4,
    overall_rating: 'sangat_baik',
    student_condition: 'Kondisi fisik dan mental sangat prima. Siswa antusias dan telah beradaptasi dengan baik di divisi Fiber Optic PT Telkom.',
    industry_feedback: 'Siswa cepat memahami SOP keselamatan kerja (K3) dan rajin mencatat instruksi dari mentor lapangan.',
    obstacles: 'Awalnya sedikit canggung saat berkomunikasi dengan teknisi senior, namun sekarang sudah membaur lancar.',
    recommendation: 'Lanjutkan penguasaan alat precision cleaver dan OTDR pada sesi monitoring berikutnya.',
    documentation_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-05T10:30:00.000Z',
    updated_at: '2026-08-05T10:30:00.000Z',
  },
  {
    id: 'mon-2',
    placement_id: 'p-1',
    student_id: 's-1',
    teacher_id: 't-1',
    dudi_id: 'd-1',
    monitoring_stage: 2,
    visit_date: '2026-08-18',
    attendance_score: 5,
    discipline_score: 5,
    attitude_score: 5,
    competency_score: 5,
    communication_score: 5,
    overall_rating: 'sangat_baik',
    student_condition: 'Sangat mandiri dan telah dipercaya memimpin tim kecil penarikan kabel drop core.',
    industry_feedback: 'Kinerja Ahmad Fauzi sangat memuaskan, bahkan perusahaan mempertimbangkan untuk rekrutmen pasca lulus.',
    obstacles: 'Tidak ada kendala berarti.',
    recommendation: 'Mulai mendokumentasikan bab 3 dan 4 laporan PKL secara bertahap.',
    documentation_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-18T11:00:00.000Z',
    updated_at: '2026-08-18T11:00:00.000Z',
  },
  {
    id: 'mon-3',
    placement_id: 'p-2',
    student_id: 's-2',
    teacher_id: 't-1',
    dudi_id: 'd-2',
    monitoring_stage: 1,
    visit_date: '2026-08-10',
    attendance_score: 4,
    discipline_score: 4,
    attitude_score: 4,
    competency_score: 4,
    communication_score: 4,
    overall_rating: 'baik',
    student_condition: 'Sehat walafiat, aktif di lab server dan router PT Astra Honda Motor.',
    industry_feedback: 'Siti Nurhaliza memiliki ketelitian yang tinggi dalam merapikan kabel rack server data center.',
    obstacles: 'Jarak tempuh dari rumah ke lokasi DUDI cukup jauh (18 km), namun selalu hadir tepat waktu.',
    recommendation: 'Jaga stamina dan tetap konsisten dengan pencatatan jurnal harian.',
    documentation_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-10T14:15:00.000Z',
    updated_at: '2026-08-10T14:15:00.000Z',
  },
  {
    id: 'mon-4',
    placement_id: 'p-3',
    student_id: 's-3',
    teacher_id: 't-2',
    dudi_id: 'd-3',
    monitoring_stage: 1,
    visit_date: '2026-08-12',
    attendance_score: 4,
    discipline_score: 3,
    attitude_score: 4,
    competency_score: 3,
    communication_score: 3,
    overall_rating: 'cukup',
    student_condition: 'Kondisi baik, sedang proses adaptasi mesin bubut manual ke CNC 3-axis di bengkel PT Pindad.',
    industry_feedback: 'Perlu lebih percaya diri saat membaca gambar teknik dan toleransi dimensi milimeter.',
    obstacles: 'Sempat terlambat 1 kali karena masalah kendaraan bermotor.',
    recommendation: 'Guru pembimbing memberikan penguatan materi pembacaan gambar kerja CAD/CAM setiap akhir pekan.',
    documentation_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    created_at: '2026-08-12T09:45:00.000Z',
    updated_at: '2026-08-12T09:45:00.000Z',
  },
];

const getLocalMonitoring = (): MonitoringRecord[] => {
  const saved = localStorage.getItem(MONITORING_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(MONITORING_STORAGE_KEY, JSON.stringify(INITIAL_MONITORING));
  return INITIAL_MONITORING;
};

const saveLocalMonitoring = (records: MonitoringRecord[]) => {
  localStorage.setItem(MONITORING_STORAGE_KEY, JSON.stringify(records));
};

export const monitoringService = {
  // Target tahap monitoring (configurable)
  getTargetStages(): number {
    const saved = localStorage.getItem(STAGE_TARGET_STORAGE_KEY);
    return saved ? parseInt(saved, 10) || 3 : 3;
  },

  setTargetStages(count: number): void {
    const validCount = Math.max(1, Math.min(10, count));
    localStorage.setItem(STAGE_TARGET_STORAGE_KEY, validCount.toString());
  },

  // Calculate rating helper
  calculateRating(scores: {
    attendance_score: number;
    discipline_score: number;
    attitude_score: number;
    competency_score: number;
    communication_score: number;
  }): MonitoringRating {
    const avg =
      (scores.attendance_score +
        scores.discipline_score +
        scores.attitude_score +
        scores.competency_score +
        scores.communication_score) /
      5;

    if (avg >= 4.5) return 'sangat_baik';
    if (avg >= 3.5) return 'baik';
    if (avg >= 2.5) return 'cukup';
    return 'perlu_bimbingan';
  },

  // Get all monitoring records (alias)
  async getMonitoringRecords(filter?: MonitoringFilter): Promise<MonitoringRecord[]> {
    return this.getMonitoringList(filter);
  },

  // Get all monitoring records with relations
  async getMonitoringList(filter?: MonitoringFilter): Promise<MonitoringRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('monitoring')
          .select(`
            *,
            placement:pkl_placements(*),
            student:students(*, class:classes(*)),
            teacher:teachers(*),
            dudi:dudi(*)
          `)
          .order('visit_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (filter?.teacherId) query = query.eq('teacher_id', filter.teacherId);
        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.dudiId) query = query.eq('dudi_id', filter.dudiId);
        if (filter?.stage) query = query.eq('monitoring_stage', filter.stage);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as MonitoringRecord[];
        }
      } catch (err) {
        console.warn('Supabase getMonitoringList fallback to local:', err);
      }
    }

    // Fallback Mock with hydrated relations
    const [students, teachers, dudiList, placements] = await Promise.all([
      masterService.getStudents(),
      masterService.getTeachers(),
      masterService.getDudi(),
      pklService.getPlacements(),
    ]);

    let list = getLocalMonitoring().map((m) => {
      const student = students.find((s) => s.id === m.student_id) || null;
      const teacher = teachers.find((t) => t.id === m.teacher_id) || null;
      const dudi = dudiList.find((d) => d.id === m.dudi_id) || null;
      const placement = placements.find((p) => p.id === m.placement_id) || null;
      return {
        ...m,
        student,
        teacher,
        dudi,
        placement,
      };
    });

    if (filter?.teacherId) {
      list = list.filter((m) => m.teacher_id === filter.teacherId);
    }
    if (filter?.studentId) {
      list = list.filter((m) => m.student_id === filter.studentId);
    }
    if (filter?.dudiId) {
      list = list.filter((m) => m.dudi_id === filter.dudiId);
    }
    if (filter?.stage) {
      list = list.filter((m) => m.monitoring_stage === filter.stage);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.student?.name?.toLowerCase().includes(q) ||
          m.student?.nis?.toLowerCase().includes(q) ||
          m.teacher?.name?.toLowerCase().includes(q) ||
          m.dudi?.name?.toLowerCase().includes(q) ||
          m.student_condition?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  },

  async getMonitoringById(id: string): Promise<MonitoringRecord | null> {
    const list = await this.getMonitoringList();
    return list.find((m) => m.id === id) || null;
  },

  async createMonitoring(
    data: Omit<MonitoringRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MonitoringRecord> {
    const overall_rating = data.overall_rating || this.calculateRating(data);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          placement_id: data.placement_id,
          student_id: data.student_id,
          teacher_id: data.teacher_id,
          dudi_id: data.dudi_id,
          monitoring_stage: data.monitoring_stage,
          visit_date: data.visit_date,
          attendance_score: data.attendance_score,
          discipline_score: data.discipline_score,
          attitude_score: data.attitude_score,
          competency_score: data.competency_score,
          communication_score: data.communication_score,
          overall_rating,
          student_condition: data.student_condition || null,
          industry_feedback: data.industry_feedback || null,
          obstacles: data.obstacles || null,
          recommendation: data.recommendation || null,
          documentation_url: data.documentation_url || null,
        };

        const { data: created, error } = await supabase
          .from('monitoring')
          .insert([payload])
          .select(`
            *,
            placement:pkl_placements(*),
            student:students(*, class:classes(*)),
            teacher:teachers(*),
            dudi:dudi(*)
          `)
          .single();

        if (!error && created) {
          return created as MonitoringRecord;
        }
      } catch (err) {
        console.warn('Supabase createMonitoring fallback to local:', err);
      }
    }

    const current = getLocalMonitoring();
    const newRecord: MonitoringRecord = {
      ...data,
      id: `mon-${Date.now()}`,
      overall_rating,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalMonitoring([newRecord, ...current]);
    const hyd = await this.getMonitoringById(newRecord.id);
    return hyd || newRecord;
  },

  async updateMonitoring(id: string, data: Partial<MonitoringRecord>): Promise<MonitoringRecord> {
    if (isSupabaseConfigured) {
      try {
        const { data: updated, error } = await supabase
          .from('monitoring')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select(`
            *,
            placement:pkl_placements(*),
            student:students(*, class:classes(*)),
            teacher:teachers(*),
            dudi:dudi(*)
          `)
          .single();

        if (!error && updated) {
          return updated as MonitoringRecord;
        }
      } catch (err) {
        console.warn('Supabase updateMonitoring fallback to local:', err);
      }
    }

    const current = getLocalMonitoring();
    const index = current.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Data monitoring tidak ditemukan');

    const mergedScores = {
      attendance_score: data.attendance_score ?? current[index].attendance_score,
      discipline_score: data.discipline_score ?? current[index].discipline_score,
      attitude_score: data.attitude_score ?? current[index].attitude_score,
      competency_score: data.competency_score ?? current[index].competency_score,
      communication_score: data.communication_score ?? current[index].communication_score,
    };

    const overall_rating = data.overall_rating || this.calculateRating(mergedScores);

    const updatedRecord: MonitoringRecord = {
      ...current[index],
      ...data,
      ...mergedScores,
      overall_rating,
      updated_at: new Date().toISOString(),
    };

    current[index] = updatedRecord;
    saveLocalMonitoring(current);

    const hyd = await this.getMonitoringById(id);
    return hyd || updatedRecord;
  },

  async deleteMonitoring(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('monitoring').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteMonitoring fallback to local:', err);
      }
    }

    const current = getLocalMonitoring();
    const filtered = current.filter((m) => m.id !== id);
    saveLocalMonitoring(filtered);
    return true;
  },

  // Upload Photo to Supabase Storage or Local DataURL
  async uploadDocumentationPhoto(file: File): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `monitoring_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `documentation/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('monitoring-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('monitoring-documents').getPublicUrl(filePath);
          return data.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage upload fallback:', err);
      }
    }

    // Fallback Data URL conversion for seamless offline/mock use
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Aggregation of Student Monitoring Summaries
  async getStudentMonitoringSummaries(filter?: {
    teacherId?: string;
    periodId?: string;
    majorId?: string;
    search?: string;
  }): Promise<StudentMonitoringSummary[]> {
    const targetStages = this.getTargetStages();
    const [placements, monitoringList] = await Promise.all([
      pklService.getPlacements(filter?.periodId ? { periodId: filter.periodId } : undefined),
      this.getMonitoringList(),
    ]);

    // Placements with active / enrolled status
    let validPlacements = placements.filter((p) => p.status === 'aktif' || p.status === 'belum_mulai');

    if (filter?.teacherId) {
      validPlacements = validPlacements.filter((p) => p.teacher_id === filter.teacherId);
    }
    if (filter?.majorId) {
      validPlacements = validPlacements.filter((p) => p.student?.major_id === filter.majorId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      validPlacements = validPlacements.filter(
        (p) =>
          p.student?.name?.toLowerCase().includes(q) ||
          p.student?.nis?.toLowerCase().includes(q) ||
          p.dudi?.name?.toLowerCase().includes(q) ||
          p.teacher?.name?.toLowerCase().includes(q)
      );
    }

    const summaries: StudentMonitoringSummary[] = validPlacements.map((placement) => {
      const studentRecords = monitoringList
        .filter((m) => m.placement_id === placement.id || m.student_id === placement.student_id)
        .sort((a, b) => a.monitoring_stage - b.monitoring_stage);

      const completedStages = Array.from(new Set(studentRecords.map((m) => m.monitoring_stage)));

      const lastVisit =
        studentRecords.length > 0
          ? studentRecords.reduce((latest, curr) =>
              new Date(curr.visit_date) > new Date(latest.visit_date) ? curr : latest
            ).visit_date
          : null;

      let averageScore: number | null = null;
      if (studentRecords.length > 0) {
        const totalScore = studentRecords.reduce(
          (sum, r) =>
            sum +
            (r.attendance_score +
              r.discipline_score +
              r.attitude_score +
              r.competency_score +
              r.communication_score) /
              5,
          0
        );
        averageScore = parseFloat((totalScore / studentRecords.length).toFixed(1));
      }

      return {
        placement,
        student: placement.student as Student,
        dudi: placement.dudi as Dudi,
        teacher: placement.teacher as Teacher,
        completedStages,
        records: studentRecords,
        targetStages,
        isFullyMonitored: completedStages.length >= targetStages,
        lastVisitDate: lastVisit,
        averageScore,
      };
    });

    return summaries;
  },

  // Calculate Overall System Monitoring Statistics
  async getMonitoringStats(teacherId?: string) {
    const targetStages = this.getTargetStages();
    const summaries = await this.getStudentMonitoringSummaries(
      teacherId ? { teacherId } : undefined
    );
    const monitoringList = await this.getMonitoringList(
      teacherId ? { teacherId } : undefined
    );

    const totalStudents = summaries.length;
    const fullyMonitored = summaries.filter((s) => s.isFullyMonitored).length;
    const partiallyMonitored = summaries.filter(
      (s) => s.completedStages.length > 0 && !s.isFullyMonitored
    ).length;
    const unmonitored = summaries.filter((s) => s.completedStages.length === 0).length;

    let avgScore = 0;
    if (monitoringList.length > 0) {
      const sum = monitoringList.reduce(
        (acc, curr) =>
          acc +
          (curr.attendance_score +
            curr.discipline_score +
            curr.attitude_score +
            curr.competency_score +
            curr.communication_score) /
            5,
        0
      );
      avgScore = parseFloat((sum / monitoringList.length).toFixed(1));
    }

    const completionRate = totalStudents > 0 ? Math.round((fullyMonitored / totalStudents) * 100) : 0;

    return {
      targetStages,
      totalStudents,
      totalVisits: monitoringList.length,
      fullyMonitored,
      partiallyMonitored,
      unmonitored,
      avgScore,
      completionRate,
    };
  },
};
