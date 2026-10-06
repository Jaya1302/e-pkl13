import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  PklCertificate,
  CertificateEligibility,
  CertificateFilter,
  PklPlacement,
  Student,
  Dudi,
  Teacher,
  GradePredicate
} from '../types';
import { pklService } from './pklService';
import { masterService } from './masterService';
import { assessmentService } from './assessmentService';
import { documentService } from './documentService';
import { settingsService } from './settingsService';
import { qrCodeUtils } from '../utils/qrCode';

const CERTIFICATES_STORAGE_KEY = 'epkl_certificates_v1';

// Initial Mock Issued Certificates
const INITIAL_CERTIFICATES: PklCertificate[] = [
  {
    id: 'cert-1',
    placement_id: 'p-1',
    student_id: 's-1',
    certificate_number: 'PKL/SMKN13BDG/2026/0001',
    serial_number: 1,
    issue_year: 2026,
    issue_date: '2026-08-22',
    final_score: 89.8,
    predicate: 'B',
    principal_name: settingsService.getSchoolProfile().principalName || 'Drs. H. Dedi Indrayana, M.Pd.',
    principal_nip: settingsService.getSchoolProfile().principalNip || '196805121994031008',
    principal_title: `Kepala ${settingsService.getSchoolProfile().schoolName || 'SMK Negeri 13 Bandung'}`,
    verification_code: 'VCD-2026-898-0001-AHMAD',
    qr_code_url: qrCodeUtils.getQrCodeImageUrl(
      qrCodeUtils.getVerificationUrl('PKL/SMKN13BDG/2026/0001')
    ),
    pdf_url: null,
    status: 'valid',
    created_at: '2026-08-22T08:00:00.000Z',
    updated_at: '2026-08-22T08:00:00.000Z',
  },
];

const getLocalCertificates = (): PklCertificate[] => {
  const saved = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
  return INITIAL_CERTIFICATES;
};

const saveLocalCertificates = (certs: PklCertificate[]) => {
  localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(certs));
};

export const certificateService = {
  // 1. Generate Unique Certificate Number per Year
  async generateUniqueCertificateNumber(year = new Date().getFullYear()): Promise<{
    certificateNumber: string;
    serialNumber: number;
    issueYear: number;
  }> {
    const certs = getLocalCertificates().filter((c) => c.issue_year === year);
    const maxSerial = certs.reduce((max, c) => Math.max(max, c.serial_number), 0);
    const nextSerial = maxSerial + 1;
    const formattedSerial = nextSerial.toString().padStart(4, '0');
    const prefix = settingsService.getGradingSettings().certificatePrefix || 'PKL/SMKN13BDG';
    const certificateNumber = `${prefix}/${year}/${formattedSerial}`;

    return {
      certificateNumber,
      serialNumber: nextSerial,
      issueYear: year,
    };
  },

  // 2. Get All Certificates with Relations
  async getCertificates(filter?: CertificateFilter): Promise<PklCertificate[]> {
    const [students, placements] = await Promise.all([
      masterService.getStudents(),
      pklService.getPlacements(),
    ]);

    let list = getLocalCertificates().map((c) => {
      const placement = placements.find((p) => p.id === c.placement_id) || null;
      const student = students.find((s) => s.id === c.student_id) || null;
      return {
        ...c,
        placement,
        student,
      };
    });

    if (filter?.status) list = list.filter((c) => c.status === filter.status);
    if (filter?.year) list = list.filter((c) => c.issue_year === filter.year);
    if (filter?.majorId) list = list.filter((c) => c.student?.major_id === filter.majorId);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.certificate_number.toLowerCase().includes(q) ||
          c.student?.name.toLowerCase().includes(q) ||
          c.student?.nis.toLowerCase().includes(q) ||
          c.placement?.dudi?.name?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.serial_number - a.serial_number);
  },

  async getCertificateById(id: string): Promise<PklCertificate | null> {
    const list = await this.getCertificates();
    return list.find((c) => c.id === id) || null;
  },

  async getCertificateByNumber(certNumber: string): Promise<PklCertificate | null> {
    const list = await this.getCertificates();
    const cleanQuery = decodeURIComponent(certNumber).trim().toUpperCase();
    return (
      list.find(
        (c) =>
          c.certificate_number.toUpperCase() === cleanQuery ||
          c.verification_code.toUpperCase() === cleanQuery
      ) || null
    );
  },

  // 3. Check Eligibility for All Placements
  async getEligibilityList(majorId?: string): Promise<CertificateEligibility[]> {
    const [placements, assessments, reports, certificates] = await Promise.all([
      pklService.getPlacements(),
      assessmentService.getAssessments(),
      documentService.getReports(),
      this.getCertificates(),
    ]);

    let filteredPlacements = placements;
    if (majorId) {
      filteredPlacements = filteredPlacements.filter((p) => p.student?.major_id === majorId);
    }

    const eligibilityList: CertificateEligibility[] = filteredPlacements.map((placement) => {
      const student = placement.student as Student;
      const dudi = placement.dudi as Dudi;
      const teacher = placement.teacher as Teacher;

      // 1. Syarat PKL Selesai (status penempatan aktif / selesai)
      const isPklCompleted =
        placement.status === 'aktif' ||
        placement.status === 'selesai' ||
        new Date(placement.end_date) <= new Date();

      // 2. Syarat Penilaian Lengkap
      const assessment = assessments.find((a) => a.placement_id === placement.id);
      const isAssessmentCompleted = Boolean(
        assessment && assessment.final_score !== null && assessment.final_score !== undefined
      );

      // 3. Syarat Laporan Disetujui
      const report = reports.find((r) => r.placement_id === placement.id);
      const isReportApproved = Boolean(report && report.status === 'approved');

      // Overall Eligibility
      const isEligibleForCertificate =
        isPklCompleted && isAssessmentCompleted && isReportApproved;

      // Existing Certificate Check
      const existingCert = certificates.find((c) => c.placement_id === placement.id) || null;

      return {
        placement,
        student,
        dudi,
        teacher,
        isPklCompleted,
        isAssessmentCompleted,
        isReportApproved,
        isEligibleForCertificate,
        hasCertificate: Boolean(existingCert && existingCert.status === 'valid'),
        certificate: existingCert,
        finalScore: assessment?.final_score || null,
        predicate: assessment?.predicate || null,
      };
    });

    return eligibilityList;
  },

  // 4. Issue Certificate (Single)
  async issueCertificate(placementId: string, adminUserId?: string): Promise<PklCertificate> {
    const eligibilityList = await this.getEligibilityList();
    const item = eligibilityList.find((e) => e.placement.id === placementId);

    if (!item) throw new Error('Data penempatan tidak ditemukan');
    if (!item.isEligibleForCertificate) {
      throw new Error(
        'Siswa belum memenuhi 3 syarat kelayakan: PKL Selesai, Penilaian Lengkap, dan Laporan Approved.'
      );
    }

    const current = getLocalCertificates();
    const existingIdx = current.findIndex((c) => c.placement_id === placementId);

    const year = new Date().getFullYear();
    const { certificateNumber, serialNumber, issueYear } = await this.generateUniqueCertificateNumber(year);

    const verificationCode = `VCD-${year}-${Math.round((item.finalScore || 85) * 10)}-${serialNumber}-${item.student.name.split(' ')[0].toUpperCase()}`;
    const verificationUrl = qrCodeUtils.getVerificationUrl(certificateNumber);
    const qrCodeUrl = qrCodeUtils.getQrCodeImageUrl(verificationUrl);

    const schoolProfile = settingsService.getSchoolProfile();

    const newCert: PklCertificate = {
      id: existingIdx !== -1 ? current[existingIdx].id : `cert-${Date.now()}`,
      placement_id: placementId,
      student_id: item.student.id,
      certificate_number: existingIdx !== -1 ? current[existingIdx].certificate_number : certificateNumber,
      serial_number: existingIdx !== -1 ? current[existingIdx].serial_number : serialNumber,
      issue_year: issueYear,
      issue_date: new Date().toISOString().split('T')[0],
      final_score: item.finalScore || 85,
      predicate: (item.predicate as GradePredicate) || 'B',
      principal_name: schoolProfile.principalName || 'Drs. H. Dedi Indrayana, M.Pd.',
      principal_nip: schoolProfile.principalNip || '196805121994031008',
      principal_title: `Kepala ${schoolProfile.schoolName || 'SMK Negeri 13 Bandung'}`,
      verification_code: verificationCode,
      qr_code_url: qrCodeUrl,
      pdf_url: null,
      status: 'valid',
      created_by: adminUserId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      current[existingIdx] = newCert;
    } else {
      current.push(newCert);
    }

    saveLocalCertificates(current);
    const hyd = await this.getCertificateById(newCert.id);
    return hyd || newCert;
  },

  // 5. Issue Bulk Certificates for all eligible
  async issueBulkCertificates(
    placementIds: string[],
    adminUserId?: string
  ): Promise<{ successCount: number; errors: string[] }> {
    let successCount = 0;
    const errors: string[] = [];

    for (const pid of placementIds) {
      try {
        await this.issueCertificate(pid, adminUserId);
        successCount++;
      } catch (err: any) {
        errors.push(`Penempatan ${pid}: ${err.message}`);
      }
    }

    return { successCount, errors };
  },

  // 6. Revoke Certificate
  async revokeCertificate(certificateId: string, reason: string): Promise<PklCertificate> {
    const current = getLocalCertificates();
    const idx = current.findIndex((c) => c.id === certificateId);
    if (idx === -1) throw new Error('Sertifikat tidak ditemukan');

    current[idx].status = 'revoked';
    current[idx].revoked_reason = reason;
    current[idx].revoked_at = new Date().toISOString();
    current[idx].updated_at = new Date().toISOString();

    saveLocalCertificates(current);
    const hyd = await this.getCertificateById(certificateId);
    return hyd || current[idx];
  },

  // 7. Verify Certificate Authenticity (Public API)
  async verifyCertificate(
    certificateNumberOrCode: string
  ): Promise<{ isValid: boolean; certificate: PklCertificate | null; message: string }> {
    const cert = await this.getCertificateByNumber(certificateNumberOrCode);

    if (!cert) {
      return {
        isValid: false,
        certificate: null,
        message: 'Nomor sertifikat atau kode verifikasi tidak terdaftar di sistem database SMKN 13 Bandung.',
      };
    }

    if (cert.status === 'revoked') {
      return {
        isValid: false,
        certificate: cert,
        message: `Sertifikat ini telah DICABUT / DINONAKTIFKAN oleh sekolah. Alasan: ${cert.revoked_reason || 'Penyalahgunaan dokumen'}.`,
      };
    }

    return {
      isValid: true,
      certificate: cert,
      message: 'SERTIFIKAT RESMI DAN VALID TERDAFTAR DI DATABASE SMKN 13 BANDUNG.',
    };
  },
};
