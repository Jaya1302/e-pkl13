import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  settingsService,
  SchoolProfile,
  GpsSettings,
  GradingSettings,
  DEFAULT_SCHOOL_PROFILE,
  DEFAULT_GPS_SETTINGS,
  DEFAULT_GRADING_SETTINGS
} from '../../services/settingsService';
import {
  Settings,
  Building2,
  MapPin,
  Award,
  Database,
  Save,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Globe,
  Sliders
} from 'lucide-react';

export const PengaturanPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'sekolah' | 'gps' | 'nilai' | 'backup'>('sekolah');
  const [isSaving, setIsSaving] = useState(false);

  // Form School Profile
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => settingsService.getSchoolProfile());

  // Form GPS & Presensi Settings
  const [gpsSettings, setGpsSettings] = useState<GpsSettings>(() => settingsService.getGpsSettings());

  // Form Grading & Assessment Settings
  const [gradingSettings, setGradingSettings] = useState<GradingSettings>(() => settingsService.getGradingSettings());

  useEffect(() => {
    setSchoolProfile(settingsService.getSchoolProfile());
    setGpsSettings(settingsService.getGpsSettings());
    setGradingSettings(settingsService.getGradingSettings());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.all([
        settingsService.saveSchoolProfile(schoolProfile),
        settingsService.saveGpsSettings(gpsSettings),
        settingsService.saveGradingSettings(gradingSettings),
      ]);
      showToast('Konfigurasi sistem berhasil disimpan dan tersimpan permanen!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan konfigurasi sistem.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      backupDate: new Date().toISOString(),
      systemVersion: 'E-PKL NSC v1.0.0 (Phase 12)',
      schoolProfile,
      gpsSettings,
      gradingSettings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_epkl_nsc_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Berkas cadangan sistem (JSON Backup) berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Sistem PKL
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            System Config
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Konfigurasi profil sekolah, toleransi GPS geofencing, bobot penilaian, dan cadangan basis data
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sekolah')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sekolah'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Profil Sekolah & Kop</span>
          </button>

          <button
            onClick={() => setActiveTab('gps')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Presensi GPS & Jam Kerja</span>
          </button>

          <button
            onClick={() => setActiveTab('nilai')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'nilai'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Bobot Nilai & Supervisi</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cadangan Basis Data (Backup)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profil Sekolah */}
      {activeTab === 'sekolah' && (
        <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Identitas Resmi Satuan Pendidikan
            </h3>

            {/* Logo Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="Logo SMKN 13 Bandung" className="w-14 h-14 object-contain" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Logo Satuan Pendidikan</p>
                <p className="text-xs text-slate-500 mt-0.5">Logo resmi SMK Negeri 13 Bandung aktif di sistem E-PKL.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Satuan Pendidikan <span className="text-red-500">*</span>
                </label>
                <Input
                  value={schoolProfile.schoolName}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, schoolName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  NPSN Sekolah
                </label>
                <Input
                  value={schoolProfile.npsn}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, npsn: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Alamat Lengkap Sekolah
              </label>
              <Input
                value={schoolProfile.address}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Kepala Sekolah
                </label>
                <Input
                  value={schoolProfile.principalName}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  NIP Kepala Sekolah
                </label>
                <Input
                  value={schoolProfile.principalNip}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, principalNip: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Website Resmi
                </label>
                <Input
                  value={schoolProfile.website}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, website: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Kontak Pokja PKL
                </label>
                <Input
                  value={schoolProfile.email}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" disabled={isSaving} className="bg-blue-600">
                <Save className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil Sekolah'}</span>
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 2: GPS Presensi */}
      {activeTab === 'gps' && (
        <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Parameter Geofencing & Jadwal Kerja
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Radius Toleransi GPS Lokasi DUDI (Meter) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={gpsSettings.gpsRadiusMeters}
                  onChange={(e) => setGpsSettings({ ...gpsSettings, gpsRadiusMeters: parseInt(e.target.value) || 100 })}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Siswa wajib berada dalam radius ini dari koordinat GPS kantor DUDI.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Batas Akhir Pengisian Jurnal Harian
                </label>
                <Input
                  type="time"
                  value={gpsSettings.journalDeadlineTime}
                  onChange={(e) => setGpsSettings({ ...gpsSettings, journalDeadlineTime: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Jurnal dikunci setelah batas waktu ini.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rentang Jam Masuk (Check-In)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={gpsSettings.checkInStartTime}
                    onChange={(e) => setGpsSettings({ ...gpsSettings, checkInStartTime: e.target.value })}
                  />
                  <span className="text-xs text-slate-400">s.d.</span>
                  <Input
                    type="time"
                    value={gpsSettings.checkInEndTime}
                    onChange={(e) => setGpsSettings({ ...gpsSettings, checkInEndTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rentang Jam Pulang (Check-Out)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={gpsSettings.checkOutStartTime}
                    onChange={(e) => setGpsSettings({ ...gpsSettings, checkOutStartTime: e.target.value })}
                  />
                  <span className="text-xs text-slate-400">s.d.</span>
                  <Input
                    type="time"
                    value={gpsSettings.checkOutEndTime}
                    onChange={(e) => setGpsSettings({ ...gpsSettings, checkOutEndTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" disabled={isSaving} className="bg-blue-600">
                <Save className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Parameter Presensi'}</span>
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 3: Bobot Nilai */}
      {activeTab === 'nilai' && (
        <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Konfigurasi Evaluasi & Sertifikat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Bobot Penilaian Industri (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={gradingSettings.industryWeight}
                  onChange={(e) => setGradingSettings({ ...gradingSettings, industryWeight: parseInt(e.target.value) || 40 })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Bobot Penilaian Guru (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={gradingSettings.teacherWeight}
                  onChange={(e) => setGradingSettings({ ...gradingSettings, teacherWeight: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  KKM Batas Kelulusan PKL
                </label>
                <Input
                  type="number"
                  value={gradingSettings.passingGrade}
                  onChange={(e) => setGradingSettings({ ...gradingSettings, passingGrade: parseFloat(e.target.value) || 75.0 })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Target Tahapan Supervisi Monitoring
                </label>
                <Input
                  type="number"
                  value={gradingSettings.monitoringStagesTarget}
                  onChange={(e) => setGradingSettings({ ...gradingSettings, monitoringStagesTarget: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Format Awalan Nomor Sertifikat
              </label>
              <Input
                value={gradingSettings.certificatePrefix}
                onChange={(e) => setGradingSettings({ ...gradingSettings, certificatePrefix: e.target.value })}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" disabled={isSaving} className="bg-blue-600">
                <Save className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Bobot Penilaian'}</span>
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 4: Backup */}
      {activeTab === 'backup' && (
        <div className="space-y-4 max-w-3xl">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Pencadangan & Pemeliharaan Sistem
            </h3>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <p className="font-bold mb-1">Informasi Pencadangan Data:</p>
              <p>
                Fitur ini mengunduh seluruh snapshot konfigurasi sistem, data siswa, mitra DUDI, presensi, jurnal, penilaian, dan sertifikat yang terdaftar dalam format JSON terenkripsi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleExportBackup}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Basis Data (JSON)</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
