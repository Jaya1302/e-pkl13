export type UserRole =
  | 'super_admin'
  | 'admin_pkl'
  | 'kepala_sekolah'
  | 'wakasek'
  | 'guru_pembimbing'
  | 'siswa'
  | 'pembimbing_industri';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  student?: Student | null;
  teacher?: Teacher | null;
  mentor?: IndustryMentor | null;
  placement?: PklPlacement | null;
  created_at?: string;
  updated_at?: string;
}

// 1. Jurusan
export interface Major {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 2. Guru
export interface Teacher {
  id: string;
  user_id?: string | null;
  nip?: string | null;
  name: string;
  email: string;
  phone_number?: string | null;
  major_id?: string | null;
  major?: Major | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 3. Kelas
export interface ClassItem {
  id: string;
  name: string;
  level: 'X' | 'XI' | 'XII';
  major_id: string;
  major?: Major | null;
  homeroom_teacher_id?: string | null;
  homeroom_teacher?: Teacher | null;
  academic_year: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 4. DUDI
export interface Dudi {
  id: string;
  name: string;
  sector: string;
  address: string;
  city: string;
  contact_person?: string | null;
  phone_number?: string | null;
  email?: string | null;
  quota: number;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters: number;
  is_active: boolean;
  placed_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 5. Pembimbing Industri
export interface IndustryMentor {
  id: string;
  user_id?: string | null;
  dudi_id: string;
  dudi?: Dudi | null;
  name: string;
  position?: string | null;
  email: string;
  phone_number?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 6. Siswa
export type PklStatus =
  | 'belum_ditempatkan'
  | 'proses_penempatan'
  | 'sedang_pkl'
  | 'selesai_pkl'
  | 'batal';

export interface Student {
  id: string;
  user_id?: string | null;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  class_id: string;
  class?: ClassItem | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  pkl_status: PklStatus;
  is_eligible: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 7. Periode PKL
export interface PklPeriod {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 8. Penempatan PKL
export type PlacementStatus = 'belum_mulai' | 'aktif' | 'selesai' | 'dibatalkan';

export interface PklPlacement {
  id: string;
  period_id: string;
  period?: PklPeriod | null;
  student_id: string;
  student?: Student | null;
  dudi_id: string;
  dudi?: Dudi | null;
  teacher_id: string;
  teacher?: Teacher | null;
  industry_mentor_id?: string | null;
  industry_mentor?: IndustryMentor | null;
  start_date: string;
  end_date: string;
  division?: string | null;
  status: PlacementStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 9. Absensi PKL
export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';

export interface AttendanceRecord {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student_id: string;
  student?: Student | null;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  status: AttendanceStatus;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters?: number | null;
  is_gps_valid: boolean;
  photo_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 10. Jurnal PKL
export type JournalStatus = 'draft' | 'submitted' | 'verified' | 'revision';

export interface JournalRecord {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student_id: string;
  student?: Student | null;
  date: string;
  activity: string;
  competency: string;
  duration_hours: number;
  obstacles?: string | null;
  solution?: string | null;
  photo_url?: string | null;
  status: JournalStatus;
  teacher_notes?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  verifier_teacher?: Teacher | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalDudi: number;
  totalTeachers: number;
  activePkl: number;
  unplacedStudents: number;
  pendingJournals: number;
  pendingMonitoring: number;
  pendingAssessments: number;
}

// 11. Monitoring PKL
export type MonitoringRating = 'sangat_baik' | 'baik' | 'cukup' | 'perlu_bimbingan';

export interface MonitoringAspectScores {
  attendance_score: number; // 1 - 5
  discipline_score: number; // 1 - 5
  attitude_score: number; // 1 - 5
  competency_score: number; // 1 - 5
  communication_score: number; // 1 - 5
}

export interface MonitoringRecord extends MonitoringAspectScores {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student_id: string;
  student?: Student | null;
  teacher_id: string;
  teacher?: Teacher | null;
  dudi_id: string;
  dudi?: Dudi | null;
  monitoring_stage: number; // 1, 2, 3, etc.
  visit_date: string;
  overall_rating: MonitoringRating;
  student_condition?: string | null;
  industry_feedback?: string | null;
  obstacles?: string | null;
  recommendation?: string | null;
  documentation_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentMonitoringSummary {
  placement: PklPlacement;
  student: Student;
  dudi: Dudi;
  teacher: Teacher;
  completedStages: number[];
  records: MonitoringRecord[];
  targetStages: number;
  isFullyMonitored: boolean;
  lastVisitDate?: string | null;
  averageScore?: number | null;
}

export interface MonitoringFilter {
  teacherId?: string;
  studentId?: string;
  dudiId?: string;
  majorId?: string;
  stage?: number;
  periodId?: string;
  search?: string;
}

// 12. Penilaian PKL
export type EvaluatorType = 'industry' | 'teacher';
export type AssessmentStatus = 'draft' | 'submitted' | 'locked';
export type GradePredicate = 'A' | 'B' | 'C' | 'D';

export interface AssessmentCategory {
  id: string;
  evaluator_type: EvaluatorType;
  code: string;
  name: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentWeightConfig {
  id?: string;
  industry_weight: number;
  teacher_weight: number;
  passing_grade: number;
  is_assessment_open: boolean;
  updated_by?: string | null;
  updated_at?: string;
}

export interface AssessmentDetail {
  id: string;
  assessment_id: string;
  category_id: string;
  category?: AssessmentCategory | null;
  score: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentRecord {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student?: Student | null;
  dudi?: Dudi | null;
  teacher?: Teacher | null;
  industry_mentor?: IndustryMentor | null;

  industry_score?: number | null;
  industry_weight: number;
  industry_evaluated_by?: string | null;
  industry_evaluated_at?: string | null;
  industry_notes?: string | null;

  teacher_score?: number | null;
  teacher_weight: number;
  teacher_evaluated_by?: string | null;
  teacher_evaluated_at?: string | null;
  teacher_notes?: string | null;

  final_score?: number | null;
  predicate?: GradePredicate | null;

  status: AssessmentStatus;
  locked_at?: string | null;
  locked_by?: string | null;

  details?: AssessmentDetail[];

  created_at?: string;
  updated_at?: string;
}

export interface AssessmentFilter {
  teacherId?: string;
  dudiId?: string;
  majorId?: string;
  periodId?: string;
  status?: AssessmentStatus;
  predicate?: GradePredicate;
  search?: string;
}

// 13. Laporan PKL & Dokumen Administrasi
export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revision_required'
  | 'approved';

export interface ReportRevision {
  id: string;
  report_id: string;
  version: number;
  file_url: string;
  file_name: string;
  notes?: string | null;
  teacher_feedback?: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface PklReport {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student_id: string;
  student?: Student | null;
  title: string;
  abstract?: string | null;
  file_url: string;
  file_name: string;
  file_size_bytes?: number;
  version: number;
  status: ReportStatus;
  teacher_feedback?: string | null;
  reviewed_by?: string | null;
  reviewer_teacher?: Teacher | null;
  approved_at?: string | null;
  revisions?: ReportRevision[];
  created_at?: string;
  updated_at?: string;
}

export type DocumentType =
  | 'surat_pengantar'
  | 'surat_permohonan'
  | 'surat_tugas'
  | 'surat_penerimaan'
  | 'surat_monitoring'
  | 'surat_selesai';

export interface DocumentTemplate {
  id: string;
  code: string;
  title: string;
  type: DocumentType;
  template_body: string;
  header_title?: string;
  school_name?: string;
  is_active: boolean;
}

export interface GeneratedLetter {
  id: string;
  letter_number: string;
  template_type: DocumentType;
  title: string;
  placement_id?: string | null;
  student_id?: string | null;
  student?: Student | null;
  dudi_id?: string | null;
  dudi?: Dudi | null;
  dudi_name?: string;
  dudi_address?: string;
  mentor_name?: string;
  position?: string;
  teacher_id?: string | null;
  teacher?: Teacher | null;
  content_html: string;
  issued_date: string;
  signer_name: string;
  signer_nip?: string | null;
  signer_title: string;
  students_list?: Array<{
    name: string;
    nisn: string;
    ttl: string;
    major_name: string;
  }>;
  created_at?: string;
}

export type AdminRecapType =
  | 'students'
  | 'dudi'
  | 'placements'
  | 'teachers'
  | 'attendance'
  | 'journals'
  | 'monitoring'
  | 'grades';

// 14. Sertifikat PKL & Verifikasi QR
export type CertificateStatus = 'draft' | 'valid' | 'revoked';

export interface PklCertificate {
  id: string;
  placement_id: string;
  placement?: PklPlacement | null;
  student_id: string;
  student?: Student | null;
  certificate_number: string;
  serial_number: number;
  issue_year: number;
  issue_date: string;
  final_score: number;
  predicate: GradePredicate;
  principal_name: string;
  principal_nip?: string | null;
  principal_title: string;
  verification_code: string;
  qr_code_url?: string | null;
  pdf_url?: string | null;
  status: CertificateStatus;
  revoked_reason?: string | null;
  revoked_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CertificateEligibility {
  placement: PklPlacement;
  student: Student;
  dudi: Dudi;
  teacher: Teacher;
  isPklCompleted: boolean;
  isAssessmentCompleted: boolean;
  isReportApproved: boolean;
  isEligibleForCertificate: boolean;
  hasCertificate: boolean;
  certificate?: PklCertificate | null;
  finalScore?: number | null;
  predicate?: GradePredicate | null;
}

export interface CertificateFilter {
  majorId?: string;
  status?: CertificateStatus;
  year?: number;
  search?: string;
}

// 15. Notifikasi Internal & Pusat Pengumuman
export type NotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'journal'
  | 'attendance'
  | 'monitoring'
  | 'assessment'
  | 'report'
  | 'placement'
  | 'certificate'
  | 'announcement'
  | 'system';

export interface AppNotification {
  id: string;
  user_id?: string | null;
  role_target?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string; // 'all', 'siswa', 'guru_pembimbing', 'pembimbing_industri', 'admin_pkl', etc.
  target_major_id?: string | null;
  target_major?: Major | null;
  target_class_id?: string | null;
  target_class?: ClassItem | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  is_pinned: boolean;
  author_id?: string | null;
  author_name?: string | null;
  published_at: string;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementFilter {
  roleTarget?: string;
  majorId?: string;
  isPinned?: boolean;
  search?: string;
}





