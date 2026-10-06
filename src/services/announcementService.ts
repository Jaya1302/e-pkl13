import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Announcement, AnnouncementFilter } from '../types';
import { notificationService } from './notificationService';

const ANNOUNCEMENTS_STORAGE_KEY = 'epkl_announcements_v1';

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Pedoman Penulisan Laporan Akhir PKL Tahun Ajaran 2026/2027',
    content: `Diberitahukan kepada seluruh siswa kelas XII peserta Praktik Kerja Lapangan (PKL) bahwa naskah laporan akhir wajib disusun sesuai Buku Pedoman Penulisan Laporan PKL SMKN 13 Bandung.

Beberapa poin penting:
1. Naskah laporan memuat Bab 1 s.d. Bab 4 lengkap dengan lembar pengesahan DUDI dan sekolah.
2. Batas waktu pengunggahan draf awal paling lambat 15 September 2026 melalui menu Laporan & Dokumen.
3. Siswa yang membutuhkan konsultasi dapat berkoordinasi langsung dengan guru pembimbing masing-masing.`,
    target_role: 'all',
    attachment_name: 'Buku_Pedoman_Laporan_PKL_2026.pdf',
    attachment_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    is_pinned: true,
    author_name: 'Pokja PKL SMKN 13 Bandung',
    published_at: '2026-08-20T08:00:00.000Z',
  },
  {
    id: 'ann-2',
    title: 'Jadwal Monitoring & Supervisi DUDI Tahap 1 Dimulai',
    content: `Kepada Bapak/Ibu Guru Pembimbing PKL,

Pelaksanaan monitoring tahap 1 akan dimulai efektif tanggal 25 Agustus 2026. Mohon untuk:
• Melakukan konfirmasi jadwal kunjungan kepada mentor industri minimal H-2.
• Mengisi lembar supervisi monitoring 5 aspek di menu Monitoring PKL.
• Mengambil foto dokumentasi bersama siswa dan pembimbing industri.`,
    target_role: 'guru_pembimbing',
    attachment_name: 'Surat_Tugas_Monitoring_Tahap1.pdf',
    attachment_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    is_pinned: true,
    author_name: 'Wakasek Hubungan Industri (Hubin)',
    published_at: '2026-08-21T09:00:00.000Z',
  },
  {
    id: 'ann-3',
    title: 'Sosialisasi Penilaian Kinerja Industri & Rubrik 6 Aspek',
    content: `Kepada seluruh Pembimbing Industri Mitra DUDI, form pengisian evaluasi kinerja siswa PKL kini telah dibuka pada menu Penilaian PKL. Penilaian mencakup 6 aspek utama: Disiplin, Tanggung Jawab, Kerja Sama, Komunikasi, Kompetensi Teknis, dan Sikap Kerja.`,
    target_role: 'pembimbing_industri',
    is_pinned: false,
    author_name: 'Admin Pokja BKK & PKL',
    published_at: '2026-08-22T10:00:00.000Z',
  },
];

const getLocalAnnouncements = (): Announcement[] => {
  const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  return INITIAL_ANNOUNCEMENTS;
};

const saveLocalAnnouncements = (items: Announcement[]) => {
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
};

export const announcementService = {
  // 1. Get Announcements with filtering
  async getAnnouncements(filter?: AnnouncementFilter, currentUser?: { role?: string }): Promise<Announcement[]> {
    const list = getLocalAnnouncements();
    const userRole = currentUser?.role || 'siswa';

    let filtered = list.filter((a) => {
      // Role match
      if (a.target_role !== 'all' && a.target_role !== userRole && userRole !== 'super_admin' && userRole !== 'admin_pkl') {
        return false;
      }
      if (filter?.roleTarget && filter.roleTarget !== 'all' && a.target_role !== filter.roleTarget) {
        return false;
      }
      if (filter?.isPinned !== undefined && a.is_pinned !== filter.isPinned) {
        return false;
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      }
      return true;
    });

    // Pinned announcements first, then sorted by published_at DESC
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  },

  // 2. Create Announcement
  async createAnnouncement(data: {
    title: string;
    content: string;
    target_role: string;
    attachment_name?: string;
    attachment_url?: string;
    is_pinned?: boolean;
    author_name?: string;
  }): Promise<Announcement> {
    const list = getLocalAnnouncements();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title,
      content: data.content,
      target_role: data.target_role,
      attachment_name: data.attachment_name || null,
      attachment_url: data.attachment_url || null,
      is_pinned: Boolean(data.is_pinned),
      author_name: data.author_name || 'Admin Pokja PKL',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalAnnouncements([newAnn, ...list]);

    // Automatically trigger a notification broadcast
    await notificationService.createNotification({
      role_target: data.target_role,
      title: `Pengumuman Baru: ${data.title}`,
      message: data.content.substring(0, 120) + (data.content.length > 120 ? '...' : ''),
      type: 'announcement',
      action_url: '/pengumuman',
      reference_id: newAnn.id,
    });

    return newAnn;
  },

  // 3. Toggle Pin
  async togglePin(id: string): Promise<Announcement> {
    const list = getLocalAnnouncements();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Pengumuman tidak ditemukan');

    list[idx].is_pinned = !list[idx].is_pinned;
    list[idx].updated_at = new Date().toISOString();
    saveLocalAnnouncements(list);
    return list[idx];
  },

  // 4. Delete Announcement
  async deleteAnnouncement(id: string): Promise<void> {
    const list = getLocalAnnouncements();
    const filtered = list.filter((a) => a.id !== id);
    saveLocalAnnouncements(filtered);
  },
};
