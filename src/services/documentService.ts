import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  PklReport,
  ReportStatus,
  ReportRevision,
  DocumentTemplate,
  DocumentType,
  GeneratedLetter,
  AdminRecapType
} from '../types';
import { masterService } from './masterService';
import { pklService } from './pklService';
import { attendanceService } from './attendanceService';
import { journalService } from './journalService';
import { monitoringService } from './monitoringService';
import { assessmentService } from './assessmentService';
import { settingsService } from './settingsService';

const REPORTS_STORAGE_KEY = 'epkl_reports_v1';
const LETTERS_STORAGE_KEY = 'epkl_generated_letters_v1';

// Initial Mock Reports
const INITIAL_REPORTS: PklReport[] = [
  {
    id: 'rep-1',
    placement_id: 'p-1',
    student_id: 's-1',
    title: 'Implementasi dan Pengujian Jaringan Fiber To The Home (FTTH) pada Divisi Akses PT Telkom Indonesia',
    abstract: 'Laporan ini membahas mengenai tahapan instalasi jaringan serat optik FTTH, proses splicing core pada Optical Distribution Point (ODP), serta pengukuran redaman daya menggunakan Optical Time Domain Reflectometer (OTDR).',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Laporan_PKL_Ahmad_Fauzi_XIITKJ1.pdf',
    file_size_bytes: 2450000,
    version: 2,
    status: 'approved',
    teacher_feedback: 'Naskah laporan bab 1 hingga bab 4 sudah sangat baik, format dan lampiran dokumentasi telah sesuai standar.',
    reviewed_by: 't-1',
    approved_at: '2026-08-21T10:00:00.000Z',
    revisions: [
      {
        id: 'rev-1-1',
        report_id: 'rep-1',
        version: 1,
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_name: 'Laporan_PKL_Ahmad_Fauzi_Draft_v1.pdf',
        notes: 'Pengajuan draf awal laporan PKL bab 1-3.',
        teacher_feedback: 'Tolong tambahkan pembahasan standar redaman ITU-T G.652 pada bab 2.',
        status: 'revision_required',
        created_at: '2026-08-15T09:00:00.000Z',
      },
      {
        id: 'rev-1-2',
        report_id: 'rep-1',
        version: 2,
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_name: 'Laporan_PKL_Ahmad_Fauzi_XIITKJ1.pdf',
        notes: 'Revisi perbaikan bab 2 dan penambahan lampiran dokumentasi lapangan.',
        teacher_feedback: 'Naskah laporan bab 1 hingga bab 4 sudah sangat baik, disetujui.',
        status: 'approved',
        created_at: '2026-08-20T11:00:00.000Z',
      },
    ],
    created_at: '2026-08-15T09:00:00.000Z',
    updated_at: '2026-08-21T10:00:00.000Z',
  },
  {
    id: 'rep-2',
    placement_id: 'p-2',
    student_id: 's-2',
    title: 'Optimalisasi Manajemen Bandwidth dan Routing Inter-VLAN pada Data Center PT Astra Honda Motor',
    abstract: 'Laporan ini menjelaskan konfigurasi router Cisco dan switch Catalyst untuk mendukung isolasi trafik server per divisi serta penerapan ACL firewall.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Laporan_PKL_Siti_Nurhaliza_v1.pdf',
    file_size_bytes: 3100000,
    version: 1,
    status: 'submitted',
    teacher_feedback: null,
    reviewed_by: null,
    approved_at: null,
    revisions: [
      {
        id: 'rev-2-1',
        report_id: 'rep-2',
        version: 1,
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_name: 'Laporan_PKL_Siti_Nurhaliza_v1.pdf',
        notes: 'Pengajuan draf lengkap laporan PKL.',
        teacher_feedback: null,
        status: 'submitted',
        created_at: '2026-08-21T16:00:00.000Z',
      },
    ],
    created_at: '2026-08-21T16:00:00.000Z',
    updated_at: '2026-08-21T16:00:00.000Z',
  },
  {
    id: 'rep-3',
    placement_id: 'p-3',
    student_id: 's-3',
    title: 'Proses Pembuatan Komponen Poros Penggerak Menggunakan Mesin Bubut CNC 3-Axis di PT Pindad',
    abstract: 'Kajian praktis pemrograman G-Code dan M-Code serta parameter kecepatan potong (cutting speed) pada material baja paduan S45C.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: 'Laporan_PKL_Budi_Santoso_Draft.pdf',
    file_size_bytes: 1800000,
    version: 1,
    status: 'revision_required',
    teacher_feedback: 'Format penulisan daftar pustaka belum sesuai APA Style dan gambar kerja di bab 3 belum ada keterangan dimensi.',
    reviewed_by: 't-2',
    approved_at: null,
    revisions: [
      {
        id: 'rev-3-1',
        report_id: 'rep-3',
        version: 1,
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_name: 'Laporan_PKL_Budi_Santoso_Draft.pdf',
        notes: 'Pengajuan draf awal.',
        teacher_feedback: 'Format penulisan daftar pustaka belum sesuai APA Style dan gambar kerja di bab 3 belum ada keterangan dimensi.',
        status: 'revision_required',
        created_at: '2026-08-19T14:00:00.000Z',
      },
    ],
    created_at: '2026-08-19T14:00:00.000Z',
    updated_at: '2026-08-20T10:30:00.000Z',
  },
];

// Document Templates
const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tpl-1',
    code: 'SURAT-PERMOHONAN',
    title: 'Surat Permohonan Tempat & Kuota PKL',
    type: 'surat_permohonan',
    template_body: `Kepada Yth,
Pimpinan/Kepala {{dudi_name}}
di_
{{dudi_address}}

Dasar :
1. Undang-undang No.20 Tahun 2003 tentang Sistem Pendidikan Nasional
2. Peraturan Menteri Pendidikan dan Kebudayaan RI No.30 Tahun 2017 tentang peranan masyarakat dan Keluarga dalam Pendidikan Nasional
3. Peraturan Menteri Pendidikan dan Kebudayaan RI No. 36 Tahun 2018 tentang Kurikulum Sekolah Menengah Kejuruan
4. Peraturan Menteri Pendidikan dan Kebudayaan RI No. 50 Tahun 2020 tentang penyelenggaraan Praktik Kerja Lapangan (PKL) bagi Peserta Didik
5. Kurikulum SMK dan Jadwal Prakerin SMKN 13 Bandung Kota Bandung Tahun Pelajaran {{academic_year}}

Sesuai dengan dasar tersebut di atas, melalui surat ini kami mohon ketersediaan Bapak/Ibu/Sdr untuk dapat menerima siswa/i kami dalam melaksanakan Kegiatan Praktik Industri pada Instansi/Perusahaan yang Bapak/Ibu/Sdr Pimpin pada bulan {{pkl_months}} dengan rincian permohonan:
• Tempat / Instansi    : {{dudi_name}}
• Alamat Instansi      : {{dudi_address}}
• Posisi / Bidang      : {{dudi_position}}
• Instruktur / PIC     : {{mentor_name}}

Demikian surat permohonan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terimakasih.`,
    is_active: true,
  },
  {
    id: 'tpl-2',
    code: 'SURAT-PENGANTAR',
    title: 'Surat Pengantar Siswa PKL',
    type: 'surat_pengantar',
    template_body: `Dengan hormat,

Menindaklanjuti kesediaan penerimaan PKL di {{dudi_name}}, dengan ini kami menghadapkan siswa SMK Negeri 13 Bandung berikut:

Nama Siswa         : {{student_name}}
NIS / NISN         : {{student_nis}} / {{student_nisn}}
Kelas / Jurusan    : {{class_name}} ({{major_name}})
Tempat PKL         : {{dudi_name}}
Alamat DUDI        : {{dudi_address}}
Posisi / Bidang    : {{dudi_position}}
Instruktur Industri: {{mentor_name}}
Waktu Mulai        : {{start_date}} s.d. {{end_date}}
Guru Pembimbing    : {{teacher_name}} ({{teacher_phone}})

Kami mohon bimbingan, arahan teknis, dan pengawasan kerja kepada siswa kami selama melaksanakan praktik di perusahaan Bapak/Ibu.`,
    is_active: true,
  },
  {
    id: 'tpl-3',
    code: 'SURAT-TUGAS-GURU',
    title: 'Surat Tugas Pembimbing PKL',
    type: 'surat_tugas',
    template_body: `SURAT TUGAS
Nomor: {{letter_number}}

Kepala SMK Negeri 13 Bandung menugaskan kepada:

Nama    : {{teacher_name}}
NIP     : {{teacher_nip}}
Jabatan : Guru Pembimbing PKL

Untuk melaksanakan tugas pembimbingan, koordinasi dengan mentor DUDI, serta pemantauan kemajuan belajar siswa PKL di {{dudi_name}} pada periode {{academic_year}}.

Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.`,
    is_active: true,
  },
  {
    id: 'tpl-4',
    code: 'SURAT-PENERIMAAN',
    title: 'Surat Konfirmasi Penerimaan PKL',
    type: 'surat_penerimaan',
    template_body: `SURAT KONFIRMASI PENERIMAAN
Nomor: {{letter_number}}

Berdasarkan surat permohonan dari SMK Negeri 13 Bandung, pihak industri {{dudi_name}} menyatakan:

MENERIMA

Siswa berikut untuk melaksanakan Praktik Kerja Lapangan (PKL):
Nama Siswa : {{student_name}}
NIS        : {{student_nis}}
Jurusan    : {{major_name}}
Masa PKL   : {{start_date}} s.d. {{end_date}}
Pembimbing : {{mentor_name}}

Demikian surat keterangan penerimaan ini kami sampaikan.`,
    is_active: true,
  },
  {
    id: 'tpl-5',
    code: 'SURAT-MONITORING',
    title: 'Surat Tugas Monitoring Kunjungan PKL',
    type: 'surat_monitoring',
    template_body: `SURAT JALAN / TUGAS MONITORING PKL
Nomor: {{letter_number}}

Kepala SMK Negeri 13 Bandung menugaskan kepada:
Nama Guru : {{teacher_name}} (NIP: {{teacher_nip}})

Untuk melaksanakan supervisi dan kunjungan monitoring siswa PKL ke:
Instansi / DUDI : {{dudi_name}}
Alamat          : {{dudi_address}}
Tanggal Kunjungan: {{issued_date}}
Tahap Supervisi : Monitoring Tahap {{monitoring_stage}}

Diharapkan pihak DUDI berkenan memberikan keterangan terkait perkembangan belajar dan kedisiplinan siswa bersangkutan.`,
    is_active: true,
  },
  {
    id: 'tpl-6',
    code: 'SURAT-SELESAI-PKL',
    title: 'Surat Keterangan Selesai PKL',
    type: 'surat_selesai',
    template_body: `SURAT KETERANGAN SELESAI PRAKTIK KERJA LAPANGAN
Nomor: {{letter_number}}

Kepala SMK Negeri 13 Bandung menerangkan bahwa:

Nama Siswa    : {{student_name}}
NIS / NISN    : {{student_nis}} / {{student_nisn}}
Kelas / Jurusan : {{class_name}}
Tempat PKL    : {{dudi_name}}
Periode PKL   : {{start_date}} s.d. {{end_date}}

Telah menyelesaikan seluruh rangkaian kegiatan Praktik Kerja Lapangan (PKL) dan dinyatakan LULUS serta memenuhi syarat administrasi kelulusan PKL.`,
    is_active: true,
  },
];

// Helper storage functions
const getLocalReports = (): PklReport[] => {
  const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
  return INITIAL_REPORTS;
};

const saveLocalReports = (reports: PklReport[]) => {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
};

const getLocalLetters = (): GeneratedLetter[] => {
  const saved = localStorage.getItem(LETTERS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return [];
};

const saveLocalLetters = (letters: GeneratedLetter[]) => {
  localStorage.setItem(LETTERS_STORAGE_KEY, JSON.stringify(letters));
};

export const documentService = {
  // 1. Get Reports List
  async getReports(filter?: {
    studentId?: string;
    teacherId?: string;
    status?: ReportStatus;
  }): Promise<PklReport[]> {
    const [students, placements, teachers] = await Promise.all([
      masterService.getStudents(),
      pklService.getPlacements(),
      masterService.getTeachers(),
    ]);

    let list = getLocalReports().map((r) => {
      const placement = placements.find((p) => p.id === r.placement_id) || null;
      const student = students.find((s) => s.id === r.student_id) || null;
      const reviewer = teachers.find((t) => t.id === r.reviewed_by) || null;
      return {
        ...r,
        placement,
        student,
        reviewer_teacher: reviewer,
      };
    });

    if (filter?.studentId) list = list.filter((r) => r.student_id === filter.studentId);
    if (filter?.teacherId) list = list.filter((r) => r.placement?.teacher_id === filter.teacherId);
    if (filter?.status) list = list.filter((r) => r.status === filter.status);

    return list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async getReportByPlacementId(placementId: string): Promise<PklReport | null> {
    const list = await this.getReports();
    return list.find((r) => r.placement_id === placementId) || null;
  },

  // 2. Upload Initial Report
  async uploadReport(data: {
    placement_id: string;
    student_id: string;
    title: string;
    abstract?: string;
    file: File;
  }): Promise<PklReport> {
    const fileUpload = await this.uploadReportFile(data.file);
    const current = getLocalReports();

    const newRevision: ReportRevision = {
      id: `rev-${Date.now()}-1`,
      report_id: `rep-${Date.now()}`,
      version: 1,
      file_url: fileUpload.fileUrl,
      file_name: fileUpload.fileName,
      notes: 'Pengajuan naskah awal laporan PKL.',
      teacher_feedback: null,
      status: 'submitted',
      created_at: new Date().toISOString(),
    };

    const newReport: PklReport = {
      id: newRevision.report_id,
      placement_id: data.placement_id,
      student_id: data.student_id,
      title: data.title,
      abstract: data.abstract || null,
      file_url: fileUpload.fileUrl,
      file_name: fileUpload.fileName,
      file_size_bytes: fileUpload.fileSize,
      version: 1,
      status: 'submitted',
      teacher_feedback: null,
      reviewed_by: null,
      approved_at: null,
      revisions: [newRevision],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalReports([newReport, ...current]);
    const hyd = await this.getReportByPlacementId(data.placement_id);
    return hyd || newReport;
  },

  // 3. Submit Revision File
  async submitRevision(
    reportId: string,
    data: { file: File; notes?: string }
  ): Promise<PklReport> {
    const fileUpload = await this.uploadReportFile(data.file);
    const current = getLocalReports();
    const idx = current.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Laporan tidak ditemukan');

    const nextVersion = current[idx].version + 1;

    const revisionItem: ReportRevision = {
      id: `rev-${Date.now()}-${nextVersion}`,
      report_id: reportId,
      version: nextVersion,
      file_url: fileUpload.fileUrl,
      file_name: fileUpload.fileName,
      notes: data.notes || `Revisi versi ${nextVersion}`,
      teacher_feedback: null,
      status: 'submitted',
      created_at: new Date().toISOString(),
    };

    const updatedReport: PklReport = {
      ...current[idx],
      file_url: fileUpload.fileUrl,
      file_name: fileUpload.fileName,
      file_size_bytes: fileUpload.fileSize,
      version: nextVersion,
      status: 'submitted',
      revisions: [...(current[idx].revisions || []), revisionItem],
      updated_at: new Date().toISOString(),
    };

    current[idx] = updatedReport;
    saveLocalReports(current);

    const hyd = await this.getReportByPlacementId(updatedReport.placement_id);
    return hyd || updatedReport;
  },

  // 4. Review Report (Teacher / Admin)
  async reviewReport(
    reportId: string,
    feedback: string,
    status: 'approved' | 'revision_required',
    teacherId?: string
  ): Promise<PklReport> {
    const current = getLocalReports();
    const idx = current.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error('Laporan tidak ditemukan');

    const isApproved = status === 'approved';

    const updatedReport: PklReport = {
      ...current[idx],
      status: status,
      teacher_feedback: feedback,
      reviewed_by: teacherId || current[idx].reviewed_by || 't-1',
      approved_at: isApproved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    // Update status in last revision
    if (updatedReport.revisions && updatedReport.revisions.length > 0) {
      const lastRevIdx = updatedReport.revisions.length - 1;
      updatedReport.revisions[lastRevIdx].status = status;
      updatedReport.revisions[lastRevIdx].teacher_feedback = feedback;
    }

    current[idx] = updatedReport;
    saveLocalReports(current);

    const hyd = await this.getReportByPlacementId(updatedReport.placement_id);
    return hyd || updatedReport;
  },

  // 5. Upload File Helper
  async uploadReportFile(file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const safeName = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `reports/${safeName}`;

        const { error } = await supabase.storage.from('pkl-reports').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (!error) {
          const { data } = supabase.storage.from('pkl-reports').getPublicUrl(filePath);
          return { fileUrl: data.publicUrl, fileName: file.name, fileSize: file.size };
        }
      } catch (err) {
        console.warn('Supabase storage upload fallback:', err);
      }
    }

    // Offline / Demo fallback dummy URL
    return {
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: file.name,
      fileSize: file.size,
    };
  },

  // 6. Document Templates
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return DOCUMENT_TEMPLATES;
  },

  // 7. Generate Official Letter
  async generateOfficialLetter(
    type: DocumentType,
    payload: {
      studentId?: string;
      dudiId?: string;
      customDudiName?: string;
      customDudiAddress?: string;
      mentorName?: string;
      position?: string;
      teacherId?: string;
      placementId?: string;
      letterNumber?: string;
      signerName?: string;
      signerNip?: string;
      signerTitle?: string;
      customBody?: string;
      selectedStudentIds?: string[];
      studentsList?: Array<{ name: string; nisn: string; ttl: string; major_name: string }>;
    }
  ): Promise<GeneratedLetter> {
    const template = DOCUMENT_TEMPLATES.find((t) => t.type === type) || DOCUMENT_TEMPLATES[0];
    const [students, dudiList, teachers, placements] = await Promise.all([
      masterService.getStudents(),
      masterService.getDudi(),
      masterService.getTeachers(),
      pklService.getPlacements(),
    ]);

    const student = students.find((s) => s.id === payload.studentId) || null;
    const targetDudiId = payload.dudiId || (dudiList.length > 0 ? dudiList[0].id : undefined);
    const dudi = dudiList.find((d) => d.id === targetDudiId) || (dudiList.length > 0 ? dudiList[0] : null);
    const teacher = teachers.find((t) => t.id === payload.teacherId) || null;
    const placement = placements.find((p) => p.id === payload.placementId) || null;

    // Nilai data DUDI (Mendukung Input Manual atau Master Data)
    const finalDudiName = payload.customDudiName?.trim() || dudi?.name || 'PT Telkom Indonesia';
    const finalDudiAddress = payload.customDudiAddress?.trim() || dudi?.address || 'Jl. Lembong No. 11 Bandung';
    const finalMentorName = payload.mentorName?.trim() || dudi?.contact_person || 'Hendri Gunawan';
    const finalPosition = payload.position?.trim() || dudi?.sector || 'Teknisi Operasional';

    // Ambil daftar siswa untuk lampiran tabel (Prioritas: studentsList eksplisit -> selectedStudentIds -> penempatan DUDI -> single student -> fallback)
    let studentsList: Array<{ name: string; nisn: string; ttl: string; major_name: string }> = [];

    if (payload.studentsList && payload.studentsList.length > 0) {
      studentsList = payload.studentsList;
    } else if (payload.selectedStudentIds && payload.selectedStudentIds.length > 0) {
      const selected = students.filter((s) => payload.selectedStudentIds?.includes(s.id));
      studentsList = selected.map((s, idx) => ({
        name: s.name,
        nisn: s.nisn || `008${idx}123456`,
        ttl: '01-06-2008',
        major_name: s.class?.major?.code || s.class?.major?.name || 'TKRO',
      }));
    } else {
      const dudiPlacements = placements.filter((p) => p.dudi_id === dudi?.id);
      if (dudiPlacements.length > 0) {
        studentsList = dudiPlacements.map((p, idx) => {
          const s = students.find((st) => st.id === p.student_id);
          return {
            name: s?.name || `Siswa ${idx + 1}`,
            nisn: s?.nisn || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
            ttl: '01-06-2008',
            major_name: s?.class?.major?.code || s?.class?.major?.name || 'TKRO',
          };
        });
      } else if (student) {
        studentsList = [
          {
            name: student.name,
            nisn: student.nisn || '0088583834',
            ttl: '01-06-2008',
            major_name: student.class?.major?.code || student.class?.major?.name || 'TKRO',
          },
        ];
      }
    }

    if (studentsList.length === 0) {
      // Default contoh data sesuai dokumen fisik Pengajuan Bengkel Jasutra Motor
      studentsList = [
        {
          name: 'Muhamad Alfa rizky',
          nisn: '0088583834',
          ttl: '01-06-2008',
          major_name: 'TKRO',
        },
        {
          name: 'Rehan Ramadhan',
          nisn: '3081317146',
          ttl: '24-09-2008',
          major_name: 'TKRO',
        },
      ];
    }

    const defaultPermohonanNo = `421.5/${Math.floor(100 + Math.random() * 900)}/TU.01.02/SMKN1CMA/Cadisdik WIL.IV`;
    const defaultOtherNo = `421.5/${Math.floor(100 + Math.random() * 900)}/SMKN1-PKL/${new Date().getFullYear()}`;
    const letterNumber =
      payload.letterNumber || (type === 'surat_permohonan' ? defaultPermohonanNo : defaultOtherNo);

    let body = payload.customBody || template.template_body;

    // Template variables substitution
    const replacements: Record<string, string> = {
      '{{letter_number}}': letterNumber,
      '{{academic_year}}': placement?.period?.academic_year || '2025 - 2026',
      '{{pkl_months}}': 'April - Juli 2026',
      '{{start_date}}': placement?.start_date || '01 Juli 2026',
      '{{end_date}}': placement?.end_date || '30 September 2026',
      '{{student_name}}': student?.name || (studentsList[0]?.name ?? 'Muhamad Alfa rizky'),
      '{{student_nis}}': student?.nis || '242510101',
      '{{student_nisn}}': student?.nisn || (studentsList[0]?.nisn ?? '0088583834'),
      '{{class_name}}': student?.class?.name || 'XII TKRO 1',
      '{{major_name}}': student?.class?.major?.name || 'Teknik Kendaraan Ringan Otomotif',
      '{{student_count}}': studentsList.length.toString(),
      '{{dudi_name}}': finalDudiName,
      '{{dudi_address}}': finalDudiAddress,
      '{{teacher_name}}': teacher?.name || 'Drs. Supriyanto, M.Pd.',
      '{{teacher_nip}}': teacher?.nip || '197508122002121004',
      '{{teacher_phone}}': teacher?.phone_number || '081234567890',
      '{{mentor_name}}': finalMentorName,
      '{{dudi_position}}': finalPosition,
      '{{position}}': finalPosition,
      '{{monitoring_stage}}': '1',
      '{{issued_date}}': new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    Object.entries(replacements).forEach(([key, val]) => {
      body = body.split(key).join(val);
    });

    const schoolProfile = settingsService.getSchoolProfile();

    const newLetter: GeneratedLetter = {
      id: `let-${Date.now()}`,
      letter_number: letterNumber,
      template_type: type,
      title: template.title,
      placement_id: payload.placementId || null,
      student_id: payload.studentId || null,
      student,
      dudi_id: payload.dudiId || null,
      dudi,
      dudi_name: finalDudiName,
      dudi_address: finalDudiAddress,
      mentor_name: finalMentorName,
      position: finalPosition,
      teacher_id: payload.teacherId || null,
      teacher,
      content_html: body,
      issued_date: new Date().toISOString().split('T')[0],
      signer_name: payload.signerName || schoolProfile.principalName || 'H. Kardi, S.Pd., M.M.',
      signer_nip: payload.signerNip || schoolProfile.principalNip || '197203151998021003',
      signer_title: payload.signerTitle || 'Kepala Sekolah',
      students_list: studentsList,
      created_at: new Date().toISOString(),
    };

    const currentLetters = getLocalLetters();
    saveLocalLetters([newLetter, ...currentLetters]);
    return newLetter;
  },

  async getGeneratedLetters(): Promise<GeneratedLetter[]> {
    return getLocalLetters();
  },

  // 8. Admin 8-Module Master Recap Hub
  async getRecapData(recapType: AdminRecapType, filters?: any): Promise<any[]> {
    switch (recapType) {
      case 'students':
        return masterService.getStudents();
      case 'dudi':
        return masterService.getDudi();
      case 'placements':
        return pklService.getPlacements();
      case 'teachers':
        return masterService.getTeachers();
      case 'attendance':
        return attendanceService.getAttendanceRecords(filters);
      case 'journals':
        return journalService.getJournals(filters);
      case 'monitoring':
        return monitoringService.getMonitoringList(filters);
      case 'grades':
        return assessmentService.getAssessments(filters);
      default:
        return [];
    }
  },
};
