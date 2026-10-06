import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MonitoringRecord,
  MonitoringRating,
  StudentMonitoringSummary,
  Teacher,
  Dudi,
  PklPlacement,
  Major
} from '../../types';
import { monitoringService } from '../../services/monitoringService';
import { masterService } from '../../services/masterService';
import { pklService } from '../../services/pklService';
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
  Camera,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Award,
  Settings,
  Download,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  Star,
  Layers,
  ListFilter
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  // Active Tab: 'students' | 'history' | 'analytics'
  const [activeTab, setActiveTab] = useState<'students' | 'history' | 'analytics'>('students');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [summaries, setSummaries] = useState<StudentMonitoringSummary[]>([]);
  const [historyList, setHistoryList] = useState<MonitoringRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [placements, setPlacements] = useState<PklPlacement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [targetStages, setTargetStages] = useState(3);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedDudiFilter, setSelectedDudiFilter] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'full' | 'partial' | 'unmonitored'>('all');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MonitoringRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    placement_id: '',
    monitoring_stage: 1,
    visit_date: new Date().toISOString().split('T')[0],
    attendance_score: 4,
    discipline_score: 4,
    attitude_score: 4,
    competency_score: 4,
    communication_score: 4,
    student_condition: '',
    industry_feedback: '',
    obstacles: '',
    recommendation: '',
    documentation_url: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Role Permissions Check
  const isTeacher = role === 'guru_pembimbing';
  const isAdmin = role === 'super_admin' || role === 'admin_pkl';
  const isExecutive = role === 'kepala_sekolah' || role === 'wakasek';
  const canCreateOrEdit = isTeacher || isAdmin;

  // Identify current teacher ID if logged in as guru
  const currentTeacher = useMemo(() => {
    if (!isTeacher) return null;
    return teachers.find((t) => t.email.toLowerCase() === user?.email.toLowerCase() || t.user_id === user?.id) || null;
  }, [isTeacher, teachers, user]);

  // Initial Fetch
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const stageCount = monitoringService.getTargetStages();
      setTargetStages(stageCount);

      const [teachersData, dudiData, majorsData, placementsData] = await Promise.all([
        masterService.getTeachers(),
        masterService.getDudi(),
        masterService.getMajors(),
        pklService.getPlacements(),
      ]);

      setTeachers(teachersData);
      setDudiList(dudiData);
      setMajors(majorsData);
      setPlacements(placementsData);

      // Determine filter based on role
      const teacherFilterId = isTeacher && currentTeacher ? currentTeacher.id : undefined;

      const [summaryData, historyData, statsData] = await Promise.all([
        monitoringService.getStudentMonitoringSummaries({
          teacherId: teacherFilterId,
        }),
        monitoringService.getMonitoringList({
          teacherId: teacherFilterId,
        }),
        monitoringService.getMonitoringStats(teacherFilterId),
      ]);

      setSummaries(summaryData);
      setHistoryList(historyData);
      setStats(statsData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data monitoring.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, user, currentTeacher?.id]);

  // Filtered Student Summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      // Search
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        s.student.name.toLowerCase().includes(q) ||
        s.student.nis.toLowerCase().includes(q) ||
        s.dudi.name.toLowerCase().includes(q) ||
        s.teacher?.name?.toLowerCase().includes(q);

      // Teacher filter
      const matchTeacher = !selectedTeacherFilter || s.teacher?.id === selectedTeacherFilter;

      // DUDI filter
      const matchDudi = !selectedDudiFilter || s.dudi.id === selectedDudiFilter;

      // Status filter
      let matchStatus = true;
      if (selectedStatusFilter === 'full') matchStatus = s.isFullyMonitored;
      else if (selectedStatusFilter === 'partial') matchStatus = s.completedStages.length > 0 && !s.isFullyMonitored;
      else if (selectedStatusFilter === 'unmonitored') matchStatus = s.completedStages.length === 0;

      return matchSearch && matchTeacher && matchDudi && matchStatus;
    });
  }, [summaries, searchTerm, selectedTeacherFilter, selectedDudiFilter, selectedStatusFilter]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((h) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        h.student?.name?.toLowerCase().includes(q) ||
        h.student?.nis?.toLowerCase().includes(q) ||
        h.dudi?.name?.toLowerCase().includes(q) ||
        h.teacher?.name?.toLowerCase().includes(q) ||
        h.student_condition?.toLowerCase().includes(q);

      const matchTeacher = !selectedTeacherFilter || h.teacher_id === selectedTeacherFilter;
      const matchDudi = !selectedDudiFilter || h.dudi_id === selectedDudiFilter;
      const matchStage = !selectedStageFilter || h.monitoring_stage === parseInt(selectedStageFilter, 10);

      return matchSearch && matchTeacher && matchDudi && matchStage;
    });
  }, [historyList, searchTerm, selectedTeacherFilter, selectedDudiFilter, selectedStageFilter]);

  // Handle Create New Monitoring for a student
  const handleOpenCreateModal = (placementId?: string, defaultStage?: number) => {
    const targetPlacement = placementId || (placements.length > 0 ? placements[0].id : '');
    
    // Auto-detect next stage for this placement if not specified
    let nextStage = defaultStage || 1;
    if (!defaultStage && targetPlacement) {
      const currentStudentSummary = summaries.find((s) => s.placement.id === targetPlacement);
      if (currentStudentSummary) {
        for (let i = 1; i <= targetStages; i++) {
          if (!currentStudentSummary.completedStages.includes(i)) {
            nextStage = i;
            break;
          }
        }
      }
    }

    setSelectedRecord(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      placement_id: targetPlacement,
      monitoring_stage: nextStage,
      visit_date: new Date().toISOString().split('T')[0],
      attendance_score: 4,
      discipline_score: 4,
      attitude_score: 4,
      competency_score: 4,
      communication_score: 4,
      student_condition: '',
      industry_feedback: '',
      obstacles: '',
      recommendation: '',
      documentation_url: '',
    });
    setIsFormOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (record: MonitoringRecord) => {
    setSelectedRecord(record);
    setPhotoFile(null);
    setPhotoPreview(record.documentation_url || null);
    setFormData({
      placement_id: record.placement_id,
      monitoring_stage: record.monitoring_stage,
      visit_date: record.visit_date,
      attendance_score: record.attendance_score,
      discipline_score: record.discipline_score,
      attitude_score: record.attitude_score,
      competency_score: record.competency_score,
      communication_score: record.communication_score,
      student_condition: record.student_condition || '',
      industry_feedback: record.industry_feedback || '',
      obstacles: record.obstacles || '',
      recommendation: record.recommendation || '',
      documentation_url: record.documentation_url || '',
    });
    setIsFormOpen(true);
  };

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB.', 'error');
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.placement_id) {
      showToast('Silakan pilih siswa / penempatan PKL.', 'error');
      return;
    }

    const selectedPlacement = placements.find((p) => p.id === formData.placement_id);
    if (!selectedPlacement) {
      showToast('Data penempatan siswa tidak valid.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = formData.documentation_url;

      if (photoFile) {
        finalPhotoUrl = await monitoringService.uploadDocumentationPhoto(photoFile);
      }

      if (selectedRecord) {
        // Update
        await monitoringService.updateMonitoring(selectedRecord.id, {
          ...formData,
          documentation_url: finalPhotoUrl,
        });
        showToast(`Monitoring Tahap ${formData.monitoring_stage} berhasil diperbarui.`, 'success');
      } else {
        // Create
        await monitoringService.createMonitoring({
          placement_id: selectedPlacement.id,
          student_id: selectedPlacement.student_id,
          teacher_id: selectedPlacement.teacher_id || currentTeacher?.id || 't-1',
          dudi_id: selectedPlacement.dudi_id,
          monitoring_stage: formData.monitoring_stage,
          visit_date: formData.visit_date,
          attendance_score: formData.attendance_score,
          discipline_score: formData.discipline_score,
          attitude_score: formData.attitude_score,
          competency_score: formData.competency_score,
          communication_score: formData.communication_score,
          overall_rating: monitoringService.calculateRating(formData),
          student_condition: formData.student_condition,
          industry_feedback: formData.industry_feedback,
          obstacles: formData.obstacles,
          recommendation: formData.recommendation,
          documentation_url: finalPhotoUrl,
        });
        showToast(`Supervisi Monitoring Tahap ${formData.monitoring_stage} berhasil dicatat!`, 'success');
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data monitoring.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Record
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await monitoringService.deleteMonitoring(recordToDelete.id);
      showToast('Data monitoring berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      setRecordToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus monitoring.', 'error');
    }
  };

  // Handle Save Stage Target Config
  const handleSaveConfig = () => {
    monitoringService.setTargetStages(targetStages);
    showToast(`Target monitoring berhasil disetel menjadi ${targetStages} tahap.`, 'success');
    setIsConfigOpen(false);
    fetchData();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (historyList.length === 0) {
      showToast('Tidak ada data monitoring untuk diexport.', 'warning');
      return;
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'DUDI',
      'Guru Pembimbing',
      'Tahap',
      'Tanggal Kunjungan',
      'Kehadiran',
      'Kedisiplinan',
      'Sikap',
      'Kompetensi',
      'Komunikasi',
      'Predikat',
      'Kondisi Siswa',
      'Rekomendasi',
    ];

    const rows = historyList.map((h, i) => [
      i + 1,
      `"${h.student?.nis || ''}"`,
      `"${h.student?.name || ''}"`,
      `"${h.dudi?.name || ''}"`,
      `"${h.teacher?.name || ''}"`,
      `"Monitoring ${h.monitoring_stage}"`,
      `"${h.visit_date}"`,
      h.attendance_score,
      h.discipline_score,
      h.attitude_score,
      h.competency_score,
      h.communication_score,
      `"${h.overall_rating.replace('_', ' ').toUpperCase()}"`,
      `"${(h.student_condition || '').replace(/"/g, '""')}"`,
      `"${(h.recommendation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Monitoring_PKL_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan monitoring berhasil diunduh.', 'success');
  };

  const getRatingBadge = (rating: MonitoringRating) => {
    switch (rating) {
      case 'sangat_baik':
        return <Badge variant="success">Sangat Baik</Badge>;
      case 'baik':
        return <Badge variant="primary">Baik</Badge>;
      case 'cukup':
        return <Badge variant="warning">Cukup</Badge>;
      case 'perlu_bimbingan':
        return <Badge variant="danger">Perlu Bimbingan</Badge>;
      default:
        return <Badge variant="neutral">{rating}</Badge>;
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 5:
        return '5 - Istimewa';
      case 4:
        return '4 - Sangat Baik';
      case 3:
        return '3 - Baik';
      case 2:
        return '2 - Cukup';
      case 1:
        return '1 - Perlu Bimbingan';
      default:
        return score.toString();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Monitoring Kunjungan PKL
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Phase 6
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervisi dan evaluasi perkembangan kompetensi siswa di Dunia Usaha/Dunia Industri (DUDI)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Target Tahap ({targetStages})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </Button>

          {canCreateOrEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Supervisi Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Metrik Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50/70 to-white border-blue-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Total Siswa Dampingan
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.totalStudents} <span className="text-xs font-normal text-slate-500">Siswa</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-blue-700">{stats.totalVisits} Kunjungan</span> telah tercatat
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Tuntas {targetStages} Tahap
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.fullyMonitored} <span className="text-xs font-normal text-slate-500">({stats.completionRate}%)</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50/70 to-white border-amber-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Belum Lengkap / Belum Dimonitor
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.partiallyMonitored + stats.unmonitored}{' '}
                  <span className="text-xs font-normal text-slate-500">Siswa</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Proses: <strong>{stats.partiallyMonitored}</strong></span>
              <span>Belum Kunjung: <strong>{stats.unmonitored}</strong></span>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50/70 to-white border-purple-100/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  Rata-rata Skor Supervisi
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.avgScore > 0 ? stats.avgScore : '-'} <span className="text-xs font-normal text-slate-500">/ 5.0</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-purple-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Predikat Evaluasi: <strong>{stats.avgScore >= 4.5 ? 'Sangat Baik' : stats.avgScore >= 3.5 ? 'Baik' : 'Cukup'}</strong></span>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Progress Siswa Bimbingan</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {summaries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Histori Kunjungan Supervisi</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {historyList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Laporan & Evaluasi Eksekutif</span>
          </button>
        </div>
      </div>

      {/* 4. Filters Bar */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari siswa, NIS, DUDI, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Teacher Filter (For Admin / Executive) */}
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

          {/* DUDI Filter */}
          <Select
            value={selectedDudiFilter}
            onChange={(e) => setSelectedDudiFilter(e.target.value)}
            className="text-xs sm:text-sm"
          >
            <option value="">Semua Mitra DUDI</option>
            {dudiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.city})
              </option>
            ))}
          </Select>

          {/* Stage / Status Filter */}
          {activeTab === 'students' ? (
            <Select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="text-xs sm:text-sm"
            >
              <option value="all">Semua Status Monitoring</option>
              <option value="full">✅ Tuntas ({targetStages}/{targetStages} Tahap)</option>
              <option value="partial">⏳ Sedang Berjalan (1/{targetStages} atau 2/{targetStages})</option>
              <option value="unmonitored">⚠️ Belum Dimonitor (0/{targetStages})</option>
            </Select>
          ) : (
            <Select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="text-xs sm:text-sm"
            >
              <option value="">Semua Tahap Monitoring</option>
              {Array.from({ length: targetStages }).map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Tahap {idx + 1} (Monitoring {idx + 1})
                </option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {/* 5. Main Tab Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500 mt-3 font-medium">Memuat data monitoring PKL...</p>
        </div>
      ) : (
        <>
          {/* ================= TAB 1: REKAP PROGRESS SISWA ================= */}
          {activeTab === 'students' && (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              {filteredSummaries.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={<Camera className="w-8 h-8" />}
                    title="Tidak ada data siswa ditemukan"
                    description="Coba ubah kata kunci pencarian atau filter status monitoring di atas."
                  />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Siswa / Kelas</TableHeaderCell>
                      <TableHeaderCell>Mitra DUDI & Lokasi</TableHeaderCell>
                      <TableHeaderCell>Guru Pembimbing</TableHeaderCell>
                      <TableHeaderCell>Progress Monitoring ({targetStages} Tahap)</TableHeaderCell>
                      <TableHeaderCell>Rata-rata Skor</TableHeaderCell>
                      <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSummaries.map((item) => {
                      const completedCount = item.completedStages.length;
                      const percent = Math.round((completedCount / targetStages) * 100);

                      return (
                        <TableRow key={item.placement.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Siswa */}
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900">{item.student.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span>NIS: {item.student.nis}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{item.student.class?.name || '-'}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* DUDI */}
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-slate-800 text-xs sm:text-sm">{item.dudi.name}</p>
                                <p className="text-xs text-slate-500">{item.dudi.city}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Guru Pembimbing */}
                          <TableCell>
                            <p className="text-xs sm:text-sm font-medium text-slate-800">
                              {item.teacher?.name || '-'}
                            </p>
                            <p className="text-xs text-slate-400">{item.teacher?.nip || 'NIP: -'}</p>
                          </TableCell>

                          {/* Progress Stages Badges */}
                          <TableCell>
                            <div className="space-y-1.5 min-w-[200px]">
                              {/* Stage Pills */}
                              <div className="flex items-center gap-1.5">
                                {Array.from({ length: targetStages }).map((_, idx) => {
                                  const stageNum = idx + 1;
                                  const isDone = item.completedStages.includes(stageNum);
                                  const stageRecord = item.records.find((r) => r.monitoring_stage === stageNum);

                                  return (
                                    <button
                                      key={stageNum}
                                      onClick={() => {
                                        if (stageRecord) {
                                          setSelectedRecord(stageRecord);
                                          setIsDetailOpen(true);
                                        } else if (canCreateOrEdit) {
                                          handleOpenCreateModal(item.placement.id, stageNum);
                                        }
                                      }}
                                      title={
                                        isDone
                                          ? `Tahap ${stageNum} Selesai (${stageRecord?.visit_date}) - Klik untuk lihat detail`
                                          : canCreateOrEdit
                                          ? `Tahap ${stageNum} Belum - Klik untuk catat supervisi`
                                          : `Tahap ${stageNum} Belum Dilakukan`
                                      }
                                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                        isDone
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                          : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700 border border-dashed border-slate-300'
                                      }`}
                                    >
                                      {isDone ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                                          <span>T{stageNum}</span>
                                        </>
                                      ) : (
                                        <span>T{stageNum}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      item.isFullyMonitored
                                        ? 'bg-emerald-500'
                                        : completedCount > 0
                                        ? 'bg-amber-500'
                                        : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500">
                                  {completedCount}/{targetStages}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Average Score */}
                          <TableCell>
                            {item.averageScore ? (
                              <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                <span className="font-bold text-slate-800 text-sm">{item.averageScore}</span>
                                <span className="text-xs text-slate-400">/ 5.0</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Belum ada skor</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canCreateOrEdit && !item.isFullyMonitored && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCreateModal(item.placement.id)}
                                  className="text-xs py-1 h-8 text-blue-600 hover:bg-blue-50 border-blue-200"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  <span>Supervisi</span>
                                </Button>
                              )}

                              {item.records.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(item.records[0]);
                                    setIsDetailOpen(true);
                                  }}
                                  className="text-xs py-1 h-8 text-slate-600 hover:text-slate-900"
                                  title="Lihat Lembar Supervisi"
                                >
                                  <Eye className="w-3.5 h-3.5" />
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

          {/* ================= TAB 2: HISTORI KUNJUNGAN SUPERVISI ================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="p-12">
                  <EmptyState
                    icon={<Calendar className="w-8 h-8" />}
                    title="Belum ada riwayat supervisi"
                    description="Catat kunjungan monitoring pertama Anda dengan menekan tombol 'Catat Supervisi Baru'."
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredHistory.map((record) => {
                    const avgScore = (
                      (record.attendance_score +
                        record.discipline_score +
                        record.attitude_score +
                        record.competency_score +
                        record.communication_score) /
                      5
                    ).toFixed(1);

                    return (
                      <Card
                        key={record.id}
                        className="p-5 border-slate-200 hover:border-blue-200 transition-all hover:shadow-md bg-white flex flex-col justify-between"
                      >
                        <div>
                          {/* Top row: Stage & Date */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Monitoring Tahap {record.monitoring_stage}
                              </span>
                              {getRatingBadge(record.overall_rating)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{record.visit_date}</span>
                            </div>
                          </div>

                          {/* Student & DUDI info */}
                          <div className="mt-3 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">
                                {record.student?.name || 'Siswa PKL'}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                NIS: {record.student?.nis} • {record.student?.class?.name || '-'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-700">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{record.dudi?.name}</span>
                              </div>
                            </div>

                            {/* Aspect Score Box */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center min-w-[80px]">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skor Rata²</p>
                              <p className="text-xl font-extrabold text-blue-700 mt-0.5">{avgScore}</p>
                              <p className="text-[10px] text-slate-400">dari 5.0</p>
                            </div>
                          </div>

                          {/* 5 Aspect Score Bars */}
                          <div className="mt-4 grid grid-cols-5 gap-1.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-center">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block">Hadir</span>
                              <span className="text-xs font-bold text-slate-800">{record.attendance_score}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block">Disiplin</span>
                              <span className="text-xs font-bold text-slate-800">{record.discipline_score}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block">Sikap</span>
                              <span className="text-xs font-bold text-slate-800">{record.attitude_score}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block">Komp</span>
                              <span className="text-xs font-bold text-slate-800">{record.competency_score}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 block">Komun</span>
                              <span className="text-xs font-bold text-slate-800">{record.communication_score}</span>
                            </div>
                          </div>

                          {/* Notes preview */}
                          {record.student_condition && (
                            <div className="mt-3 text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-md border border-blue-100">
                              <span className="font-semibold text-blue-900 block mb-0.5">Kondisi Siswa:</span>
                              <p className="line-clamp-2 italic">"{record.student_condition}"</p>
                            </div>
                          )}

                          {/* Photo preview thumbnail */}
                          {record.documentation_url && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-200/60">
                              <img
                                src={record.documentation_url}
                                alt="Dokumentasi"
                                className="w-10 h-10 object-cover rounded-md border border-slate-300"
                              />
                              <div className="truncate">
                                <span className="font-medium text-slate-700 block truncate">Foto Dokumentasi Lapangan</span>
                                <span className="text-[11px] text-slate-400">Terlampir</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            Guru: <strong className="text-slate-700">{record.teacher?.name || '-'}</strong>
                          </p>

                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDetailOpen(true);
                              }}
                              className="text-xs h-7 text-slate-600 hover:text-blue-600"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>Detail</span>
                            </Button>

                            {canCreateOrEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(record)}
                                  className="text-xs h-7 text-slate-600 hover:text-amber-600"
                                >
                                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                                  <span>Edit</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRecordToDelete(record);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-xs h-7 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: LAPORAN & EVALUASI EKSEKUTIF ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Rekap Per Jurusan */}
                <Card className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Distribusi Monitoring per Jurusan</span>
                    </h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    {majors.map((m) => {
                      const majorSummaries = summaries.filter((s) => s.student.major_id === m.id);
                      const total = majorSummaries.length;
                      const done = majorSummaries.filter((s) => s.isFullyMonitored).length;
                      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <div key={m.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-semibold text-slate-800">
                              {m.code} — {m.name}
                            </span>
                            <span className="font-bold text-slate-600">
                              {done} / {total} Siswa Tuntas ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 2. Rekap Aspek Penilaian */}
                <Card className="p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>Rata-rata 5 Aspek Penilaian Supervisi</span>
                    </h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    {[
                      {
                        name: 'Kehadiran & Presensi di DUDI',
                        score: historyList.length
                          ? (
                              historyList.reduce((s, r) => s + r.attendance_score, 0) / historyList.length
                            ).toFixed(1)
                          : 0,
                      },
                      {
                        name: 'Kedisiplinan & Ketaatan SOP / K3',
                        score: historyList.length
                          ? (
                              historyList.reduce((s, r) => s + r.discipline_score, 0) / historyList.length
                            ).toFixed(1)
                          : 0,
                      },
                      {
                        name: 'Sikap, Etika & Integritas Kerja',
                        score: historyList.length
                          ? (historyList.reduce((s, r) => s + r.attitude_score, 0) / historyList.length).toFixed(1)
                          : 0,
                      },
                      {
                        name: 'Penguasaan Kompetensi Kejuruan',
                        score: historyList.length
                          ? (
                              historyList.reduce((s, r) => s + r.competency_score, 0) / historyList.length
                            ).toFixed(1)
                          : 0,
                      },
                      {
                        name: 'Komunikasi & Adaptasi Lapangan',
                        score: historyList.length
                          ? (
                              historyList.reduce((s, r) => s + r.communication_score, 0) / historyList.length
                            ).toFixed(1)
                          : 0,
                      },
                    ].map((aspect, idx) => {
                      const scoreNum = parseFloat(aspect.score as string);
                      const percent = (scoreNum / 5) * 100;

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-medium text-slate-700">{aspect.name}</span>
                            <span className="font-bold text-purple-800">{aspect.score} / 5.0</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* 3. Rekomendasi & Siswa Memerlukan Perhatian Khusus */}
              <Card className="p-5 border-amber-200/80 bg-amber-50/20">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Daftar Siswa dengan Catatan Kendala / Predikat Cukup</span>
                </h3>

                <div className="mt-4 divide-y divide-amber-100">
                  {historyList.filter((h) => h.overall_rating === 'cukup' || h.overall_rating === 'perlu_bimbingan' || (h.obstacles && h.obstacles.length > 5)).length === 0 ? (
                    <p className="text-xs sm:text-sm text-slate-500 py-3 italic">
                      Tidak ada catatan kendala signifikan. Seluruh siswa bimbingan berada dalam kondisi baik.
                    </p>
                  ) : (
                    historyList
                      .filter((h) => h.overall_rating === 'cukup' || h.overall_rating === 'perlu_bimbingan' || (h.obstacles && h.obstacles.length > 5))
                      .map((h) => (
                        <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{h.student?.name}</p>
                              <span className="text-xs text-slate-500">({h.dudi?.name})</span>
                              {getRatingBadge(h.overall_rating)}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              <strong>Kendala:</strong> {h.obstacles || '-'}
                            </p>
                            <p className="text-xs text-blue-700 mt-0.5">
                              <strong>Rekomendasi:</strong> {h.recommendation || '-'}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(h);
                              setIsDetailOpen(true);
                            }}
                            className="text-xs whitespace-nowrap self-start sm:self-center"
                          >
                            Lihat Lembar
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ================= MODAL 1: FORM CATAT / EDIT MONITORING ================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedRecord ? `Edit Supervisi Kunjungan Tahap ${formData.monitoring_stage}` : 'Catat Supervisi Kunjungan PKL'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Placement Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Pilih Siswa & DUDI Bimbingan <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.placement_id}
              onChange={(e) => setFormData({ ...formData, placement_id: e.target.value })}
              disabled={!!selectedRecord}
              required
            >
              <option value="">-- Pilih Siswa Penempatan --</option>
              {placements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.student?.name} ({p.student?.class?.name || 'Kelas'}) — {p.dudi?.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Tahap Monitoring */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tahap Supervisi <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.monitoring_stage}
                onChange={(e) => setFormData({ ...formData, monitoring_stage: parseInt(e.target.value, 10) })}
                required
              >
                {Array.from({ length: targetStages }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Monitoring Tahap {idx + 1}
                  </option>
                ))}
              </Select>
            </div>

            {/* 3. Tanggal Kunjungan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tanggal Kunjungan <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 4. Aspek Penilaian 5 Indikator (1 - 5) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Penilaian 5 Aspek Kunjungan (Skala 1 - 5)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                1: Bimbingan • 2: Cukup • 3: Baik • 4: Sangat Baik • 5: Istimewa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Aspek 1: Kehadiran */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. Kehadiran & Presensi
                </label>
                <Select
                  value={formData.attendance_score}
                  onChange={(e) => setFormData({ ...formData, attendance_score: parseInt(e.target.value, 10) })}
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {getScoreLabel(num)}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Aspek 2: Kedisiplinan */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2. Kedisiplinan & K3
                </label>
                <Select
                  value={formData.discipline_score}
                  onChange={(e) => setFormData({ ...formData, discipline_score: parseInt(e.target.value, 10) })}
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {getScoreLabel(num)}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Aspek 3: Sikap */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  3. Sikap & Etika Kerja
                </label>
                <Select
                  value={formData.attitude_score}
                  onChange={(e) => setFormData({ ...formData, attitude_score: parseInt(e.target.value, 10) })}
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {getScoreLabel(num)}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Aspek 4: Kompetensi */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  4. Kompetensi Kejuruan
                </label>
                <Select
                  value={formData.competency_score}
                  onChange={(e) => setFormData({ ...formData, competency_score: parseInt(e.target.value, 10) })}
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {getScoreLabel(num)}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Aspek 5: Komunikasi */}
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  5. Komunikasi & Kerjasama Tim
                </label>
                <Select
                  value={formData.communication_score}
                  onChange={(e) => setFormData({ ...formData, communication_score: parseInt(e.target.value, 10) })}
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {getScoreLabel(num)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* 5. Catatan Kualitatif */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Kondisi & Adaptasi Siswa di DUDI <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.student_condition}
                onChange={(e) => setFormData({ ...formData, student_condition: e.target.value })}
                placeholder="Contoh: Siswa dalam kondisi sehat, antusias dan mampu beradaptasi cepat dengan tim..."
                className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Masukan / Feedback Pembimbing Industri
              </label>
              <textarea
                rows={2}
                value={formData.industry_feedback}
                onChange={(e) => setFormData({ ...formData, industry_feedback: e.target.value })}
                placeholder="Contoh: Mentor DUDI menyampaikan bahwa kedisiplinan siswa sangat baik..."
                className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Kendala yang Dihadapi (Jika Ada)
                </label>
                <textarea
                  rows={2}
                  value={formData.obstacles}
                  onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                  placeholder="Contoh: Belum ada kendala berarti / Jarak tempat tinggal cukup jauh..."
                  className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rekomendasi / Tindak Lanjut Guru
                </label>
                <textarea
                  rows={2}
                  value={formData.recommendation}
                  onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                  placeholder="Contoh: Pertahankan kedisiplinan dan mulai cicil penyusunan laporan PKL..."
                  className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                />
              </div>
            </div>
          </div>

          {/* 6. Upload Dokumentasi Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Foto Dokumentasi Kunjungan Supervisi
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      setFormData({ ...formData, documentation_url: '' });
                    }}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">Belum Ada</span>
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  id="monitoringPhoto"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="monitoringPhoto"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>{photoPreview ? 'Ganti Foto' : 'Unggah Foto Lapangan'}</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format JPG, PNG, atau WebP. Maksimal 5 MB.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Menyimpan...</span>
                </div>
              ) : selectedRecord ? (
                'Simpan Perubahan'
              ) : (
                'Simpan Supervisi'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL 2: DETAIL LEMBAR SUPERVISI ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Lembar Supervisi Kunjungan PKL"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5">
            {/* Header Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
                    SMK NEGERI 13 BANDUNG
                  </span>
                  <h3 className="text-lg font-extrabold mt-0.5">
                    Monitoring Tahap {selectedRecord.monitoring_stage}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-200 block">Tanggal Kunjungan</span>
                  <span className="text-sm font-bold">{selectedRecord.visit_date}</span>
                </div>
              </div>
            </div>

            {/* Identitas Siswa & DUDI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase block">Siswa PKL</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRecord.student?.name}</p>
                <p className="text-xs text-slate-500">
                  NIS: {selectedRecord.student?.nis} • {selectedRecord.student?.class?.name || '-'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase block">Mitra DUDI</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedRecord.dudi?.name}</p>
                <p className="text-xs text-slate-500">{selectedRecord.dudi?.address}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase block">Guru Pembimbing</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedRecord.teacher?.name}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase block">Predikat Evaluasi</span>
                <div className="mt-1">{getRatingBadge(selectedRecord.overall_rating)}</div>
              </div>
            </div>

            {/* 5 Aspek Skor */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Hasil Evaluasi 5 Aspek
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-900 block">Kehadiran</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                    {selectedRecord.attendance_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 5</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-900 block">Kedisiplinan</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                    {selectedRecord.discipline_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 5</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-900 block">Sikap & Etika</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                    {selectedRecord.attitude_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 5</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-900 block">Kompetensi</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                    {selectedRecord.competency_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 5</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-blue-900 block">Komunikasi</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-1 block">
                    {selectedRecord.communication_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 5</span>
                </div>
              </div>
            </div>

            {/* Catatan Lapangan */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Kondisi & Adaptasi Siswa:</span>
                <p className="text-slate-600">{selectedRecord.student_condition || '-'}</p>
              </div>

              {selectedRecord.industry_feedback && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Feedback Pembimbing Industri:</span>
                  <p className="text-slate-600">{selectedRecord.industry_feedback}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Kendala yang Dihadapi:</span>
                  <p className="text-slate-600">{selectedRecord.obstacles || 'Tidak ada kendala'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Rekomendasi Guru:</span>
                  <p className="text-slate-600">{selectedRecord.recommendation || '-'}</p>
                </div>
              </div>
            </div>

            {/* Foto Dokumentasi */}
            {selectedRecord.documentation_url && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Dokumentasi Foto Kunjungan
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-72 bg-slate-900 flex items-center justify-center">
                  <img
                    src={selectedRecord.documentation_url}
                    alt="Dokumentasi Kunjungan"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Action Close */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL 3: KONFIGURASI TARGET TAHAP ================= */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Pengaturan Target Tahap Monitoring"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600">
            Tentukan jumlah tahapan supervisi wajib yang harus dilakukan oleh guru pembimbing selama masa PKL
            berlangsung.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Jumlah Target Tahap (1 - 10)
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={targetStages}
              onChange={(e) => setTargetStages(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveConfig}>
              Simpan Target
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 4: KONFIRMASI HAPUS ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Data Supervisi Monitoring"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus data <strong>Monitoring Tahap {recordToDelete?.monitoring_stage}</strong>{' '}
            untuk siswa <strong>{recordToDelete?.student?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Hapus Supervisi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
