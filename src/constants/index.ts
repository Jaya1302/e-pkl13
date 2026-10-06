import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  UserCheck,
  ClipboardList,
  Camera,
  FileCheck,
  Award,
  FileText,
  Bell,
  Settings,
  Briefcase,
  Layers
} from 'lucide-react';
import { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_pkl: 'Admin PKL',
  kepala_sekolah: 'Kepala Sekolah',
  wakasek: 'Wakil Kepala Sekolah',
  guru_pembimbing: 'Guru Pembimbing',
  siswa: 'Siswa PKL',
  pembimbing_industri: 'Pembimbing Industri',
};

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-rose-50 text-rose-700 border-rose-200',
  admin_pkl: 'bg-purple-50 text-purple-700 border-purple-200',
  kepala_sekolah: 'bg-amber-50 text-amber-700 border-amber-200',
  wakasek: 'bg-orange-50 text-orange-700 border-orange-200',
  guru_pembimbing: 'bg-blue-50 text-blue-700 border-blue-200',
  siswa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pembimbing_industri: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: UserRole[];
  badge?: string;
  submenu?: {
    title: string;
    href: string;
    roles: UserRole[];
  }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa', 'pembimbing_industri'],
  },
  {
    title: 'Master Data',
    href: '/master',
    icon: Layers,
    roles: ['super_admin', 'admin_pkl'],
    submenu: [
      { title: 'Data Siswa', href: '/master/siswa', roles: ['super_admin', 'admin_pkl'] },
      { title: 'Data Guru', href: '/master/guru', roles: ['super_admin', 'admin_pkl'] },
      { title: 'Data Jurusan', href: '/master/jurusan', roles: ['super_admin', 'admin_pkl'] },
      { title: 'Data Kelas', href: '/master/kelas', roles: ['super_admin', 'admin_pkl'] },
      { title: 'Pembimbing Industri', href: '/master/pembimbing-industri', roles: ['super_admin', 'admin_pkl'] },
    ],
  },
  {
    title: 'Periode PKL',
    href: '/periode',
    icon: Calendar,
    roles: ['super_admin', 'admin_pkl'],
  },
  {
    title: 'Data DUDI & Mitra',
    href: '/dudi',
    icon: Building2,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa'],
  },
  {
    title: 'Penempatan PKL',
    href: '/penempatan',
    icon: Briefcase,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'pembimbing_industri'],
  },
  {
    title: 'Absensi PKL',
    href: '/absensi',
    icon: UserCheck,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa', 'pembimbing_industri'],
  },
  {
    title: 'Jurnal Kegiatan',
    href: '/jurnal',
    icon: ClipboardList,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa', 'pembimbing_industri'],
  },
  {
    title: 'Monitoring Guru',
    href: '/monitoring',
    icon: Camera,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing'],
  },
  {
    title: 'Penilaian PKL',
    href: '/penilaian',
    icon: FileCheck,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa', 'pembimbing_industri'],
  },
  {
    title: 'Laporan & Dokumen',
    href: '/laporan',
    icon: FileText,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa'],
  },
  {
    title: 'Sertifikat PKL',
    href: '/sertifikat',
    icon: Award,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa'],
  },
  {
    title: 'Pengumuman',
    href: '/pengumuman',
    icon: Bell,
    roles: ['super_admin', 'admin_pkl', 'kepala_sekolah', 'wakasek', 'guru_pembimbing', 'siswa', 'pembimbing_industri'],
  },
  {
    title: 'User Management',
    href: '/users',
    icon: Users,
    roles: ['super_admin', 'admin_pkl'],
  },
  {
    title: 'Pengaturan Sistem',
    href: '/pengaturan',
    icon: Settings,
    roles: ['super_admin', 'admin_pkl'],
  },
];
