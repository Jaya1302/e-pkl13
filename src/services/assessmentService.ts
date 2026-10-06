import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AssessmentCategory,
  AssessmentWeightConfig,
  AssessmentRecord,
  AssessmentDetail,
  AssessmentFilter,
  EvaluatorType,
  AssessmentStatus,
  GradePredicate
} from '../types';
import { pklService } from './pklService';

const CATEGORIES_STORAGE_KEY = 'epkl_assessment_categories_v1';
const SETTINGS_STORAGE_KEY = 'epkl_assessment_settings_v1';
const ASSESSMENTS_STORAGE_KEY = 'epkl_assessment_records_v1';

// Initial Rubric Categories
const INITIAL_CATEGORIES: AssessmentCategory[] = [
  // Industry Aspects (Default)
  {
    id: 'cat-ind-1',
    evaluator_type: 'industry',
    code: 'IND_DISIPLIN',
    name: 'Disiplin Kerja & Kepatuhan Waktu',
    description: 'Ketepatan waktu kehadiran, kepatuhan jam kerja dan SOP industri.',
    order_index: 1,
    is_active: true,
  },
  {
    id: 'cat-ind-2',
    evaluator_type: 'industry',
    code: 'IND_TANGGUNG_JAWAB',
    name: 'Tanggung Jawab & Kemandirian',
    description: 'Kesungguhan dalam menuntaskan tugas pekerjaan yang diinstruksikan.',
    order_index: 2,
    is_active: true,
  },
  {
    id: 'cat-ind-3',
    evaluator_type: 'industry',
    code: 'IND_KERJA_SAMA',
    name: 'Kerja Sama & Interaksi Tim',
    description: 'Kemampuan berkoordinasi dan membantu rekan kerja di lingkungan kerja.',
    order_index: 3,
    is_active: true,
  },
  {
    id: 'cat-ind-4',
    evaluator_type: 'industry',
    code: 'IND_KOMUNIKASI',
    name: 'Komunikasi & Adaptasi',
    description: 'Keterbukaan dalam berdiskusi, sopan santun, dan responsif terhadap arahan.',
    order_index: 4,
    is_active: true,
  },
  {
    id: 'cat-ind-5',
    evaluator_type: 'industry',
    code: 'IND_KOMPETENSI',
    name: 'Penguasaan Kompetensi Teknis',
    description: 'Kemampuan teknis, keterampilan praktikum, serta kualitas hasil kerja.',
    order_index: 5,
    is_active: true,
  },
  {
    id: 'cat-ind-6',
    evaluator_type: 'industry',
    code: 'IND_SIKAP',
    name: 'Sikap, Etika & Kejujuran',
    description: 'Integritas, etos kerja profesional, dan kepedulian terhadap lingkungan kerja.',
    order_index: 6,
    is_active: true,
  },

  // Teacher Aspects (Default)
  {
    id: 'cat-gur-1',
    evaluator_type: 'teacher',
    code: 'GUR_KEHADIRAN',
    name: 'Kehadiran & Rekap Presensi',
    description: 'Tingkat presensi dan kedisiplinan absensi GPS selama periode PKL.',
    order_index: 1,
    is_active: true,
  },
  {
    id: 'cat-gur-2',
    evaluator_type: 'teacher',
    code: 'GUR_JURNAL',
    name: 'Jurnal Kegiatan Harian (Logbook)',
    description: 'Kelengkapan, konsistensi pengisian logbook harian, dan dokumentasi foto.',
    order_index: 2,
    is_active: true,
  },
  {
    id: 'cat-gur-3',
    evaluator_type: 'teacher',
    code: 'GUR_SIKAP',
    name: 'Sikap, Etika & Respon Bimbingan',
    description: 'Keaktifan dalam bimbingan, sopan santun, dan ketaatan terhadap norma sekolah.',
    order_index: 3,
    is_active: true,
  },
  {
    id: 'cat-gur-4',
    evaluator_type: 'teacher',
    code: 'GUR_LAPORAN',
    name: 'Naskah Laporan Akhir PKL',
    description: 'Kerapian, kesesuaian format, dan ketepatan waktu pengumpulan laporan PKL.',
    order_index: 4,
    is_active: true,
  },
  {
    id: 'cat-gur-5',
    evaluator_type: 'teacher',
    code: 'GUR_KOMPETENSI',
    name: 'Ujian / Presentasi Kompetensi PKL',
    description: 'Penguasaan materi hasil praktik industri saat monitoring / ujian PKL.',
    order_index: 5,
    is_active: true,
  },
];

// Initial Weight Settings
const INITIAL_SETTINGS: AssessmentWeightConfig = {
  industry_weight: 40.0,
  teacher_weight: 60.0,
  passing_grade: 75.0,
  is_assessment_open: true,
};

// Initial Assessments
const INITIAL_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: 'ass-1',
    placement_id: 'p-1',
    industry_score: 92.5,
    industry_weight: 40.0,
    industry_evaluated_by: 'm-1',
    industry_evaluated_at: '2026-08-20T10:00:00.000Z',
    industry_notes: 'Sangat menguasai teknik splicing fiber optik dan disiplin waktu luar biasa.',
    teacher_score: 88.0,
    teacher_weight: 60.0,
    teacher_evaluated_by: 't-1',
    teacher_evaluated_at: '2026-08-21T14:30:00.000Z',
    teacher_notes: 'Jurnal harian terisi lengkap 100%, naskah laporan bab 1-4 sudah disetujui.',
    final_score: 89.8,
    predicate: 'B',
    status: 'locked',
    locked_at: '2026-08-22T08:00:00.000Z',
    locked_by: 'admin-1',
    details: [
      { id: 'd-1', assessment_id: 'ass-1', category_id: 'cat-ind-1', score: 95 },
      { id: 'd-2', assessment_id: 'ass-1', category_id: 'cat-ind-2', score: 90 },
      { id: 'd-3', assessment_id: 'ass-1', category_id: 'cat-ind-3', score: 92 },
      { id: 'd-4', assessment_id: 'ass-1', category_id: 'cat-ind-4', score: 90 },
      { id: 'd-5', assessment_id: 'ass-1', category_id: 'cat-ind-5', score: 95 },
      { id: 'd-6', assessment_id: 'ass-1', category_id: 'cat-ind-6', score: 93 },
      { id: 'd-7', assessment_id: 'ass-1', category_id: 'cat-gur-1', score: 90 },
      { id: 'd-8', assessment_id: 'ass-1', category_id: 'cat-gur-2', score: 92 },
      { id: 'd-9', assessment_id: 'ass-1', category_id: 'cat-gur-3', score: 88 },
      { id: 'd-10', assessment_id: 'ass-1', category_id: 'cat-gur-4', score: 85 },
      { id: 'd-11', assessment_id: 'ass-1', category_id: 'cat-gur-5', score: 85 },
    ],
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-22T08:00:00.000Z',
  },
  {
    id: 'ass-2',
    placement_id: 'p-2',
    industry_score: 90.0,
    industry_weight: 40.0,
    industry_evaluated_by: 'm-2',
    industry_evaluated_at: '2026-08-19T11:00:00.000Z',
    industry_notes: 'Cermat dalam penataan kabel server rack dan rajin bertanya.',
    teacher_score: 91.0,
    teacher_weight: 60.0,
    teacher_evaluated_by: 't-1',
    teacher_evaluated_at: '2026-08-21T15:00:00.000Z',
    teacher_notes: 'Jurnal harian rapi, kehadiran 100%, presentasi laporan sangat memuaskan.',
    final_score: 90.6,
    predicate: 'A',
    status: 'submitted',
    details: [
      { id: 'd-12', assessment_id: 'ass-2', category_id: 'cat-ind-1', score: 90 },
      { id: 'd-13', assessment_id: 'ass-2', category_id: 'cat-ind-2', score: 90 },
      { id: 'd-14', assessment_id: 'ass-2', category_id: 'cat-ind-3', score: 90 },
      { id: 'd-15', assessment_id: 'ass-2', category_id: 'cat-ind-4', score: 90 },
      { id: 'd-16', assessment_id: 'ass-2', category_id: 'cat-ind-5', score: 90 },
      { id: 'd-17', assessment_id: 'ass-2', category_id: 'cat-ind-6', score: 90 },
      { id: 'd-18', assessment_id: 'ass-2', category_id: 'cat-gur-1', score: 95 },
      { id: 'd-19', assessment_id: 'ass-2', category_id: 'cat-gur-2', score: 90 },
      { id: 'd-20', assessment_id: 'ass-2', category_id: 'cat-gur-3', score: 90 },
      { id: 'd-21', assessment_id: 'ass-2', category_id: 'cat-gur-4', score: 90 },
      { id: 'd-22', assessment_id: 'ass-2', category_id: 'cat-gur-5', score: 90 },
    ],
    created_at: '2026-08-19T11:00:00.000Z',
    updated_at: '2026-08-21T15:00:00.000Z',
  },
  {
    id: 'ass-3',
    placement_id: 'p-3',
    industry_score: 82.0,
    industry_weight: 40.0,
    industry_evaluated_by: 'm-3',
    industry_evaluated_at: '2026-08-18T09:30:00.000Z',
    industry_notes: 'Keterampilan pembubutan cukup baik, perlu terus ditingkatkan ketelitian ukuran.',
    teacher_score: null,
    teacher_weight: 60.0,
    teacher_evaluated_by: null,
    teacher_evaluated_at: null,
    teacher_notes: null,
    final_score: null,
    predicate: null,
    status: 'draft',
    details: [
      { id: 'd-23', assessment_id: 'ass-3', category_id: 'cat-ind-1', score: 80 },
      { id: 'd-24', assessment_id: 'ass-3', category_id: 'cat-ind-2', score: 85 },
      { id: 'd-25', assessment_id: 'ass-3', category_id: 'cat-ind-3', score: 80 },
      { id: 'd-26', assessment_id: 'ass-3', category_id: 'cat-ind-4', score: 80 },
      { id: 'd-27', assessment_id: 'ass-3', category_id: 'cat-ind-5', score: 85 },
      { id: 'd-28', assessment_id: 'ass-3', category_id: 'cat-ind-6', score: 82 },
    ],
    created_at: '2026-08-18T09:30:00.000Z',
    updated_at: '2026-08-18T09:30:00.000Z',
  },
];

// Helper Storage Getters
const getLocalCategories = (): AssessmentCategory[] => {
  const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
};

const saveLocalCategories = (cats: AssessmentCategory[]) => {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
};

const getLocalSettings = (): AssessmentWeightConfig => {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
};

const saveLocalSettings = (settings: AssessmentWeightConfig) => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

const getLocalAssessments = (): AssessmentRecord[] => {
  const saved = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ASSESSMENTS));
  return INITIAL_ASSESSMENTS;
};

const saveLocalAssessments = (assessments: AssessmentRecord[]) => {
  localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
};

export const assessmentService = {
  // 1. Calculate Grade Predicate
  calculatePredicate(score: number): GradePredicate {
    if (score >= 90.0) return 'A';
    if (score >= 80.0) return 'B';
    if (score >= 70.0) return 'C';
    return 'D';
  },

  // 2. Get Rubric Categories
  async getCategories(evaluatorType?: EvaluatorType, onlyActive = false): Promise<AssessmentCategory[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('assessment_categories')
          .select('*')
          .order('order_index', { ascending: true });

        if (evaluatorType) query = query.eq('evaluator_type', evaluatorType);
        if (onlyActive) query = query.eq('is_active', true);

        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as AssessmentCategory[];
      } catch (err) {
        console.warn('Supabase getCategories fallback:', err);
      }
    }

    let list = getLocalCategories();
    if (evaluatorType) list = list.filter((c) => c.evaluator_type === evaluatorType);
    if (onlyActive) list = list.filter((c) => c.is_active);
    return list.sort((a, b) => a.order_index - b.order_index);
  },

  async createCategory(
    category: Omit<AssessmentCategory, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AssessmentCategory> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('assessment_categories')
          .insert([category])
          .select()
          .single();

        if (!error && data) return data as AssessmentCategory;
      } catch (err) {
        console.warn('Supabase createCategory fallback:', err);
      }
    }

    const current = getLocalCategories();
    const newCat: AssessmentCategory = {
      ...category,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalCategories([...current, newCat]);
    return newCat;
  },

  async updateCategory(id: string, category: Partial<AssessmentCategory>): Promise<AssessmentCategory> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('assessment_categories')
          .update({ ...category, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return data as AssessmentCategory;
      } catch (err) {
        console.warn('Supabase updateCategory fallback:', err);
      }
    }

    const current = getLocalCategories();
    const idx = current.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kategori penilaian tidak ditemukan');

    const updated = {
      ...current[idx],
      ...category,
      updated_at: new Date().toISOString(),
    };
    current[idx] = updated;
    saveLocalCategories(current);
    return updated;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('assessment_categories').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteCategory fallback:', err);
      }
    }

    const current = getLocalCategories();
    saveLocalCategories(current.filter((c) => c.id !== id));
    return true;
  },

  // 3. Weight Settings
  async getWeightConfig(): Promise<AssessmentWeightConfig> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('assessment_settings')
          .select('*')
          .limit(1)
          .single();

        if (!error && data) return data as AssessmentWeightConfig;
      } catch (err) {
        console.warn('Supabase getWeightConfig fallback:', err);
      }
    }
    return getLocalSettings();
  },

  async updateWeightConfig(config: Partial<AssessmentWeightConfig>): Promise<AssessmentWeightConfig> {
    if (config.industry_weight !== undefined && config.teacher_weight !== undefined) {
      const total = Number(config.industry_weight) + Number(config.teacher_weight);
      if (Math.round(total) !== 100) {
        throw new Error(`Total bobot harus tepat 100% (saat ini ${total}%)`);
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('assessment_settings')
          .upsert([
            {
              ...config,
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (!error && data) return data as AssessmentWeightConfig;
      } catch (err) {
        console.warn('Supabase updateWeightConfig fallback:', err);
      }
    }

    const current = getLocalSettings();
    const updated = { ...current, ...config, updated_at: new Date().toISOString() };
    saveLocalSettings(updated);
    return updated;
  },

  // 4. Get Assessments with Placements and Details
  async getAssessments(filter?: AssessmentFilter): Promise<AssessmentRecord[]> {
    const placements = await pklService.getPlacements(filter?.periodId ? { periodId: filter.periodId } : undefined);
    const categories = await this.getCategories();
    const weightConfig = await this.getWeightConfig();
    const localAssessments = getLocalAssessments();

    // Map each placement to an AssessmentRecord (create virtual empty one if not exists)
    let list: AssessmentRecord[] = placements.map((p) => {
      const existing = localAssessments.find((a) => a.placement_id === p.id);
      if (existing) {
        // Hydrate category names into details
        const hydratedDetails = (existing.details || []).map((d) => ({
          ...d,
          category: categories.find((c) => c.id === d.category_id) || null,
        }));

        return {
          ...existing,
          placement: p,
          student: p.student,
          dudi: p.dudi,
          teacher: p.teacher,
          industry_mentor: p.industry_mentor,
          details: hydratedDetails,
        };
      }

      // Default blank record
      return {
        id: `ass-blank-${p.id}`,
        placement_id: p.id,
        placement: p,
        student: p.student,
        dudi: p.dudi,
        teacher: p.teacher,
        industry_mentor: p.industry_mentor,
        industry_score: null,
        industry_weight: weightConfig.industry_weight,
        teacher_score: null,
        teacher_weight: weightConfig.teacher_weight,
        final_score: null,
        predicate: null,
        status: 'draft',
        details: [],
      };
    });

    if (filter?.teacherId) list = list.filter((a) => a.teacher?.id === filter.teacherId);
    if (filter?.dudiId) list = list.filter((a) => a.dudi?.id === filter.dudiId);
    if (filter?.status) list = list.filter((a) => a.status === filter.status);
    if (filter?.predicate) list = list.filter((a) => a.predicate === filter.predicate);
    if (filter?.majorId) list = list.filter((a) => a.student?.major_id === filter.majorId);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.student?.name?.toLowerCase().includes(q) ||
          a.student?.nis?.toLowerCase().includes(q) ||
          a.dudi?.name?.toLowerCase().includes(q) ||
          a.teacher?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getAssessmentByPlacementId(placementId: string): Promise<AssessmentRecord | null> {
    const list = await this.getAssessments();
    return list.find((a) => a.placement_id === placementId) || null;
  },

  // 5. Save Industry Assessment
  async saveIndustryAssessment(
    placementId: string,
    scores: Record<string, number>, // category_id -> score
    notes?: string,
    mentorId?: string,
    isSubmit = false
  ): Promise<AssessmentRecord> {
    const weightConfig = await this.getWeightConfig();
    const categories = await this.getCategories('industry', true);

    // Calculate Average Industry Score
    const scoreValues = Object.entries(scores)
      .filter(([catId]) => categories.some((c) => c.id === catId))
      .map(([, val]) => Number(val));

    if (scoreValues.length === 0) {
      throw new Error('Harap isi minimal satu aspek penilaian industri.');
    }

    const avgIndustryScore = parseFloat(
      (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)
    );

    const currentList = getLocalAssessments();
    let recordIndex = currentList.findIndex((a) => a.placement_id === placementId);

    let existingRecord = recordIndex !== -1 ? currentList[recordIndex] : null;

    // Check if locked
    if (existingRecord && existingRecord.status === 'locked') {
      throw new Error('Penilaian telah dikunci (LOCKED) oleh Admin dan tidak dapat diubah.');
    }

    // Merge Details
    const otherDetails = (existingRecord?.details || []).filter(
      (d) => !categories.some((c) => c.id === d.category_id)
    );

    const newIndustryDetails: AssessmentDetail[] = Object.entries(scores).map(
      ([categoryId, score]) => ({
        id: `det-${Date.now()}-${categoryId}`,
        assessment_id: existingRecord?.id || `ass-${Date.now()}`,
        category_id: categoryId,
        score,
      })
    );

    const mergedDetails = [...otherDetails, ...newIndustryDetails];

    // Compute Final Score if Teacher Score is already available
    let finalScore = existingRecord?.final_score || null;
    let predicate = existingRecord?.predicate || null;

    const teacherScore = existingRecord?.teacher_score;
    if (teacherScore !== null && teacherScore !== undefined) {
      const indW = weightConfig.industry_weight / 100;
      const tchW = weightConfig.teacher_weight / 100;
      finalScore = parseFloat((avgIndustryScore * indW + teacherScore * tchW).toFixed(1));
      predicate = this.calculatePredicate(finalScore);
    }

    let status: AssessmentStatus = existingRecord?.status || 'draft';
    if (isSubmit) {
      status = teacherScore !== null && teacherScore !== undefined ? 'submitted' : 'draft';
    }

    const updatedRecord: AssessmentRecord = {
      id: existingRecord?.id || `ass-${Date.now()}`,
      placement_id: placementId,
      industry_score: avgIndustryScore,
      industry_weight: weightConfig.industry_weight,
      industry_evaluated_by: mentorId || null,
      industry_evaluated_at: new Date().toISOString(),
      industry_notes: notes || existingRecord?.industry_notes || null,
      teacher_score: existingRecord?.teacher_score || null,
      teacher_weight: weightConfig.teacher_weight,
      teacher_evaluated_by: existingRecord?.teacher_evaluated_by || null,
      teacher_evaluated_at: existingRecord?.teacher_evaluated_at || null,
      teacher_notes: existingRecord?.teacher_notes || null,
      final_score: finalScore,
      predicate: predicate,
      status: status,
      details: mergedDetails,
      created_at: existingRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (recordIndex !== -1) {
      currentList[recordIndex] = updatedRecord;
    } else {
      currentList.push(updatedRecord);
    }

    saveLocalAssessments(currentList);
    const hyd = await this.getAssessmentByPlacementId(placementId);
    return hyd || updatedRecord;
  },

  // 6. Save Teacher Assessment
  async saveTeacherAssessment(
    placementId: string,
    scores: Record<string, number>, // category_id -> score
    notes?: string,
    teacherId?: string,
    isSubmit = false
  ): Promise<AssessmentRecord> {
    const weightConfig = await this.getWeightConfig();
    const categories = await this.getCategories('teacher', true);

    const scoreValues = Object.entries(scores)
      .filter(([catId]) => categories.some((c) => c.id === catId))
      .map(([, val]) => Number(val));

    if (scoreValues.length === 0) {
      throw new Error('Harap isi minimal satu aspek penilaian guru.');
    }

    const avgTeacherScore = parseFloat(
      (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)
    );

    const currentList = getLocalAssessments();
    let recordIndex = currentList.findIndex((a) => a.placement_id === placementId);
    let existingRecord = recordIndex !== -1 ? currentList[recordIndex] : null;

    if (existingRecord && existingRecord.status === 'locked') {
      throw new Error('Penilaian telah dikunci (LOCKED) oleh Admin dan tidak dapat diubah.');
    }

    const otherDetails = (existingRecord?.details || []).filter(
      (d) => !categories.some((c) => c.id === d.category_id)
    );

    const newTeacherDetails: AssessmentDetail[] = Object.entries(scores).map(
      ([categoryId, score]) => ({
        id: `det-${Date.now()}-${categoryId}`,
        assessment_id: existingRecord?.id || `ass-${Date.now()}`,
        category_id: categoryId,
        score,
      })
    );

    const mergedDetails = [...otherDetails, ...newTeacherDetails];

    let finalScore = existingRecord?.final_score || null;
    let predicate = existingRecord?.predicate || null;

    const industryScore = existingRecord?.industry_score;
    if (industryScore !== null && industryScore !== undefined) {
      const indW = weightConfig.industry_weight / 100;
      const tchW = weightConfig.teacher_weight / 100;
      finalScore = parseFloat((industryScore * indW + avgTeacherScore * tchW).toFixed(1));
      predicate = this.calculatePredicate(finalScore);
    }

    let status: AssessmentStatus = existingRecord?.status || 'draft';
    if (isSubmit) {
      status = industryScore !== null && industryScore !== undefined ? 'submitted' : 'draft';
    }

    const updatedRecord: AssessmentRecord = {
      id: existingRecord?.id || `ass-${Date.now()}`,
      placement_id: placementId,
      industry_score: existingRecord?.industry_score || null,
      industry_weight: weightConfig.industry_weight,
      industry_evaluated_by: existingRecord?.industry_evaluated_by || null,
      industry_evaluated_at: existingRecord?.industry_evaluated_at || null,
      industry_notes: existingRecord?.industry_notes || null,
      teacher_score: avgTeacherScore,
      teacher_weight: weightConfig.teacher_weight,
      teacher_evaluated_by: teacherId || null,
      teacher_evaluated_at: new Date().toISOString(),
      teacher_notes: notes || existingRecord?.teacher_notes || null,
      final_score: finalScore,
      predicate: predicate,
      status: status,
      details: mergedDetails,
      created_at: existingRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (recordIndex !== -1) {
      currentList[recordIndex] = updatedRecord;
    } else {
      currentList.push(updatedRecord);
    }

    saveLocalAssessments(currentList);
    const hyd = await this.getAssessmentByPlacementId(placementId);
    return hyd || updatedRecord;
  },

  // 7. Lock / Unlock Assessment
  async lockAssessment(placementId: string, adminUserId?: string): Promise<AssessmentRecord> {
    const currentList = getLocalAssessments();
    const idx = currentList.findIndex((a) => a.placement_id === placementId);
    if (idx === -1 || currentList[idx].final_score === null) {
      throw new Error('Nilai siswa belum lengkap untuk dapat dikunci.');
    }

    currentList[idx].status = 'locked';
    currentList[idx].locked_at = new Date().toISOString();
    currentList[idx].locked_by = adminUserId || 'admin';
    currentList[idx].updated_at = new Date().toISOString();

    saveLocalAssessments(currentList);
    const hyd = await this.getAssessmentByPlacementId(placementId);
    return hyd || currentList[idx];
  },

  async unlockAssessment(placementId: string): Promise<AssessmentRecord> {
    const currentList = getLocalAssessments();
    const idx = currentList.findIndex((a) => a.placement_id === placementId);
    if (idx === -1) throw new Error('Data penilaian tidak ditemukan');

    currentList[idx].status = 'submitted';
    currentList[idx].locked_at = null;
    currentList[idx].locked_by = null;
    currentList[idx].updated_at = new Date().toISOString();

    saveLocalAssessments(currentList);
    const hyd = await this.getAssessmentByPlacementId(placementId);
    return hyd || currentList[idx];
  },

  async lockAllAssessments(adminUserId?: string): Promise<{ lockedCount: number }> {
    const currentList = getLocalAssessments();
    let count = 0;
    currentList.forEach((a) => {
      if (a.final_score !== null && a.status !== 'locked') {
        a.status = 'locked';
        a.locked_at = new Date().toISOString();
        a.locked_by = adminUserId || 'admin';
        a.updated_at = new Date().toISOString();
        count++;
      }
    });

    saveLocalAssessments(currentList);
    return { lockedCount: count };
  },

  // 8. Statistics & Analytics
  async getAssessmentStats(teacherId?: string) {
    const list = await this.getAssessments(teacherId ? { teacherId } : undefined);
    const weightConfig = await this.getWeightConfig();

    const totalStudents = list.length;
    const completed = list.filter((a) => a.final_score !== null);
    const locked = list.filter((a) => a.status === 'locked');
    const waitingTeacher = list.filter((a) => a.industry_score !== null && a.teacher_score === null);
    const waitingIndustry = list.filter((a) => a.teacher_score !== null && a.industry_score === null);
    const unstarted = list.filter((a) => a.industry_score === null && a.teacher_score === null);

    let avgFinal = 0;
    let avgIndustry = 0;
    let avgTeacher = 0;

    if (completed.length > 0) {
      avgFinal = parseFloat(
        (completed.reduce((s, a) => s + (a.final_score || 0), 0) / completed.length).toFixed(1)
      );
    }

    const withInd = list.filter((a) => a.industry_score !== null);
    if (withInd.length > 0) {
      avgIndustry = parseFloat(
        (withInd.reduce((s, a) => s + (a.industry_score || 0), 0) / withInd.length).toFixed(1)
      );
    }

    const withTch = list.filter((a) => a.teacher_score !== null);
    if (withTch.length > 0) {
      avgTeacher = parseFloat(
        (withTch.reduce((s, a) => s + (a.teacher_score || 0), 0) / withTch.length).toFixed(1)
      );
    }

    const predicateCounts = {
      A: completed.filter((a) => a.predicate === 'A').length,
      B: completed.filter((a) => a.predicate === 'B').length,
      C: completed.filter((a) => a.predicate === 'C').length,
      D: completed.filter((a) => a.predicate === 'D').length,
    };

    const passedCount = completed.filter(
      (a) => (a.final_score || 0) >= weightConfig.passing_grade
    ).length;

    const passRate = completed.length > 0 ? Math.round((passedCount / completed.length) * 100) : 0;

    return {
      totalStudents,
      completedCount: completed.length,
      lockedCount: locked.length,
      waitingTeacherCount: waitingTeacher.length,
      waitingIndustryCount: waitingIndustry.length,
      unstartedCount: unstarted.length,
      avgFinal,
      avgIndustry,
      avgTeacher,
      predicateCounts,
      passRate,
      weightConfig,
    };
  },
};
