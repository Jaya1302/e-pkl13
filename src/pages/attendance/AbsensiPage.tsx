import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord, AttendanceStatus, PklPlacement, Student } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { pklService } from '../../services/pklService';
import { masterService } from '../../services/masterService';
import { getCurrentCoordinates } from '../../utils/geoUtils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import {
  UserCheck,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  Building2,
  Sliders,
  Sparkles
} from 'lucide-react';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  hadir: { label: 'Hadir Tepat Waktu', variant: 'success' },
  izin: { label: 'Izin Resmi', variant: 'warning' },
  sakit: { label: 'Surat Sakit', variant: 'info' },
  alpa: { label: 'Tanpa Keterangan', variant: 'danger' },
};

export const AbsensiPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const isStudent = role === 'siswa';

  // State
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [myPlacement, setMyPlacement] = useState<PklPlacement | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time ticker
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

  // GPS Settings
  const [isGpsEnforced, setIsGpsEnforced] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Form State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [leaveStatus, setLeaveStatus] = useState<'izin' | 'sakit'>('izin');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters for Admin/Guru
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allPlacements, allStudents, allAttendances] = await Promise.all([
        pklService.getPlacements(),
        masterService.getStudents(),
        attendanceService.getAttendanceRecords(),
      ]);

      setStudents(allStudents);
      setAttendances(allAttendances);

      // Find my placement if student
      if (isStudent) {
        const studentObj = user?.student || allStudents.find((s) => s.email === user?.email || s.name === user?.name) || allStudents[0];
        const placement = user?.placement || allPlacements.find((p) => p.student_id === studentObj?.id);
        setMyPlacement(placement || null);

        if (studentObj) {
          const todayRec = await attendanceService.getTodayAttendance(studentObj.id);
          setTodayRecord(todayRec);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data presensi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isStudent]);

  // Request GPS
  const handleDetectGPS = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      setGpsLocation({ latitude: coords.latitude, longitude: coords.longitude });
      showToast(`GPS terdeteksi (Akurasi: ±${Math.round(coords.accuracy)}m)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mendeteksi koordinat GPS', 'warning');
    } finally {
      setIsLocating(false);
    }
  };

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submit Check In
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPlacement) {
      showToast('Anda belum terdaftar dalam penempatan PKL aktif.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile) {
        photoUrl = await attendanceService.uploadPhoto(photoFile);
      }

      await attendanceService.checkIn({
        placement_id: myPlacement.id,
        student_id: myPlacement.student_id,
        latitude: gpsLocation?.latitude,
        longitude: gpsLocation?.longitude,
        photo_url: photoUrl,
        notes: checkInNotes,
        isGpsEnforced,
      });

      showToast('Presensi masuk berhasil dicatat! Selamat bertugas.', 'success');
      setIsCheckInOpen(false);
      setPhotoFile(null);
      setPhotoPreview('');
      setCheckInNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal melakukan presensi masuk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Check Out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setIsSubmitting(true);
    try {
      await attendanceService.checkOut(todayRecord.id, 'Presensi pulang tepat waktu');
      showToast('Presensi pulang berhasil dicatat. Sampai jumpa besok!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal presensi pulang', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Leave / Sick Request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPlacement) {
      showToast('Penempatan tidak ditemukan.', 'error');
      return;
    }
    if (!leaveNotes) {
      showToast('Keterangan izin/sakit wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile) {
        photoUrl = await attendanceService.uploadPhoto(photoFile);
      }

      await attendanceService.submitLeave({
        placement_id: myPlacement.id,
        student_id: myPlacement.student_id,
        status: leaveStatus,
        notes: leaveNotes,
        photo_url: photoUrl,
      });

      showToast(`Pengajuan ${leaveStatus.toUpperCase()} berhasil dikirimkan ke guru pembimbing.`, 'success');
      setIsLeaveOpen(false);
      setPhotoFile(null);
      setPhotoPreview('');
      setLeaveNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengajukan izin/sakit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered attendances for admin / teacher
  const filteredAttendances = useMemo(() => {
    return attendances.filter((a) => {
      const matchDate = filterDate ? a.date === filterDate : true;
      const matchStatus = filterStatus ? a.status === filterStatus : true;
      const matchSearch =
        (a.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.student?.nis || '').includes(searchTerm) ||
        (a.placement?.dudi?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchDate && matchStatus && matchSearch;
    });
  }, [attendances, filterDate, filterStatus, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Presensi & Kehadiran Siswa PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan kehadiran harian berbasis verifikasi swafoto dan validasi radius geolokasi GPS DUDI.
          </p>
        </div>

        {/* Live Clock Banner */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
          <Clock className="w-4 h-4 text-brand-600 animate-spin-slow" />
          <div className="text-right">
            <div className="text-sm font-extrabold font-mono text-slate-900">{currentTime} WIB</div>
            <div className="text-[10px] text-slate-400 font-semibold">{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      </div>

      {/* STUDENT DAILY ATTENDANCE CARD */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Today's Action Widget */}
          <Card className="lg:col-span-1 border-brand-200/80 bg-gradient-to-b from-brand-50/40 via-white to-white p-5 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 block">Presensi Hari Ini</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">{formatDate(new Date().toISOString())}</h2>
              {myPlacement ? (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-600" />
                  <span>{myPlacement.dudi?.name}</span>
                </p>
              ) : (
                <p className="text-xs text-rose-500 font-semibold mt-1">Belum terdaftar di DUDI mitra.</p>
              )}
            </div>

            {/* Attendance Status Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Status Kehadiran:</span>
                {todayRecord ? (
                  <Badge variant={STATUS_CONFIG[todayRecord.status]?.variant || 'neutral'} size="sm">
                    {STATUS_CONFIG[todayRecord.status]?.label}
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">Belum Presensi</Badge>
                )}
              </div>

              {todayRecord && (
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jam Masuk</span>
                    <span className="font-mono font-bold text-slate-800">{todayRecord.check_in_time || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jam Pulang</span>
                    <span className="font-mono font-bold text-slate-800">{todayRecord.check_out_time || 'Belum'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!todayRecord ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      handleDetectGPS();
                      setIsCheckInOpen(true);
                    }}
                    className="w-full"
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Absen Masuk
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsLeaveOpen(true)}
                    className="w-full"
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    Izin / Sakit
                  </Button>
                </div>
              ) : todayRecord.status === 'hadir' && !todayRecord.check_out_time ? (
                <Button
                  onClick={handleCheckOut}
                  variant="success"
                  className="w-full"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Absen Pulang Sekarang
                </Button>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-center text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Presensi Hari Ini Telah Lengkap
                </div>
              )}
            </div>
          </Card>

          {/* Card 2: DUDI Location & Geofence Status */}
          <Card className="lg:col-span-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Informasi Radius Geofence DUDI
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {myPlacement?.dudi?.address}, {myPlacement?.dudi?.city}
                </p>
              </div>
              <Badge variant="purple" size="sm">
                Radius: {myPlacement?.dudi?.radius_meters || 100} Meter
              </Badge>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs text-left w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">GPS DUDI:</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {myPlacement?.dudi?.latitude || '-6.3050'}, {myPlacement?.dudi?.longitude || '107.2990'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Posisi Anda:</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Belum dideteksi'}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDetectGPS}
                isLoading={isLocating}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-600" />}
              >
                Uji Lokasi GPS
              </Button>
            </div>

            {/* Attendance Hint */}
            <div className="text-[11px] text-slate-500 bg-blue-50/60 border border-blue-100 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Ketentuan Presensi:</strong> Pastikan Anda telah mengizinkan browser mengakses lokasi (GPS) dan kamera perangkat untuk swafoto kehadiran. Apabila sinyal GPS terkendala di dalam gedung, foto kehadiran tetap tersimpan dan dapat diverifikasi oleh guru pembimbing.
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ADMIN & GURU REKAP PRESENSI TABLE */}
      <div className="space-y-4">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NIS, atau DUDI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">Semua Status Kehadiran</option>
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>

            {!isStudent && (
              <div className="flex items-center justify-end gap-2 text-xs">
                <Sliders className="w-4 h-4 text-slate-400" />
                <label className="text-slate-600 font-semibold flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGpsEnforced}
                    onChange={(e) => setIsGpsEnforced(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span>Wajibkan Radius GPS</span>
                </label>
              </div>
            )}
          </div>
        </Card>

        {/* Main Attendance Table */}
        {isLoading ? (
          <LoadingSpinner label="Memuat rekap presensi..." />
        ) : filteredAttendances.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="Tidak Ada Data Presensi"
            description="Belum ada riwayat kehadiran siswa pada filter tanggal yang dipilih."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Siswa</TableHeaderCell>
                <TableHeaderCell>DUDI Mitra</TableHeaderCell>
                <TableHeaderCell>Jam Masuk</TableHeaderCell>
                <TableHeaderCell>Jam Pulang</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Validasi GPS & Foto</TableHeaderCell>
                <TableHeaderCell className="text-right">Catatan</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendances.map((rec) => {
                const statusConf = STATUS_CONFIG[rec.status] || STATUS_CONFIG.hadir;
                return (
                  <TableRow key={rec.id}>
                    <TableCell className="text-xs">
                      <div className="font-extrabold text-slate-900">{rec.student?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {rec.student?.nis}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {rec.placement?.dudi?.name || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-slate-800">
                      {rec.check_in_time || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-slate-800">
                      {rec.check_out_time || <span className="text-slate-400 font-normal">Belum</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConf.variant} size="sm">
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        {rec.photo_url ? (
                          <button
                            onClick={() => {
                              setSelectedPhoto(rec.photo_url || null);
                              setIsPhotoViewerOpen(true);
                            }}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform"
                            title="Klik untuk lihat foto"
                          >
                            <img src={rec.photo_url} alt="Selfie" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tanpa Foto</span>
                        )}

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            rec.is_gps_valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {rec.distance_meters ? `±${rec.distance_meters}m` : 'GPS OK'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500 max-w-xs truncate">
                      {rec.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Check In Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Formulir Presensi Masuk Siswa"
        description="Ambil swafoto (selfie) dan konfirmasi lokasi DUDI Anda."
        maxWidth="lg"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4 text-xs">
          {/* Photo Upload / Camera Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Foto Bukti Kehadiran / Selfie</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 space-y-3">
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-36 h-36 rounded-2xl object-cover border border-slate-300 shadow-xs mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview('');
                    }}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Unggah foto kehadiran dari kamera</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
            </div>
          </div>

          {/* GPS status display */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" />
              Status GPS:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Mendeteksi...'}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Catatan Masuk (Opsional)</label>
            <textarea
              rows={2}
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
              placeholder="Contoh: Datang lebih awal untuk briefing safety K3..."
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCheckInOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Kirim Presensi Masuk
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leave / Sick Modal */}
      <Modal
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        title="Pengajuan Izin / Surat Sakit"
        description="Sampaikan permohonan ketidakhadiran resmi kepada pembimbing."
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Jenis Pengajuan</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold ${
                  leaveStatus === 'izin' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="leave_type"
                  checked={leaveStatus === 'izin'}
                  onChange={() => setLeaveStatus('izin')}
                  className="hidden"
                />
                <span>Izin Resmi</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold ${
                  leaveStatus === 'sakit' ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="leave_type"
                  checked={leaveStatus === 'sakit'}
                  onChange={() => setLeaveStatus('sakit')}
                  className="hidden"
                />
                <span>Surat Dokter / Sakit</span>
              </label>
            </div>
          </div>

          {/* Photo Proof */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Lampirkan Surat Bukti (Opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">Alasan / Keterangan Lengkap</label>
            <textarea
              rows={3}
              value={leaveNotes}
              onChange={(e) => setLeaveNotes(e.target.value)}
              placeholder="Jelaskan alasan izin / sakit secara rinci..."
              required
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLeaveOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Kirim Permohonan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Photo Zoom Viewer Modal */}
      <Modal
        isOpen={isPhotoViewerOpen}
        onClose={() => setIsPhotoViewerOpen(false)}
        title="Pratinjau Foto Bukti Kehadiran"
      >
        {selectedPhoto && (
          <div className="space-y-4 text-center">
            <img src={selectedPhoto} alt="Bukti Presensi" className="w-full max-h-96 object-contain rounded-2xl" />
            <Button size="sm" variant="outline" onClick={() => setIsPhotoViewerOpen(false)}>
              Tutup
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
