import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage';

// Master Data Pages
import { SiswaPage } from '../pages/master/SiswaPage';
import { GuruPage } from '../pages/master/GuruPage';
import { JurusanPage } from '../pages/master/JurusanPage';
import { KelasPage } from '../pages/master/KelasPage';
import { DudiPage } from '../pages/master/DudiPage';
import { PembimbingIndustriPage } from '../pages/master/PembimbingIndustriPage';

// PKL Management Pages
import { PeriodePage } from '../pages/pkl/PeriodePage';
import { PenempatanPage } from '../pages/pkl/PenempatanPage';

// Attendance, Journal, Monitoring, Assessment, Document & Certificate Pages
import { AbsensiPage } from '../pages/attendance/AbsensiPage';
import { JurnalPage } from '../pages/journal/JurnalPage';
import { MonitoringPage } from '../pages/monitoring/MonitoringPage';
import { PenilaianPage } from '../pages/assessment/PenilaianPage';
import { LaporanDokumenPage } from '../pages/document/LaporanDokumenPage';
import { SertifikatPage } from '../pages/certificate/SertifikatPage';
import { VerifyCertificatePage } from '../pages/public/VerifyCertificatePage';
import { PengumumanPage } from '../pages/announcement/PengumumanPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { PengaturanPage } from '../pages/admin/PengaturanPage';

import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState } from '../components/common/EmptyState';
import {
  Camera,
  FileCheck,
  FileText,
  Award,
  Bell,
  Users,
  Settings
} from 'lucide-react';

const ModulePlaceholder: React.FC<{ title: string; desc: string; icon: React.ReactNode }> = ({
  title,
  desc,
  icon,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <EmptyState
        icon={icon}
        title={`Modul ${title} Siap Dikonfigurasi`}
        description="Struktur fondasi rute, role RBAC, dan layout telah aktif dan terproteksi."
      />
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Auth & Verification routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/verify/:certificateNumber" element={<VerifyCertificatePage />} />
      <Route path="/verify" element={<VerifyCertificatePage />} />

      {/* 2. Protected App shell (Requires authenticated user) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Base Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Common routes accessible by all 7 authenticated roles */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Master Data — Restricted to: Super Admin & Admin PKL */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin_pkl']} />}>
            <Route path="/master/siswa" element={<SiswaPage />} />
            <Route path="/master/guru" element={<GuruPage />} />
            <Route path="/master/jurusan" element={<JurusanPage />} />
            <Route path="/master/kelas" element={<KelasPage />} />
            <Route path="/master/pembimbing-industri" element={<PembimbingIndustriPage />} />
            <Route path="/periode" element={<PeriodePage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
          </Route>

          {/* DUDI & Mitra — Super Admin, Admin PKL, Kepsek, Wakasek, Guru, Siswa */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'super_admin',
                  'admin_pkl',
                  'kepala_sekolah',
                  'wakasek',
                  'guru_pembimbing',
                  'siswa',
                ]}
              />
            }
          >
            <Route path="/dudi" element={<DudiPage />} />
          </Route>

          {/* Periode & Penempatan — Super Admin, Admin PKL, Kepsek, Wakasek, Guru, Pembimbing Industri */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'super_admin',
                  'admin_pkl',
                  'kepala_sekolah',
                  'wakasek',
                  'guru_pembimbing',
                  'pembimbing_industri',
                ]}
              />
            }
          >
            <Route path="/penempatan" element={<PenempatanPage />} />
          </Route>

          {/* Presensi / Absensi — All 7 roles */}
          <Route path="/absensi" element={<AbsensiPage />} />

          {/* Jurnal Kegiatan — All 7 roles */}
          <Route path="/jurnal" element={<JurnalPage />} />

          {/* Monitoring Guru — Super Admin, Admin PKL, Kepsek, Wakasek, Guru Pembimbing */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'super_admin',
                  'admin_pkl',
                  'kepala_sekolah',
                  'wakasek',
                  'guru_pembimbing',
                ]}
              />
            }
          >
            <Route path="/monitoring" element={<MonitoringPage />} />
          </Route>

          {/* Penilaian PKL — All 7 roles */}
          <Route path="/penilaian" element={<PenilaianPage />} />

          {/* Laporan & Dokumen — Super Admin, Admin PKL, Kepsek, Wakasek, Guru, Siswa */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'super_admin',
                  'admin_pkl',
                  'kepala_sekolah',
                  'wakasek',
                  'guru_pembimbing',
                  'siswa',
                ]}
              />
            }
          >
            <Route path="/laporan" element={<LaporanDokumenPage />} />
            <Route path="/sertifikat" element={<SertifikatPage />} />
          </Route>

          {/* Pengumuman — All 7 roles */}
          <Route path="/pengumuman" element={<PengumumanPage />} />
        </Route>
      </Route>

      {/* 3. 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
