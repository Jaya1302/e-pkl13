import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PklReport,
  ReportStatus,
  DocumentTemplate,
  DocumentType,
  GeneratedLetter,
  AdminRecapType,
  Student,
  Dudi,
  Teacher,
  PklPlacement,
  Major
} from '../../types';
import { documentService } from '../../services/documentService';
import { masterService } from '../../services/masterService';
import { pklService } from '../../services/pklService';
import { settingsService } from '../../services/settingsService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileText,
  Search,
  Upload,
  Download,
  Printer,
  Building2,
  GraduationCap,
  Eye,
  FileCheck,
  RotateCcw,
  FileCode,
  Layers,
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  ClipboardList,
  Camera,
  Award
} from 'lucide-react';

export const LaporanDokumenPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'laporan' | 'surat' | 'rekap'>('laporan');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [reports, setReports] = useState<PklReport[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [placements, setPlacements] = useState<PklPlacement[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  // Filter States (Laporan)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState<string>('');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isCreateLetterModalOpen, setIsCreateLetterModalOpen] = useState(false);

  const [selectedReport, setSelectedReport] = useState<PklReport | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [activeLetter, setActiveLetter] = useState<GeneratedLetter | null>(null);

  // Upload Form States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAbstract, setUploadAbstract] = useState('');
  const [uploadPlacementId, setUploadPlacementId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');

  // Letter Generator Form States
  const [letterForm, setLetterForm] = useState(() => {
    const profile = settingsService.getSchoolProfile();
    return {
      type: 'surat_permohonan' as DocumentType,
      studentId: '',
      dudiId: '',
      dudiMode: 'select' as 'select' | 'manual',
      customDudiName: 'PT Telkom Indonesia (Witel Bandung)',
      customDudiAddress: 'Jl. Lembong No. 11, Bandung',
      mentorName: 'Hendri Gunawan',
      position: 'Teknologi Informasi & Jaringan',
      teacherId: '',
      placementId: '',
      letterNumber: '421.5/128/SMKN13BDG/Cadisdik WIL.VII',
      signerName: profile.principalName || 'Drs. H. Dedi Indrayana, M.Pd.',
      signerNip: profile.principalNip || '196805121994031008',
      signerTitle: 'Kepala Sekolah',
      pklMonths: 'Juli - Desember 2026',
      selectedStudentIds: [] as string[],
    };
  });
  const [studentPickerSearch, setStudentPickerSearch] = useState('');

  // Admin Recap Hub States
  const [activeRecapType, setActiveRecapType] = useState<AdminRecapType>('students');
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapSearch, setRecapSearch] = useState('');

  // Role Checks
  const isStudent = role === 'siswa';
  const isTeacher = role === 'guru_pembimbing';
  const isAdmin = role === 'super_admin' || role === 'admin_pkl';
  const isExecutive = role === 'kepala_sekolah' || role === 'wakasek';

  // Initial Fetch
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsData, templatesData, studentsData, dudiData, teachersData, placementsData, majorsData] =
        await Promise.all([
          documentService.getReports(),
          documentService.getDocumentTemplates(),
          masterService.getStudents(),
          masterService.getDudi(),
          masterService.getTeachers(),
          pklService.getPlacements(),
          masterService.getMajors(),
        ]);

      setReports(reportsData);
      setTemplates(templatesData);
      setStudents(studentsData);
      setDudiList(dudiData);
      setTeachers(teachersData);
      setPlacements(placementsData);
      setMajors(majorsData);

      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data laporan & dokumen.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, user]);

  // Ensure student stays on laporan tab only
  useEffect(() => {
    if (isStudent && activeTab !== 'laporan') {
      setActiveTab('laporan');
    }
  }, [isStudent, activeTab]);

  // Load Recap Data on Recap Tab or Type Change
  useEffect(() => {
    if (activeTab === 'rekap' && !isStudent) {
      const loadRecap = async () => {
        setRecapLoading(true);
        try {
          const data = await documentService.getRecapData(activeRecapType);
          setRecapData(data);
        } catch (err: any) {
          showToast(err.message || 'Gagal memuat rekap data.', 'error');
        } finally {
          setRecapLoading(false);
        }
      };
      loadRecap();
    }
  }, [activeTab, activeRecapType, isStudent]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // If student role, only show own reports
      if (isStudent) {
        const myStudentId = user?.student?.id;
        const myEmail = user?.email;
        const isMine =
          (myStudentId && r.student_id === myStudentId) ||
          (myEmail && r.student?.email === myEmail) ||
          (user?.name && r.student?.name === user.name);
        if (!isMine) return false;
      }

      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        r.title.toLowerCase().includes(q) ||
        r.student?.name.toLowerCase().includes(q) ||
        r.student?.nis.toLowerCase().includes(q) ||
        r.placement?.dudi?.name?.toLowerCase().includes(q);

      const matchStatus = selectedStatusFilter === 'all' || r.status === selectedStatusFilter;
      const matchMajor =
        !selectedMajorFilter ||
        r.student?.class?.major_id === selectedMajorFilter ||
        r.student?.class?.major?.id === selectedMajorFilter;

      return matchSearch && matchStatus && matchMajor;
    });
  }, [reports, searchTerm, selectedStatusFilter, selectedMajorFilter, isStudent, user]);

  // Handle Initial Report Upload (Student)
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPlacementId || !uploadFile || !uploadTitle.trim()) {
      showToast('Judul laporan, penempatan, dan file naskah wajib diisi.', 'error');
      return;
    }

    const placement = placements.find((p) => p.id === uploadPlacementId);
    if (!placement) return;

    setIsSubmitting(true);
    try {
      await documentService.uploadReport({
        placement_id: uploadPlacementId,
        student_id: placement.student_id,
        title: uploadTitle,
        abstract: uploadAbstract,
        file: uploadFile,
      });

      showToast('Naskah laporan akhir PKL berhasil diunggah!', 'success');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadAbstract('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah laporan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revision Upload (Student)
  const handleUploadRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !uploadFile) {
      showToast('Pilih file naskah revisi terbaru.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await documentService.submitRevision(selectedReport.id, {
        file: uploadFile,
        notes: revisionNotes,
      });

      showToast(`Naskah revisi versi ${selectedReport.version + 1} berhasil diajukan!`, 'success');
      setIsRevisionModalOpen(false);
      setUploadFile(null);
      setRevisionNotes('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengajukan revisi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Review Report (Teacher)
  const handleReviewSubmit = async (status: 'approved' | 'revision_required') => {
    if (!selectedReport) return;
    if (status === 'revision_required' && !teacherFeedback.trim()) {
      showToast('Harap berikan catatan revisi untuk siswa.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await documentService.reviewReport(
        selectedReport.id,
        teacherFeedback || (status === 'approved' ? 'Laporan disetujui tanpa revisi.' : ''),
        status,
        't-1'
      );

      showToast(
        status === 'approved'
          ? 'Laporan PKL siswa telah disetujui (APPROVED)!'
          : 'Catatan revisi telah dikirimkan kepada siswa.',
        'success'
      );
      setIsReviewModalOpen(false);
      setTeacherFeedback('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan hasil review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper Filter & Selection Siswa Database untuk Lampiran Surat
  const filteredPickerStudents = useMemo(() => {
    if (!studentPickerSearch.trim()) return students;
    const q = studentPickerSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.class?.name && s.class.name.toLowerCase().includes(q)) ||
        (s.class?.major?.code && s.class.major.code.toLowerCase().includes(q))
    );
  }, [students, studentPickerSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setLetterForm((prev) => {
      const exists = prev.selectedStudentIds.includes(studentId);
      const updated = exists
        ? prev.selectedStudentIds.filter((id) => id !== studentId)
        : [...prev.selectedStudentIds, studentId];
      return { ...prev, selectedStudentIds: updated };
    });
  };

  const selectDudiStudents = () => {
    const dudiStudentIds = placements
      .filter((p) => p.dudi_id === letterForm.dudiId)
      .map((p) => p.student_id);
    if (dudiStudentIds.length === 0) {
      showToast('Belum ada siswa yang terdata di DUDI ini. Anda dapat memilih siswa lain secara bebas.', 'info');
      return;
    }
    setLetterForm((prev) => ({
      ...prev,
      selectedStudentIds: Array.from(new Set([...prev.selectedStudentIds, ...dudiStudentIds])),
    }));
    showToast(`${dudiStudentIds.length} siswa DUDI berhasil ditambahkan ke lampiran.`, 'success');
  };

  const selectAllFilteredStudents = () => {
    const ids = filteredPickerStudents.map((s) => s.id);
    setLetterForm((prev) => ({
      ...prev,
      selectedStudentIds: Array.from(new Set([...prev.selectedStudentIds, ...ids])),
    }));
  };

  const clearStudentSelection = () => {
    setLetterForm((prev) => ({
      ...prev,
      selectedStudentIds: [],
    }));
  };

  // Handle Generate Letter
  const handleGenerateLetter = async (
    type?: DocumentType,
    customData?: Partial<typeof letterForm>
  ) => {
    setIsSubmitting(true);
    try {
      const activeType = type || letterForm.type;
      const merged = {
        ...letterForm,
        ...(customData || {}),
        type: activeType,
      };

      // Siapkan studentsList dari siswa terpilih dari database
      let studentsListPayload: Array<{ name: string; nisn: string; ttl: string; major_name: string }> | undefined;
      if (merged.selectedStudentIds && merged.selectedStudentIds.length > 0) {
        const selected = students.filter((s) => merged.selectedStudentIds.includes(s.id));
        studentsListPayload = selected.map((s, idx) => ({
          name: s.name,
          nisn: s.nisn || `008${idx}123456`,
          ttl: '01-06-2008',
          major_name: s.class?.major?.code || s.class?.major?.name || 'TKRO',
        }));
      }

      const generated = await documentService.generateOfficialLetter(activeType, {
        ...merged,
        placementId: merged.placementId || (placements.length > 0 ? placements[0].id : undefined),
        studentId: merged.selectedStudentIds[0] || merged.studentId || (students.length > 0 ? students[0].id : undefined),
        dudiId: merged.dudiMode === 'manual' ? undefined : (merged.dudiId || (dudiList.length > 0 ? dudiList[0].id : undefined)),
        customDudiName: merged.customDudiName,
        customDudiAddress: merged.customDudiAddress,
        mentorName: merged.mentorName,
        position: merged.position,
        teacherId: merged.teacherId || (teachers.length > 0 ? teachers[0].id : undefined),
        selectedStudentIds: merged.selectedStudentIds,
        studentsList: studentsListPayload,
      });

      setActiveLetter(generated);
      setIsCreateLetterModalOpen(false);
      setIsLetterModalOpen(true);
      showToast('Surat resmi berhasil dibuat!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat surat resmi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated High-Fidelity Print Engine via Clean Isolated Iframe
  const handlePrintLetter = (letter: GeneratedLetter) => {
    const printDateStr = new Date(letter.issued_date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const isPermohonan = letter.template_type === 'surat_permohonan';
    const students = letter.students_list || [];

    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${letter.title || 'Surat Resmi SMKN 13 Bandung'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 20mm 15mm 20mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .sheet {
            width: 100%;
            page-break-after: always;
          }
          .kop-surat {
            border-bottom: 3px double #000;
            padding-bottom: 8px;
            margin-bottom: 18px;
          }
          .kop-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-bottom: 0;
          }
          .kop-table td {
            border: none;
            padding: 0;
          }
          .kop-logo {
            width: 85px;
            vertical-align: middle;
            text-align: left;
          }
          .kop-logo img {
            width: 78px;
            height: 78px;
            object-fit: contain;
          }
          .kop-text {
            text-align: center;
            vertical-align: middle;
          }
          .kop-spacer {
            width: 85px;
          }
          .kop-instansi {
            font-size: 11pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin: 0;
            line-height: 1.25;
            text-transform: uppercase;
          }
          .kop-sekolah {
            font-size: 13pt;
            font-weight: bold;
            margin: 3px 0 2px 0;
            line-height: 1.25;
            text-transform: uppercase;
          }
          .kop-alamat {
            font-size: 9pt;
            margin: 1px 0;
            line-height: 1.3;
          }
          .kop-kab {
            font-size: 9.5pt;
            font-weight: bold;
            margin-top: 1px;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 14px;
            font-size: 11pt;
            border-collapse: collapse;
          }
          .meta-table td {
            vertical-align: top;
            padding: 2px 0;
          }
          .content-body {
            text-align: justify;
            line-height: 1.5;
            white-space: pre-line;
            margin-bottom: 20px;
            font-size: 11pt;
          }
          .ttd-container {
            width: 100%;
            margin-top: 16px;
            display: flex;
            justify-content: flex-end;
          }
          .ttd-box {
            width: 270px;
            text-align: left;
            font-size: 11pt;
          }
          .ttd-space {
            height: 65px;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .lampiran-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 14px 0 18px 0;
          }
          .students-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10pt;
          }
          .students-table th, .students-table td {
            border: 1px solid #000;
            padding: 6px 8px;
          }
          .students-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
        </style>
      </head>
      <body>
        <!-- LEMBAR 1: SURAT PENGAJUAN / PERMOHONAN -->
        <div class="sheet">
          <div class="kop-surat">
            <table class="kop-table">
              <tr>
                <td class="kop-logo">
                  <img src="${window.location.origin}/logo.png" alt="Logo SMKN 13 Bandung" />
                </td>
                <td class="kop-text">
                  <div class="kop-instansi">PEMERINTAH DAERAH PROVINSI JAWA BARAT</div>
                  <div class="kop-instansi">DINAS PENDIDIKAN</div>
                  <div class="kop-instansi">CABANG DINAS PENDIDIKAN WILAYAH VII</div>
                  <div class="kop-sekolah">SEKOLAH MENENGAH KEJURUAN NEGERI 13 BANDUNG</div>
                  <div class="kop-alamat">Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu</div>
                  <div class="kop-alamat">Telp/Fax. (022) 7318960 Email: info@smkn13bdg.sch.id</div>
                  <div class="kop-kab">Kota Bandung - 40286</div>
                </td>
                <td class="kop-spacer"></td>
              </tr>
            </table>
          </div>

          <table class="meta-table">
            <tr>
              <td style="width: 80px;">Nomor</td>
              <td style="width: 15px;">:</td>
              <td>${letter.letter_number}</td>
            </tr>
            <tr>
              <td>Lamp</td>
              <td>:</td>
              <td>${isPermohonan ? '1 (Satu) Berkas' : '-'}</td>
            </tr>
            <tr>
              <td>Perihal</td>
              <td>:</td>
              <td><strong>${isPermohonan ? 'Pengajuan Tempat Siswa Prakerin (PKL)' : letter.title}</strong></td>
            </tr>
          </table>

          <div class="content-body">${letter.content_html}</div>

          <div class="ttd-container">
            <div class="ttd-box">
              <div>Bandung, ${printDateStr}</div>
              <div style="font-weight: bold; margin-bottom: 2px;">${letter.signer_title}</div>
              <div class="ttd-space"></div>
              <div style="font-weight: bold; text-decoration: underline;">${letter.signer_name}</div>
              <div>NIP. ${letter.signer_nip}</div>
            </div>
          </div>
        </div>

        ${isPermohonan ? `
        <!-- LEMBAR 2: LAMPIRAN DAFTAR NAMA SISWA -->
        <div class="page-break"></div>
        <div class="sheet">
          <div class="kop-surat">
            <table class="kop-table">
              <tr>
                <td class="kop-logo">
                  <img src="${window.location.origin}/logo.png" alt="Logo SMKN 13 Bandung" />
                </td>
                <td class="kop-text">
                  <div class="kop-instansi">PEMERINTAH DAERAH PROVINSI JAWA BARAT</div>
                  <div class="kop-instansi">DINAS PENDIDIKAN</div>
                  <div class="kop-instansi">CABANG DINAS PENDIDIKAN WILAYAH VII</div>
                  <div class="kop-sekolah">SEKOLAH MENENGAH KEJURUAN NEGERI 13 BANDUNG</div>
                  <div class="kop-alamat">Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu</div>
                  <div class="kop-alamat">Telp/Fax. (022) 7318960 Email: info@smkn13bdg.sch.id</div>
                  <div class="kop-kab">Kota Bandung - 40286</div>
                </td>
                <td class="kop-spacer"></td>
              </tr>
            </table>
          </div>

          <div class="lampiran-title">DAFTAR NAMA SISWA PRAKERIN</div>

          <table style="width: 100%; margin-bottom: 14px; font-size: 10pt; line-height: 1.5; border-collapse: collapse;">
            <tr>
              <td style="width: 130px; font-weight: bold;">Tempat / DUDI</td>
              <td style="width: 15px;">:</td>
              <td><strong>${letter.dudi_name || letter.dudi?.name || '-'}</strong></td>
              <td style="width: 140px; font-weight: bold;">Instruktur Industri</td>
              <td style="width: 15px;">:</td>
              <td><strong>${letter.mentor_name || '-'}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Alamat DUDI</td>
              <td>:</td>
              <td>${letter.dudi_address || letter.dudi?.address || '-'}</td>
              <td style="font-weight: bold;">Posisi / Bidang</td>
              <td>:</td>
              <td><strong>${letter.position || '-'}</strong></td>
            </tr>
          </table>

          <table class="students-table">
            <thead>
              <tr>
                <th style="width: 40px;">NO</th>
                <th>Nama</th>
                <th style="width: 120px;">NISN</th>
                <th style="width: 130px;">TTL</th>
                <th style="width: 160px;">Kompetensi Keahlian</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((st, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}.</td>
                  <td><strong>${st.name}</strong></td>
                  <td class="text-center">${st.nisn}</td>
                  <td class="text-center">${st.ttl}</td>
                  <td class="text-center">${st.major_name}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="ttd-container">
            <div class="ttd-box">
              <div>Bandung, ${printDateStr}</div>
              <div style="font-weight: bold; margin-bottom: 2px;">${letter.signer_title}</div>
              <div class="ttd-space"></div>
              <div style="font-weight: bold; text-decoration: underline;">${letter.signer_name}</div>
              <div>NIP. ${letter.signer_nip}</div>
            </div>
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    let printFrame = document.getElementById('print-letter-iframe') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-letter-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      }, 350);
    }
  };

  // Export Recap to CSV
  const handleExportRecapCsv = () => {
    if (recapData.length === 0) {
      showToast('Tidak ada data untuk diexport.', 'warning');
      return;
    }

    const firstItem = recapData[0];
    const keys = Object.keys(firstItem).filter((k) => typeof firstItem[k] !== 'object');
    const headers = keys.map((k) => `"${k.toUpperCase()}"`).join(',');

    const rows = recapData.map((item) =>
      keys.map((k) => `"${(item[k] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_${activeRecapType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Rekap ${activeRecapType} berhasil diunduh.`, 'success');
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">✅ APPROVED (Disetujui)</Badge>;
      case 'revision_required':
        return <Badge variant="danger">⚠️ REVISION (Perlu Perbaikan)</Badge>;
      case 'in_review':
        return <Badge variant="purple">🔍 IN REVIEW (Sedang Ditelaah)</Badge>;
      case 'submitted':
        return <Badge variant="warning">⏳ SUBMITTED (Menunggu Review)</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">📝 DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Laporan & Dokumen PKL
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Phase 8
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isStudent
              ? 'Pengumpulan dan pengelolaan naskah laporan akhir kegiatan PKL'
              : 'Pengumpulan naskah laporan akhir PKL, generator surat resmi sekolah, dan pusat rekapitulasi data administrasi'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isStudent && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setUploadPlacementId(placements.length > 0 ? placements[0].id : '');
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Naskah Laporan</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const defaultDudi = dudiList.find((d) => d.id === 'd-jasutra') || dudiList[0];
                const targetDudiId = defaultDudi?.id || '';
                const dudiStudentIds = placements.filter((p) => p.dudi_id === targetDudiId).map((p) => p.student_id);
                const currentProfile = settingsService.getSchoolProfile();
                setLetterForm((prev) => ({
                  ...prev,
                  type: 'surat_permohonan',
                  letterNumber: `421.5/${Math.floor(100 + Math.random() * 900)}/SMKN13BDG/Cadisdik WIL.VII`,
                  dudiId: targetDudiId,
                  dudiMode: 'select',
                  customDudiName: defaultDudi?.name || 'PT Telkom Indonesia',
                  customDudiAddress: defaultDudi?.address || 'Jl. Lembong No. 11, Bandung',
                  mentorName: defaultDudi?.contact_person || 'Hendri Gunawan',
                  position: defaultDudi?.sector || 'Teknologi Informasi',
                  signerName: currentProfile.principalName || 'Drs. H. Dedi Indrayana, M.Pd.',
                  signerNip: currentProfile.principalNip || '196805121994031008',
                  signerTitle: 'Kepala Sekolah',
                  selectedStudentIds: dudiStudentIds.length > 0 ? dudiStudentIds : students.slice(0, 2).map((s) => s.id),
                }));
                setIsCreateLetterModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              <FileCode className="w-4 h-4" />
              <span>Buat Surat Resmi</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs (Hanya ditampilkan untuk Non-Siswa: Guru, Hubin, Admin) */}
      {!isStudent && (
        <div className="border-b border-slate-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('laporan')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'laporan'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Naskah Laporan Akhir Siswa</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {reports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('surat')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'surat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Generator Dokumen & Surat Resmi</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {templates.length} Template
              </span>
            </button>

            {(isAdmin || isExecutive) && (
              <button
                onClick={() => setActiveTab('rekap')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'rekap'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Pusat Rekapitulasi Laporan Admin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Tab 1: LAPORAN AKHIR SISWA */}
      {activeTab === 'laporan' && (
        <div className="space-y-4">
          {/* Top Filters */}
          <Card className="p-4 bg-white shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari judul laporan, siswa, DUDI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                />
              </div>

              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs sm:text-sm"
              >
                <option value="all">Semua Status Review</option>
                <option value="submitted">Menunggu Review (SUBMITTED)</option>
                <option value="revision_required">Perlu Perbaikan (REVISION)</option>
                <option value="approved">Telah Disetujui (APPROVED)</option>
              </Select>

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
            </div>
          </Card>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500 mt-3 font-medium">Memuat data laporan PKL...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <Card className="p-12">
                  <EmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title="Tidak ada naskah laporan ditemukan"
                    description="Belum ada siswa yang mengunggah laporan atau coba ubah kata kunci filter."
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredReports.map((report) => (
                    <Card
                      key={report.id}
                      className="p-5 border-slate-200 hover:border-blue-200 transition-all hover:shadow-md bg-white flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                              Versi {report.version}
                            </span>
                            {getStatusBadge(report.status)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Diunggah: {new Date(report.created_at || '').toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors">
                            {report.title}
                          </h3>
                          {report.abstract && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">
                              "{report.abstract}"
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                          <div>
                            <span className="text-slate-400 block">Penulis / Siswa:</span>
                            <span className="font-semibold text-slate-800">
                              {report.student?.name} ({report.student?.class?.name || '-'})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Mitra DUDI:</span>
                            <span className="font-semibold text-slate-800">
                              {report.placement?.dudi?.name || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Guru Pembimbing:</span>
                            <span className="font-semibold text-slate-800">
                              {report.placement?.teacher?.name || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Catatan Feedback Guru jika ada */}
                        {report.teacher_feedback && (
                          <div className={`p-3 rounded-lg text-xs border ${
                            report.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            <span className="font-bold block mb-0.5">Catatan Pembimbing:</span>
                            <p className="italic">"{report.teacher_feedback}"</p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh File: {report.file_name}</span>
                        </a>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-xs h-8 text-slate-600"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Riwayat Versi ({report.revisions?.length || 1})</span>
                          </Button>

                          {/* Tombol Siswa: Upload Revisi */}
                          {(isStudent || isAdmin) && report.status === 'revision_required' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setIsRevisionModalOpen(true);
                              }}
                              className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              <span>Unggah Revisi v{report.version + 1}</span>
                            </Button>
                          )}

                          {/* Tombol Guru: Review & Pengesahan */}
                          {(isTeacher || isAdmin) && report.status !== 'approved' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setTeacherFeedback(report.teacher_feedback || '');
                                setIsReviewModalOpen(true);
                              }}
                              className="text-xs h-8 bg-purple-600 hover:bg-purple-700"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Telaah & Review</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab 2: GENERATOR DOKUMEN & SURAT RESMI (Hanya Non-Siswa) */}
      {activeTab === 'surat' && !isStudent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                className="p-5 border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    Template surat otomatis dengan penyesuaian nomor surat, data siswa, DUDI mitra, dan tanda tangan digital.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{tpl.code}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      const defaultDudi = dudiList.find((d) => d.id === 'd-jasutra') || dudiList[0];
                      const targetDudiId = defaultDudi?.id || '';
                      const dudiStudentIds = placements.filter((p) => p.dudi_id === targetDudiId).map((p) => p.student_id);
                      setLetterForm((prev) => ({
                        ...prev,
                        type: tpl.type,
                        letterNumber:
                          tpl.type === 'surat_permohonan'
                            ? `421.5/${Math.floor(100 + Math.random() * 900)}/SMKN13BDG/Cadisdik WIL.VII`
                            : `421.5/${Math.floor(100 + Math.random() * 900)}/SMKN13-PKL/${new Date().getFullYear()}`,
                        dudiId: targetDudiId,
                        dudiMode: 'select',
                        customDudiName: defaultDudi?.name || 'PT Telkom Indonesia',
                        customDudiAddress: defaultDudi?.address || 'Jl. Lembong No. 11, Bandung',
                        mentorName: defaultDudi?.contact_person || 'Hendri Gunawan',
                        position: defaultDudi?.sector || 'Teknologi Informasi',
                        signerName: currentProfile.principalName || 'Drs. H. Dedi Indrayana, M.Pd.',
                        signerNip: currentProfile.principalNip || '196805121994031008',
                        signerTitle: 'Kepala Sekolah',
                        selectedStudentIds: dudiStudentIds.length > 0 ? dudiStudentIds : students.slice(0, 2).map((s) => s.id),
                      }));
                      setIsCreateLetterModalOpen(true);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    <span>Buat & Cetak</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab 3: PUSAT REKAPITULASI LAPORAN ADMIN (Hanya Non-Siswa) */}
      {activeTab === 'rekap' && !isStudent && (
        <div className="space-y-6">
          {/* 8-Recap Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { type: 'students', label: '1. Siswa PKL', icon: Users },
              { type: 'dudi', label: '2. Mitra DUDI', icon: Building2 },
              { type: 'placements', label: '3. Penempatan', icon: Briefcase },
              { type: 'teachers', label: '4. Guru Pembimbing', icon: GraduationCap },
              { type: 'attendance', label: '5. Presensi / Absen', icon: UserCheck },
              { type: 'journals', label: '6. Jurnal Harian', icon: ClipboardList },
              { type: 'monitoring', label: '7. Monitoring Guru', icon: Camera },
              { type: 'grades', label: '8. Nilai & Kelulusan', icon: Award },
            ].map((btn) => {
              const Icon = btn.icon;
              const isActive = activeRecapType === btn.type;
              return (
                <button
                  key={btn.type}
                  onClick={() => setActiveRecapType(btn.type as AdminRecapType)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="text-[11px] font-bold block">{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari dalam tabel rekap..."
                value={recapSearch}
                onChange={(e) => setRecapSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportRecapCsv}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({activeRecapType})</span>
              </Button>
            </div>
          </div>

          {/* Recap Table */}
          {recapLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500 mt-3 font-medium">Mengompilasi data rekap {activeRecapType}...</p>
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Data Master Rekapitulasi: {activeRecapType.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Total: {recapData.length} Baris Data
                </span>
              </div>

              {recapData.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={<Layers className="w-8 h-8" />}
                    title="Tidak ada data rekapitulasi"
                    description="Belum ada data yang tercatat dalam modul ini."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-3">No</th>
                        {Object.keys(recapData[0])
                          .filter((k) => typeof recapData[0][k] !== 'object')
                          .map((col) => (
                            <th key={col} className="p-3 uppercase font-bold text-slate-700 whitespace-nowrap">
                              {col.replace(/_/g, ' ')}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recapData
                        .filter((row) =>
                          !recapSearch ||
                          JSON.stringify(row).toLowerCase().includes(recapSearch.toLowerCase())
                        )
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                            {Object.keys(row)
                              .filter((k) => typeof row[k] !== 'object')
                              .map((k) => (
                                <td key={k} className="p-3 text-slate-700 whitespace-nowrap">
                                  {row[k]?.toString() || '-'}
                                </td>
                              ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ================= MODAL 1: UPLOAD LAPORAN AWAL (SISWA) ================= */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah Naskah Laporan Akhir PKL"
        size="lg"
      >
        <form onSubmit={handleUploadReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Pilih Penempatan PKL <span className="text-red-500">*</span>
            </label>
            <Select
              value={uploadPlacementId}
              onChange={(e) => setUploadPlacementId(e.target.value)}
              required
            >
              <option value="">-- Pilih Penempatan --</option>
              {placements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.student?.name} — {p.dudi?.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Judul Laporan PKL Lengkap <span className="text-red-500">*</span>
            </label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Contoh: Implementasi Jaringan FTTH pada PT Telkom..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Ringkasan / Abstrak Laporan
            </label>
            <textarea
              rows={3}
              value={uploadAbstract}
              onChange={(e) => setUploadAbstract(e.target.value)}
              placeholder="Uraian singkat mengenai latar belakang, topik teknis, dan kesimpulan PKL..."
              className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Unggah Dokumen Naskah Laporan (PDF / DOCX) <span className="text-red-500">*</span>
            </label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Maksimal 15 MB. Format naskah resmi sesuai panduan penulisan laporan PKL sekolah.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Mengunggah...' : 'Submit Laporan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL 2: UPLOAD REVISI (SISWA) ================= */}
      <Modal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title={`Unggah Naskah Revisi Versi ${(selectedReport?.version || 1) + 1}`}
        size="md"
      >
        <form onSubmit={handleUploadRevision} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <span className="font-bold block mb-1">Catatan Pembimbing Sebelumnya:</span>
            <p className="italic">"{selectedReport?.teacher_feedback || '-'}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Pilih Dokumen Naskah Revisi Baru (PDF / DOCX) <span className="text-red-500">*</span>
            </label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Catatan Perubahan / Poin Revisi
            </label>
            <textarea
              rows={2}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Contoh: Sudah diperbaiki format daftar pustaka dan penambahan gambar dimensi bab 3..."
              className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRevisionModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : 'Submit Revisi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL 3: REVIEW LAPORAN GURU ================= */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Telaah & Evaluasi Laporan PKL Siswa"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
            <span className="text-purple-700 font-bold block">Judul Laporan:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReport?.title}</p>
            <p className="text-purple-800 mt-1">
              Penulis: <strong>{selectedReport?.student?.name}</strong> ({selectedReport?.student?.class?.name})
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Catatan Pembimbing / Poin Revisi
            </label>
            <textarea
              rows={4}
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              placeholder="Tuliskan catatan koreksi per bab, format penulisan, atau apresiasi jika laporan disetujui..."
              className="w-full text-xs sm:text-sm rounded-lg border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleReviewSubmit('revision_required')}
                disabled={isSubmitting}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Minta Revisi
              </Button>

              <Button
                variant="primary"
                onClick={() => handleReviewSubmit('approved')}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Memproses...' : 'Setujui & Sahkan (APPROVED)'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 4: DETAIL RIWAYAT VERSI ================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Riwayat Versi & Log Revisi Laporan"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="space-y-3">
              {(selectedReport.revisions || []).map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Versi {rev.version}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {rev.notes && (
                    <p className="text-xs text-slate-600">
                      <strong>Catatan Siswa:</strong> {rev.notes}
                    </p>
                  )}

                  {rev.teacher_feedback && (
                    <div className="p-2.5 rounded bg-purple-50 text-purple-900 text-xs border border-purple-200">
                      <strong>Feedback Guru:</strong> "{rev.teacher_feedback}"
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                    <a
                      href={rev.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh Berkas v{rev.version}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL GENERATOR & KONFIGURASI SURAT RESMI ================= */}
      <Modal
        isOpen={isCreateLetterModalOpen}
        onClose={() => setIsCreateLetterModalOpen(false)}
        title="Buat & Konfigurasi Surat Resmi Administrasi PKL"
        size="4xl"
      >
        <div className="space-y-5">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white mt-0.5">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950">
                Pusat Generator Surat Resmi SMKN 13 Bandung {selectedTemplate ? `— ${selectedTemplate.title}` : ''}
              </h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Pilih jenis surat, instansi DUDI mitra tujuan, dan tentukan siswa dari database yang dicantumkan pada lampiran resmi berstandar Dinas Pendidikan Jawa Barat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Jenis Template Surat */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Jenis Dokumen / Template Surat
              </label>
              <Select
                value={letterForm.type}
                onChange={(e) => {
                  const newType = e.target.value as DocumentType;
                  const isPermohonan = newType === 'surat_permohonan';
                  setLetterForm({
                    ...letterForm,
                    type: newType,
                    letterNumber: isPermohonan
                      ? `421.5/${Math.floor(100 + Math.random() * 900)}/TU.01.02/SMKN1CMA/Cadisdik WIL.IV`
                      : `421.5/${Math.floor(100 + Math.random() * 900)}/SMKN1-PKL/${new Date().getFullYear()}`,
                  });
                }}
                className="text-xs"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.type}>
                    {t.title} ({t.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* 2. Data Tempat DUDI, Instruktur & Posisi (Mendukung Input Manual / Pilih Master) */}
            <div className="md:col-span-2 p-4 bg-slate-50 border border-indigo-100 rounded-2xl space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Data DUDI & Penempatan (Tempat, Instruktur & Posisi)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pilih dari master data atau ketik langsung secara manual untuk tempat, instruktur, dan posisi PKL.
                    </p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const currentDudi = dudiList.find((d) => d.id === letterForm.dudiId) || dudiList[0];
                      setLetterForm((prev) => ({
                        ...prev,
                        dudiMode: 'select',
                        dudiId: currentDudi?.id || '',
                        customDudiName: currentDudi?.name || prev.customDudiName,
                        customDudiAddress: currentDudi?.address || prev.customDudiAddress,
                        mentorName: currentDudi?.contact_person || prev.mentorName,
                        position: currentDudi?.sector || prev.position,
                      }));
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      letterForm.dudiMode === 'select'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Pilih Master DUDI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLetterForm((prev) => ({
                        ...prev,
                        dudiMode: 'manual',
                      }));
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      letterForm.dudiMode === 'manual'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✍️ Input Manual Murni
                  </button>
                </div>
              </div>

              {/* Jika Mode Select dari Master */}
              {letterForm.dudiMode === 'select' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Pilih Instansi dari Master DUDI:
                  </label>
                  <Select
                    value={letterForm.dudiId || (dudiList.length > 0 ? dudiList[0].id : '')}
                    onChange={(e) => {
                      const newDudiId = e.target.value;
                      const selectedD = dudiList.find((d) => d.id === newDudiId);
                      const dudiStudentIds = placements.filter((p) => p.dudi_id === newDudiId).map((p) => p.student_id);
                      setLetterForm({
                        ...letterForm,
                        dudiId: newDudiId,
                        customDudiName: selectedD?.name || '',
                        customDudiAddress: selectedD?.address || '',
                        mentorName: selectedD?.contact_person || 'Ir. Hendra Wijaya',
                        position: selectedD?.sector || 'Teknisi Operasional',
                        selectedStudentIds: dudiStudentIds.length > 0 ? dudiStudentIds : letterForm.selectedStudentIds,
                      });
                    }}
                    className="text-xs bg-white"
                  >
                    {dudiList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — ({d.sector})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Form 4 Kolom: Tempat, Alamat, Instruktur, Posisi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* 1. Tempat / Nama DUDI */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Tempat / Nama Instansi DUDI <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-indigo-600 font-medium">Bisa diedit manual</span>
                  </label>
                  <Input
                    value={letterForm.customDudiName}
                    onChange={(e) => setLetterForm({ ...letterForm, customDudiName: e.target.value })}
                    placeholder="Contoh: BENGKEL JASUTRA MOTOR"
                    className="text-xs bg-white"
                  />
                </div>

                {/* 2. Alamat DUDI */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Alamat Lengkap DUDI</span>
                    <span className="text-[10px] text-indigo-600 font-medium">Bisa diedit manual</span>
                  </label>
                  <Input
                    value={letterForm.customDudiAddress}
                    onChange={(e) => setLetterForm({ ...letterForm, customDudiAddress: e.target.value })}
                    placeholder="Contoh: Jl. Soekarno-Hatta No. 442, Bandung"
                    className="text-xs bg-white"
                  />
                </div>

                {/* 3. Instruktur Industri */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Nama Instruktur / Pembimbing Lapangan <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-medium">Input Manual</span>
                  </label>
                  <Input
                    value={letterForm.mentorName}
                    onChange={(e) => setLetterForm({ ...letterForm, mentorName: e.target.value })}
                    placeholder="Contoh: Ir. Hendra Wijaya / Bpk. Sutrisno"
                    className="text-xs bg-white"
                  />
                </div>

                {/* 4. Posisi / Bidang PKL */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Posisi / Bidang / Divisi Penempatan <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-medium">Input Manual</span>
                  </label>
                  <Input
                    value={letterForm.position}
                    onChange={(e) => setLetterForm({ ...letterForm, position: e.target.value })}
                    placeholder="Contoh: Teknisi Otomotif / Mekanik Servis / Front Office"
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Nomor Surat */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Nomor Surat Resmi
              </label>
              <Input
                value={letterForm.letterNumber}
                onChange={(e) => setLetterForm({ ...letterForm, letterNumber: e.target.value })}
                placeholder="Contoh: 421.5/.../TU.01.02/SMKN1CMA/Cadisdik WIL.IV"
                className="text-xs font-mono"
              />
            </div>

            {/* 4. Nama Penandatangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Nama Penandatangan (Kepala Sekolah)
              </label>
              <Input
                value={letterForm.signerName}
                onChange={(e) => setLetterForm({ ...letterForm, signerName: e.target.value })}
                className="text-xs"
              />
            </div>

            {/* 5. NIP Penandatangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                NIP Penandatangan
              </label>
              <Input
                value={letterForm.signerNip}
                onChange={(e) => setLetterForm({ ...letterForm, signerNip: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          {/* 6. Pemilih Siswa dari Database untuk Lampiran Surat */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Pilih Siswa dari Database untuk Lembar Lampiran
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                  {letterForm.selectedStudentIds.length} Siswa Terpilih
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectDudiStudents}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors text-[11px]"
                >
                  Siswa DUDI Ini
                </button>
                <button
                  type="button"
                  onClick={selectAllFilteredStudents}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors text-[11px]"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={clearStudentSelection}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa berdasarkan nama, NISN, atau kelas..."
                value={studentPickerSearch}
                onChange={(e) => setStudentPickerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Listbox Siswa dari Database */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200/80 rounded-xl p-2 bg-white">
              {filteredPickerStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada data siswa yang cocok dengan pencarian "{studentPickerSearch}".
                </div>
              ) : (
                filteredPickerStudents.map((st) => {
                  const isSelected = letterForm.selectedStudentIds.includes(st.id);
                  const placement = placements.find((p) => p.student_id === st.id);
                  const isPlacedAtCurrentDudi = placement?.dudi_id === letterForm.dudiId;

                  return (
                    <div
                      key={st.id}
                      onClick={() => toggleStudentSelection(st.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-200 text-slate-900 shadow-xs'
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {st.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono leading-tight">
                            NISN: {st.nisn || '-'} • NIS: {st.nis || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isPlacedAtCurrentDudi && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            DUDI Ini
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {st.class?.name || st.class?.major?.code || 'TKRO'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Summary Chips */}
            {letterForm.selectedStudentIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600">Urutan Lampiran:</span>
                {students
                  .filter((s) => letterForm.selectedStudentIds.includes(s.id))
                  .map((s, idx) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      <span>{idx + 1}. {s.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStudentSelection(s.id);
                        }}
                        className="text-indigo-400 hover:text-indigo-700 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setIsCreateLetterModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={() => handleGenerateLetter(letterForm.type)}
              disabled={
                isSubmitting ||
                letterForm.selectedStudentIds.length === 0 ||
                !letterForm.customDudiName.trim()
              }
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Memproses...'
                  : `Buat Surat dengan ${letterForm.selectedStudentIds.length} Siswa`}
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 5: PREVIEW & CETAK SURAT RESMI ================= */}
      <Modal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        title="Pratinjau Surat Resmi Administrasi PKL"
        size="6xl"
      >
        {activeLetter && (
          <div className="space-y-4">
            {/* Viewer Canvas Container: Tampilan Kertas Luas & Elegan */}
            <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-4 sm:p-8 max-h-[76vh] overflow-y-auto space-y-8 printable-letter">
              {/* Lembar 1: Surat Pengajuan / Permohonan */}
              <div className="printable-sheet max-w-4xl w-full mx-auto bg-white p-8 sm:p-14 shadow-lg border border-slate-200/90 rounded-sm space-y-6">
                {/* Kop Surat SMKN 13 Bandung Resmi Jawa Barat */}
                <div className="border-b-[3px] border-double border-slate-900 pb-3 text-slate-900 font-serif flex items-center justify-between gap-3 sm:gap-6">
                  <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Logo SMKN 13 Bandung"
                      className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <h4 className="text-xs sm:text-sm font-bold tracking-widest leading-tight uppercase">
                      PEMERINTAH DAERAH PROVINSI JAWA BARAT
                    </h4>
                    <h3 className="text-xs sm:text-sm font-bold tracking-wide leading-tight uppercase">
                      DINAS PENDIDIKAN
                    </h3>
                    <h3 className="text-xs sm:text-sm font-bold tracking-wide leading-tight uppercase">
                      CABANG DINAS PENDIDIKAN WILAYAH VII
                    </h3>
                    <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight uppercase mt-1">
                      SEKOLAH MENENGAH KEJURUAN NEGERI 13 BANDUNG
                    </h2>
                    <p className="text-xs leading-relaxed mt-1 text-slate-700">
                      Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu
                    </p>
                    <p className="text-xs leading-tight text-slate-700">
                      Telp/Fax. (022) 7318960 Email: info@smkn13bdg.sch.id
                    </p>
                    <p className="text-xs font-semibold leading-tight text-slate-800">
                      Kota Bandung - 40286
                    </p>
                  </div>
                  <div className="w-16 sm:w-20 shrink-0 hidden sm:block"></div>
                </div>

                {/* Nomor & Perihal */}
                <div className="text-xs sm:text-sm text-slate-900 space-y-1">
                  <p>
                    <span className="inline-block w-24 font-semibold">Nomor</span>: {activeLetter.letter_number}
                  </p>
                  <p>
                    <span className="inline-block w-24 font-semibold">Lamp</span>: {activeLetter.template_type === 'surat_permohonan' ? '1 (Satu) Berkas' : '-'}
                  </p>
                  <p>
                    <span className="inline-block w-24 font-semibold">Perihal</span>:{' '}
                    <span className="font-semibold">
                      {activeLetter.template_type === 'surat_permohonan'
                        ? 'Pengajuan Tempat Siswa Prakerin (PKL)'
                        : activeLetter.title}
                    </span>
                  </p>
                </div>

                {/* Isi Surat */}
                <div className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-line py-2">
                  {activeLetter.content_html}
                </div>

                {/* Tanda Tangan Kepala Sekolah */}
                <div className="flex justify-end pt-4">
                  <div className="text-left text-xs sm:text-sm w-72 space-y-1.5">
                    <p>
                      Bandung,{' '}
                      {new Date(activeLetter.issued_date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="font-semibold">{activeLetter.signer_title}</p>
                    <div className="h-20 flex items-center justify-center text-slate-300 italic border border-dashed border-slate-200 rounded my-1.5">
                      [Tanda Tangan & Stempel Resmi]
                    </div>
                    <p className="font-bold underline text-slate-900">{activeLetter.signer_name}</p>
                    <p className="text-slate-700 font-medium">NIP. {activeLetter.signer_nip}</p>
                  </div>
                </div>
              </div>

              {/* Lembar 2: Lampiran Daftar Nama Siswa Prakerin (Sesuai File Jasutra Motor) */}
              {activeLetter.template_type === 'surat_permohonan' && (
                <div className="printable-sheet page-break max-w-4xl w-full mx-auto bg-white p-8 sm:p-14 shadow-lg border border-slate-200/90 rounded-sm space-y-6">
                  {/* Kop Surat Lampiran */}
                  <div className="border-b-[3px] border-double border-slate-900 pb-3 text-slate-900 font-serif flex items-center justify-between gap-3 sm:gap-6">
                    <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt="Logo SMKN 13 Bandung"
                        className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-center">
                      <h4 className="text-xs sm:text-sm font-bold tracking-widest leading-tight uppercase">
                        PEMERINTAH DAERAH PROVINSI JAWA BARAT
                      </h4>
                      <h3 className="text-xs sm:text-sm font-bold tracking-wide leading-tight uppercase">
                        DINAS PENDIDIKAN
                      </h3>
                      <h3 className="text-xs sm:text-sm font-bold tracking-wide leading-tight uppercase">
                        CABANG DINAS PENDIDIKAN WILAYAH VII
                      </h3>
                      <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight uppercase mt-1">
                        SEKOLAH MENENGAH KEJURUAN NEGERI 13 BANDUNG
                      </h2>
                      <p className="text-xs leading-relaxed mt-1 text-slate-700">
                        Jl. Soekarno-Hatta No.Km. 10, Jatisari, Kec. Buahbatu
                      </p>
                      <p className="text-xs leading-tight text-slate-700">
                        Telp/Fax. (022) 7318960 Email: info@smkn13bdg.sch.id
                      </p>
                      <p className="text-xs font-semibold leading-tight text-slate-800">
                        Kota Bandung - 40286
                      </p>
                    </div>
                    <div className="w-16 sm:w-20 shrink-0 hidden sm:block"></div>
                  </div>

                  {/* Judul Lampiran */}
                  <div className="text-center my-4">
                    <h3 className="font-bold text-sm sm:text-base uppercase tracking-wider underline text-slate-900">
                      DAFTAR NAMA SISWA PRAKERIN
                    </h3>
                  </div>

                  {/* Ringkasan DUDI, Instruktur & Posisi */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 my-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="font-semibold text-slate-500">Tempat / DUDI:</span>{' '}
                        <span className="font-bold text-slate-900">{activeLetter.dudi_name || activeLetter.dudi?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Instruktur Industri:</span>{' '}
                        <span className="font-bold text-slate-900">{activeLetter.mentor_name || '-'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Alamat DUDI:</span>{' '}
                        <span className="text-slate-700">{activeLetter.dudi_address || activeLetter.dudi?.address || '-'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Posisi / Bidang:</span>{' '}
                        <span className="font-bold text-indigo-700">{activeLetter.position || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Daftar Nama Siswa Sesuai Dokumen Jasutra */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm my-2 text-slate-900">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-900 px-3 py-2 text-center w-14">NO</th>
                          <th className="border border-slate-900 px-4 py-2 text-left">Nama</th>
                          <th className="border border-slate-900 px-4 py-2 text-center w-36">NISN</th>
                          <th className="border border-slate-900 px-4 py-2 text-center w-36">TTL</th>
                          <th className="border border-slate-900 px-4 py-2 text-center w-48">
                            Kompetensi Keahlian
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeLetter.students_list || []).map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="border border-slate-900 px-3 py-2.5 text-center font-medium">
                              {idx + 1}.
                            </td>
                            <td className="border border-slate-900 px-4 py-2.5 font-medium">{st.name}</td>
                            <td className="border border-slate-900 px-4 py-2.5 text-center font-mono">{st.nisn}</td>
                            <td className="border border-slate-900 px-4 py-2.5 text-center">{st.ttl}</td>
                            <td className="border border-slate-900 px-4 py-2.5 text-center font-semibold">
                              {st.major_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tanda Tangan Lampiran */}
                  <div className="flex justify-end pt-4">
                    <div className="text-left text-xs sm:text-sm w-72 space-y-1.5">
                      <p>
                        Bandung,{' '}
                        {new Date(activeLetter.issued_date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="font-semibold">{activeLetter.signer_title}</p>
                    <div className="h-20 flex items-center justify-center text-slate-300 italic border border-dashed border-slate-200 rounded my-1.5">
                      [Tanda Tangan & Stempel Resmi]
                    </div>
                    <p className="font-bold underline text-slate-900">{activeLetter.signer_name}</p>
                    <p className="text-slate-700 font-medium">NIP. {activeLetter.signer_nip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Print (Hidden on paper print) */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between no-print">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePrintLetter(activeLetter)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 px-4 py-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Surat & Lampiran (PDF / Kertas A4)</span>
            </Button>
            <Button variant="outline" onClick={() => setIsLetterModalOpen(false)}>
              Tutup Pratinjau
            </Button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
};
