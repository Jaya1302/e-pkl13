import React, { useState, useEffect, useMemo } from 'react';
import {
  PklPlacement,
  PklPeriod,
  Student,
  Dudi,
  Teacher,
  IndustryMentor,
  PlacementStatus,
  Major
} from '../../types';
import { pklService } from '../../services/pklService';
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
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Briefcase,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

const STATUS_CONFIG: Record<PlacementStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral' }> = {
  belum_mulai: { label: 'Belum Mulai', variant: 'warning' },
  aktif: { label: 'Sedang Berjalan', variant: 'success' },
  selesai: { label: 'Selesai PKL', variant: 'info' },
  dibatalkan: { label: 'Dibatalkan', variant: 'danger' },
};

export const PenempatanPage: React.FC = () => {
  const { showToast } = useToast();

  // State Data
  const [placements, setPlacements] = useState<PklPlacement[]>([]);
  const [periods, setPeriods] = useState<PklPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [mentors, setMentors] = useState<IndustryMentor[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');
  const [selectedDudiFilter, setSelectedDudiFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isSingleFormOpen, setIsSingleFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPlacement, setSelectedPlacement] = useState<PklPlacement | null>(null);

  // Single Form State
  const [singleFormData, setSingleFormData] = useState({
    period_id: '',
    student_id: '',
    dudi_id: '',
    teacher_id: '',
    industry_mentor_id: '',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Teknisi Operasional',
    status: 'aktif' as PlacementStatus,
    notes: '',
  });

  // Bulk Assignment State
  const [bulkSelectedStudents, setBulkSelectedStudents] = useState<string[]>([]);
  const [bulkShowAll, setBulkShowAll] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    period_id: '',
    dudi_id: '',
    teacher_id: '',
    industry_mentor_id: '',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    division: 'Peserta PKL',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        placementsData,
        periodsData,
        studentsData,
        dudiData,
        teachersData,
        mentorsData,
        majorsData,
      ] = await Promise.all([
        pklService.getPlacements(),
        pklService.getPeriods(),
        masterService.getStudents(),
        masterService.getDudi(),
        masterService.getTeachers(),
        masterService.getMentors(),
        masterService.getMajors(),
      ]);

      setPlacements(placementsData);
      setPeriods(periodsData);
      setStudents(studentsData);
      setDudiList(dudiData);
      setTeachers(teachersData);
      setMentors(mentorsData);
      setMajors(majorsData);

      // Default active period
      const activeP = periodsData.find((p) => p.is_active) || periodsData[0];
      if (activeP) {
        setSingleFormData((prev) => ({ ...prev, period_id: activeP.id, start_date: activeP.start_date, end_date: activeP.end_date }));
        setBulkFormData((prev) => ({ ...prev, period_id: activeP.id, start_date: activeP.start_date, end_date: activeP.end_date }));
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data penempatan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered List
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchSearch =
        (p.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.student?.nis || '').includes(searchTerm) ||
        (p.dudi?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.teacher?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.division || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchPeriod = selectedPeriodFilter ? p.period_id === selectedPeriodFilter : true;
      const matchMajor = selectedMajorFilter ? p.student?.class?.major_id === selectedMajorFilter : true;
      const matchDudi = selectedDudiFilter ? p.dudi_id === selectedDudiFilter : true;
      const matchStatus = selectedStatusFilter ? p.status === selectedStatusFilter : true;

      return matchSearch && matchPeriod && matchMajor && matchDudi && matchStatus;
    });
  }, [placements, searchTerm, selectedPeriodFilter, selectedMajorFilter, selectedDudiFilter, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredPlacements.length / pageSize) || 1;
  const paginatedPlacements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlacements.slice(start, start + pageSize);
  }, [filteredPlacements, currentPage, pageSize]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const placedStudents = students.filter((s) => s.pkl_status !== 'belum_ditempatkan').length;
    const unplacedStudents = totalStudents - placedStudents;
    const activePlacements = placements.filter((p) => p.status === 'aktif').length;
    const completedPlacements = placements.filter((p) => p.status === 'selesai').length;

    return {
      totalStudents,
      placedStudents,
      unplacedStudents,
      activePlacements,
      completedPlacements,
    };
  }, [students, placements]);

  // Students eligible for new placement (unplaced)
  const unplacedStudentsList = useMemo(() => {
    return students.filter((s) => s.pkl_status === 'belum_ditempatkan');
  }, [students]);

  const availableStudentsForBulk = useMemo(() => {
    return bulkShowAll ? students : (unplacedStudentsList.length > 0 ? unplacedStudentsList : students);
  }, [bulkShowAll, students, unplacedStudentsList]);

  // Mentors filtered by selected DUDI in form
  const availableMentorsForSingle = useMemo(() => {
    if (!singleFormData.dudi_id) return [];
    return mentors.filter((m) => m.dudi_id === singleFormData.dudi_id);
  }, [mentors, singleFormData.dudi_id]);

  const availableMentorsForBulk = useMemo(() => {
    if (!bulkFormData.dudi_id) return [];
    return mentors.filter((m) => m.dudi_id === bulkFormData.dudi_id);
  }, [mentors, bulkFormData.dudi_id]);

  // Target DUDI Quota check
  const getDudiQuotaInfo = (dudiId: string, periodId: string) => {
    const dudi = dudiList.find((d) => d.id === dudiId);
    if (!dudi) return { total: 0, used: 0, remaining: 0 };
    const used = placements.filter(
      (p) => p.dudi_id === dudiId && p.period_id === periodId && p.status !== 'dibatalkan'
    ).length;
    return {
      total: dudi.quota,
      used,
      remaining: Math.max(dudi.quota - used, 0),
    };
  };

  const handleOpenCreateSingle = () => {
    setSelectedPlacement(null);
    const activeP = periods.find((p) => p.is_active) || periods[0];
    const defaultStudent = unplacedStudentsList[0]?.id || students[0]?.id || '';
    const defaultDudi = dudiList[0]?.id || '';
    const defaultTeacher = teachers[0]?.id || '';

    setSingleFormData({
      period_id: activeP?.id || '',
      student_id: defaultStudent,
      dudi_id: defaultDudi,
      teacher_id: defaultTeacher,
      industry_mentor_id: '',
      start_date: activeP?.start_date || '2026-07-15',
      end_date: activeP?.end_date || '2026-10-15',
      division: 'Teknisi Operasional',
      status: 'aktif',
      notes: '',
    });
    setIsSingleFormOpen(true);
  };

  const handleOpenEdit = (placement: PklPlacement) => {
    setSelectedPlacement(placement);
    setSingleFormData({
      period_id: placement.period_id,
      student_id: placement.student_id,
      dudi_id: placement.dudi_id,
      teacher_id: placement.teacher_id,
      industry_mentor_id: placement.industry_mentor_id || '',
      start_date: placement.start_date,
      end_date: placement.end_date,
      division: placement.division || '',
      status: placement.status,
      notes: placement.notes || '',
    });
    setIsSingleFormOpen(true);
  };

  const handleOpenDetail = (placement: PklPlacement) => {
    setSelectedPlacement(placement);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (placement: PklPlacement) => {
    setSelectedPlacement(placement);
    setIsDeleteOpen(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFormData.student_id || !singleFormData.dudi_id || !singleFormData.teacher_id || !singleFormData.period_id) {
      showToast('Periode, Siswa, DUDI, dan Guru Pembimbing wajib dipilih.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPlacement) {
        await pklService.updatePlacement(selectedPlacement.id, singleFormData);
        showToast('Data penempatan berhasil diperbarui.', 'success');
      } else {
        await pklService.createPlacement(singleFormData);
        showToast('Siswa berhasil ditempatkan ke DUDI.', 'success');
      }
      setIsSingleFormOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan penempatan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedStudents.length === 0) {
      showToast('Pilih minimal satu siswa untuk di-assign.', 'error');
      return;
    }
    if (!bulkFormData.dudi_id || !bulkFormData.teacher_id || !bulkFormData.period_id) {
      showToast('Periode, DUDI, dan Guru Pembimbing wajib ditentukan.', 'error');
      return;
    }

    const quotaInfo = getDudiQuotaInfo(bulkFormData.dudi_id, bulkFormData.period_id);
    if (bulkSelectedStudents.length > quotaInfo.remaining) {
      showToast(
        `Gagal: Jumlah siswa terpilih (${bulkSelectedStudents.length}) melebihi sisa kuota DUDI (${quotaInfo.remaining} kursi).`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await pklService.bulkAssignPlacements({
        studentIds: bulkSelectedStudents,
        ...bulkFormData,
      });

      if (res.errors.length > 0) {
        showToast(`Penempatan selesai dengan catatan: ${res.successCount} berhasil, ${res.errors.length} gagal.`, 'warning');
      } else {
        showToast(`Berhasil menempatkan ${res.successCount} siswa secara massal!`, 'success');
      }

      setBulkSelectedStudents([]);
      setIsBulkModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal melakukan bulk assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlacement) return;
    setIsSubmitting(true);
    try {
      await pklService.deletePlacement(selectedPlacement.id);
      showToast('Data penempatan berhasil dihapus & status siswa di-reset.', 'success');
      setIsDeleteOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus penempatan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSelectAllBulk = () => {
    if (bulkSelectedStudents.length === availableStudentsForBulk.length) {
      setBulkSelectedStudents([]);
    } else {
      setBulkSelectedStudents(availableStudentsForBulk.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-brand-600" />
            Manajemen Penempatan Siswa PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Plotting siswa ke DUDI mitra, penugasan guru pembimbing, dan instruktur industri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsBulkModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
          >
            Bulk Assignment
          </Button>
          <Button onClick={handleOpenCreateSingle} leftIcon={<Plus className="w-4 h-4" />}>
            Tempatkan Siswa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200/80">
          <span className="text-xs font-semibold text-slate-500 block">Total Siswa</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalStudents}</div>
          <span className="text-[10px] text-slate-400 font-medium">Tingkat XI/XII</span>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200/60">
          <span className="text-xs font-semibold text-emerald-800 block flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Ditempatkan
          </span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">{stats.placedStudents}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {stats.totalStudents ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0}% Terplot
          </span>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200/60">
          <span className="text-xs font-semibold text-rose-800 block flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" /> Belum Ditempatkan
          </span>
          <div className="text-2xl font-extrabold text-rose-900 mt-0.5">{stats.unplacedStudents}</div>
          <span className="text-[10px] text-rose-700 font-semibold">Perlu plotting DUDI</span>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200/60">
          <span className="text-xs font-semibold text-blue-800 block">PKL Sedang Aktif</span>
          <div className="text-2xl font-extrabold text-blue-900 mt-0.5">{stats.activePlacements}</div>
          <span className="text-[10px] text-blue-700 font-medium">{stats.completedPlacements} Selesai</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari siswa, NIS, DUDI, guru, atau divisi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedPeriodFilter}
            onChange={(e) => {
              setSelectedPeriodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">Semua Periode Gelombang</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_active ? '★ (Aktif)' : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedMajorFilter}
            onChange={(e) => {
              setSelectedMajorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">Semua Jurusan</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">Semua Status Penempatan</option>
            {(Object.keys(STATUS_CONFIG) as PlacementStatus[]).map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data penempatan siswa..." />
      ) : filteredPlacements.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="Tidak Ada Data Penempatan"
          description={searchTerm || selectedPeriodFilter ? 'Tidak ditemukan data penempatan sesuai filter.' : 'Belum ada siswa yang ditempatkan ke DUDI.'}
          actionText="Tempatkan Siswa Baru"
          onAction={handleOpenCreateSingle}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Siswa / Kelas</TableHeaderCell>
                <TableHeaderCell>Perusahaan Mitra (DUDI)</TableHeaderCell>
                <TableHeaderCell>Guru Pembimbing</TableHeaderCell>
                <TableHeaderCell>Instruktur Industri</TableHeaderCell>
                <TableHeaderCell>Rentang Waktu</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPlacements.map((p) => {
                const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.belum_mulai;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">
                      <div className="font-extrabold text-slate-900">{p.student?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        NIS: <span className="font-mono">{p.student?.nis}</span> &bull; {p.student?.class?.name} ({p.student?.class?.major?.code})
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold text-brand-700">{p.dudi?.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Posisi: {p.division || 'Peserta PKL'}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {p.teacher?.name || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {p.industry_mentor?.name || <span className="text-slate-400 italic">Belum ditentukan</span>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div>{formatDate(p.start_date)}</div>
                      <div className="text-[11px] text-slate-400">s/d {formatDate(p.end_date)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConf.variant} size="sm">
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(p)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Penempatan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus Penempatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500">
              <span>
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredPlacements.length} penempatan)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((pg) => Math.max(pg - 1, 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((pg) => Math.min(pg + 1, totalPages))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Placement Form Modal */}
      <Modal
        isOpen={isSingleFormOpen}
        onClose={() => setIsSingleFormOpen(false)}
        title={selectedPlacement ? 'Edit Data Penempatan PKL' : 'Plotting Penempatan Siswa ke DUDI'}
        description="Hubungkan siswa dengan gelombang periode, DUDI mitra, guru pembimbing, dan instruktur."
        maxWidth="xl"
      >
        <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gelombang / Periode PKL"
              value={singleFormData.period_id}
              onChange={(e) => {
                const p = periods.find((x) => x.id === e.target.value);
                setSingleFormData({
                  ...singleFormData,
                  period_id: e.target.value,
                  start_date: p ? p.start_date : singleFormData.start_date,
                  end_date: p ? p.end_date : singleFormData.end_date,
                });
              }}
              required
            >
              <option value="">Pilih Periode</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_active ? '★ (Aktif)' : ''}
                </option>
              ))}
            </Select>

            <Select
              label="Siswa Peserta"
              value={singleFormData.student_id}
              onChange={(e) => setSingleFormData({ ...singleFormData, student_id: e.target.value })}
              required
              disabled={Boolean(selectedPlacement)}
            >
              <option value="">Pilih Siswa</option>
              {selectedPlacement ? (
                <option value={selectedPlacement.student_id}>
                  {selectedPlacement.student?.name} (NIS: {selectedPlacement.student?.nis})
                </option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NIS: {s.nis} - {s.class?.name || 'Kelas'}) {s.pkl_status === 'sedang_pkl' ? '— [Sudah Terplot]' : ''}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Select
                label="Perusahaan Mitra (DUDI)"
                value={singleFormData.dudi_id}
                onChange={(e) => setSingleFormData({ ...singleFormData, dudi_id: e.target.value, industry_mentor_id: '' })}
                required
              >
                <option value="">Pilih DUDI Mitra</option>
                {dudiList.map((d) => {
                  const q = getDudiQuotaInfo(d.id, singleFormData.period_id);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} (Sisa: {q.remaining}/{q.total})
                    </option>
                  );
                })}
              </Select>
              {singleFormData.dudi_id && (
                <p className="text-[11px] text-brand-600 font-semibold mt-1">
                  Sisa Kuota DUDI: {getDudiQuotaInfo(singleFormData.dudi_id, singleFormData.period_id).remaining} kursi
                </p>
              )}
            </div>

            <Select
              label="Guru Pembimbing Sekolah"
              value={singleFormData.teacher_id}
              onChange={(e) => setSingleFormData({ ...singleFormData, teacher_id: e.target.value })}
              required
            >
              <option value="">Pilih Guru Pembimbing</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.major?.code || 'Umum'})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Instruktur / Pembimbing Industri"
              value={singleFormData.industry_mentor_id}
              onChange={(e) => setSingleFormData({ ...singleFormData, industry_mentor_id: e.target.value })}
            >
              <option value="">Pilih Pembimbing Industri (Opsional)</option>
              {availableMentorsForSingle.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.position || 'Mentor'})
                </option>
              ))}
            </Select>

            <Input
              label="Posisi / Bagian Pekerjaan"
              placeholder="Contoh: Network Operations, QC Assembly"
              value={singleFormData.division}
              onChange={(e) => setSingleFormData({ ...singleFormData, division: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Tanggal Mulai PKL"
              type="date"
              value={singleFormData.start_date}
              onChange={(e) => setSingleFormData({ ...singleFormData, start_date: e.target.value })}
              required
            />

            <Input
              label="Tanggal Selesai PKL"
              type="date"
              value={singleFormData.end_date}
              onChange={(e) => setSingleFormData({ ...singleFormData, end_date: e.target.value })}
              required
            />

            <Select
              label="Status Penempatan"
              value={singleFormData.status}
              onChange={(e) => setSingleFormData({ ...singleFormData, status: e.target.value as PlacementStatus })}
            >
              {(Object.keys(STATUS_CONFIG) as PlacementStatus[]).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Catatan Khusus Penempatan</label>
            <textarea
              rows={2}
              value={singleFormData.notes}
              onChange={(e) => setSingleFormData({ ...singleFormData, notes: e.target.value })}
              placeholder="Shift kerja, seragam, kontak darurat, dll..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSingleFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedPlacement ? 'Simpan Perubahan' : 'Tempatkan Siswa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Assignment Modal Wizard */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Penugasan Penempatan Massal (Bulk Assignment)"
        description="Pilih banyak siswa sekaligus yang belum ditempatkan dan tetapkan ke DUDI & Guru Pembimbing dalam 1 langkah."
        maxWidth="2xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-5 text-xs">
          {/* Target Configuration */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="font-bold text-slate-900 block text-xs">1. Konfigurasi Tujuan Penempatan:</span>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Periode PKL"
                value={bulkFormData.period_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, period_id: e.target.value })}
                required
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Perusahaan Mitra (DUDI)"
                value={bulkFormData.dudi_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, dudi_id: e.target.value, industry_mentor_id: '' })}
                required
              >
                <option value="">Pilih DUDI</option>
                {dudiList.map((d) => {
                  const q = getDudiQuotaInfo(d.id, bulkFormData.period_id);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} (Sisa Kuota: {q.remaining}/{q.total})
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Guru Pembimbing"
                value={bulkFormData.teacher_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, teacher_id: e.target.value })}
                required
              >
                <option value="">Pilih Guru Pembimbing</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Instruktur Industri (Opsional)"
                value={bulkFormData.industry_mentor_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, industry_mentor_id: e.target.value })}
              >
                <option value="">Pilih Instruktur</option>
                {availableMentorsForBulk.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.position})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Student Multi Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 block text-xs">
                2. Pilih Siswa ({bulkSelectedStudents.length} Terpilih):
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBulkShowAll(!bulkShowAll)}
                  className="text-slate-600 hover:text-brand-600 font-semibold text-[11px] underline"
                >
                  {bulkShowAll ? 'Tampilkan Hanya Belum Ditempatkan' : 'Tampilkan Semua Siswa'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleSelectAllBulk}
                  className="text-brand-700 font-bold hover:underline text-[11px]"
                >
                  {bulkSelectedStudents.length === availableStudentsForBulk.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>
            </div>

            {availableStudentsForBulk.length === 0 ? (
              <p className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl text-xs">
                Tidak ada data siswa yang tersedia untuk penempatan.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200/80 p-2 space-y-1 bg-white">
                {availableStudentsForBulk.map((st) => {
                  const isChecked = bulkSelectedStudents.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-brand-50 border-brand-200 text-brand-950 font-bold'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelectedStudents([...bulkSelectedStudents, st.id]);
                            } else {
                              setBulkSelectedStudents(bulkSelectedStudents.filter((id) => id !== st.id));
                            }
                          }}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                        />
                        <div>
                          <span>{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-2">NIS: {st.nis}</span>
                          {st.pkl_status === 'sedang_pkl' && (
                            <span className="text-[10px] text-emerald-600 font-medium ml-1.5">(Sudah Terplot)</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="purple" size="sm">
                        {st.class?.name || 'Kelas XI'}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Siswa terpilih akan langsung berstatus <strong className="text-slate-700 font-bold">Sedang PKL</strong>
            </span>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isSubmitting}
                disabled={bulkSelectedStudents.length === 0}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Assign {bulkSelectedStudents.length} Siswa
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Lembar Detail Penempatan PKL"
        description="Rincian lengkap data siswa, perusahaan mitra DUDI, dan pembimbing."
        maxWidth="lg"
      >
        {selectedPlacement && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Gelombang / Periode:</span>
                <span className="font-extrabold text-brand-700">{selectedPlacement.period?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{selectedPlacement.student?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">NIS & Kelas:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPlacement.student?.nis} &bull; {selectedPlacement.student?.class?.name} ({selectedPlacement.student?.class?.major?.name})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">DUDI Mitra:</span>
                <span className="font-bold text-slate-900">{selectedPlacement.dudi?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Posisi / Bagian:</span>
                <span className="font-semibold text-slate-800">{selectedPlacement.division || 'Peserta PKL'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Guru Pembimbing:</span>
                <span className="font-semibold text-slate-800">{selectedPlacement.teacher?.name} ({selectedPlacement.teacher?.phone_number || '-'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Instruktur Industri:</span>
                <span className="font-semibold text-slate-800">{selectedPlacement.industry_mentor?.name || 'Belum diisi'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Jadwal Pelaksanaan:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedPlacement.start_date)} s/d {formatDate(selectedPlacement.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Penempatan:</span>
                <Badge variant={STATUS_CONFIG[selectedPlacement.status]?.variant || 'neutral'} size="sm">
                  {STATUS_CONFIG[selectedPlacement.status]?.label}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Batalkan Penempatan"
        description="Apakah Anda yakin ingin menghapus data penempatan ini? Status siswa akan dikembalikan ke 'Belum Ditempatkan'."
      >
        {selectedPlacement && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan membatalkan penempatan siswa <strong>{selectedPlacement.student?.name}</strong> di <strong>{selectedPlacement.dudi?.name}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Penempatan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
