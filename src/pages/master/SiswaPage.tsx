import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassItem, Major, PklStatus } from '../../types';
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
import { ExcelImportModal } from '../../components/common/ExcelImportModal';
import { downloadExcelTemplate, validateStudentExcel } from '../../utils/excelParser';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  GraduationCap,
  CheckCircle2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PKL_STATUS_CONFIG: Record<PklStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral' }> = {
  belum_ditempatkan: { label: 'Belum Ditempatkan', variant: 'warning' },
  proses_penempatan: { label: 'Proses Penempatan', variant: 'purple' },
  sedang_pkl: { label: 'Sedang PKL', variant: 'success' },
  selesai_pkl: { label: 'Selesai PKL', variant: 'info' },
  batal: { label: 'Batal PKL', variant: 'danger' },
};

export const SiswaPage: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    class_id: '',
    email: '',
    phone_number: '',
    address: '',
    pkl_status: 'belum_ditempatkan' as PklStatus,
    is_eligible: true,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, classesData, majorsData] = await Promise.all([
        masterService.getStudents(),
        masterService.getClasses(),
        masterService.getMajors(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      setMajors(majorsData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data siswa', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Paginated List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.includes(searchTerm) ||
        s.nisn.includes(searchTerm) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchClass = selectedClassFilter ? s.class_id === selectedClassFilter : true;
      const matchStatus = selectedStatusFilter ? s.pkl_status === selectedStatusFilter : true;

      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchTerm, selectedClassFilter, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      class_id: classes[0]?.id || '',
      email: '',
      phone_number: '',
      address: '',
      pkl_status: 'belum_ditempatkan',
      is_eligible: true,
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      class_id: student.class_id,
      email: student.email || '',
      phone_number: student.phone_number || '',
      address: student.address || '',
      pkl_status: student.pkl_status,
      is_eligible: student.is_eligible,
      is_active: student.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.nisn || !formData.name || !formData.class_id) {
      showToast('NIS, NISN, Nama Lengkap, dan Kelas wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedStudent) {
        await masterService.updateStudent(selectedStudent.id, formData);
        showToast('Data siswa berhasil diperbarui.', 'success');
      } else {
        await masterService.createStudent(formData);
        showToast('Siswa baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan siswa.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteStudent(selectedStudent.id);
      showToast('Data siswa berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus siswa.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            Data Master Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data biodata, NISN, rombel kelas, dan status kelayakan PKL siswa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsCsvModalOpen(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Impor Excel (.xlsx)
          </Button>
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari NIS, NISN, atau nama siswa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  setSelectedClassFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Rombel Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Status PKL</option>
                {(Object.keys(PKL_STATUS_CONFIG) as PklStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {PKL_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total <strong>{filteredStudents.length}</strong> siswa
          </span>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat master data siswa..." />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-6 h-6" />}
          title="Tidak Ada Data Siswa"
          description={searchTerm || selectedClassFilter || selectedStatusFilter ? 'Tidak ditemukan data siswa sesuai filter pencarian.' : 'Belum ada data siswa terdaftar.'}
          actionText={searchTerm ? undefined : 'Tambah Siswa Baru'}
          onAction={searchTerm ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>NIS / NISN</TableHeaderCell>
                <TableHeaderCell>Nama Lengkap</TableHeaderCell>
                <TableHeaderCell>JK</TableHeaderCell>
                <TableHeaderCell>Kelas & Jurusan</TableHeaderCell>
                <TableHeaderCell>Status PKL</TableHeaderCell>
                <TableHeaderCell>Kelayakan</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStudents.map((student) => {
                const statusConf = PKL_STATUS_CONFIG[student.pkl_status] || PKL_STATUS_CONFIG.belum_ditempatkan;
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="font-bold text-slate-900">{student.nis}</div>
                      <div className="text-[10px] text-slate-400">{student.nisn}</div>
                    </TableCell>
                    <TableCell className="font-bold text-xs text-slate-900">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                        {student.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-extrabold text-slate-800">{student.class?.name || '-'}</div>
                      <div className="text-[11px] text-brand-700 font-semibold">{student.class?.major?.code || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConf.variant} size="sm">
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.is_eligible ? 'success' : 'danger'} size="sm">
                        {student.is_eligible ? 'Layak PKL' : 'Tertunda'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(student)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus"
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
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredStudents.length} siswa)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        description="Lengkapi biodata pokok, NIS, NISN, dan rombongan belajar siswa."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Induk Siswa (NIS)"
              placeholder="Contoh: 222310001"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              required
            />

            <Input
              label="NISN (10 Digit)"
              placeholder="Contoh: 0061234567"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              required
            />
          </div>

          <Input
            label="Nama Lengkap Siswa"
            placeholder="Contoh: Muhammad Rizky Pratama"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Jenis Kelamin"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
              required
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </Select>

            <Select
              label="Rombel Kelas"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              required
            >
              <option value="">Pilih Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.major?.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Alamat Email Siswa"
              type="email"
              placeholder="siswa@smkn13bdg.sch.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Nomor WhatsApp / HP"
              placeholder="081234567890"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Alamat Tempat Tinggal</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dusun, Desa, Kecamatan..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Select
              label="Status Pelaksanaan PKL"
              value={formData.pkl_status}
              onChange={(e) => setFormData({ ...formData, pkl_status: e.target.value as PklStatus })}
            >
              {(Object.keys(PKL_STATUS_CONFIG) as PklStatus[]).map((st) => (
                <option key={st} value={st}>
                  {PKL_STATUS_CONFIG[st].label}
                </option>
              ))}
            </Select>

            <div className="flex flex-col justify-end space-y-2 pb-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_eligible}
                  onChange={(e) => setFormData({ ...formData, is_eligible: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span>Memenuhi Syarat Kelayakan PKL</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Biodata Siswa"
        description="Informasi lengkap akun dan status penempatan PKL."
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">NIS / NISN:</span>
                <span className="font-mono font-extrabold text-slate-900">{selectedStudent.nis} / {selectedStudent.nisn}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-extrabold text-slate-900">{selectedStudent.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Jenis Kelamin:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Rombel Kelas:</span>
                <span className="font-bold text-brand-700">
                  {selectedStudent.class?.name} &bull; {selectedStudent.class?.major?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Kontak:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.email || '-'} ({selectedStudent.phone_number || '-'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Status PKL:</span>
                <Badge variant={PKL_STATUS_CONFIG[selectedStudent.pkl_status]?.variant || 'neutral'} size="sm">
                  {PKL_STATUS_CONFIG[selectedStudent.pkl_status]?.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelayakan:</span>
                <Badge variant={selectedStudent.is_eligible ? 'success' : 'danger'} size="sm">
                  {selectedStudent.is_eligible ? 'Layak Mengikuti PKL' : 'Tertunda'}
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
        title="Konfirmasi Hapus Siswa"
        description="Apakah Anda yakin ingin menghapus data siswa ini?"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus data siswa <strong>{selectedStudent.name} (NIS: {selectedStudent.nis})</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Siswa
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Excel Import Modal Wizard */}
      <ExcelImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Impor Data Siswa via Excel (.xlsx)"
        description="Unggah file Excel (.xlsx) sesuai template resmi untuk menambahkan biodata siswa sekaligus penempatan PKL otomatis."
        templateFileName="template_import_siswa_epkl.xlsx"
        onDownloadTemplate={() =>
          downloadExcelTemplate(
            'template_import_siswa_epkl.xlsx',
            'Data Siswa',
            [
              'NIS',
              'NISN',
              'Nama Siswa',
              'Jenis Kelamin',
              'Kelas',
              'Email',
              'No HP',
              'Alamat',
              'Tempat PKL',
              'Alamat Perusahaan',
              'Tanggal Mulai PKL',
              'Tanggal Selesai PKL',
            ],
            [
              [
                '222310001',
                '0061234567',
                'Muhammad Rizky Pratama',
                'L',
                classes[0]?.name || 'XI RPL 1',
                'rizky@siswa.smkn13bdg.sch.id',
                '081234567890',
                'Buahbatu, Bandung',
                'PT Telkom Indonesia (Witel Bandung)',
                'Jl. Lembong No. 11 Bandung',
                '2026-07-01',
                '2026-12-31',
              ],
              [
                '222310002',
                '0061234568',
                'Annisa Putri Rahmadani',
                'P',
                classes[0]?.name || 'XI RPL 1',
                'annisa@siswa.smkn13bdg.sch.id',
                '081234567891',
                'Batununggal, Bandung',
                'PT Bio Farma (Persero)',
                'Jl. Pasteur No. 28 Bandung',
                '2026-07-01',
                '2026-12-31',
              ],
              [
                '222310003',
                '0061234569',
                'Dimas Aditya Nugraha',
                'L',
                classes[1]?.name || classes[0]?.name || 'XI APL 1',
                'dimas@siswa.smkn13bdg.sch.id',
                '081234567892',
                'Kiaracondong, Bandung',
                '',
                '',
                '',
                '',
              ],
            ],
            [14, 16, 26, 14, 14, 26, 16, 26, 28, 34, 18, 18]
          )
        }
        onValidate={(records) => validateStudentExcel(records, classes.map((c) => ({ id: c.id, name: c.name })))}
        onImport={async (validRecords) => {
          try {
            const res = await masterService.batchInsertStudents(validRecords);
            if (res.errors && res.errors.length > 0 && res.count === 0) {
              showToast(`Gagal mengimpor: ${res.errors[0]}`, 'error');
            } else if (res.errors && res.errors.length > 0) {
              showToast(`Berhasil mengimpor ${res.count} siswa (${res.errors.length} ada catatan).`, 'warning');
            } else {
              showToast(`Berhasil mengimpor ${res.count} data siswa!`, 'success');
            }
            await loadData();
          } catch (err: any) {
            showToast(err.message || 'Gagal menyimpan data siswa ke database.', 'error');
            throw err;
          }
        }}
        previewColumns={[
          { header: 'NIS', accessor: (r) => r.nis },
          { header: 'Nama Siswa', accessor: (r) => r.name },
          { header: 'JK', accessor: (r) => r.gender },
          { header: 'Kelas', accessor: (r) => r.className || r.class_id },
          {
            header: 'Tempat PKL',
            accessor: (r) =>
              r.dudi_name ? (
                <span className="font-semibold text-emerald-700">{r.dudi_name}</span>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Belum ditempatkan</span>
              ),
          },
          {
            header: 'Periode PKL',
            accessor: (r) =>
              r.start_date && r.end_date ? (
                <span className="text-slate-600 text-[11px] font-mono">
                  {r.start_date} s/d {r.end_date}
                </span>
              ) : (
                <span className="text-slate-300">-</span>
              ),
          },
        ]}
      />
    </div>
  );
};
