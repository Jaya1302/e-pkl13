import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { JournalRecord, JournalStatus, PklPlacement, Student } from '../../types';
import { journalService } from '../../services/journalService';
import { attendanceService } from '../../services/attendanceService';
import { pklService } from '../../services/pklService';
import { masterService } from '../../services/masterService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  MessageSquare
} from 'lucide-react';

const STATUS_CONFIG: Record<JournalStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' }> = {
  draft: { label: 'Draft Disimpan', variant: 'default' },
  submitted: { label: 'Menunggu Verifikasi', variant: 'warning' },
  verified: { label: 'Diverifikasi & Disetujui', variant: 'success' },
  revision: { label: 'Perlu Revisi', variant: 'danger' },
};

export const JurnalPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const isStudent = role === 'siswa';
  const isTeacherOrMentor = role === 'guru_pembimbing' || role === 'pembimbing_industri' || role === 'super_admin' || role === 'admin_pkl';

  // State
  const [journals, setJournals] = useState<JournalRecord[]>([]);
  const [myPlacement, setMyPlacement] = useState<PklPlacement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Tabs
  const [statusTab, setStatusTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedJournal, setSelectedJournal] = useState<JournalRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    competency: '',
    duration_hours: 8,
    obstacles: '',
    solution: '',
    photo_url: '',
    status: 'submitted' as JournalStatus,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allJournals, allPlacements, allStudents] = await Promise.all([
        journalService.getJournals(),
        pklService.getPlacements(),
        masterService.getStudents(),
      ]);

      setStudents(allStudents);
      setJournals(allJournals);

      if (isStudent) {
        const studentObj = user?.student || allStudents.find((s) => s.email === user?.email || s.name === user?.name) || allStudents[0];
        const pl = user?.placement || allPlacements.find((p) => p.student_id === studentObj?.id);
        setMyPlacement(pl || null);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat logbook jurnal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isStudent]);

  // Photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setSelectedJournal(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      activity: '',
      competency: '',
      duration_hours: 8,
      obstacles: '',
      solution: '',
      photo_url: '',
      status: 'submitted',
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setIsFormOpen(true);
  };

  // Open Form for Edit (draft or revision)
  const handleOpenEdit = (journal: JournalRecord) => {
    setSelectedJournal(journal);
    setFormData({
      date: journal.date,
      activity: journal.activity,
      competency: journal.competency,
      duration_hours: journal.duration_hours,
      obstacles: journal.obstacles || '',
      solution: journal.solution || '',
      photo_url: journal.photo_url || '',
      status: journal.status,
    });
    setPhotoPreview(journal.photo_url || '');
    setIsFormOpen(true);
  };

  // Submit Journal
  const handleFormSubmit = async (submitType: 'draft' | 'submitted') => {
    if (!formData.activity || !formData.competency) {
      showToast('Uraian kegiatan dan kompetensi kejuruan wajib diisi.', 'error');
      return;
    }
    if (!myPlacement) {
      showToast('Penempatan PKL tidak ditemukan.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile) {
        photoUrl = await attendanceService.uploadPhoto(photoFile, 'journal-photos');
      }

      const payload = {
        ...formData,
        photo_url: photoUrl,
        status: submitType,
        placement_id: myPlacement.id,
        student_id: myPlacement.student_id,
      };

      if (selectedJournal) {
        await journalService.updateJournal(selectedJournal.id, payload);
        showToast(
          submitType === 'submitted' ? 'Jurnal berhasil diserahkan ke guru pembimbing.' : 'Draft jurnal disimpan.',
          'success'
        );
      } else {
        await journalService.createJournal(payload);
        showToast(
          submitType === 'submitted' ? 'Jurnal harian berhasil disubmit!' : 'Draft jurnal berhasil disimpan.',
          'success'
        );
      }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan jurnal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher Action: Verify & Approve
  const handleVerifySubmit = async () => {
    if (!selectedJournal) return;
    setIsSubmitting(true);
    try {
      await journalService.verifyJournal(selectedJournal.id, user?.id || 't-1', teacherNotes);
      showToast('Jurnal siswa berhasil diverifikasi dan disetujui.', 'success');
      setIsVerifyOpen(false);
      setIsDetailOpen(false);
      setTeacherNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memverifikasi jurnal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher Action: Request Revision
  const handleRevisionSubmit = async () => {
    if (!selectedJournal) return;
    if (!teacherNotes) {
      showToast('Wajib memberikan catatan alasan revisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await journalService.requestRevision(selectedJournal.id, user?.id || 't-1', teacherNotes);
      showToast('Permintaan revisi berhasil dikirimkan ke siswa.', 'warning');
      setIsRevisionOpen(false);
      setIsDetailOpen(false);
      setTeacherNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal meminta revisi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Draft
  const handleDelete = async () => {
    if (!selectedJournal) return;
    setIsSubmitting(true);
    try {
      await journalService.deleteJournal(selectedJournal.id);
      showToast('Jurnal berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus jurnal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchTab = statusTab === 'all' ? true : j.status === statusTab;
      const matchSearch =
        (j.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.activity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.competency || '').toLowerCase().includes(searchTerm.toLowerCase());

      // If student role, only show own journals
      if (isStudent && myPlacement) {
        return matchTab && matchSearch && j.student_id === myPlacement.student_id;
      }
      return matchTab && matchSearch;
    });
  }, [journals, statusTab, searchTerm, isStudent, myPlacement]);

  // Tab Badge counts
  const tabCounts = useMemo(() => {
    const list = isStudent && myPlacement ? journals.filter((j) => j.student_id === myPlacement.student_id) : journals;
    return {
      all: list.length,
      submitted: list.filter((j) => j.status === 'submitted').length,
      verified: list.filter((j) => j.status === 'verified').length,
      revision: list.filter((j) => j.status === 'revision').length,
      draft: list.filter((j) => j.status === 'draft').length,
    };
  }, [journals, isStudent, myPlacement]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-brand-600" />
            Jurnal & Logbook Harian PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan aktivitas kerja harian, kompetensi kejuruan, dokumentasi, dan verifikasi guru pembimbing.
          </p>
        </div>

        {isStudent && (
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Tulis Jurnal Hari Ini
          </Button>
        )}
      </div>

      {/* KPI Cards for Logbook */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200/80">
          <span className="text-xs font-semibold text-slate-500 block">Total Jurnal</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{tabCounts.all}</div>
          <span className="text-[10px] text-slate-400 font-medium">Logbook tersimpan</span>
        </Card>

        <Card className="p-4 bg-amber-50/50 border-amber-200/60">
          <span className="text-xs font-semibold text-amber-800 block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
          </span>
          <div className="text-2xl font-extrabold text-amber-900 mt-0.5">{tabCounts.submitted}</div>
          <span className="text-[10px] text-amber-700 font-semibold">Perlu dicek guru</span>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200/60">
          <span className="text-xs font-semibold text-emerald-800 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">{tabCounts.verified}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Kompetensi valid</span>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200/60">
          <span className="text-xs font-semibold text-rose-800 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Perlu Revisi
          </span>
          <div className="text-2xl font-extrabold text-rose-900 mt-0.5">{tabCounts.revision}</div>
          <span className="text-[10px] text-rose-700 font-semibold">Perlu perbaikan siswa</span>
        </Card>
      </div>

      {/* Tabs & Search Filter */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'Semua Jurnal', count: tabCounts.all },
              { key: 'submitted', label: 'Menunggu', count: tabCounts.submitted },
              { key: 'verified', label: 'Disetujui', count: tabCounts.verified },
              { key: 'revision', label: 'Revisi', count: tabCounts.revision },
              { key: 'draft', label: 'Draft', count: tabCounts.draft },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusTab === tab.key
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kegiatan, kompetensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data jurnal..." />
      ) : filteredJournals.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="Tidak Ada Jurnal"
          description={
            isStudent
              ? 'Anda belum memiliki entri jurnal untuk filter ini. Klik tombol di atas untuk membuat jurnal baru.'
              : 'Belum ada data jurnal siswa bimbingan pada filter ini.'
          }
          actionText={isStudent ? 'Tulis Jurnal Sekarang' : undefined}
          onAction={isStudent ? handleOpenCreate : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tanggal</TableHeaderCell>
              {!isStudent && <TableHeaderCell>Siswa / DUDI</TableHeaderCell>}
              <TableHeaderCell>Uraian Kegiatan Kerja</TableHeaderCell>
              <TableHeaderCell>Kompetensi</TableHeaderCell>
              <TableHeaderCell>Durasi</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJournals.map((j) => {
              const statusConf = STATUS_CONFIG[j.status] || STATUS_CONFIG.draft;
              return (
                <TableRow key={j.id}>
                  <TableCell className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {formatDate(j.date)}
                  </TableCell>

                  {!isStudent && (
                    <TableCell className="text-xs">
                      <div className="font-extrabold text-slate-900">{j.student?.name}</div>
                      <div className="text-[11px] text-slate-500">{j.placement?.dudi?.name}</div>
                    </TableCell>
                  )}

                  <TableCell className="text-xs max-w-sm">
                    <p className="font-medium text-slate-800 line-clamp-2">{j.activity}</p>
                    {j.teacher_notes && (
                      <div className="mt-1 text-[11px] text-rose-700 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100 flex items-start gap-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Catatan Guru: {j.teacher_notes}</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-brand-700 font-semibold max-w-xs truncate">
                    {j.competency}
                  </TableCell>

                  <TableCell className="text-xs font-mono font-bold text-slate-700">
                    {j.duration_hours} Jam
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusConf.variant} size="sm">
                      {statusConf.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedJournal(j);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                        title="Lihat Detail Logbook"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Student edit allowed if draft or revision */}
                      {isStudent && (j.status === 'draft' || j.status === 'revision') && (
                        <button
                          onClick={() => handleOpenEdit(j)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Jurnal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Teacher Verification Actions */}
                      {isTeacherOrMentor && j.status === 'submitted' && (
                        <button
                          onClick={() => {
                            setSelectedJournal(j);
                            setIsVerifyOpen(true);
                          }}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-bold text-xs flex items-center gap-1"
                          title="Verifikasi Jurnal"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Student delete if draft */}
                      {isStudent && j.status === 'draft' && (
                        <button
                          onClick={() => {
                            setSelectedJournal(j);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Form Modal (Create / Edit Journal) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedJournal ? 'Edit Jurnal Kegiatan PKL' : 'Tulis Jurnal Kegiatan Harian PKL'}
        description="Isi aktivitas kerja, kompetensi yang dipelajari, serta dokumentasi foto pelaksanaan."
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Pelaksanaan"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Input
              label="Durasi Kerja (Jam)"
              type="number"
              step="0.5"
              min="1"
              max="12"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 8 })}
              required
            />
          </div>

          <Input
            label="Kompetensi Kejuruan yang Diterapkan"
            placeholder="Contoh: Splicing Kabel Fiber Optik FTTH / Perawatan Mesin Bubut CNC"
            value={formData.competency}
            onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Rincian Kegiatan Kerja Harian *</label>
            <textarea
              rows={3}
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              placeholder="Deskripsikan langkah-langkah kerja yang Anda lakukan secara detail..."
              required
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700">Kendala / Masalah yang Dihadapi</label>
              <textarea
                rows={2}
                value={formData.obstacles}
                onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                placeholder="Contoh: Redaman kabel optik melebihi batas standar..."
                className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700">Solusi / Pemecahan Masalah</label>
              <textarea
                rows={2}
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="Contoh: Pembersihan ferrule dengan alkohol 99% & recutting..."
                className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Photo documentation */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Foto Dokumentasi Kegiatan</label>
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center gap-4">
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleFormSubmit('draft')}
            >
              Simpan Sebagai Draft
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={isSubmitting}
                onClick={() => handleFormSubmit('submitted')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit ke Guru
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal & Teacher Review */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Lembar Detail Logbook Jurnal PKL"
        description="Rincian kegiatan harian siswa dan histori verifikasi pembimbing."
        maxWidth="lg"
      >
        {selectedJournal && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Siswa & DUDI:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedJournal.student?.name} &bull; {selectedJournal.placement?.dudi?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Tanggal Pelaksanaan:</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedJournal.date)} ({selectedJournal.duration_hours} Jam)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Kompetensi:</span>
                <span className="font-bold text-brand-700">{selectedJournal.competency}</span>
              </div>
              <div className="space-y-1 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold block">Uraian Kegiatan:</span>
                <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                  {selectedJournal.activity}
                </p>
              </div>
              {selectedJournal.obstacles && (
                <div className="space-y-1 border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold block">Kendala & Solusi:</span>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-amber-900 space-y-1">
                    <p><strong>Kendala:</strong> {selectedJournal.obstacles}</p>
                    {selectedJournal.solution && <p><strong>Solusi:</strong> {selectedJournal.solution}</p>}
                  </div>
                </div>
              )}
              {selectedJournal.photo_url && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Dokumentasi Foto:</span>
                  <img
                    src={selectedJournal.photo_url}
                    alt="Dokumentasi"
                    className="w-full max-h-56 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Teacher Notes if any */}
            {selectedJournal.teacher_notes && (
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 space-y-1">
                <span className="font-bold text-[11px] uppercase tracking-wider block">Catatan Guru Pembimbing:</span>
                <p>{selectedJournal.teacher_notes}</p>
              </div>
            )}

            {/* Teacher Verification Buttons */}
            <div className="flex justify-between items-center pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>

              {isTeacherOrMentor && selectedJournal.status === 'submitted' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRevisionOpen(true);
                    }}
                    leftIcon={<AlertTriangle className="w-4 h-4" />}
                  >
                    Minta Revisi
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsVerifyOpen(true);
                    }}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Verifikasi & Setujui
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Teacher Verification Modal */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        title="Verifikasi & Setujui Jurnal PKL"
        description="Berikan catatan apresiasi atau evaluasi untuk siswa bimbingan Anda."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900">
            Anda akan menyetujui jurnal kegiatan tanggal <strong>{selectedJournal && formatDate(selectedJournal.date)}</strong> oleh <strong>{selectedJournal?.student?.name}</strong>.
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Catatan Evaluasi Guru (Opsional)</label>
            <textarea
              rows={3}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Contoh: Logbook sangat baik dan sesuai target kompetensi..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsVerifyOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="success"
              isLoading={isSubmitting}
              onClick={handleVerifySubmit}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Setujui Jurnal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Teacher Request Revision Modal */}
      <Modal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        title="Minta Revisi Jurnal PKL"
        description="Instruksikan perbaikan apa yang harus dilengkapi oleh siswa."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-900">
            Status jurnal akan diubah menjadi <strong>Perlu Revisi</strong> sehingga siswa dapat mengedit kembali laporannya.
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Instruksi Perbaikan Revisi *</label>
            <textarea
              rows={3}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Contoh: Tolong lengkapi foto saat proses pengukuran daya optik dan perjelas kendala..."
              required
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsRevisionOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleRevisionSubmit}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Kirim Permintaan Revisi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Draft Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Draft Jurnal"
        description="Apakah Anda yakin ingin menghapus draft jurnal ini?"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">Draft jurnal kegiatan akan dihapus secara permanen.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
              Ya, Hapus Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
