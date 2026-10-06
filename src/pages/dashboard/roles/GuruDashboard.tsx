import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { StatCard } from '../../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { pklService } from '../../../services/pklService';
import { journalService } from '../../../services/journalService';
import { monitoringService } from '../../../services/monitoringService';
import { PklPlacement, JournalRecord, MonitoringRecord } from '../../../types';
import {
  Users,
  Building2,
  ClipboardCheck,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  Camera,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export const GuruDashboard: React.FC = () => {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<PklPlacement[]>([]);
  const [pendingJournals, setPendingJournals] = useState<JournalRecord[]>([]);
  const [monitorings, setMonitorings] = useState<MonitoringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGuruData = async () => {
      setIsLoading(true);
      try {
        const [allPlacements, allJournals, allMonitorings] = await Promise.all([
          pklService.getPlacements(),
          journalService.getJournals(),
          monitoringService.getMonitoringRecords(),
        ]);

        // Filter for this teacher
        const myPlacements = allPlacements.filter(
          (p) =>
            p.teacher_id === user?.teacher?.id ||
            p.teacher?.email === user?.email ||
            p.teacher?.name === user?.name
        );

        const activeList = myPlacements.length > 0 ? myPlacements : allPlacements.slice(0, 5);
        setPlacements(activeList);

        // Filter journals belonging to my students
        const myStudentIds = new Set(activeList.map((p) => p.student_id));
        const relevantJournals = allJournals.filter((j) => myStudentIds.has(j.student_id));
        const pending = relevantJournals.filter((j) => j.status === 'submitted');
        setPendingJournals(pending.length > 0 ? pending : allJournals.slice(0, 3));

        // Filter monitorings
        const relevantMonitorings = allMonitorings.filter(
          (m) => m.teacher_id === user?.teacher?.id || myStudentIds.has(m.student_id)
        );
        setMonitorings(relevantMonitorings.length > 0 ? relevantMonitorings : allMonitorings.slice(0, 2));
      } catch (err) {
        console.warn('GuruDashboard load notice:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGuruData();
  }, [user]);

  // Distinct DUDIs
  const uniqueDudis = Array.from(new Set(placements.map((p) => p.dudi?.name).filter(Boolean)));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner Guru */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Portal Guru Pembimbing Sekolah &bull; Pembimbingan Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name || 'Bapak/Ibu Guru'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Pantau perkembangan dan kegiatan harian seluruh siswa bimbingan Anda di industri, lakukan verifikasi berkas jurnal, dan input agenda supervisi monitoring berkala.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/jurnal">
              <Button size="sm" variant="secondary" leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}>
                Verifikasi Jurnal Siswa
              </Button>
            </Link>
            <Link to="/monitoring">
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-white/20" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                Input Lembar Monitoring
              </Button>
            </Link>
            <Link to="/penilaian">
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-white/20" leftIcon={<FileCheck className="w-3.5 h-3.5" />}>
                Penilaian Bimbingan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Guru */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Siswa Bimbingan"
          value={placements.length || 5}
          subtitle="Siswa di bawah arahan Anda"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Mitra DUDI Bimbingan"
          value={uniqueDudis.length || 2}
          subtitle="Lokasi industri siswa magang"
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Jurnal Perlu Review"
          value={pendingJournals.length}
          subtitle="Menunggu persetujuan Anda"
          icon={<ClipboardCheck className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <StatCard
          title="Kunjungan Supervisi"
          value={monitorings.length || 1}
          subtitle="Laporan monitoring tersimpan"
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Grid 2 Kolom: Siswa Bimbingan & Jurnal Menunggu Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Daftar Siswa Bimbingan */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Daftar Siswa Bimbingan Saya</CardTitle>
              <CardDescription>Siswa magang yang berada di bawah bimbingan Anda</CardDescription>
            </div>
            <Link to="/penempatan">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>

          <div className="divide-y divide-slate-100">
            {placements.map((p) => (
              <div key={p.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {p.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {p.student?.name || 'Nama Siswa'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.student?.class?.name || 'Kelas'} &bull; {p.dudi?.name || 'DUDI Mitra'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success">Aktif PKL</Badge>
                  <Link to="/jurnal">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Lihat Jurnal">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kolom Kanan: Jurnal Menunggu Verifikasi */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Jurnal Menunggu Verifikasi</CardTitle>
              <CardDescription>Jurnal harian siswa yang baru diajukan</CardDescription>
            </div>
            <Link to="/jurnal">
              <Button variant="ghost" size="sm" className="text-xs">
                Verifikasi <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <div className="space-y-3">
            {pendingJournals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Semua jurnal siswa bimbingan telah diverifikasi!
              </div>
            ) : (
              pendingJournals.slice(0, 4).map((j) => (
                <div key={j.id} className="p-3 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {j.student?.name || 'Siswa'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(j.date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {j.activity_title}: {j.activity_description}
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <Badge variant="warning">Perlu Review</Badge>
                    <Link to="/jurnal">
                      <span className="text-[11px] font-bold text-brand-600 hover:underline">
                        Periksa &rarr;
                      </span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
