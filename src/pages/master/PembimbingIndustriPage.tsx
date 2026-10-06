import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { IndustryMentor, Dudi } from '../../types';
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
import { Plus, Search, Edit2, Trash2, Eye, Users, CheckCircle2, Mail, Phone, Briefcase } from 'lucide-react';

export const PembimbingIndustriPage: React.FC = () => {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<IndustryMentor[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDudiFilter, setSelectedDudiFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedMentor, setSelectedMentor] = useState<IndustryMentor | null>(null);
  const [formData, setFormData] = useState({
    dudi_id: '',
    name: '',
    position: '',
    email: '',
    phone_number: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mentorsData, dudiData] = await Promise.all([
        masterService.getMentors(),
        masterService.getDudi(),
      ]);
      setMentors(mentorsData);
      setDudiList(dudiData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data pembimbing industri', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.dudi?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchDudi = selectedDudiFilter ? m.dudi_id === selectedDudiFilter : true;
      return matchSearch && matchDudi;
    });
  }, [mentors, searchTerm, selectedDudiFilter]);

  const handleOpenCreate = () => {
    setSelectedMentor(null);
    setFormData({
      dudi_id: dudiList[0]?.id || '',
      name: '',
      position: '',
      email: '',
      phone_number: '',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mentor: IndustryMentor) => {
    setSelectedMentor(mentor);
    setFormData({
      dudi_id: mentor.dudi_id,
      name: mentor.name,
      position: mentor.position || '',
      email: mentor.email,
      phone_number: mentor.phone_number || '',
      is_active: mentor.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (mentor: IndustryMentor) => {
    setSelectedMentor(mentor);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (mentor: IndustryMentor) => {
    setSelectedMentor(mentor);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dudi_id || !formData.email) {
      showToast('Nama mentor, perusahaan DUDI, dan email wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedMentor) {
        await masterService.updateMentor(selectedMentor.id, formData);
        showToast('Data pembimbing industri berhasil diperbarui.', 'success');
      } else {
        await masterService.createMentor(formData);
        showToast('Pembimbing industri baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMentor) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteMentor(selectedMentor.id);
      showToast('Pembimbing industri berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus data.', 'error');
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
            <Briefcase className="w-6 h-6 text-brand-600" />
            Data Pembimbing Industri (Instruktur)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola instruktur lapangan dan mentor teknis dari pihak mitra DUDI.
          </p>
        </div>

        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Pembimbing
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama mentor, jabatan, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedDudiFilter}
                onChange={(e) => setSelectedDudiFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500 truncate"
              >
                <option value="">Semua Perusahaan DUDI</option>
                {dudiList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total <strong>{filteredMentors.length}</strong> pembimbing
          </span>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data pembimbing industri..." />
      ) : filteredMentors.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="Tidak Ada Pembimbing Industri"
          description={searchTerm || selectedDudiFilter ? 'Tidak ditemukan data sesuai filter pencarian.' : 'Belum ada pembimbing industri terdaftar.'}
          actionText={searchTerm || selectedDudiFilter ? undefined : 'Tambah Pembimbing'}
          onAction={searchTerm || selectedDudiFilter ? undefined : handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama Instruktur</TableHeaderCell>
              <TableHeaderCell>Perusahaan Mitra (DUDI)</TableHeaderCell>
              <TableHeaderCell>Jabatan / Posisi</TableHeaderCell>
              <TableHeaderCell>Kontak</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMentors.map((mentor) => (
              <TableRow key={mentor.id}>
                <TableCell className="font-extrabold text-xs text-slate-900">
                  {mentor.name}
                </TableCell>
                <TableCell className="font-semibold text-xs text-brand-700">
                  {mentor.dudi ? mentor.dudi.name : '-'}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium">
                  {mentor.position || '-'}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div>{mentor.email}</div>
                  <div className="text-[11px] text-slate-400">{mentor.phone_number || '-'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={mentor.is_active ? 'success' : 'neutral'} size="sm">
                    {mentor.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(mentor)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(mentor)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(mentor)}
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
        title={selectedMentor ? 'Edit Pembimbing Industri' : 'Tambah Pembimbing Industri Baru'}
        description="Lengkapi data mentor dan perusahaan tempat pembimbing bertugas."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Select
            label="Perusahaan / Mitra DUDI"
            value={formData.dudi_id}
            onChange={(e) => setFormData({ ...formData, dudi_id: e.target.value })}
            required
          >
            <option value="">Pilih Perusahaan Mitra</option>
            {dudiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Input
            label="Nama Lengkap Mentor"
            placeholder="Contoh: Bambang Sudarsono"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            leftIcon={<Users className="w-4 h-4" />}
          />

          <Input
            label="Jabatan / Divisi di Perusahaan"
            placeholder="Contoh: Supervisor QC, Leader IT, Kepala Bengkel"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />

          <Input
            label="Alamat Email Perusahaan / Akun"
            type="email"
            placeholder="bambang.s@ahm.co.id"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Nomor WhatsApp / HP"
            placeholder="081388990011"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="m_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="m_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Pembimbing Berstatus Aktif
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedMentor ? 'Simpan Perubahan' : 'Tambah Pembimbing'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Pembimbing Industri"
        description="Profil lengkap instruktur lapangan DUDI."
      >
        {selectedMentor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Pembimbing:</span>
                <span className="font-extrabold text-slate-900">{selectedMentor.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Perusahaan Mitra:</span>
                <span className="font-bold text-brand-700">{selectedMentor.dudi?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Jabatan:</span>
                <span className="font-semibold text-slate-800">{selectedMentor.position || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{selectedMentor.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nomor HP/WA:</span>
                <span className="font-semibold text-slate-800">{selectedMentor.phone_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant={selectedMentor.is_active ? 'success' : 'neutral'} size="sm">
                  {selectedMentor.is_active ? 'Aktif' : 'Nonaktif'}
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
        title="Konfirmasi Hapus Pembimbing"
        description="Apakah Anda yakin ingin menghapus data instruktur lapangan ini?"
      >
        {selectedMentor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus data pembimbing <strong>{selectedMentor.name}</strong> dari <strong>{selectedMentor.dudi?.name}</strong>.
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
    </div>
  );
};
