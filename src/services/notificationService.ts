import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppNotification, NotificationType } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'epkl_notifications_v1';

// Initial Seeded Notifications for All 7 Roles
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // 1. Siswa Notifications
  {
    id: 'notif-s-1',
    user_id: 'u-siswa-1',
    role_target: 'siswa',
    title: 'Jurnal Harian Belum Diisi',
    message: 'Kamu belum mengisi jurnal kegiatan PKL untuk hari ini. Segera buat catatan aktivitas harianmu sebelum batas waktu 23:59 WIB.',
    type: 'journal',
    action_url: '/jurnal',
    reference_id: 'j-today',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
  },
  {
    id: 'notif-s-2',
    user_id: 'u-siswa-1',
    role_target: 'siswa',
    title: 'Catatan Revisi Laporan PKL',
    message: 'Guru pembimbing telah memberikan feedback revisi pada naskah laporan PKL bab 2 & 3. Silakan periksa dan unggah perbaikan.',
    type: 'report',
    action_url: '/laporan',
    reference_id: 'rep-3',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
  },
  {
    id: 'notif-s-3',
    user_id: 'u-siswa-1',
    role_target: 'siswa',
    title: 'Pengumuman Pelaksanaan Supervisi PKL',
    message: 'Diberitahukan kepada seluruh siswa PKL agar menyiapkan buku panduan dan dokumentasi kerja saat kunjungan guru pembimbing.',
    type: 'announcement',
    action_url: '/pengumuman',
    reference_id: 'ann-1',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },

  // 2. Guru Pembimbing Notifications
  {
    id: 'notif-g-1',
    user_id: 'u-guru-1',
    role_target: 'guru_pembimbing',
    title: '3 Jurnal Menunggu Verifikasi',
    message: 'Siswa bimbingan Anda (Ahmad Fauzi & Siti Nurhaliza) telah mengirimkan jurnal kegiatan harian terbaru yang memerlukan paraf/persetujuan.',
    type: 'journal',
    action_url: '/jurnal',
    reference_id: 'j-list',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-g-2',
    user_id: 'u-guru-1',
    role_target: 'guru_pembimbing',
    title: 'Jadwal Monitoring Tahap 1',
    message: 'Agenda kunjungan supervisi siswa PKL ke PT Telkom Indonesia dijadwalkan pada pekan ini. Pastikan mengunggah foto dokumentasi.',
    type: 'monitoring',
    action_url: '/monitoring',
    reference_id: 'mon-1',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-g-3',
    user_id: 'u-guru-1',
    role_target: 'guru_pembimbing',
    title: 'Pengingat Batas Pengisian Nilai Guru',
    message: 'Pengisian komponen penilaian bimbingan guru untuk periode 2026/2027 telah dibuka. Segera lengkapi nilai siswa bimbingan.',
    type: 'assessment',
    action_url: '/penilaian',
    reference_id: 'assess-list',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },

  // 3. Admin PKL & Super Admin Notifications
  {
    id: 'notif-a-1',
    user_id: 'u-admin-1',
    role_target: 'admin_pkl',
    title: 'Siswa Belum Memiliki Penempatan',
    message: 'Terdapat 2 siswa aktif kelas XII TKJ yang belum dialokasikan ke DUDI mitra pada periode PKL 2026/2027.',
    type: 'placement',
    action_url: '/penempatan',
    reference_id: 'place-needed',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'notif-a-2',
    user_id: 'u-admin-1',
    role_target: 'admin_pkl',
    title: 'Naskah Laporan Akhir Masuk',
    message: 'Siswa Siti Nurhaliza telah mengunggah draf laporan akhir PKL. Status laporan: Menunggu Review.',
    type: 'report',
    action_url: '/laporan',
    reference_id: 'rep-2',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'notif-a-3',
    user_id: 'u-admin-1',
    role_target: 'admin_pkl',
    title: 'Sertifikat Digital Siap Diterbitkan',
    message: 'Ahmad Fauzi telah memenuhi 3 syarat kelayakan (PKL selesai, penilaian lengkap, laporan approved). Sertifikat siap diterbitkan.',
    type: 'certificate',
    action_url: '/sertifikat',
    reference_id: 'cert-ready',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },

  // 4. Pembimbing Industri Notifications
  {
    id: 'notif-i-1',
    user_id: 'u-industri-1',
    role_target: 'pembimbing_industri',
    title: 'Penilaian Kinerja Siswa PKL',
    message: 'Mohon mengisi form evaluasi 6 aspek kompetensi industri untuk siswa praktik di instansi Anda.',
    type: 'assessment',
    action_url: '/penilaian',
    reference_id: 'ind-assess',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },

  // 5. Kepala Sekolah & Wakasek Notifications
  {
    id: 'notif-k-1',
    user_id: 'u-kepsek-1',
    role_target: 'kepala_sekolah',
    title: 'Laporan Rekapitulasi Monitoring PKL',
    message: 'Supervisi tahap 1 telah mencapai 80% ketercapaian di 15 mitra DUDI. Laporan eksekutif dapat ditinjau.',
    type: 'monitoring',
    action_url: '/monitoring',
    reference_id: 'exec-mon',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

const getLocalNotifications = (): AppNotification[] => {
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
};

const saveLocalNotifications = (notifs: AppNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
};

export const notificationService = {
  // 1. Get Notifications filtered by current user role/id
  async getNotifications(currentUser?: { id?: string; role?: string }): Promise<AppNotification[]> {
    const list = getLocalNotifications();
    const userRole = currentUser?.role || 'siswa';
    const userId = currentUser?.id;

    const filtered = list.filter((n) => {
      // Direct user match
      if (userId && n.user_id === userId) return true;
      // Target role match (or broadcast 'all')
      if (n.role_target === 'all' || n.role_target === userRole) return true;
      // Admin roles also see general operational alerts
      if ((userRole === 'super_admin' || userRole === 'admin_pkl') && n.role_target === 'admin_pkl') {
        return true;
      }
      if ((userRole === 'kepala_sekolah' || userRole === 'wakasek') && n.role_target === 'kepala_sekolah') {
        return true;
      }
      return false;
    });

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // 2. Get Unread Count
  async getUnreadCount(currentUser?: { id?: string; role?: string }): Promise<number> {
    const notifs = await this.getNotifications(currentUser);
    return notifs.filter((n) => !n.is_read).length;
  },

  // 3. Mark Single Notification as Read
  async markAsRead(notificationId: string): Promise<void> {
    const list = getLocalNotifications();
    const idx = list.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      list[idx].is_read = true;
      list[idx].read_at = new Date().toISOString();
      saveLocalNotifications(list);
    }
  },

  // 4. Mark All User Notifications as Read
  async markAllAsRead(currentUser?: { id?: string; role?: string }): Promise<void> {
    const list = getLocalNotifications();
    const userRole = currentUser?.role || 'siswa';
    const userId = currentUser?.id;

    const updated = list.map((n) => {
      const isTarget =
        (userId && n.user_id === userId) ||
        n.role_target === 'all' ||
        n.role_target === userRole ||
        ((userRole === 'super_admin' || userRole === 'admin_pkl') && n.role_target === 'admin_pkl') ||
        ((userRole === 'kepala_sekolah' || userRole === 'wakasek') && n.role_target === 'kepala_sekolah');

      if (isTarget && !n.is_read) {
        return {
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        };
      }
      return n;
    });

    saveLocalNotifications(updated);
  },

  // 5. Delete Notification
  async deleteNotification(notificationId: string): Promise<void> {
    const list = getLocalNotifications();
    const filtered = list.filter((n) => n.id !== notificationId);
    saveLocalNotifications(filtered);
  },

  // 6. Create New Notification
  async createNotification(data: {
    user_id?: string | null;
    role_target?: string | null;
    title: string;
    message: string;
    type: NotificationType;
    action_url?: string | null;
    reference_id?: string | null;
  }): Promise<AppNotification> {
    const list = getLocalNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: data.user_id || null,
      role_target: data.role_target || 'all',
      title: data.title,
      message: data.message,
      type: data.type,
      action_url: data.action_url || null,
      reference_id: data.reference_id || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    saveLocalNotifications([newNotif, ...list]);
    return newNotif;
  },
};
