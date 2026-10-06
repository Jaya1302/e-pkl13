import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { StatCard } from '../../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { attendanceService } from '../../../services/attendanceService';
import { journalService } from '../../../services/journalService';
import { pklService } from '../../../services/pklService';
import { AttendanceRecord, JournalRecord, PklPlacement } from '../../../types';
import {
  Building2,
  Calendar,
  UserCheck,
  ClipboardList,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  Camera,
  FileText
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export const SiswaDashboard: React.FC = () => {
  const { user } = useAuth();

  const [placement, setPlacement] = useState<PklPlacement | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [recentJournals, setRecentJournals] = useState<JournalRecord[]>([]);
  const [stats, setStats] = useState({
    totalHadir: 42,
    totalJurnal: 38,
    verifiedJurnal: 35,
    attendanceRate: '97.6%',
  });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadSiswaData = async () => {
      try {
        // If placement attached to user profile
        if (user?.placement) {
          setPlacement(user.placement);
        } else {
          const placements = await pklService.getPlacements();
          const found = placements.find(
            (p) => p.student?.email === user?.email || p.student?.name === user?.name
          );
          setPlacement(found || placements[0] || null);
        }

        // Attendance today
        const todayStr = new Date().toISOString().split('T')[0];
        const attendances = await attendanceService.getAttendanceRecords({ date: todayStr });
        const myAtt = attendances.find(
          (a) => a.student_id === user?.student?.id || a.student?.email === user?.email
        );
        setTodayAttendance(myAtt || attendances[0] || null);

        // Recent journals
        const journals = await journalService.getJournals();
        const myJournals = journals.filter(
          (j) => j.student_id === user?.student?.id || j.student?.email === user?.email
        );
        const activeJournals = myJournals.length > 0 ? myJournals : journals.slice(0, 3);
        setRecentJournals(activeJournals);

        const verified = activeJournals.filter((j) => j.status === 'verified').length;
        setStats({
          totalHadir: 42,
          totalJurnal: activeJournals.length,
          verifiedJurnal: verified,
          attendanceRate: '97.6%',
        });
      } catch (err) {
        console.warn('SiswaDashboard load notice:', err);
      }
    };
    loadSiswaData();
  }, [user]);

  const dudiName = placement?.dudi?.name || 'PT Astra Honda Motor (Plant Karawang)';
  const dudiAddress = placement?.dudi?.address || 'Kawasan Industri KIIC Kav. LL 01, Karawang';
  const mentorName = placement?.industry_mentor?.name || 'Bambang Sudarsono';
  const teacherName = placement?.teacher?.name || 'Ahmad Fauzi, S.Kom';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner Siswa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Portal Siswa Peserta PKL &bull; Sedang Praktik Kerja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Halo, {user?.name || 'Siswa PKL'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Lokasi Magang: <strong>{dudiName}</strong>. Pastikan Anda melakukan presensi harian tepat waktu sesuai radius kerja dan mengisi jurnal kegiatan setiap hari.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/absensi">
              <Button size="sm" variant="secondary" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                Presensi Sekarang ({currentTime})
              </Button>
            </Link>
            <Link to="/jurnal">
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-white/20" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
                Tulis Jurnal Hari Ini
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Kartu Status Penempatan & Kontak Bimbingan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info DUDI */}
        <Card className="border-emerald-200/80 bg-emerald-50/20">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  DUDI Tempat Magang
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {dudiName}
                </h2>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-emerald-100">
              <p className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{dudiAddress}</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Periode: 1 Juli 2026 s.d 31 Des 2026</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Pembimbing Industri */}
        <Card className="border-cyan-200/80 bg-cyan-50/20">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">
                  Pembimbing Industri (DUDI)
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {mentorName}
                </h2>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-cyan-100">
              <p className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>0813-8899-0011 (WhatsApp Aktif)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Supervisor Lapangan & Evaluator Aspek Teknis
              </p>
            </div>
          </div>
        </Card>

        {/* Guru Pembimbing */}
        <Card className="border-blue-200/80 bg-blue-50/20">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Guru Pembimbing Sekolah
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {teacherName}
                </h2>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-blue-100">
              <p className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>0812-3456-7801 (Guru Produktif TKJ)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Supervisi berkala dan validasi jurnal mingguan
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Primary Action Cards: Presensi & Jurnal Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status Presensi Hari Ini */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm font-extrabold text-slate-900">
                Status Presensi Hari Ini
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              {currentTime} WIB
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-1">
              {todayAttendance ? (
                <>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sudah Presensi Masuk</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Pukul {todayAttendance.check_in_time || '07:25:00'} WIB &bull; GPS Valid ({todayAttendance.distance_meters || 45}m)
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Belum Melakukan Presensi</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Batas toleransi kehadiran: 08.00 WIB
                  </p>
                </>
              )}
            </div>

            <Link to="/absensi">
              <Button size="sm" variant={todayAttendance ? 'outline' : 'primary'}>
                {todayAttendance ? 'Lihat Bukti' : 'Ambil Foto'}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Status Jurnal Hari Ini */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-extrabold text-slate-900">
                Jurnal Kerja Praktik Hari Ini
              </h2>
            </div>
            <Badge variant="default">Harian</Badge>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 block">
                Catatan Pekerjaan & Kompetensi
              </span>
              <p className="text-xs text-slate-500">
                Tuliskan aktivitas teknis yang Anda kerjakan di DUDI hari ini
              </p>
            </div>

            <Link to="/jurnal">
              <Button size="sm" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
                Buka Jurnal
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Riwayat Jurnal Siswa & Rekap Kehadiran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Riwayat Jurnal Terakhir */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>Riwayat Jurnal Kegiatan Anda</CardTitle>
              <CardDescription>Status verifikasi oleh pembimbing sekolah dan industri</CardDescription>
            </div>
            <Link to="/jurnal">
              <Button variant="ghost" size="sm" className="text-xs">
                Semua Jurnal <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <div className="divide-y divide-slate-100">
            {recentJournals.map((j) => (
              <div key={j.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {j.activity_title}
                    </span>
                    <Badge variant={j.status === 'verified' ? 'success' : 'warning'}>
                      {j.status === 'verified' ? 'Disetujui' : 'Menunggu Review'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {j.activity_description}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Tanggal: {formatDate(j.date)} &bull; {j.competency_type || 'Praktik'}
                  </span>
                </div>

                <Link to="/jurnal">
                  <button className="text-slate-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Kolom Kanan: Rekap Statistik Siswa */}
        <Card className="lg:col-span-4 space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Ringkasan PKL</CardTitle>
              <CardDescription>Akumulasi progres magang</CardDescription>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-600 font-medium">Tingkat Kehadiran</span>
              <span className="font-extrabold text-emerald-600">{stats.attendanceRate}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-600 font-medium">Total Hari Hadir</span>
              <span className="font-extrabold text-slate-900">{stats.totalHadir} Hari</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-600 font-medium">Jurnal Tervalidasi</span>
              <span className="font-extrabold text-blue-600">{stats.verifiedJurnal} / {stats.totalJurnal} Entri</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-600 font-medium">Sertifikat Digital</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Dalam Proses
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
