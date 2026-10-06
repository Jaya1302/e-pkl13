import React, { useState, useEffect, useMemo } from 'react';
import { Major } from '../../types';
import { masterService } from '../../services/masterService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Plus, Search, Edit2, Trash2, Eye, Layers, CheckCircle2 } from 'lucide-react';

export const JurusanPage: React.FC = () => {
  const { showToast } = useToast();
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMajors = async () => {
    setIsLoading(true);
    try {
      const data = await masterService.getMajors();
      setMajors(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data jurusan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  const filteredMajors = useMemo(() => {
    return majors.filter((m) =>
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [majors, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedMajor(null);
    setFormData({ code: '', name: '', description: '', is_active: true });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (major: Major) => {
    setSelectedMajor(major);
    setFormData({
      code: major.code,
      name: major.name,
      description: major.description || '',
      is_active: major.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (major: Major) => {
    setSelectedMajor(major);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (major: Major) => {
    setSelectedMajor(major);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      showToast('Kode dan nama jurusan wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedMajor) {
        await masterService.updateMajor(selectedMajor.id, formData);
        showToast('Data jurusan berhasil diperbarui.', 'success');
      } else {
        await masterService.createMajor(formData);
        showToast('Jurusan baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      fetchMajors();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan jurusan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMajor) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteMajor(selectedMajor.id);
      showToast('Jurusan berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      fetchMajors();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus jurusan.', 'error');
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
            <Layers className="w-6 h-6 text-brand-600" />
            Data Master Jurusan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola program keahlian kejuruan dan kompetensi di SMKN 13 Bandung.
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Jurusan
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode atau nama jurusan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Menampilkan <strong>{filteredMajors.length}</strong> jurusan
          </span>
        </div>
      </Card>

      {/* Main Content Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat master data jurusan..." />
      ) : filteredMajors.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title="Tidak Ada Data Jurusan"
          description={searchTerm ? 'Tidak ditemukan jurusan yang cocok dengan pencarian.' : 'Belum ada jurusan yang terdaftar di sistem.'}
          actionText={searchTerm ? undefined : 'Tambah Jurusan Baru'}
          onAction={searchTerm ? undefined : handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Kode</TableHeaderCell>
              <TableHeaderCell>Nama Program Keahlian</TableHeaderCell>
              <TableHeaderCell>Deskripsi Kompetensi</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMajors.map((major) => (
              <TableRow key={major.id}>
                <TableCell className="font-extrabold text-xs text-brand-700 font-mono">
                  {major.code}
                </TableCell>
                <TableCell className="font-bold text-xs text-slate-900">
                  {major.name}
                </TableCell>
                <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                  {major.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={major.is_active ? 'success' : 'neutral'} size="sm">
                    {major.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(major)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(major)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(major)}
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

      {/* Form Modal (Create/Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedMajor ? 'Edit Data Jurusan' : 'Tambah Jurusan Baru'}
        description="Lengkapi informasi kode dan program keahlian kejuruan."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Kode Jurusan"
            placeholder="Contoh: TKRO, TP, TKJ"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
          />

          <Input
            label="Nama Lengkap Jurusan"
            placeholder="Contoh: Teknik Kendaraan Ringan Otomotif"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Deskripsi / Ruang Lingkup</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat kompetensi keahlian..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Jurusan Berstatus Aktif
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedMajor ? 'Simpan Perubahan' : 'Tambah Jurusan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Program Keahlian"
        description="Informasi lengkap data jurusan terdaftar."
      >
        {selectedMajor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Kode Jurusan:</span>
                <span className="font-mono font-bold text-brand-700">{selectedMajor.code}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Jurusan:</span>
                <span className="font-bold text-slate-900">{selectedMajor.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Status Keaktifan:</span>
                <Badge variant={selectedMajor.is_active ? 'success' : 'neutral'} size="sm">
                  {selectedMajor.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Deskripsi:</span>
                <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedMajor.description || 'Tidak ada deskripsi.'}
                </p>
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
        title="Konfirmasi Hapus Jurusan"
        description="Apakah Anda yakin ingin menghapus data jurusan ini? Tindakan ini tidak dapat dibatalkan."
      >
        {selectedMajor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus jurusan <strong>{selectedMajor.name} ({selectedMajor.code})</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Jurusan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
