import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Announcement, AnnouncementFilter } from '../../types';
import { announcementService } from '../../services/announcementService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Bell,
  Pin,
  PinOff,
  Search,
  Plus,
  Calendar,
  Download,
  Trash2,
  Users,
  Megaphone,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PengumumanPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Modal Create
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_role: 'all',
    attachment_name: '',
    attachment_url: '',
    is_pinned: false,
  });

  const isAdmin = role === 'super_admin' || role === 'admin_pkl';

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getAnnouncements(undefined, { role: role || 'siswa' });
      setAnnouncements(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data pengumuman.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [role, user]);

  // Filtered
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);

      const matchRole =
        selectedRoleFilter === 'all' || a.target_role === 'all' || a.target_role === selectedRoleFilter;

      return matchSearch && matchRole;
    });
  }, [announcements, searchTerm, selectedRoleFilter]);

  // Handle Create Announcement
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Judul dan isi pengumuman wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await announcementService.createAnnouncement({
        ...formData,
        author_name: user?.name || 'Admin Pokja PKL',
      });

      showToast('Pengumuman resmi berhasil diterbitkan dan disiarkan!', 'success');
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        content: '',
        target_role: 'all',
        attachment_name: '',
        attachment_url: '',
        is_pinned: false,
      });
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Gagal menerbitkan pengumuman.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Pin
  const handleTogglePin = async (id: string) => {
    try {
      await announcementService.togglePin(id);
      showToast('Status sematan pengumuman diperbarui.', 'success');
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah sematan.', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      showToast('Pengumuman berhasil dihapus.', 'success');
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pengumuman.', 'error');
    }
  };

  const getTargetRoleBadge = (targetRole: string) => {
    switch (targetRole) {
      case 'siswa':
        return <Badge variant="primary">Khusus Siswa</Badge>;
      case 'guru_pembimbing':
        return <Badge variant="warning">Khusus Guru</Badge>;
      case 'pembimbing_industri':
        return <Badge variant="neutral">Khusus Industri</Badge>;
      case 'all':
      default:
        return <Badge variant="success">Semua Peran (Umum)</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pusat Pengumuman PKL
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Phase 10
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Siaran informasi resmi pelaksanaan Praktik Kerja Lapangan SMKN 13 Bandung
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman Baru</span>
          </Button>
        )}
      </div>

      {/* 2. Filter Bar */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari judul pengumuman, kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          <Select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs sm:text-sm"
          >
            <option value="all">Semua Target Sasaran</option>
            <option value="siswa">Khusus Siswa</option>
            <option value="guru_pembimbing">Khusus Guru Pembimbing</option>
            <option value="pembimbing_industri">Khusus Mitra DUDI</option>
          </Select>
        </div>
      </Card>

      {/* 3. Announcement Cards List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500 mt-3 font-medium">Memuat siaran pengumuman...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Megaphone className="w-8 h-8" />}
            title="Tidak ada pengumuman"
            description="Belum ada siaran pengumuman baru untuk kategori ini."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnnouncements.map((ann) => (
            <Card
              key={ann.id}
              className={`p-6 bg-white border transition-all hover:shadow-md relative overflow-hidden ${
                ann.is_pinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Pinned Ribbon */}
              {ann.is_pinned && (
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-white" />
                    <span>PINNED (Penting)</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {getTargetRoleBadge(ann.target_role)}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ann.published_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-slate-500">
                    Oleh: <strong>{ann.author_name}</strong>
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {ann.title}
                </h3>

                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </div>

                {/* Attachment if exists */}
                {ann.attachment_name && (
                  <div className="pt-2">
                    <a
                      href={ann.attachment_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 text-xs font-semibold transition-colors border border-slate-200"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lampiran: {ann.attachment_name}</span>
                      <Download className="w-3 h-3 ml-1 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(ann.id)}
                    className="text-xs h-7 text-amber-700 hover:bg-amber-50"
                  >
                    {ann.is_pinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 mr-1" />
                        <span>Lepas Sematan</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 mr-1" />
                        <span>Sematkan ke Atas</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ann.id)}
                    className="text-xs h-7 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Hapus</span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ================= MODAL CREATE ANNOUNCEMENT (ADMIN) ================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Terbitkan Pengumuman PKL Baru"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Judul Pengumuman <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Jadwal Pembekalan dan Pelepasan Siswa PKL..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Target Sasaran <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                required
              >
                <option value="all">Semua Pengguna (Broadcast Umum)</option>
                <option value="siswa">Khusus Siswa PKL</option>
                <option value="guru_pembimbing">Khusus Guru Pembimbing</option>
                <option value="pembimbing_industri">Khusus Pembimbing Industri</option>
              </Select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Sematkan di Paling Atas (PINNED)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Isi Pengumuman Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Tuliskan detail arahan, jadwal, atau informasi pengumuman..."
              className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Dokumen Lampiran (Opsional)
            </label>
            <Input
              value={formData.attachment_name}
              onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
              placeholder="Contoh: Jadwal_Pelepasan_PKL.pdf"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Pengumuman'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
