import React, { useState, useEffect } from 'react';
import { PklPeriod } from '../../types';
import { pklService } from '../../services/pklService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import { Plus, Calendar, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export const PeriodePage: React.FC = () => {
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<PklPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState<PklPeriod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    academic_year: '2026/2027',
    start_date: '2026-07-15',
    end_date: '2026-10-15',
    is_active: false,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await pklService.getPeriods();
      setPeriods(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat periode PKL', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPeriod(null);
    setFormData({
      name: '',
      academic_year: '2026/2027',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: periods.length === 0,
      description: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (period: PklPeriod) => {
    setSelectedPeriod(period);
    setFormData({
      name: period.name,
      academic_year: period.academic_year,
      start_date: period.start_date,
      end_date: period.end_date,
      is_active: period.is_active,
      description: period.description || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (period: PklPeriod) => {
    setSelectedPeriod(period);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showToast('Nama gelombang dan rentang tanggal wajib diisi.', 'error');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPeriod) {
        await pklService.updatePeriod(selectedPeriod.id, formData);
        showToast('Periode PKL berhasil diperbarui.', 'success');
      } else {
        await pklService.createPeriod(formData);
        showToast('Periode PKL baru berhasil dibuat.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan periode.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (period: PklPeriod) => {
    try {
      await pklService.updatePeriod(period.id, { is_active: true });
      showToast(`Periode "${period.name}" kini aktif sebagai gelombang utama.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status aktif.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedPeriod) return;
    setIsSubmitting(true);
    try {
      await pklService.deletePeriod(selectedPeriod.id);
      showToast('Periode PKL berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus periode.', 'error');
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
            <Calendar className="w-6 h-6 text-brand-600" />
            Manajemen Periode & Gelombang PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur rentang waktu pelaksanaan PKL per gelombang dan tahun ajaran aktif.
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Periode
        </Button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat periode PKL..." />
      ) : periods.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title="Belum Ada Periode PKL"
          description="Buat periode atau gelombang PKL pertama untuk memulai penempatan siswa."
          actionText="Buat Periode Sekarang"
          onAction={handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama Periode / Gelombang</TableHeaderCell>
              <TableHeaderCell>Tahun Ajaran</TableHeaderCell>
              <TableHeaderCell>Tanggal Pelaksanaan</TableHeaderCell>
              <TableHeaderCell>Durasi</TableHeaderCell>
              <TableHeaderCell>Status Gelombang</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map((period) => {
              const start = new Date(period.start_date);
              const end = new Date(period.end_date);
              const durationMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

              return (
                <TableRow key={period.id}>
                  <TableCell className="font-extrabold text-xs text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{period.name}</span>
                      {period.is_active && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Periode Sedang Berjalan" />
                      )}
                    </div>
                    {period.description && (
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">{period.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">
                    {period.academic_year}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {formatDate(period.start_date)} — {formatDate(period.end_date)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600">
                    {durationMonths || 3} Bulan
                  </TableCell>
                  <TableCell>
                    {period.is_active ? (
                      <Badge variant="success" size="sm">
                        Aktif Berjalan
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(period)}
                        className="text-[11px] text-slate-500 hover:text-brand-600 font-semibold underline"
                      >
                        Jadikan Aktif
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(period)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit Periode"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(period)}
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
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedPeriod ? 'Edit Periode PKL' : 'Tambah Periode PKL Baru'}
        description="Tentukan nama gelombang, tahun ajaran, dan rentang tanggal pelaksanaan."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Nama Periode / Gelombang"
            placeholder="Contoh: Gelombang 1 — Ganjil 2026/2027"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Tahun Ajaran"
            placeholder="2026/2027"
            value={formData.academic_year}
            onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Mulai PKL"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />

            <Input
              label="Tanggal Selesai PKL"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Keterangan / Deskripsi Gelombang</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Catatan pelaksanaan..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="p_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="p_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Set sebagai Periode Aktif Utama (Hanya 1 periode aktif diizinkan)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedPeriod ? 'Simpan Perubahan' : 'Buat Periode'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Periode"
        description="Apakah Anda yakin ingin menghapus data periode PKL ini? Seluruh data penempatan di gelombang ini akan terhapus."
      >
        {selectedPeriod && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus periode <strong>{selectedPeriod.name}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Ya, Hapus Periode
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
