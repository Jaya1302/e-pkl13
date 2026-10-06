import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { Teacher, Major } from '../../types';
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
import { downloadExcelTemplate, validateTeacherExcel } from '../../utils/excelParser';
import { Plus, Search, Edit2, Trash2, Eye, Users, CheckCircle2, Mail, Phone, FileSpreadsheet } from 'lucide-react';

export const GuruPage: React.FC = () => {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    phone_number: '',
    major_id: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teachersData, majorsData] = await Promise.all([
        masterService.getTeachers(),
        masterService.getMajors(),
      ]);
      setTeachers(teachersData);
      setMajors(majorsData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data guru', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.nip || '').includes(searchTerm) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMajor = selectedMajorFilter ? t.major_id === selectedMajorFilter : true;
      return matchSearch && matchMajor;
    });
  }, [teachers, searchTerm, selectedMajorFilter]);

  const handleOpenCreate = () => {
    setSelectedTeacher(null);
    setFormData({
      nip: '',
      name: '',
      email: '',
      phone_number: '',
      major_id: majors[0]?.id || '',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      nip: teacher.nip || '',
      name: teacher.name,
      email: teacher.email,
      phone_number: teacher.phone_number || '',
      major_id: teacher.major_id || '',
      is_active: teacher.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Nama dan email guru wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedTeacher) {
        await masterService.updateTeacher(selectedTeacher.id, formData);
        showToast('Data guru berhasil diperbarui.', 'success');
      } else {
        await masterService.createTeacher(formData);
        showToast('Guru baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data guru.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteTeacher(selectedTeacher.id);
      showToast('Data guru berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus guru.', 'error');
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
            <Users className="w-6 h-6 text-brand-600" />
            Data Master Guru Pembimbing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data dewan guru pembimbing dan koordinator PKL per jurusan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsExcelModalOpen(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Impor Excel (.xlsx)
          </Button>
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Tambah Guru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari NIP, nama guru, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={selectedMajorFilter}
                onChange={(e) => setSelectedMajorFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Jurusan</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total <strong>{filteredTeachers.length}</strong> guru
          </span>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat master data guru..." />
      ) : filteredTeachers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="Tidak Ada Data Guru"
          description={searchTerm || selectedMajorFilter ? 'Tidak ditemukan guru sesuai filter pencarian.' : 'Belum ada data guru terdaftar.'}
          actionText={searchTerm || selectedMajorFilter ? undefined : 'Tambah Guru Baru'}
          onAction={searchTerm || selectedMajorFilter ? undefined : handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>NIP</TableHeaderCell>
              <TableHeaderCell>Nama Lengkap</TableHeaderCell>
              <TableHeaderCell>Program Keahlian</TableHeaderCell>
              <TableHeaderCell>Kontak</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-mono text-xs text-slate-600">
                  {teacher.nip || '-'}
                </TableCell>
                <TableCell className="font-bold text-xs text-slate-900">
                  {teacher.name}
                </TableCell>
                <TableCell>
                  {teacher.major ? (
                    <Badge variant="purple" size="sm">
                      {teacher.major.code}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div>{teacher.email}</div>
                  <div className="text-[11px] text-slate-400">{teacher.phone_number || '-'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={teacher.is_active ? 'success' : 'neutral'} size="sm">
                    {teacher.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(teacher)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(teacher)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(teacher)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        description="Lengkapi biodata dan penugasan jurusan guru pembimbing."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="NIP (Nomor Induk Pegawai)"
            placeholder="Contoh: 197505122005011002"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
          />

          <Input
            label="Nama Lengkap Beserta Gelar"
            placeholder="Contoh: Ahmad Fauzi, S.Kom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Alamat Email Dinas / Akun"
            type="email"
            placeholder="ahmad.fauzi@smkn13bdg.sch.id"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Nomor WhatsApp / HP"
            placeholder="081234567890"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Select
            label="Jurusan / Program Keahlian Binaan"
            value={formData.major_id}
            onChange={(e) => setFormData({ ...formData, major_id: e.target.value })}
          >
            <option value="">Pilih Program Keahlian</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="t_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="t_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Guru Berstatus Aktif
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Guru Pembimbing"
        description="Informasi profil dan penugasan guru pembimbing."
      >
        {selectedTeacher && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">NIP:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTeacher.nip || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Guru:</span>
                <span className="font-bold text-slate-900">{selectedTeacher.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Program Keahlian:</span>
                <span className="font-bold text-brand-700">
                  {selectedTeacher.major ? `${selectedTeacher.major.name} (${selectedTeacher.major.code})` : 'Umum / Semua'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nomor HP/WA:</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.phone_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Akun:</span>
                <Badge variant={selectedTeacher.is_active ? 'success' : 'neutral'} size="sm">
                  {selectedTeacher.is_active ? 'Aktif' : 'Nonaktif'}
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
        title="Konfirmasi Hapus Guru"
        description="Apakah Anda yakin ingin menghapus data guru pembimbing ini?"
      >
        {selectedTeacher && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus data guru <strong>{selectedTeacher.name}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Data
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Impor Data Guru Pembimbing via Excel (.xlsx)"
        description="Unggah file Excel (.xlsx) sesuai template resmi untuk menambahkan data dewan guru secara massal."
        templateFileName="template_import_guru_epkl.xlsx"
        onDownloadTemplate={() =>
          downloadExcelTemplate(
            'template_import_guru_epkl.xlsx',
            'Data Guru',
            ['NIP', 'Nama Guru', 'Email', 'No HP', 'Jurusan'],
            [
              ['197505122005011002', 'Ahmad Fauzi, S.Kom', 'guru.fauzi@smkn13bdg.sch.id', '081234567801', majors[0]?.code || 'RPL'],
              ['198003152008011003', 'Dr. Budi Santoso, M.Si', 'budi.santoso@smkn13bdg.sch.id', '081234567802', majors[1]?.code || 'APL']
            ],
            [22, 28, 30, 18, 15]
          )
        }
        onValidate={(records) => validateTeacherExcel(records, majors)}
        onImport={async (validRecords) => {
          await masterService.batchInsertTeachers(validRecords);
          showToast(`Berhasil mengimpor ${validRecords.length} data guru!`, 'success');
          loadData();
        }}
        previewColumns={[
          { header: 'NIP', accessor: (r) => r.nip || '-' },
          { header: 'Nama Guru', accessor: (r) => r.name },
          { header: 'Email', accessor: (r) => r.email },
        ]}
      />
    </div>
  );
};
