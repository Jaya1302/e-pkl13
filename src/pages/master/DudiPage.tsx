import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { Dudi } from '../../types';
import { masterService } from '../../services/masterService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ExcelImportModal } from '../../components/common/ExcelImportModal';
import { downloadExcelTemplate, validateDudiExcel } from '../../utils/excelParser';
import { Plus, Search, Edit2, Trash2, Eye, Building2, CheckCircle2, Mail, Phone, Users, Compass, FileSpreadsheet } from 'lucide-react';

export const DudiPage: React.FC = () => {
  const { showToast } = useToast();
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [selectedDudi, setSelectedDudi] = useState<Dudi | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    address: '',
    city: 'Karawang',
    contact_person: '',
    phone_number: '',
    email: '',
    quota: 5,
    latitude: -6.3052,
    longitude: 107.3021,
    radius_meters: 150,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await masterService.getDudi();
      setDudiList(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data DUDI', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDudi = useMemo(() => {
    return dudiList.filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dudiList, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedDudi(null);
    setFormData({
      name: '',
      sector: '',
      address: '',
      city: 'Karawang',
      contact_person: '',
      phone_number: '',
      email: '',
      quota: 5,
      latitude: -6.3052,
      longitude: 107.3021,
      radius_meters: 150,
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dudi: Dudi) => {
    setSelectedDudi(dudi);
    setFormData({
      name: dudi.name,
      sector: dudi.sector,
      address: dudi.address,
      city: dudi.city,
      contact_person: dudi.contact_person || '',
      phone_number: dudi.phone_number || '',
      email: dudi.email || '',
      quota: dudi.quota,
      latitude: dudi.latitude || -6.3052,
      longitude: dudi.longitude || 107.3021,
      radius_meters: dudi.radius_meters || 150,
      is_active: dudi.is_active,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (dudi: Dudi) => {
    setSelectedDudi(dudi);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (dudi: Dudi) => {
    setSelectedDudi(dudi);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sector || !formData.address) {
      showToast('Nama perusahaan, bidang industri, dan alamat wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedDudi) {
        await masterService.updateDudi(selectedDudi.id, formData);
        showToast('Data DUDI berhasil diperbarui.', 'success');
      } else {
        await masterService.createDudi(formData);
        showToast('Mitra DUDI baru berhasil ditambahkan.', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan DUDI.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDudi) return;
    setIsSubmitting(true);
    try {
      await masterService.deleteDudi(selectedDudi.id);
      showToast('Data DUDI berhasil dihapus.', 'success');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus DUDI.', 'error');
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
            <Building2 className="w-6 h-6 text-brand-600" />
            Data DUDI & Mitra Industri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Direktori Dunia Usaha & Industri mitra tempat pelaksanaan PKL siswa.
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
            Tambah Mitra DUDI
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama perusahaan, bidang usaha, atau kota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Total <strong>{filteredDudi.length}</strong> perusahaan mitra
          </span>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data mitra industri..." />
      ) : filteredDudi.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="Tidak Ada Data DUDI"
          description={searchTerm ? 'Tidak ditemukan perusahaan mitra sesuai pencarian.' : 'Belum ada data DUDI terdaftar.'}
          actionText={searchTerm ? undefined : 'Tambah Mitra Baru'}
          onAction={searchTerm ? undefined : handleOpenCreate}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Perusahaan / Mitra</TableHeaderCell>
              <TableHeaderCell>Bidang Usaha</TableHeaderCell>
              <TableHeaderCell>Alamat & Kota</TableHeaderCell>
              <TableHeaderCell>PIC / Kontak</TableHeaderCell>
              <TableHeaderCell>Kuota Siswa</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDudi.map((dudi) => (
              <TableRow key={dudi.id}>
                <TableCell className="font-extrabold text-xs text-slate-900">
                  {dudi.name}
                </TableCell>
                <TableCell>
                  <Badge variant="purple" size="sm">
                    {dudi.sector}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                  <span className="font-medium text-slate-800">{dudi.city}:</span> {dudi.address}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">{dudi.contact_person || '-'}</div>
                  <div className="text-[11px] text-slate-400">{dudi.phone_number || '-'}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 font-extrabold text-xs text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                    <Users className="w-3 h-3" /> {dudi.quota} Kursi
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={dudi.is_active ? 'success' : 'neutral'} size="sm">
                    {dudi.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(dudi)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(dudi)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(dudi)}
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
        title={selectedDudi ? 'Edit Mitra Industri' : 'Tambah Mitra DUDI Baru'}
        description="Lengkapi informasi identitas perusahaan, PIC kontak, kuota, dan geolokasi."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Nama Perusahaan / Instansi"
            placeholder="Contoh: PT Astra Honda Motor (Plant Karawang)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            leftIcon={<Building2 className="w-4 h-4" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bidang Usaha / Sektor"
              placeholder="Contoh: Otomotif, Jaringan Komputer, Manufaktur"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              required
            />

            <Input
              label="Kota / Wilayah"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Alamat Lengkap Kantor / Pabrik *</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jalan, Kawasan Industri, Kecamatan..."
              required
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Nama PIC / HRD"
              placeholder="Bambang Sudarsono"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />

            <Input
              label="Nomor Telepon / WA"
              placeholder="081234567890"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Input
              label="Alamat Email"
              type="email"
              placeholder="hrd@perusahaan.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-brand-600" />
              Kuota & Geolokasi GPS Presensi
            </span>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Kuota Siswa (Orang)"
                type="number"
                min={1}
                value={formData.quota}
                onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 1 })}
                required
              />

              <Input
                label="Latitude GPS"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              />

              <Input
                label="Longitude GPS"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="d_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="d_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Mitra DUDI Aktif Menerima Siswa PKL
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {selectedDudi ? 'Simpan Perubahan' : 'Tambah Mitra'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Mitra DUDI"
        description="Profil perusahaan dan konfigurasi penempatan PKL."
        maxWidth="lg"
      >
        {selectedDudi && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nama Perusahaan:</span>
                <span className="font-extrabold text-slate-900">{selectedDudi.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Bidang Usaha:</span>
                <span className="font-bold text-purple-700">{selectedDudi.sector}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Alamat Lengkap:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{selectedDudi.address}, {selectedDudi.city}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">PIC / HRD:</span>
                <span className="font-semibold text-slate-800">{selectedDudi.contact_person || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Kontak:</span>
                <span className="font-semibold text-slate-800">{selectedDudi.phone_number || '-'} &bull; {selectedDudi.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Kuota Siswa:</span>
                <span className="font-extrabold text-brand-700">{selectedDudi.quota} Siswa</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Koordinat GPS:</span>
                <span className="font-mono text-slate-700">{selectedDudi.latitude || '-'}, {selectedDudi.longitude || '-'} (Radius {selectedDudi.radius_meters}m)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Kemitraan:</span>
                <Badge variant={selectedDudi.is_active ? 'success' : 'neutral'} size="sm">
                  {selectedDudi.is_active ? 'Aktif Menerima' : 'Nonaktif'}
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
        title="Konfirmasi Hapus DUDI"
        description="Apakah Anda yakin ingin menghapus data mitra industri ini?"
      >
        {selectedDudi && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
              <p>
                Anda akan menghapus data mitra <strong>{selectedDudi.name}</strong>.
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
        title="Impor Data Mitra DUDI via Excel (.xlsx)"
        description="Unggah file Excel (.xlsx) sesuai template resmi untuk menambahkan mitra industri secara massal."
        templateFileName="template_import_dudi_epkl.xlsx"
        onDownloadTemplate={() =>
          downloadExcelTemplate(
            'template_import_dudi_epkl.xlsx',
            'Data DUDI',
            ['Nama DUDI', 'Bidang Usaha', 'Alamat', 'Kota', 'PIC', 'No HP', 'Email', 'Kuota PKL'],
            [
              ['PT Astra Honda Motor (Plant Karawang)', 'Otomotif & Manufaktur', 'Kawasan Industri KIIC Kav. LL 01', 'Karawang', 'Bambang Sudarsono', '081388990011', 'hrd.karawang@ahm.co.id', 15],
              ['PT Telkom Indonesia Karawang', 'Telekomunikasi & Jaringan', 'Jl. Tuparev No. 89', 'Karawang', 'Hendri Gunawan', '081299887766', 'pkl.karawang@telkom.co.id', 10]
            ],
            [30, 25, 35, 15, 22, 18, 28, 12]
          )
        }
        onValidate={(records) => validateDudiExcel(records)}
        onImport={async (validRecords) => {
          await masterService.batchInsertDudi(validRecords);
          showToast(`Berhasil mengimpor ${validRecords.length} data mitra DUDI!`, 'success');
          loadData();
        }}
        previewColumns={[
          { header: 'Nama DUDI', accessor: (r) => r.name },
          { header: 'Bidang Usaha', accessor: (r) => r.sector },
          { header: 'Kota', accessor: (r) => r.city },
          { header: 'Kuota', accessor: (r) => r.quota },
        ]}
      />
    </div>
  );
};
