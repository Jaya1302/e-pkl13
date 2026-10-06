import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { ClassItem, Major, Teacher } from '../../types';
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
import { downloadExcelTemplate, validateClassExcel } from '../../utils/excelParser';
import { Plus, Search, Edit2, Trash2, Eye, CheckCircle2, GraduationCap, FileSpreadsheet } from 'lucide-react';

export const KelasPage: React.FC = () => {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'XI' as 'X' | 'XI' | 'XII',
    major_id: '',
    homeroom_teacher_id: '',
    academic_year: '2026/2027',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classesData, majorsData, teachersData] = await Promise.all([
        masterService.getClasses(),
        masterService.getMajors(),
        masterService.getTeachers(),
      ]);
      setClasses(classesData);
      setMajors(majorsData);
      setTeachers(teachersData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data kelas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.academic_year.includes(searchTerm);

      const matchMajor = selectedMajorFilter ? c.major_id === selectedMajorFilter : true;
      const matchLevel = selectedLevelFilter ? c.level === selectedLevelFilter : true;

      return matchSearch && matchMajor && matchLevel;
    });
  }, [classes, searchTerm, selectedMajorFilter, selectedLevelFilter]);

  const handleOpenCreate = () => {
    setSelectedClass(null);
    setFormData({
      name: '',
      level: 'XI',
      major_id: majors[0]?.id || '',
      homeroom_teacher_id: '',
      academic_year: '2026/2027',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      major_id: cls.major_id,
      homeroom_teacher_id: cls.homeroom_teacher_id || '',
      academic_year: cls.academic_year,
      is_active: cls.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.major_id) {
      showToast('Nama kelas dan jurusan wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedClass) {
        await masterService.updateClass(selectedClass.id, formData);
        showToast('Data kelas berhasil diperbarui.', 'success');
      } else {
        await masterService.createClass(formData);
        showToast('Kelas baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kelas.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteClass(selectedClass.id);
      showToast('Data kelas berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kelas.', 'error');
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
            Data Master Kelas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data rombongan belajar siswa dan penetapan wali kelas.
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
            Tambah Kelas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedMajorFilter}
                onChange={(e) => setSelectedMajorFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Jurusan</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-36">
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">Semua Tingkat</option>
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total <strong>{filteredClasses.length}</strong> rombel
          </span>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat master data kelas..." />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-6 h-6" />}
          title="Tidak Ada Data Kelas"
          description={searchTerm || selectedMajorFilter ? 'Tidak ditemukan kelas yang cocok.' : 'Belum ada data rombel kelas.'}
          actionText={searchTerm || selectedMajorFilter ? undefined : 'Tambah Kelas Baru'}
          onAction={searchTerm || selectedMajorFilter ? undefined : handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama Kelas</TableHeaderCell>
              <TableHeaderCell>Tingkat</TableHeaderCell>
              <TableHeaderCell>Program Keahlian</TableHeaderCell>
              <TableHeaderCell>Wali Kelas</TableHeaderCell>
              <TableHeaderCell>Tahun Ajaran</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClasses.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-extrabold text-xs text-slate-900">
                  {cls.name}
                </TableCell>
                <TableCell>
                  <Badge variant="purple" size="sm">
                    Kelas {cls.level}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-xs text-brand-700">
                  {cls.major ? cls.major.name : '-'}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {cls.homeroom_teacher ? cls.homeroom_teacher.name : <span className="text-slate-400 italic">Belum diplot</span>}
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500">
                  {cls.academic_year}
                </TableCell>
                <TableCell>
                  <Badge variant={cls.is_active ? 'success' : 'neutral'} size="sm">
                    {cls.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(cls)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(cls)}
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
        title={selectedClass ? 'Edit Data Kelas' : 'Tambah Rombel Kelas Baru'}
        description="Lengkapi nama kelas, jurusan, tingkat, dan penugasan wali kelas."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Nama Kelas"
            placeholder="Contoh: XI TKJ 1, XII TKRO 2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tingkat"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              required
            >
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </Select>

            <Input
              label="Tahun Ajaran"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              required
            />
          </div>

          <Select
            label="Jurusan / Program Keahlian"
            value={formData.major_id}
            onChange={(e) => setFormData({ ...formData, major_id: e.target.value })}
            required
          >
            <option value="">Pilih Program Keahlian</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </Select>

          <Select
            label="Wali Kelas (Opsional)"
            value={formData.homeroom_teacher_id}
            onChange={(e) => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
          >
            <option value="">Pilih Wali Kelas</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="c_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="c_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Kelas Berstatus Aktif
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Rombongan Belajar"
        description="Informasi spesifikasi rombel kelas."
      >
        {selectedClass && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Kelas:</span>
                <span className="font-extrabold text-slate-900">{selectedClass.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Tingkat:</span>
                <span className="font-bold text-purple-700">Tingkat {selectedClass.level}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Program Keahlian:</span>
                <span className="font-bold text-brand-700">
                  {selectedClass.major?.name} ({selectedClass.major?.code})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Wali Kelas:</span>
                <span className="font-semibold text-slate-800">
                  {selectedClass.homeroom_teacher?.name || 'Belum ditentukan'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Tahun Ajaran:</span>
                <span className="font-mono text-slate-700">{selectedClass.academic_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant={selectedClass.is_active ? 'success' : 'neutral'} size="sm">
                  {selectedClass.is_active ? 'Aktif' : 'Nonaktif'}
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
        title="Konfirmasi Hapus Kelas"
        description="Apakah Anda yakin ingin menghapus data rombel kelas ini?"
      >
        {selectedClass && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus data kelas <strong>{selectedClass.name}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Kelas
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Impor Data Kelas via Excel (.xlsx)"
        description="Unggah file Excel (.xlsx) sesuai template resmi untuk menambahkan rombongan belajar kelas secara massal."
        templateFileName="template_import_kelas_epkl.xlsx"
        onDownloadTemplate={() =>
          downloadExcelTemplate(
            'template_import_kelas_epkl.xlsx',
            'Data Kelas',
            ['Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Tahun Ajaran'],
            [
              ['XI TKJ 1', 'XI', majors[0]?.code || 'TKJ', teachers[0]?.name || 'Ahmad Fauzi, S.Kom', '2026/2027'],
              ['XI TKRO 1', 'XI', majors[1]?.code || 'TKRO', teachers[1]?.name || 'Budi Santoso, S.T.', '2026/2027']
            ],
            [18, 12, 15, 28, 16]
          )
        }
        onValidate={(records) => validateClassExcel(records, majors, teachers)}
        onImport={async (validRecords) => {
          await masterService.batchInsertClasses(validRecords);
          showToast(`Berhasil mengimpor ${validRecords.length} data kelas!`, 'success');
          loadData();
        }}
        previewColumns={[
          { header: 'Nama Kelas', accessor: (r) => r.name },
          { header: 'Tingkat', accessor: (r) => r.level },
          { header: 'Tahun Ajaran', accessor: (r) => r.academic_year },
        ]}
      />
    </div>
  );
};
