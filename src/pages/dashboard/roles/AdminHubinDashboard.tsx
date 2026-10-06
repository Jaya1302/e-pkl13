import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_LABELS } from '../../../constants';
import { StatCard } from '../../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { pklService } from '../../../services/pklService';
import { masterService } from '../../../services/masterService';
import { journalService } from '../../../services/journalService';
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  ClipboardList,
  FileCheck,
  Clock,
  TrendingUp,
  Award,
  ArrowRight,
  UserPlus,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export const AdminHubinDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const userRole = role || 'admin_pkl';

  const [summary, setSummary] = useState({
    totalStudents: 480,
    placedCount: 412,
    unplacedCount: 68,
    activePkl: 405,
    completedPkl: 7,
  });

  const [journalMetrics, setJournalMetrics] = useState({
    todayCount: 388,
    unfiledToday: 17,
    pendingVerification: 24,
    verifiedCount: 364,
  });

  const [dudiCount, setDudiCount] = useState(54);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumData, dudiData, jMetrics] = await Promise.all([
          pklService.getPlacementSummary(),
          masterService.getDudi(),
          journalService.getJournalMetrics(),
        ]);
        if (sumData) setSummary(sumData);
        if (dudiData) setDudiCount(dudiData.length);
        if (jMetrics) setJournalMetrics(jMetrics);
      } catch (err) {
        console.warn('AdminHubinDashboard live load notice:', err);
      }
    };
    loadData();
  }, []);

  const majorStats = [
    { name: 'TKRO', ditempatkan: 110, belum: 10 },
    { name: 'TP', ditempatkan: 85, belum: 15 },
    { name: 'TKJ', ditempatkan: 95, belum: 8 },
    { name: 'APAT', ditempatkan: 62, belum: 18 },
    { name: 'APHP', ditempatkan: 60, belum: 17 },
  ];

  const attendanceStats = [
    { hari: 'Senin', hadir: 405, izin: 5, sakit: 2 },
    { hari: 'Selasa', hadir: 408, izin: 3, sakit: 1 },
    { hari: 'Rabu', hadir: 402, izin: 6, sakit: 4 },
    { hari: 'Kamis', hadir: 410, izin: 2, sakit: 0 },
    { hari: 'Jumat', hadir: 398, izin: 8, sakit: 6 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner Hubin / Admin */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-emerald-800 to-navy-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Portal Manajemen & Kemitraan DUDI &bull; Gelombang 1 Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name || 'Administrator'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Anda memiliki akses kontrol terpusat sebagai <strong>{ROLE_LABELS[userRole]}</strong> untuk mengelola penempatan siswa, supervisi monitoring guru, rekonsiliasi nilai, dan penerbitan sertifikat PKL SMKN 13 Bandung.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/penempatan">
              <Button size="sm" variant="secondary" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                Plotting Penempatan
              </Button>
            </Link>
            <Link to="/dudi">
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-white/20" leftIcon={<Building2 className="w-3.5 h-3.5" />}>
                Kelola Mitra DUDI
              </Button>
            </Link>
            <Link to="/sertifikat">
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-white/20" leftIcon={<Award className="w-3.5 h-3.5" />}>
                Penerbitan Sertifikat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        <StatCard
          title="Total Siswa PKL"
          value={summary.totalStudents}
          subtitle="Tingkat XI & XII"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Sudah Ditempatkan"
          value={summary.placedCount}
          subtitle={`${summary.totalStudents ? Math.round((summary.placedCount / summary.totalStudents) * 100) : 0}% dari kuota`}
          icon={<UserCheck className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: 'Terplot', isPositive: true }}
        />

        <StatCard
          title="Belum Ditempatkan"
          value={summary.unplacedCount}
          subtitle="Memerlukan alokasi DUDI"
          icon={<UserX className="w-5 h-5" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />

        <StatCard
          title="Mitra DUDI Aktif"
          value={dudiCount}
          subtitle="Perusahaan terverifikasi"
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="PKL Selesai"
          value={summary.completedPkl}
          subtitle="Siap sertifikasi"
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-4 border-amber-200/60 bg-amber-50/40">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-900 block">Jurnal Menunggu Review</span>
            <div className="text-xl font-extrabold text-amber-950">{journalMetrics.pendingVerification} Jurnal</div>
            <span className="text-[10px] text-amber-700 font-medium">Perlu verifikasi pembimbing</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-rose-200/60 bg-rose-50/40">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-900 block">Jurnal Belum Diisi</span>
            <div className="text-xl font-extrabold text-rose-950">{journalMetrics.unfiledToday} Siswa</div>
            <span className="text-[10px] text-rose-700 font-medium">Batas hari ini 20.00 WIB</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-emerald-200/60 bg-emerald-50/40">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-900 block">Jurnal Terverifikasi</span>
            <div className="text-xl font-extrabold text-emerald-950">{journalMetrics.verifiedCount} Entri</div>
            <span className="text-[10px] text-emerald-700 font-medium">Tervalidasi guru & industri</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-blue-200/60 bg-blue-50/40">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-900 block">Tingkat Kehadiran</span>
            <div className="text-xl font-extrabold text-blue-950">98.2% Hadir</div>
            <span className="text-[10px] text-blue-700 font-medium">Validasi GPS Geofencing</span>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Placement by Major */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Penempatan Siswa per Jurusan</CardTitle>
              <CardDescription>Distribusi siswa yang telah teralokasi ke DUDI mitra</CardDescription>
            </div>
            <Badge variant="default">TA 2026/2027</Badge>
          </CardHeader>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={majorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="ditempatkan" name="Ditempatkan" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="belum" name="Belum Ditempatkan" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Attendance Trend */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Statistik Kehadiran Mingguan</CardTitle>
              <CardDescription>Kehadiran harian presensi siswa magang</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>98.2%</span>
            </div>
          </CardHeader>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hari" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[380, 420]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hadir"
                  name="Hadir"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAdminHadir)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
