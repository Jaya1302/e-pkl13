import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PklCertificate,
  CertificateEligibility,
  Major,
  GradePredicate
} from '../../types';
import { certificateService } from '../../services/certificateService';
import { masterService } from '../../services/masterService';
import { qrCodeUtils } from '../../utils/qrCode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  QrCode,
  Download,
  AlertCircle,
  FileCheck,
  Check,
  Send,
  Lock,
  Clock,
  GraduationCap
} from 'lucide-react';

export const SertifikatPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'issued' | 'eligibility'>('issued');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [certificates, setCertificates] = useState<PklCertificate[]>([]);
  const [eligibilityList, setEligibilityList] = useState<CertificateEligibility[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modal States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<PklCertificate | null>(null);

  // Role Checks
  const isAdmin = role === 'super_admin' || role === 'admin_pkl';
  const isStudent = role === 'siswa';

  // Initial Fetch
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [certsData, eligData, majorsData] = await Promise.all([
        certificateService.getCertificates(),
        certificateService.getEligibilityList(),
        masterService.getMajors(),
      ]);

      setCertificates(certsData);
      setEligibilityList(eligData);
      setMajors(majorsData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data sertifikat.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, user]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        c.certificate_number.toLowerCase().includes(q) ||
        c.student?.name.toLowerCase().includes(q) ||
        c.student?.nis.toLowerCase().includes(q) ||
        c.placement?.dudi?.name?.toLowerCase().includes(q);

      const matchMajor = !selectedMajorFilter || c.student?.major_id === selectedMajorFilter;
      const matchStatus = selectedStatusFilter === 'all' || c.status === selectedStatusFilter;

      return matchSearch && matchMajor && matchStatus;
    });
  }, [certificates, searchTerm, selectedMajorFilter, selectedStatusFilter]);

  // Filtered Eligibility
  const filteredEligibility = useMemo(() => {
    return eligibilityList.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.nis.toLowerCase().includes(q) ||
        item.dudi.name.toLowerCase().includes(q);

      const matchMajor = !selectedMajorFilter || item.student.major_id === selectedMajorFilter;

      return matchSearch && matchMajor;
    });
  }, [eligibilityList, searchTerm, selectedMajorFilter]);

  // Eligible count
  const readyToIssueCount = useMemo(() => {
    return eligibilityList.filter((e) => e.isEligibleForCertificate && !e.hasCertificate).length;
  }, [eligibilityList]);

  // Handle Single Issue
  const handleIssueSingle = async (placementId: string) => {
    setIsSubmitting(true);
    try {
      const cert = await certificateService.issueCertificate(placementId, user?.id);
      showToast(`Sertifikat ${cert.certificate_number} berhasil diterbitkan!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menerbitkan sertifikat.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bulk Issue
  const handleIssueBulk = async () => {
    const readyItems = eligibilityList.filter((e) => e.isEligibleForCertificate && !e.hasCertificate);
    if (readyItems.length === 0) {
      showToast('Tidak ada siswa yang siap diterbitkan sertifikatnya.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const pids = readyItems.map((r) => r.placement.id);
      const res = await certificateService.issueBulkCertificates(pids, user?.id);
      showToast(`Berhasil menerbitkan ${res.successCount} sertifikat digital secara massal!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menerbitkan massal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Verification Link
  const handleCopyLink = (certNumber: string) => {
    const url = qrCodeUtils.getVerificationUrl(certNumber);
    navigator.clipboard.writeText(url);
    showToast('Tautan verifikasi disalin ke clipboard!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sertifikat Digital PKL
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Phase 9
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penerbitan sertifikat kelulusan PKL resmi dengan nomor seri unik dan validasi barcode QR Code
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleIssueBulk}
              disabled={readyToIssueCount === 0 || isSubmitting}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20"
            >
              <Award className="w-4 h-4" />
              <span>Terbitkan Semua yang Layak ({readyToIssueCount})</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-50/70 to-white border-amber-100/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Sertifikat Telah Terbit
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {certificates.filter((c) => c.status === 'valid').length}
                <span className="text-xs font-normal text-slate-500"> Dokumen Resmi</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Siap Diterbitkan
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {readyToIssueCount}
                <span className="text-xs font-normal text-slate-500"> Siswa Layak</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50/70 to-white border-blue-100/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Belum Memenuhi Syarat
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {eligibilityList.filter((e) => !e.isEligibleForCertificate).length}
                <span className="text-xs font-normal text-slate-500"> Siswa</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('issued')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'issued'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Daftar Sertifikat Terbit</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {certificates.length}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('eligibility')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'eligibility'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kelayakan Penerbitan (3 Syarat)</span>
              {readyToIssueCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {readyToIssueCount} Siap
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 4. Tab 1: DAFTAR SERTIFIKAT TERBIT */}
      {activeTab === 'issued' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari nomor sertifikat, siswa, NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                />
              </div>

              <Select
                value={selectedMajorFilter}
                onChange={(e) => setSelectedMajorFilter(e.target.value)}
                className="text-xs sm:text-sm"
              >
                <option value="">Semua Program Keahlian</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs sm:text-sm"
              >
                <option value="all">Semua Status Sertifikat</option>
                <option value="valid">✅ Valid & Aktif</option>
                <option value="revoked">❌ Dicabut / Nonaktif</option>
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500 mt-3 font-medium">Memuat data sertifikat digital...</p>
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              {filteredCertificates.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={<Award className="w-8 h-8" />}
                    title="Belum ada sertifikat terbit"
                    description="Penerbitan sertifikat dilakukan setelah siswa menyelesaikan PKL, penilaian lengkap, dan laporan disetujui."
                  />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Nomor Sertifikat</TableHeaderCell>
                      <TableHeaderCell>Nama Siswa / NIS</TableHeaderCell>
                      <TableHeaderCell>Mitra DUDI & Lokasi</TableHeaderCell>
                      <TableHeaderCell className="text-center">Nilai Akhir</TableHeaderCell>
                      <TableHeaderCell className="text-center">Predikat</TableHeaderCell>
                      <TableHeaderCell className="text-center">Tanggal Terbit</TableHeaderCell>
                      <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block">
                                {cert.certificate_number}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {cert.verification_code}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">{cert.student?.name}</p>
                          <p className="text-xs text-slate-500">
                            NIS: {cert.student?.nis} • {cert.student?.class?.name || '-'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">
                            {cert.placement?.dudi?.name || '-'}
                          </p>
                          <p className="text-xs text-slate-400">{cert.placement?.dudi?.city || '-'}</p>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="font-extrabold text-blue-700 text-base">{cert.final_score}</span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            PREDIKAT {cert.predicate}
                          </span>
                        </TableCell>

                        <TableCell className="text-center text-xs text-slate-600">
                          {new Date(cert.issue_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCert(cert);
                                setIsPreviewModalOpen(true);
                              }}
                              className="text-xs h-7 text-amber-700 hover:bg-amber-50"
                              title="Pratinjau & Cetak Sertifikat"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>Pratinjau</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(cert.certificate_number)}
                              className="text-xs h-7 text-slate-600 hover:text-blue-600"
                              title="Salin Tautan Verifikasi Publik"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* 5. Tab 2: KELAYAKAN PENERBITAN (3 SYARAT) */}
      {activeTab === 'eligibility' && isAdmin && (
        <div className="space-y-4">
          <Card className="p-4 bg-slate-50 border-amber-200">
            <div className="flex items-start gap-3 text-xs text-slate-700">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">
                  Aturan Standar Penerbitan Sertifikat PKL (3 Syarat Mutlak):
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                  <li><strong>Status PKL Selesai:</strong> Masa penempatan di DUDI telah berakhir / status selesai.</li>
                  <li><strong>Penilaian Lengkap:</strong> Nilai Industri dan Nilai Guru telah diinput & nilai akhir terkalkulasi.</li>
                  <li><strong>Laporan Akhir Disetujui:</strong> Naskah laporan akhir PKL berstatus <code>APPROVED</code> oleh guru pembimbing.</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Siswa / Kelas</TableHeaderCell>
                  <TableHeaderCell>Mitra DUDI</TableHeaderCell>
                  <TableHeaderCell className="text-center">1. PKL Selesai</TableHeaderCell>
                  <TableHeaderCell className="text-center">2. Nilai Lengkap</TableHeaderCell>
                  <TableHeaderCell className="text-center">3. Laporan Approved</TableHeaderCell>
                  <TableHeaderCell className="text-center">Status Sertifikat</TableHeaderCell>
                  <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEligibility.map((item) => (
                  <TableRow key={item.placement.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">{item.student.name}</p>
                      <p className="text-xs text-slate-500">
                        NIS: {item.student.nis} • {item.student.class?.name || '-'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="font-medium text-slate-800 text-xs">{item.dudi.name}</p>
                    </TableCell>

                    {/* Syarat 1 */}
                    <TableCell className="text-center">
                      {item.isPklCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> Berjalan
                        </span>
                      )}
                    </TableCell>

                    {/* Syarat 2 */}
                    <TableCell className="text-center">
                      {item.isAssessmentCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Skor: {item.finalScore} ({item.predicate})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> Belum Nilai
                        </span>
                      )}
                    </TableCell>

                    {/* Syarat 3 */}
                    <TableCell className="text-center">
                      {item.isReportApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> Belum Disahkan
                        </span>
                      )}
                    </TableCell>

                    {/* Status Sertifikat */}
                    <TableCell className="text-center">
                      {item.hasCertificate ? (
                        <Badge variant="success">✅ DITERBITKAN</Badge>
                      ) : item.isEligibleForCertificate ? (
                        <Badge variant="warning">⭐ SIAP TERBIT</Badge>
                      ) : (
                        <Badge variant="neutral">BELUM MEMENUHI</Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      {item.hasCertificate ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCert(item.certificate || null);
                            setIsPreviewModalOpen(true);
                          }}
                          className="text-xs h-7 text-amber-700"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Lihat</span>
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!item.isEligibleForCertificate || isSubmitting}
                          onClick={() => handleIssueSingle(item.placement.id)}
                          className={`text-xs h-7 ${
                            item.isEligibleForCertificate
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 mr-1" />
                          <span>Terbitkan</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ================= MODAL PRATINJAU SERTIFIKAT MEWAH ================= */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Pratinjau Sertifikat Kelulusan PKL Resmi"
        size="lg"
      >
        {selectedCert && (
          <div className="space-y-6 printable-certificate">
            {/* Sertifikat Landscape Frame */}
            <div className="relative bg-[#fdfcf7] text-slate-900 p-8 sm:p-12 rounded-2xl border-8 border-[#1e293b] shadow-2xl overflow-hidden font-serif">
              {/* Inner Gold Border Ornaments */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-600/60 pointer-events-none rounded-xl" />
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 pointer-events-none" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 pointer-events-none" />

              {/* Watermark Logo */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <GraduationCap className="w-96 h-96 text-slate-900" />
              </div>

              {/* Header Lembaga */}
              <div className="text-center relative z-10 space-y-1">
                <span className="text-[10px] sm:text-xs font-sans tracking-[0.2em] font-extrabold uppercase text-slate-600 block">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT • DINAS PENDIDIKAN
                </span>
                <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight uppercase text-[#0f172a]">
                  SMK NEGERI 13 BANDUNG
                </h2>
                <div className="h-0.5 w-32 bg-amber-600 mx-auto my-2" />
                <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wider text-amber-800 font-serif pt-1">
                  SERTIFIKAT KELULUSAN PKL
                </h1>
                <p className="text-xs sm:text-sm font-mono text-slate-500 font-sans tracking-wide">
                  Nomor: <strong>{selectedCert.certificate_number}</strong>
                </p>
              </div>

              {/* Pernyataan Kelulusan */}
              <div className="mt-8 text-center relative z-10 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 font-sans">
                  Kepala Sekolah Menengah Kejuruan Negeri 13 Bandung menerangkan bahwa:
                </p>

                <div className="py-2">
                  <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-wide underline decoration-amber-600 underline-offset-8">
                    {selectedCert.student?.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-sans mt-2">
                    NIS: <strong>{selectedCert.student?.nis}</strong> • NISN: <strong>{selectedCert.student?.nisn}</strong>
                  </p>
                  <p className="text-xs sm:text-sm font-sans font-bold text-slate-800 mt-1">
                    Program Keahlian: {selectedCert.student?.class?.name || '-'}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-sans max-w-2xl mx-auto leading-relaxed">
                  Telah melaksanakan dan menyelesaikan seluruh kegiatan{' '}
                  <strong>Praktik Kerja Lapangan (PKL)</strong> di instansi / industri:{' '}
                  <strong className="text-blue-900">{selectedCert.placement?.dudi?.name}</strong>{' '}
                  dengan hasil evaluasi kompetensi sebagai berikut:
                </p>

                {/* Score & Predicate Badge */}
                <div className="inline-flex items-center gap-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl shadow-md font-sans">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">NILAI AKHIR</span>
                    <span className="text-2xl font-black text-white">{selectedCert.final_score}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-700" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">PREDIKAT</span>
                    <span className="text-2xl font-black text-amber-400">
                      PREDIKAT {selectedCert.predicate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Signer & QR Code Verification */}
              <div className="mt-10 pt-6 flex items-end justify-between relative z-10 font-sans">
                {/* QR Code Validation */}
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg border-2 border-amber-600/80 shadow-xs">
                    {selectedCert.qr_code_url ? (
                      <img src={selectedCert.qr_code_url} alt="QR Code Verifikasi" className="w-20 h-20" />
                    ) : (
                      <QrCode className="w-20 h-20 text-slate-700" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-[160px] leading-tight">
                    <span className="font-bold text-slate-800 block uppercase">Pindai Barcode QR</span>
                    <span>Untuk memverifikasi keaslian sertifikat di database resmi sekolah.</span>
                  </div>
                </div>

                {/* Tanda Tangan Kepala Sekolah */}
                <div className="text-center text-xs space-y-1">
                  <p className="text-slate-600">
                    Bandung, {new Date(selectedCert.issue_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="font-bold text-slate-800">{selectedCert.principal_title},</p>
                  <div className="h-16 flex items-center justify-center text-amber-800/40 italic font-serif">
                    [Tanda Tangan & Stempel Resmi]
                  </div>
                  <p className="font-bold underline text-slate-900 text-sm">{selectedCert.principal_name}</p>
                  <p className="text-slate-500">NIP. {selectedCert.principal_nip}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sertifikat (A4 Landscape)</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(selectedCert.certificate_number)}
                  className="flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Tautan Verifikasi</span>
                </Button>
                <Button variant="primary" onClick={() => setIsPreviewModalOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
