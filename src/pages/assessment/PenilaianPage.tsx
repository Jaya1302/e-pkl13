import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  AssessmentRecord,
  AssessmentCategory,
  AssessmentWeightConfig,
  Teacher,
  Dudi,
  Major,
  AssessmentStatus,
  GradePredicate,
  EvaluatorType
} from '../../types';
import { assessmentService } from '../../services/assessmentService';
import { masterService } from '../../services/masterService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  GraduationCap,
  Award,
  Sliders,
  Settings,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  ListPlus,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Star,
  Check
} from 'lucide-react';

export const PenilaianPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'rekap' | 'rubrik' | 'bobot' | 'analytics'>('rekap');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [weightConfig, setWeightConfig] = useState<AssessmentWeightConfig>({
    industry_weight: 40.0,
    teacher_weight: 60.0,
    passing_grade: 75.0,
    is_assessment_open: true,
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedDudiFilter, setSelectedDudiFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPredicateFilter, setSelectedPredicateFilter] = useState<string>('all');

  // Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | null>(null);

  // Input Score States for Active Modal
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [formNotes, setFormNotes] = useState('');

  // Rubric Category Form
  const [categoryForm, setCategoryForm] = useState({
    evaluator_type: 'industry' as EvaluatorType,
    code: '',
    name: '',
    description: '',
    order_index: 1,
    is_active: true,
  });

  // Weight Form
  const [weightForm, setWeightForm] = useState({
    industry_weight: 40,
    teacher_weight: 60,
    passing_grade: 75,
    is_assessment_open: true,
  });

  // Roles Check
  const isTeacher = role === 'guru_pembimbing';
  const isIndustry = role === 'pembimbing_industri';
  const isAdmin = role === 'super_admin' || role === 'admin_pkl';
  const isExecutive = role === 'kepala_sekolah' || role === 'wakasek';

  // Identify current teacher / mentor
  const currentTeacher = useMemo(() => {
    if (!isTeacher) return null;
    return teachers.find((t) => t.email.toLowerCase() === user?.email.toLowerCase() || t.user_id === user?.id) || null;
  }, [isTeacher, teachers, user]);

  const currentMentorDudiId = useMemo(() => {
    if (!isIndustry) return null;
    // In mock/demo: mentor belongs to dudi-1 or matched
    return 'd-1';
  }, [isIndustry]);

  // Initial Fetch
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catsData, weightsData, teachersData, dudiData, majorsData] = await Promise.all([
        assessmentService.getCategories(),
        assessmentService.getWeightConfig(),
        masterService.getTeachers(),
        masterService.getDudi(),
        masterService.getMajors(),
      ]);

      setCategories(catsData);
      setWeightConfig(weightsData);
      setWeightForm(weightsData);
      setTeachers(teachersData);
      setDudiList(dudiData);
      setMajors(majorsData);

      const teacherFilterId = isTeacher && currentTeacher ? currentTeacher.id : undefined;
      const dudiFilterId = isIndustry && currentMentorDudiId ? currentMentorDudiId : undefined;

      const [assessmentsData, statsData] = await Promise.all([
        assessmentService.getAssessments({
          teacherId: teacherFilterId,
          dudiId: dudiFilterId,
        }),
        assessmentService.getAssessmentStats(teacherFilterId),
      ]);

      setAssessments(assessmentsData);
      setStats(statsData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data penilaian.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, user, currentTeacher?.id, currentMentorDudiId]);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        a.student?.name?.toLowerCase().includes(q) ||
        a.student?.nis?.toLowerCase().includes(q) ||
        a.dudi?.name?.toLowerCase().includes(q) ||
        a.teacher?.name?.toLowerCase().includes(q);

      const matchTeacher = !selectedTeacherFilter || a.teacher?.id === selectedTeacherFilter;
      const matchDudi = !selectedDudiFilter || a.dudi?.id === selectedDudiFilter;

      let matchStatus = true;
      if (selectedStatusFilter === 'draft') matchStatus = a.status === 'draft';
      else if (selectedStatusFilter === 'submitted') matchStatus = a.status === 'submitted';
      else if (selectedStatusFilter === 'locked') matchStatus = a.status === 'locked';
      else if (selectedStatusFilter === 'complete') matchStatus = a.final_score !== null;
      else if (selectedStatusFilter === 'incomplete') matchStatus = a.final_score === null;

      let matchPredicate = true;
      if (selectedPredicateFilter !== 'all') {
        matchPredicate = a.predicate === selectedPredicateFilter;
      }

      return matchSearch && matchTeacher && matchDudi && matchStatus && matchPredicate;
    });
  }, [
    assessments,
    searchTerm,
    selectedTeacherFilter,
    selectedDudiFilter,
    selectedStatusFilter,
    selectedPredicateFilter,
  ]);

  // Open Form Input Nilai Guru
  const handleOpenTeacherModal = (record: AssessmentRecord) => {
    setSelectedRecord(record);
    const teacherCats = categories.filter((c) => c.evaluator_type === 'teacher' && c.is_active);

    const initialScores: Record<string, number> = {};
    teacherCats.forEach((cat) => {
      const existingDetail = (record.details || []).find((d) => d.category_id === cat.id);
      initialScores[cat.id] = existingDetail ? existingDetail.score : 85;
    });

    setFormScores(initialScores);
    setFormNotes(record.teacher_notes || '');
    setIsTeacherModalOpen(true);
  };

  // Open Form Input Nilai Industri
  const handleOpenIndustryModal = (record: AssessmentRecord) => {
    setSelectedRecord(record);
    const industryCats = categories.filter((c) => c.evaluator_type === 'industry' && c.is_active);

    const initialScores: Record<string, number> = {};
    industryCats.forEach((cat) => {
      const existingDetail = (record.details || []).find((d) => d.category_id === cat.id);
      initialScores[cat.id] = existingDetail ? existingDetail.score : 85;
    });

    setFormScores(initialScores);
    setFormNotes(record.industry_notes || '');
    setIsIndustryModalOpen(true);
  };

  // Submit Teacher Assessment
  const handleSubmitTeacherScore = async (isSubmitFinal: boolean) => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await assessmentService.saveTeacherAssessment(
        selectedRecord.placement_id,
        formScores,
        formNotes,
        currentTeacher?.id || 't-1',
        isSubmitFinal
      );
      showToast(
        isSubmitFinal
          ? 'Nilai guru berhasil disubmit dan nilai akhir telah dikalkulasi!'
          : 'Draf nilai guru berhasil disimpan.',
        'success'
      );
      setIsTeacherModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan nilai guru.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Industry Assessment
  const handleSubmitIndustryScore = async (isSubmitFinal: boolean) => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await assessmentService.saveIndustryAssessment(
        selectedRecord.placement_id,
        formScores,
        formNotes,
        'm-1',
        isSubmitFinal
      );
      showToast(
        isSubmitFinal
          ? 'Nilai industri berhasil disubmit dan nilai akhir telah dikalkulasi!'
          : 'Draf nilai industri berhasil disimpan.',
        'success'
      );
      setIsIndustryModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan nilai industri.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lock Assessment (Admin)
  const handleToggleLock = async (record: AssessmentRecord) => {
    try {
      if (record.status === 'locked') {
        await assessmentService.unlockAssessment(record.placement_id);
        showToast('Kunci nilai dibuka (Dapat diedit kembali oleh pembimbing).', 'success');
      } else {
        await assessmentService.lockAssessment(record.placement_id, user?.id);
        showToast('Nilai resmi dikunci (LOCKED)!', 'success');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status kunci.', 'error');
    }
  };

  // Lock All Completed (Admin)
  const handleLockAll = async () => {
    try {
      const res = await assessmentService.lockAllAssessments(user?.id);
      showToast(`Berhasil mengunci ${res.lockedCount} nilai siswa yang telah lengkap!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunci nilai.', 'error');
    }
  };

  // Save Weight Config (Admin)
  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assessmentService.updateWeightConfig(weightForm);
      showToast('Konfigurasi bobot komponen berhasil disimpan.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan bobot.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rubric Category Management (Admin)
  const handleOpenCategoryModal = (cat?: AssessmentCategory) => {
    if (cat) {
      setSelectedCategory(cat);
      setCategoryForm({
        evaluator_type: cat.evaluator_type,
        code: cat.code,
        name: cat.name,
        description: cat.description || '',
        order_index: cat.order_index,
        is_active: cat.is_active,
      });
    } else {
      setSelectedCategory(null);
      setCategoryForm({
        evaluator_type: 'industry',
        code: `ASPEK_${Date.now()}`,
        name: '',
        description: '',
        order_index: categories.length + 1,
        is_active: true,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Nama aspek wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await assessmentService.updateCategory(selectedCategory.id, categoryForm);
        showToast('Aspek penilaian berhasil diperbarui.', 'success');
      } else {
        await assessmentService.createCategory(categoryForm);
        showToast('Aspek penilaian baru berhasil ditambahkan.', 'success');
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan aspek.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCategoryActive = async (cat: AssessmentCategory) => {
    try {
      await assessmentService.updateCategory(cat.id, { is_active: !cat.is_active });
      showToast(`Aspek "${cat.name}" ${!cat.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status aspek.', 'error');
    }
  };

  const handleDeleteCategory = async (cat: AssessmentCategory) => {
    if (!confirm(`Hapus aspek "${cat.name}"?`)) return;
    try {
      await assessmentService.deleteCategory(cat.id);
      showToast('Aspek berhasil dihapus.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus aspek.', 'error');
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (assessments.length === 0) {
      showToast('Tidak ada data nilai untuk diexport.', 'warning');
      return;
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Mitra DUDI',
      'Guru Pembimbing',
      `Nilai Industri (${weightConfig.industry_weight}%)`,
      `Nilai Guru (${weightConfig.teacher_weight}%)`,
      'Nilai Akhir',
      'Predikat',
      'Status Kelulusan',
      'Status Penilaian',
    ];

    const rows = assessments.map((a, i) => {
      const isPassed = (a.final_score || 0) >= weightConfig.passing_grade;
      return [
        i + 1,
        `"${a.student?.nis || ''}"`,
        `"${a.student?.name || ''}"`,
        `"${a.student?.class?.name || ''}"`,
        `"${a.dudi?.name || ''}"`,
        `"${a.teacher?.name || ''}"`,
        a.industry_score ?? '-',
        a.teacher_score ?? '-',
        a.final_score ?? '-',
        a.predicate ?? '-',
        a.final_score !== null ? (isPassed ? 'LULUS' : 'TIDAK LULUS') : 'BELUM LENGKAP',
        a.status.toUpperCase(),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Transkrip_Nilai_PKL_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transkrip nilai PKL berhasil diunduh.', 'success');
  };

  const getPredicateBadge = (predicate?: GradePredicate | null) => {
    if (!predicate) return <span className="text-xs text-slate-400 italic">-</span>;
    switch (predicate) {
      case 'A':
        return <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">A (Sangat Baik)</span>;
      case 'B':
        return <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">B (Baik)</span>;
      case 'C':
        return <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">C (Cukup)</span>;
      case 'D':
        return <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">D (Kurang)</span>;
      default:
        return <Badge variant="neutral">{predicate}</Badge>;
    }
  };

  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>LOCKED</span>
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-700" />
            <span>SUBMITTED</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>DRAFT</span>
          </span>
        );
    }
  };

  // Live calculation helper for current modal
  const liveAverageScore = useMemo(() => {
    const vals = Object.values(formScores);
    if (vals.length === 0) return 0;
    const avg = vals.reduce((a, b) => a + Number(b), 0) / vals.length;
    return parseFloat(avg.toFixed(1));
  }, [formScores]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Penilaian & Transkrip Nilai PKL
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Phase 7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kombinasi skor evaluasi Pembimbing Industri ({weightConfig.industry_weight}%) dan Guru Pembimbing ({weightConfig.teacher_weight}%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockAll}
              className="flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
            >
              <Lock className="w-4 h-4" />
              <span>Kunci Nilai Selesai</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Transkrip CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Tuntas & Terkunci
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.lockedCount}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {stats.totalStudents} Siswa
                  </span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-emerald-700">{stats.passRate}%</span> Tingkat Kelulusan (Min. {weightConfig.passing_grade})
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50/70 to-white border-blue-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Rata-rata Nilai Industri ({weightConfig.industry_weight}%)
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.avgIndustry > 0 ? stats.avgIndustry : '-'}
                  <span className="text-xs font-normal text-slate-500"> / 100</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Menunggu Industri: <strong>{stats.waitingIndustryCount}</strong></span>
              <span>Terisi: <strong>{stats.totalStudents - stats.waitingIndustryCount - stats.unstartedCount}</strong></span>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50/70 to-white border-purple-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  Rata-rata Nilai Guru ({weightConfig.teacher_weight}%)
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.avgTeacher > 0 ? stats.avgTeacher : '-'}
                  <span className="text-xs font-normal text-slate-500"> / 100</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Menunggu Guru: <strong>{stats.waitingTeacherCount}</strong></span>
              <span>Terisi: <strong>{stats.totalStudents - stats.waitingTeacherCount - stats.unstartedCount}</strong></span>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50/70 to-white border-amber-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Rata-rata Nilai Akhir
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.avgFinal > 0 ? stats.avgFinal : '-'}
                  <span className="text-xs font-normal text-slate-500"> / 100</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="text-emerald-700">A: {stats.predicateCounts.A}</span> •
              <span className="text-blue-700">B: {stats.predicateCounts.B}</span> •
              <span className="text-amber-700">C: {stats.predicateCounts.C}</span> •
              <span className="text-rose-700">D: {stats.predicateCounts.D}</span>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'rekap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Rekap Nilai Siswa</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {assessments.length}
            </span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('rubrik')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'rubrik'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <ListPlus className="w-4 h-4" />
                <span>Rubrik Aspek Penilaian</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {categories.length} Aspek
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bobot')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'bobot'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Konfigurasi Bobot & Status</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Distribusi & Statistik Nilai</span>
          </button>
        </div>
      </div>

      {/* 4. Tab 1: REKAP NILAI SISWA */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-4 bg-white shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari siswa, NIS, DUDI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                />
              </div>

              {!isTeacher && (
                <Select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="text-xs sm:text-sm"
                >
                  <option value="">Semua Guru Pembimbing</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              )}

              {!isIndustry && (
                <Select
                  value={selectedDudiFilter}
                  onChange={(e) => setSelectedDudiFilter(e.target.value)}
                  className="text-xs sm:text-sm"
                >
                  <option value="">Semua Mitra DUDI</option>
                  {dudiList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}

              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs sm:text-sm"
              >
                <option value="all">Semua Status Penilaian</option>
                <option value="complete">Nilai Lengkap (Ada Nilai Akhir)</option>
                <option value="incomplete">Belum Lengkap</option>
                <option value="locked">Terkunci (LOCKED)</option>
                <option value="submitted">Telah Diajukan (SUBMITTED)</option>
                <option value="draft">Draf (DRAFT)</option>
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500 mt-3 font-medium">Memuat data penilaian PKL...</p>
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              {filteredAssessments.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={<FileCheck className="w-8 h-8" />}
                    title="Tidak ada data penilaian"
                    description="Coba ubah kata kunci pencarian atau filter status di atas."
                  />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Siswa / Kelas</TableHeaderCell>
                      <TableHeaderCell>Mitra DUDI & Guru</TableHeaderCell>
                      <TableHeaderCell className="text-center">Nilai Industri ({weightConfig.industry_weight}%)</TableHeaderCell>
                      <TableHeaderCell className="text-center">Nilai Guru ({weightConfig.teacher_weight}%)</TableHeaderCell>
                      <TableHeaderCell className="text-center">Nilai Akhir</TableHeaderCell>
                      <TableHeaderCell className="text-center">Predikat</TableHeaderCell>
                      <TableHeaderCell className="text-center">Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssessments.map((item) => {
                      const isLocked = item.status === 'locked';

                      return (
                        <TableRow key={item.placement_id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Siswa */}
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900">{item.student?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                NIS: {item.student?.nis} • {item.student?.class?.name || '-'}
                              </p>
                            </div>
                          </TableCell>

                          {/* DUDI & Teacher */}
                          <TableCell>
                            <p className="text-xs font-semibold text-slate-800">{item.dudi?.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Guru: {item.teacher?.name || '-'}</p>
                          </TableCell>

                          {/* Nilai Industri */}
                          <TableCell className="text-center">
                            {item.industry_score !== null && item.industry_score !== undefined ? (
                              <span className="font-extrabold text-blue-700 text-sm">{item.industry_score}</span>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Belum Diisi
                              </span>
                            )}
                          </TableCell>

                          {/* Nilai Guru */}
                          <TableCell className="text-center">
                            {item.teacher_score !== null && item.teacher_score !== undefined ? (
                              <span className="font-extrabold text-purple-700 text-sm">{item.teacher_score}</span>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Belum Diisi
                              </span>
                            )}
                          </TableCell>

                          {/* Nilai Akhir */}
                          <TableCell className="text-center">
                            {item.final_score !== null && item.final_score !== undefined ? (
                              <span className="font-extrabold text-slate-900 text-base">{item.final_score}</span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">-</span>
                            )}
                          </TableCell>

                          {/* Predikat */}
                          <TableCell className="text-center">
                            {getPredicateBadge(item.predicate)}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {getStatusBadge(item.status)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Input Nilai Industri Button (Industry Mentor / Admin) */}
                              {(isIndustry || isAdmin) && !isLocked && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenIndustryModal(item)}
                                  className="text-xs h-7 py-0 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="Input Nilai Industri"
                                >
                                  <Building2 className="w-3.5 h-3.5 mr-1" />
                                  <span>Industri</span>
                                </Button>
                              )}

                              {/* Input Nilai Guru Button (Teacher / Admin) */}
                              {(isTeacher || isAdmin) && !isLocked && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenTeacherModal(item)}
                                  className="text-xs h-7 py-0 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                  title="Input Nilai Guru Pembimbing"
                                >
                                  <GraduationCap className="w-3.5 h-3.5 mr-1" />
                                  <span>Guru</span>
                                </Button>
                              )}

                              {/* View Official Transcript Sheet */}
                              {item.final_score !== null && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(item);
                                    setIsTranscriptModalOpen(true);
                                  }}
                                  className="text-xs h-7 py-0 px-1.5 text-slate-600 hover:text-slate-900"
                                  title="Lihat Lembar Transkrip Resmi"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Lock / Unlock Toggle Button (Admin only) */}
                              {isAdmin && item.final_score !== null && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleLock(item)}
                                  className={`text-xs h-7 py-0 px-1.5 ${
                                    isLocked ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={isLocked ? 'Buka Kunci Nilai' : 'Kunci Nilai Resmi'}
                                >
                                  {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* 5. Tab 2: MANAJEMEN RUBRIK ASPEK (ADMIN) */}
      {activeTab === 'rubrik' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Rubrik Aspek Penilaian Dinamis</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Konfigurasi indikator penilaian untuk evaluator Pembimbing Industri dan Guru Pembimbing
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Aspek</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aspek Industri */}
            <Card className="p-5 border-blue-100 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Aspek Penilaian Industri</h4>
                    <p className="text-[11px] text-slate-500">Dievaluasi oleh Pembimbing DUDI</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {categories.filter((c) => c.evaluator_type === 'industry' && c.is_active).length} Aktif
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {categories
                  .filter((c) => c.evaluator_type === 'industry')
                  .map((cat, idx) => (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        cat.is_active
                          ? 'bg-white border-slate-200 hover:border-blue-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-700">{idx + 1}.</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</span>
                            {!cat.is_active && <Badge variant="neutral">Nonaktif</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 pl-4">{cat.description || '-'}</p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${
                              cat.is_active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                            title={cat.is_active ? 'Nonaktifkan Aspek' : 'Aktifkan Aspek'}
                          >
                            {cat.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                            title="Edit Aspek"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100"
                            title="Hapus Aspek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Aspek Guru */}
            <Card className="p-5 border-purple-100 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Aspek Penilaian Guru</h4>
                    <p className="text-[11px] text-slate-500">Dievaluasi oleh Guru Pembimbing Sekolah</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {categories.filter((c) => c.evaluator_type === 'teacher' && c.is_active).length} Aktif
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {categories
                  .filter((c) => c.evaluator_type === 'teacher')
                  .map((cat, idx) => (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        cat.is_active
                          ? 'bg-white border-slate-200 hover:border-purple-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-700">{idx + 1}.</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</span>
                            {!cat.is_active && <Badge variant="neutral">Nonaktif</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 pl-4">{cat.description || '-'}</p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${
                              cat.is_active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                            title={cat.is_active ? 'Nonaktifkan Aspek' : 'Aktifkan Aspek'}
                          >
                            {cat.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-purple-600 hover:bg-slate-100"
                            title="Edit Aspek"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100"
                            title="Hapus Aspek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. Tab 3: KONFIGURASI BOBOT & STATUS (ADMIN) */}
      {activeTab === 'bobot' && isAdmin && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Pengaturan Bobot Komponen Penilaian</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tentukan porsi persentase nilai akhir antara Pembimbing Industri dan Guru Pembimbing. Total bobot harus 100%.
            </p>

            <form onSubmit={handleSaveWeights} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bobot Penilaian Industri (%) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={weightForm.industry_weight}
                    onChange={(e) => {
                      const ind = parseInt(e.target.value, 10) || 0;
                      setWeightForm({
                        ...weightForm,
                        industry_weight: ind,
                        teacher_weight: Math.max(0, 100 - ind),
                      });
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bobot Penilaian Guru (%) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={weightForm.teacher_weight}
                    onChange={(e) => {
                      const tch = parseInt(e.target.value, 10) || 0;
                      setWeightForm({
                        ...weightForm,
                        teacher_weight: tch,
                        industry_weight: Math.max(0, 100 - tch),
                      });
                    }}
                    required
                  />
                </div>
              </div>

              {/* Visual Bobot Progress */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-700">Industri: {weightForm.industry_weight}%</span>
                  <span className="text-purple-700">Guru: {weightForm.teacher_weight}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 flex overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${weightForm.industry_weight}%` }}
                  />
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${weightForm.teacher_weight}%` }}
                  />
                </div>
                <p className="text-[11px] text-center text-slate-500 mt-1">
                  Formula: (Nilai Industri × {weightForm.industry_weight}%) + (Nilai Guru × {weightForm.teacher_weight}%)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nilai Standar Kelulusan Minimal (Passing Grade)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={weightForm.passing_grade}
                  onChange={(e) =>
                    setWeightForm({ ...weightForm, passing_grade: parseFloat(e.target.value) || 75 })
                  }
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Siswa dinyatakan Lulus PKL jika nilai akhir $\ge$ {weightForm.passing_grade}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi Bobot'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 7. Tab 4: STATISTIK & DISTRIBUSI NILAI */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Predikat */}
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Distribusi Predikat Kelulusan PKL</span>
              </h3>

              <div className="mt-4 space-y-4">
                {[
                  { label: 'Predikat A (Sangat Baik: 90 - 100)', count: stats?.predicateCounts?.A || 0, color: 'bg-emerald-600', textColor: 'text-emerald-700' },
                  { label: 'Predikat B (Baik: 80 - 89.9)', count: stats?.predicateCounts?.B || 0, color: 'bg-blue-600', textColor: 'text-blue-700' },
                  { label: 'Predikat C (Cukup: 70 - 79.9)', count: stats?.predicateCounts?.C || 0, color: 'bg-amber-600', textColor: 'text-amber-700' },
                  { label: 'Predikat D (Kurang: < 70)', count: stats?.predicateCounts?.D || 0, color: 'bg-rose-600', textColor: 'text-rose-700' },
                ].map((item, i) => {
                  const total = stats?.completedCount || 1;
                  const percent = Math.round((item.count / total) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <span className={`font-bold ${item.textColor}`}>
                          {item.count} Siswa ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Rekap Per Jurusan */}
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Rata-rata Nilai per Jurusan</span>
              </h3>

              <div className="mt-4 space-y-4">
                {majors.map((m) => {
                  const majorAssessments = assessments.filter((a) => a.student?.major_id === m.id && a.final_score !== null);
                  const avg = majorAssessments.length > 0
                    ? (majorAssessments.reduce((s, a) => s + (a.final_score || 0), 0) / majorAssessments.length).toFixed(1)
                    : '-';

                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{m.code}</span>
                        <span className="text-xs text-slate-500">{m.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-blue-700">{avg}</span>
                        <span className="text-[11px] text-slate-400 block">/ 100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: FORM INPUT NILAI GURU ================= */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title={`Input Nilai Guru Pembimbing — ${selectedRecord?.student?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-900 block">
                Siswa: {selectedRecord?.student?.name} ({selectedRecord?.student?.class?.name})
              </span>
              <span className="text-xs text-purple-700">DUDI: {selectedRecord?.dudi?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-purple-600 block uppercase font-bold">Rata-rata Skor Guru</span>
              <span className="text-xl font-extrabold text-purple-900">{liveAverageScore}</span>
              <span className="text-xs text-purple-700"> / 100</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rubrik Aspek Penilaian Guru (Skala 0 - 100)
            </h4>

            <div className="space-y-2.5">
              {categories
                .filter((c) => c.evaluator_type === 'teacher' && c.is_active)
                .map((cat, idx) => (
                  <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        {idx + 1}. {cat.name}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formScores[cat.id] ?? 85}
                        onChange={(e) =>
                          setFormScores({
                            ...formScores,
                            [cat.id]: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="text-center font-bold"
                        required
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Catatan & Saran Guru Pembimbing
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Catatan kemajuan siswa, sikap selama PKL, dan hasil ujian..."
                className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsTeacherModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmitTeacherScore(false)}
              disabled={isSubmitting}
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              Simpan Draf
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmitTeacherScore(true)}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Menyimpan...' : 'Submit Nilai Guru'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 2: FORM INPUT NILAI INDUSTRI ================= */}
      <Modal
        isOpen={isIndustryModalOpen}
        onClose={() => setIsIndustryModalOpen(false)}
        title={`Input Nilai Pembimbing Industri — ${selectedRecord?.student?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-900 block">
                Siswa: {selectedRecord?.student?.name} ({selectedRecord?.student?.class?.name})
              </span>
              <span className="text-xs text-blue-700">Mitra: {selectedRecord?.dudi?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-600 block uppercase font-bold">Rata-rata Skor Industri</span>
              <span className="text-xl font-extrabold text-blue-900">{liveAverageScore}</span>
              <span className="text-xs text-blue-700"> / 100</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rubrik Aspek Penilaian Industri (Skala 0 - 100)
            </h4>

            <div className="space-y-2.5">
              {categories
                .filter((c) => c.evaluator_type === 'industry' && c.is_active)
                .map((cat, idx) => (
                  <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        {idx + 1}. {cat.name}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formScores[cat.id] ?? 85}
                        onChange={(e) =>
                          setFormScores({
                            ...formScores,
                            [cat.id]: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="text-center font-bold"
                        required
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Catatan & Evaluasi Pembimbing Industri
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Catatan kedisiplinan, etos kerja, dan keterampilan teknis di lapangan..."
                className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsIndustryModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmitIndustryScore(false)}
              disabled={isSubmitting}
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              Simpan Draf
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmitIndustryScore(true)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Menyimpan...' : 'Submit Nilai Industri'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 3: LEMBAR TRANSKRIP NILAI RESMI ================= */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        title="Lembar Transkrip Nilai PKL Resmi"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6 printable-transcript">
            {/* Header Sekolah */}
            <div className="border-b-2 border-slate-900 pb-3 text-center">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">
                PEMERINTAH DAERAH PROVINSI JAWA BARAT
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                SMK NEGERI 13 BANDUNG
              </h2>
              <p className="text-[11px] text-slate-500">
                Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu, Kota Bandung • Website: smkn13bdg.sch.id
              </p>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mt-2 underline">
                TRANSKRIP PENILAIAN PRAKTIK KERJA LAPANGAN (PKL)
              </h3>
            </div>

            {/* Identitas Siswa */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400">Nama Siswa:</span>
                <p className="font-bold text-slate-900">{selectedRecord.student?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">NIS / NISN:</span>
                <p className="font-bold text-slate-900">{selectedRecord.student?.nis} / {selectedRecord.student?.nisn}</p>
              </div>
              <div>
                <span className="text-slate-400">Program Keahlian:</span>
                <p className="font-semibold text-slate-800">{selectedRecord.student?.class?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Mitra Industri (DUDI):</span>
                <p className="font-semibold text-slate-800">{selectedRecord.dudi?.name}</p>
              </div>
            </div>

            {/* Rincian Aspek Penilaian */}
            <div className="space-y-4 text-xs">
              {/* Aspek Industri */}
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 font-bold text-blue-900">
                  <span>I. ASPEK PENILAIAN INDUSTRI (Bobot {weightConfig.industry_weight}%)</span>
                  <span>Skor: {selectedRecord.industry_score ?? '-'}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {categories
                    .filter((c) => c.evaluator_type === 'industry' && c.is_active)
                    .map((cat, i) => {
                      const det = (selectedRecord.details || []).find((d) => d.category_id === cat.id);
                      return (
                        <div key={cat.id} className="flex items-center justify-between text-slate-700 py-0.5">
                          <span>{i + 1}. {cat.name}</span>
                          <span className="font-bold">{det ? det.score : '-'}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Aspek Guru */}
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 font-bold text-purple-900">
                  <span>II. ASPEK PENILAIAN GURU PEMBIMBING (Bobot {weightConfig.teacher_weight}%)</span>
                  <span>Skor: {selectedRecord.teacher_score ?? '-'}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {categories
                    .filter((c) => c.evaluator_type === 'teacher' && c.is_active)
                    .map((cat, i) => {
                      const det = (selectedRecord.details || []).find((d) => d.category_id === cat.id);
                      return (
                        <div key={cat.id} className="flex items-center justify-between text-slate-700 py-0.5">
                          <span>{i + 1}. {cat.name}</span>
                          <span className="font-bold">{det ? det.score : '-'}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Total & Predikat Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">NILAI AKHIR PKL</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-black text-white">{selectedRecord.final_score ?? '-'}</span>
                    <span className="text-sm font-bold text-emerald-400">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">PREDIKAT</span>
                  <p className="text-2xl font-extrabold text-amber-400 mt-1">
                    PREDIKAT {selectedRecord.predicate || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Print & Close */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Transkrip</span>
              </Button>
              <Button variant="primary" onClick={() => setIsTranscriptModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL 4: FORM TAMBAH / EDIT ASPEK RUBRIK ================= */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedCategory ? 'Edit Butir Aspek Rubrik' : 'Tambah Butir Aspek Rubrik Penilaian'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tipe Evaluator <span className="text-red-500">*</span>
            </label>
            <Select
              value={categoryForm.evaluator_type}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, evaluator_type: e.target.value as EvaluatorType })
              }
              required
            >
              <option value="industry">Pembimbing Industri (DUDI)</option>
              <option value="teacher">Guru Pembimbing (Sekolah)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Aspek Penilaian <span className="text-red-500">*</span>
            </label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Contoh: Kepatuhan K3 & SOP Bengkel"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Deskripsi & Indikator Penilaian
            </label>
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Penjelasan kriteria penilaian yang harus dipenuhi..."
              className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Aspek'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
