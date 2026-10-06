import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../../services/certificateService';
import { PklCertificate } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { certificateNumber } = useParams<{ certificateNumber?: string }>();
  const [searchQuery, setSearchQuery] = useState(certificateNumber ? decodeURIComponent(certificateNumber) : '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    certificate: PklCertificate | null;
    message: string;
  } | null>(null);

  const handleVerify = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await certificateService.verifyCertificate(query.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        isValid: false,
        certificate: null,
        message: err.message || 'Terjadi kesalahan sistem saat memverifikasi sertifikat.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (certificateNumber) {
      const decoded = decodeURIComponent(certificateNumber);
      setSearchQuery(decoded);
      handleVerify(decoded);
    }
  }, [certificateNumber]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img src="/logo.png" alt="Logo SMKN 13 Bandung" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                E-PKL VERIFIKASI RESMI
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">SMK Negeri 13 Bandung — Kota Bandung</p>
            </div>
          </div>

          <Link
            to="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Portal</span>
          </Link>
        </div>

        {/* Verification Card */}
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-xl rounded-2xl">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Verifikasi Keaslian Sertifikat PKL
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Layanan publik pengecekan keabsahan dokumen sertifikat digital Praktik Kerja Lapangan SMKN 13 Bandung
              </p>
            </div>

            {/* Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(searchQuery);
              }}
              className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan Nomor Sertifikat (Contoh: PKL/SMKN13BDG/2026/0001)..."
                  className="pl-10 text-xs sm:text-sm h-11 rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-xs sm:text-sm"
              >
                {isLoading ? 'Memeriksa...' : 'Verifikasi Dokumen'}
              </Button>
            </form>

            {/* Result Display */}
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-slate-500 font-medium mt-3">
                  Menghubungkan ke basis data sertifikat sekolah...
                </p>
              </div>
            )}

            {!isLoading && result && (
              <div className="mt-8 pt-6 border-t border-slate-100 animate-fade-in space-y-6">
                {/* Result Header Badge */}
                <div
                  className={`p-4 rounded-xl border text-center space-y-1 ${
                    result.isValid
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {result.isValid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                    )}
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wide">
                      {result.isValid ? 'DOKUMEN RESMI & TERVERIFIKASI' : 'DOKUMEN TIDAK VALID / TIDAK DITEMUKAN'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">{result.message}</p>
                </div>

                {/* Certificate Transcript Details */}
                {result.certificate && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                          NOMOR REGISTRASI SERTIFIKAT
                        </span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                          {result.certificate.certificate_number}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        STATUS: VALID
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Nama Lengkap Siswa:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {result.certificate.student?.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Nomor Induk Siswa (NIS / NISN):</span>
                        <span className="font-bold text-slate-800">
                          {result.certificate.student?.nis} / {result.certificate.student?.nisn || '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Program Keahlian / Jurusan:</span>
                        <span className="font-bold text-slate-800">
                          {result.certificate.student?.class?.name || '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Mitra Dunia Usaha / Industri:</span>
                        <span className="font-bold text-slate-800">
                          {result.certificate.placement?.dudi?.name || '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Nilai Akhir Kelulusan:</span>
                        <span className="font-black text-blue-700 text-base">
                          {result.certificate.final_score}{' '}
                          <span className="text-xs font-bold text-slate-600">
                            (Predikat {result.certificate.predicate})
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Tanggal Penerbitan:</span>
                        <span className="font-bold text-slate-800">
                          {new Date(result.certificate.issue_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                        <span className="text-slate-400 block">Pejabat Pengesah:</span>
                        <span className="font-bold text-slate-900">
                          {result.certificate.principal_name}
                        </span>
                        <span className="text-slate-500 block">
                          {result.certificate.principal_title} • NIP. {result.certificate.principal_nip}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 mt-8 pb-4">
        <p>© {new Date().getFullYear()} SMK Negeri 13 Bandung. Sistem Validasi & Penjaminan Mutu E-PKL.</p>
      </div>
    </div>
  );
};
