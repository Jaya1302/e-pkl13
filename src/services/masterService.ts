import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Major, Teacher, ClassItem, Student, Dudi, IndustryMentor, UserRole } from '../types';

const USERS_STORAGE_KEY = 'epkl_user_accounts_v1';

// ============================================================================
// INITIAL SEED MOCK DATA (High fidelity fallback for preview & instant testing)
// ============================================================================
const INITIAL_MAJORS: Major[] = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'RPL', name: 'Rekayasa Perangkat Lunak', description: 'Pengembangan aplikasi web, mobile, database, dan cloud computing', is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', code: 'APL', name: 'Analisis Pengujian Laboratorium', description: 'Kimia analisis terpadu, instrumen laboratorium, dan uji mutu produk', is_active: true },
  { id: '33333333-3333-3333-3333-333333333333', code: 'TKJ', name: 'Teknik Komputer dan Jaringan', description: 'Infrastruktur jaringan komputer, fiber optik, server, dan cybersecurity', is_active: true },
  { id: '44444444-4444-4444-4444-444444444444', code: 'FI', name: 'Farmasi Industri', description: 'Formulasi sediaan obat, produksi farmasi skala industri, dan CPOB', is_active: true },
];

const INITIAL_TEACHERS: Teacher[] = [
  { id: 't-1', nip: '197505122005011002', name: 'Ahmad Fauzi, S.Kom', email: 'ahmad.fauzi@smkn13bdg.sch.id', phone_number: '081234567801', major_id: '11111111-1111-1111-1111-111111111111', is_active: true },
  { id: 't-2', nip: '198003152008011003', name: 'Dr. Budi Santoso, M.Si', email: 'budi.santoso@smkn13bdg.sch.id', phone_number: '081234567802', major_id: '22222222-2222-2222-2222-222222222222', is_active: true },
  { id: 't-3', nip: '198207192009022004', name: 'Dedi Kurniawan, S.T.', email: 'dedi.kurniawan@smkn13bdg.sch.id', phone_number: '081234567803', major_id: '33333333-3333-3333-3333-333333333333', is_active: true },
  { id: 't-4', nip: '198511202010012005', name: 'Siti Rahmawati, S.Farm., Apt.', email: 'siti.rahmawati@smkn13bdg.sch.id', phone_number: '081234567804', major_id: '44444444-4444-4444-4444-444444444444', is_active: true },
];

const INITIAL_CLASSES: ClassItem[] = [
  { id: 'c-1', name: 'XI RPL 1', level: 'XI', major_id: '11111111-1111-1111-1111-111111111111', homeroom_teacher_id: 't-1', academic_year: '2026/2027', is_active: true },
  { id: 'c-2', name: 'XI RPL 2', level: 'XI', major_id: '11111111-1111-1111-1111-111111111111', homeroom_teacher_id: 't-1', academic_year: '2026/2027', is_active: true },
  { id: 'c-3', name: 'XI APL 1', level: 'XI', major_id: '22222222-2222-2222-2222-222222222222', homeroom_teacher_id: 't-2', academic_year: '2026/2027', is_active: true },
  { id: 'c-4', name: 'XI TKJ 1', level: 'XI', major_id: '33333333-3333-3333-3333-333333333333', homeroom_teacher_id: 't-3', academic_year: '2026/2027', is_active: true },
  { id: 'c-5', name: 'XI FI 1', level: 'XI', major_id: '44444444-4444-4444-4444-444444444444', homeroom_teacher_id: 't-4', academic_year: '2026/2027', is_active: true },
];

const INITIAL_DUDI: Dudi[] = [
  { id: 'd-1', name: 'PT Telkom Indonesia (Witel Bandung)', sector: 'Teknologi Informasi & Jaringan', address: 'Jl. Lembong No. 11, Braga, Sumur Bandung', city: 'Bandung', contact_person: 'Hendri Gunawan', phone_number: '022-4521000', email: 'pkl.bandung@telkom.co.id', quota: 12, latitude: -6.9175, longitude: 107.6111, radius_meters: 150, is_active: true },
  { id: 'd-2', name: 'PT Bio Farma (Persero)', sector: 'Farmasi & Bioteknologi', address: 'Jl. Pasteur No. 28, Sukajadi', city: 'Bandung', contact_person: 'Dr. Bambang Sudarsono', phone_number: '022-2033755', email: 'hrd.internship@biofarma.co.id', quota: 10, latitude: -6.8992, longitude: 107.5986, radius_meters: 200, is_active: true },
  { id: 'd-3', name: 'PT LEN Industri (Persero)', sector: 'Elektronika & Sistem Kontrol', address: 'Jl. Soekarno-Hatta No. 442', city: 'Bandung', contact_person: 'Rahmat Hidayat', phone_number: '022-5202682', email: 'hrd@len.co.id', quota: 8, latitude: -6.9482, longitude: 107.6142, radius_meters: 150, is_active: true },
  { id: 'd-4', name: 'Balai Besar Standardisasi dan Pelayanan Jasa Industri Kimia', sector: 'Laboratorium & Uji Kimia', address: 'Jl. Sangkuriang No. 14, Coblong', city: 'Bandung', contact_person: 'Ir. Suherman', phone_number: '022-2503051', email: 'info@bbkkp.kemenperin.go.id', quota: 6, latitude: -6.8835, longitude: 107.6105, radius_meters: 100, is_active: true },
];

const INITIAL_MENTORS: IndustryMentor[] = [
  { id: 'm-1', dudi_id: 'd-1', name: 'Hendri Gunawan', position: 'Leader Software & Infrastructure', email: 'hendri.g@telkom.co.id', phone_number: '081299887766', is_active: true },
  { id: 'm-2', dudi_id: 'd-2', name: 'Dr. Bambang Sudarsono', position: 'Supervisor QC & R&D Laboratory', email: 'bambang.s@biofarma.co.id', phone_number: '081388990011', is_active: true },
  { id: 'm-3', dudi_id: 'd-3', name: 'Rahmat Hidayat', position: 'Hardware & System Engineer Lead', email: 'rahmat.h@len.co.id', phone_number: '081122334455', is_active: true },
];

const INITIAL_STUDENTS: Student[] = [
  { id: 's-1', nis: '222310001', nisn: '0061234567', name: 'Muhammad Rizky Pratama', gender: 'L', class_id: 'c-1', email: 'rizky.rpl1@smkn13bdg.sch.id', phone_number: '081234567890', address: 'Buahbatu, Bandung', pkl_status: 'sedang_pkl', is_eligible: true, is_active: true },
  { id: 's-2', nis: '222310002', nisn: '0061234568', name: 'Annisa Putri Rahmadani', gender: 'P', class_id: 'c-1', email: 'annisa.rpl1@smkn13bdg.sch.id', phone_number: '081234567891', address: 'Batununggal, Bandung', pkl_status: 'sedang_pkl', is_eligible: true, is_active: true },
  { id: 's-3', nis: '222310003', nisn: '0061234569', name: 'Dimas Aditya Nugraha', gender: 'L', class_id: 'c-3', email: 'dimas.apl1@smkn13bdg.sch.id', phone_number: '081234567892', address: 'Kiaracondong, Bandung', pkl_status: 'sedang_pkl', is_eligible: true, is_active: true },
  { id: 's-4', nis: '222310004', nisn: '0061234570', name: 'Faisal Akbar Maulana', gender: 'L', class_id: 'c-4', email: 'faisal.tkj1@smkn13bdg.sch.id', phone_number: '081234567893', address: 'Antapani, Bandung', pkl_status: 'belum_ditempatkan', is_eligible: true, is_active: true },
  { id: 's-5', nis: '222310005', nisn: '0061234571', name: 'Siti Nurhaliza', gender: 'P', class_id: 'c-5', email: 'siti.fi1@smkn13bdg.sch.id', phone_number: '081234567894', address: 'Lengkong, Bandung', pkl_status: 'sedang_pkl', is_eligible: true, is_active: true },
];

export const masterService = {
  // ==========================================================================
  // JURUSAN (MAJORS)
  // ==========================================================================
  async getMajors(): Promise<Major[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('majors').select('*').order('code');
        if (!error && data) return data as Major[];
      } catch (err) {
        console.warn('Supabase fetch majors fallback:', err);
      }
    }
    return INITIAL_MAJORS;
  },

  async createMajor(major: Omit<Major, 'id'>): Promise<Major> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('majors').insert(major).select().single();
        if (!error && data) return data as Major;
      } catch (err) {
        console.warn('Supabase create major fallback:', err);
      }
    }
    const newMajor = { id: `m-${Date.now()}`, ...major };
    INITIAL_MAJORS.push(newMajor);
    return newMajor;
  },

  async updateMajor(id: string, major: Partial<Major>): Promise<Major> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('majors').update(major).eq('id', id).select().single();
        if (!error && data) return data as Major;
      } catch (err) {
        console.warn('Supabase update major fallback:', err);
      }
    }
    const idx = INITIAL_MAJORS.findIndex((m) => m.id === id);
    if (idx !== -1) {
      INITIAL_MAJORS[idx] = { ...INITIAL_MAJORS[idx], ...major };
      return INITIAL_MAJORS[idx];
    }
    throw new Error('Jurusan tidak ditemukan');
  },

  async deleteMajor(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('majors').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete major fallback:', err);
      }
    }
    const idx = INITIAL_MAJORS.findIndex((m) => m.id === id);
    if (idx !== -1) INITIAL_MAJORS.splice(idx, 1);
  },

  // ==========================================================================
  // GURU (TEACHERS)
  // ==========================================================================
  async getTeachers(): Promise<Teacher[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*, major:majors(*)')
          .order('name');
        if (!error && data) return data as Teacher[];
      } catch (err) {
        console.warn('Supabase fetch teachers fallback:', err);
      }
    }
    return INITIAL_TEACHERS.map((t) => ({
      ...t,
      major: INITIAL_MAJORS.find((m) => m.id === t.major_id) || null,
    }));
  },

  /**
   * Helper to ensure a profile / user account exists in local user management cache
   */
  async ensureUserProfile(
    email: string,
    name: string,
    role: UserRole,
    phone?: string | null
  ): Promise<void> {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();

    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      const localUsers = saved ? JSON.parse(saved) : [];
      if (!localUsers.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
        localUsers.unshift({
          id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          email: cleanEmail,
          role: role,
          phone_number: phone?.trim() || null,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(localUsers));
      }
    } catch {}
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const defaultEmail =
      teacher.email ||
      `${teacher.nip || teacher.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@smkn13bdg.sch.id`;

    // Auto-create user account for teacher
    this.ensureUserProfile(defaultEmail, teacher.name, 'guru_pembimbing', teacher.phone_number);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .insert({ ...teacher, email: defaultEmail })
          .select('*, major:majors(*)')
          .single();
        if (!error && data) return data as Teacher;
      } catch (err) {
        console.warn('Supabase create teacher fallback:', err);
      }
    }
    const newTeacher = { id: `t-${Date.now()}`, ...teacher, email: defaultEmail };
    INITIAL_TEACHERS.push(newTeacher);
    return {
      ...newTeacher,
      major: INITIAL_MAJORS.find((m) => m.id === newTeacher.major_id) || null,
    };
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('teachers').update(teacher).eq('id', id).select('*, major:majors(*)').single();
        if (!error && data) return data as Teacher;
      } catch (err) {
        console.warn('Supabase update teacher fallback:', err);
      }
    }
    const idx = INITIAL_TEACHERS.findIndex((t) => t.id === id);
    if (idx !== -1) {
      INITIAL_TEACHERS[idx] = { ...INITIAL_TEACHERS[idx], ...teacher };
      return {
        ...INITIAL_TEACHERS[idx],
        major: INITIAL_MAJORS.find((m) => m.id === INITIAL_TEACHERS[idx].major_id) || null,
      };
    }
    throw new Error('Guru tidak ditemukan');
  },

  async deleteTeacher(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('teachers').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete teacher fallback:', err);
      }
    }
    const idx = INITIAL_TEACHERS.findIndex((t) => t.id === id);
    if (idx !== -1) INITIAL_TEACHERS.splice(idx, 1);
  },

  // ==========================================================================
  // KELAS (CLASSES)
  // ==========================================================================
  async getClasses(): Promise<ClassItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*, major:majors(*), homeroom_teacher:teachers(*)')
          .order('name');
        if (!error && data) return data as ClassItem[];
      } catch (err) {
        console.warn('Supabase fetch classes fallback:', err);
      }
    }
    return INITIAL_CLASSES.map((c) => ({
      ...c,
      major: INITIAL_MAJORS.find((m) => m.id === c.major_id) || null,
      homeroom_teacher: INITIAL_TEACHERS.find((t) => t.id === c.homeroom_teacher_id) || null,
    }));
  },

  async createClass(cls: Omit<ClassItem, 'id'>): Promise<ClassItem> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .insert(cls)
          .select('*, major:majors(*), homeroom_teacher:teachers(*)')
          .single();
        if (!error && data) return data as ClassItem;
      } catch (err) {
        console.warn('Supabase create class fallback:', err);
      }
    }
    const newClass = { id: `c-${Date.now()}`, ...cls };
    INITIAL_CLASSES.push(newClass);
    return {
      ...newClass,
      major: INITIAL_MAJORS.find((m) => m.id === newClass.major_id) || null,
      homeroom_teacher: INITIAL_TEACHERS.find((t) => t.id === newClass.homeroom_teacher_id) || null,
    };
  },

  async updateClass(id: string, cls: Partial<ClassItem>): Promise<ClassItem> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .update(cls)
          .eq('id', id)
          .select('*, major:majors(*), homeroom_teacher:teachers(*)')
          .single();
        if (!error && data) return data as ClassItem;
      } catch (err) {
        console.warn('Supabase update class fallback:', err);
      }
    }
    const idx = INITIAL_CLASSES.findIndex((c) => c.id === id);
    if (idx !== -1) {
      INITIAL_CLASSES[idx] = { ...INITIAL_CLASSES[idx], ...cls };
      return {
        ...INITIAL_CLASSES[idx],
        major: INITIAL_MAJORS.find((m) => m.id === INITIAL_CLASSES[idx].major_id) || null,
        homeroom_teacher: INITIAL_TEACHERS.find((t) => t.id === INITIAL_CLASSES[idx].homeroom_teacher_id) || null,
      };
    }
    throw new Error('Kelas tidak ditemukan');
  },

  async deleteClass(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('classes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete class fallback:', err);
      }
    }
    const idx = INITIAL_CLASSES.findIndex((c) => c.id === id);
    if (idx !== -1) INITIAL_CLASSES.splice(idx, 1);
  },

  // ==========================================================================
  // DUDI & MITRA INDUSTRI
  // ==========================================================================
  async getDudi(): Promise<Dudi[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dudi').select('*').order('name');
        if (!error && data) return data as Dudi[];
      } catch (err) {
        console.warn('Supabase fetch dudi fallback:', err);
      }
    }
    return INITIAL_DUDI;
  },

  async createDudi(dudi: Omit<Dudi, 'id'>): Promise<Dudi> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dudi').insert(dudi).select().single();
        if (!error && data) return data as Dudi;
      } catch (err) {
        console.warn('Supabase create dudi fallback:', err);
      }
    }
    const newDudi = { id: `d-${Date.now()}`, ...dudi };
    INITIAL_DUDI.push(newDudi);
    return newDudi;
  },

  async updateDudi(id: string, dudi: Partial<Dudi>): Promise<Dudi> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dudi').update(dudi).eq('id', id).select().single();
        if (!error && data) return data as Dudi;
      } catch (err) {
        console.warn('Supabase update dudi fallback:', err);
      }
    }
    const idx = INITIAL_DUDI.findIndex((d) => d.id === id);
    if (idx !== -1) {
      INITIAL_DUDI[idx] = { ...INITIAL_DUDI[idx], ...dudi };
      return INITIAL_DUDI[idx];
    }
    throw new Error('DUDI tidak ditemukan');
  },

  async deleteDudi(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('dudi').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete dudi fallback:', err);
      }
    }
    const idx = INITIAL_DUDI.findIndex((d) => d.id === id);
    if (idx !== -1) INITIAL_DUDI.splice(idx, 1);
  },

  // ==========================================================================
  // PEMBIMBING INDUSTRI (MENTORS)
  // ==========================================================================
  async getMentors(): Promise<IndustryMentor[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('industry_mentors')
          .select('*, dudi:dudi(*)')
          .order('name');
        if (!error && data) return data as IndustryMentor[];
      } catch (err) {
        console.warn('Supabase fetch mentors fallback:', err);
      }
    }
    return INITIAL_MENTORS.map((m) => ({
      ...m,
      dudi: INITIAL_DUDI.find((d) => d.id === m.dudi_id) || null,
    }));
  },

  async createMentor(mentor: Omit<IndustryMentor, 'id'>): Promise<IndustryMentor> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('industry_mentors')
          .insert(mentor)
          .select('*, dudi:dudi(*)')
          .single();
        if (!error && data) return data as IndustryMentor;
      } catch (err) {
        console.warn('Supabase create mentor fallback:', err);
      }
    }
    const newMentor = { id: `m-${Date.now()}`, ...mentor };
    INITIAL_MENTORS.push(newMentor);
    return {
      ...newMentor,
      dudi: INITIAL_DUDI.find((d) => d.id === newMentor.dudi_id) || null,
    };
  },

  async updateMentor(id: string, mentor: Partial<IndustryMentor>): Promise<IndustryMentor> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('industry_mentors')
          .update(mentor)
          .eq('id', id)
          .select('*, dudi:dudi(*)')
          .single();
        if (!error && data) return data as IndustryMentor;
      } catch (err) {
        console.warn('Supabase update mentor fallback:', err);
      }
    }
    const idx = INITIAL_MENTORS.findIndex((m) => m.id === id);
    if (idx !== -1) {
      INITIAL_MENTORS[idx] = { ...INITIAL_MENTORS[idx], ...mentor };
      return {
        ...INITIAL_MENTORS[idx],
        dudi: INITIAL_DUDI.find((d) => d.id === INITIAL_MENTORS[idx].dudi_id) || null,
      };
    }
    throw new Error('Pembimbing industri tidak ditemukan');
  },

  async deleteMentor(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('industry_mentors').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete mentor fallback:', err);
      }
    }
    const idx = INITIAL_MENTORS.findIndex((m) => m.id === id);
    if (idx !== -1) INITIAL_MENTORS.splice(idx, 1);
  },

  // ==========================================================================
  // SISWA (STUDENTS)
  // ==========================================================================
  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*, class:classes(*, major:majors(*))')
          .order('name');
        if (!error && data) return data as Student[];
      } catch (err) {
        console.warn('Supabase fetch students fallback:', err);
      }
    }
    return INITIAL_STUDENTS.map((s) => {
      const cls = INITIAL_CLASSES.find((c) => c.id === s.class_id);
      return {
        ...s,
        class: cls
          ? {
              ...cls,
              major: INITIAL_MAJORS.find((m) => m.id === cls.major_id) || null,
            }
          : null,
      };
    });
  },

  async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    const defaultEmail =
      student.email ||
      `${student.nis || student.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@siswa.smkn13bdg.sch.id`;

    // Auto-create user account for student
    this.ensureUserProfile(defaultEmail, student.name, 'siswa', student.phone_number);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert({ ...student, email: defaultEmail })
          .select('*, class:classes(*, major:majors(*))')
          .single();
        if (!error && data) return data as Student;
      } catch (err) {
        console.warn('Supabase create student fallback:', err);
      }
    }
    const newStudent = { id: `s-${Date.now()}`, ...student, email: defaultEmail };
    INITIAL_STUDENTS.push(newStudent);
    const cls = INITIAL_CLASSES.find((c) => c.id === newStudent.class_id);
    return {
      ...newStudent,
      class: cls
        ? {
            ...cls,
            major: INITIAL_MAJORS.find((m) => m.id === cls.major_id) || null,
          }
        : null,
    };
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update(student)
          .eq('id', id)
          .select('*, class:classes(*, major:majors(*))')
          .single();
        if (!error && data) return data as Student;
      } catch (err) {
        console.warn('Supabase update student fallback:', err);
      }
    }
    const idx = INITIAL_STUDENTS.findIndex((s) => s.id === id);
    if (idx !== -1) {
      INITIAL_STUDENTS[idx] = { ...INITIAL_STUDENTS[idx], ...student };
      const cls = INITIAL_CLASSES.find((c) => c.id === INITIAL_STUDENTS[idx].class_id);
      return {
        ...INITIAL_STUDENTS[idx],
        class: cls
          ? {
              ...cls,
              major: INITIAL_MAJORS.find((m) => m.id === cls.major_id) || null,
            }
          : null,
      };
    }
    throw new Error('Siswa tidak ditemukan');
  },

  async deleteStudent(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete student fallback:', err);
      }
    }
    const idx = INITIAL_STUDENTS.findIndex((s) => s.id === id);
    if (idx !== -1) INITIAL_STUDENTS.splice(idx, 1);
  },

  async batchInsertStudents(
    students: (Omit<Student, 'id'> & {
      dudi_name?: string | null;
      dudi_address?: string | null;
      start_date?: string | null;
      end_date?: string | null;
    })[]
  ): Promise<{ count: number; errors?: string[] }> {
    if (!students || students.length === 0) return { count: 0 };

    const formatted = students.map((s) => {
      const email =
        s.email || `${s.nis || s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@siswa.smkn13bdg.sch.id`;
      this.ensureUserProfile(email, s.name, 'siswa', s.phone_number);
      return { ...s, email };
    });

    let insertedStudents: any[] = [];
    const errorMessages: string[] = [];

    if (isSupabaseConfigured) {
      for (const item of formatted) {
        const studentPayload = {
          nis: item.nis,
          nisn: item.nisn,
          name: item.name,
          gender: item.gender,
          class_id: item.class_id,
          email: item.email,
          phone_number: item.phone_number || null,
          address: item.address || null,
          pkl_status: item.dudi_name ? 'sedang_pkl' : (item.pkl_status || 'belum_ditempatkan'),
          is_eligible: item.is_eligible ?? true,
          is_active: item.is_active ?? true,
        };

        try {
          // Check if student already exists by NIS
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('nis', item.nis)
            .maybeSingle();

          let savedStudent: any = null;

          if (existingStudent?.id) {
            const { data: updated, error: updateErr } = await supabase
              .from('students')
              .update(studentPayload)
              .eq('id', existingStudent.id)
              .select('*, class:classes(*)')
              .single();
            if (updateErr) throw updateErr;
            savedStudent = updated;
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('students')
              .insert(studentPayload)
              .select('*, class:classes(*)')
              .single();
            if (insertErr) throw insertErr;
            savedStudent = inserted;
          }

          if (savedStudent) {
            insertedStudents.push(savedStudent);

            // Handle Placement & DUDI if dudi_name is present
            if (item.dudi_name) {
              const dudiNameClean = item.dudi_name.trim();
              let targetDudiId: string | null = null;

              // 1. Resolve or Create DUDI in Supabase
              try {
                const { data: existingDudi } = await supabase
                  .from('dudi')
                  .select('id')
                  .ilike('name', dudiNameClean)
                  .maybeSingle();

                if (existingDudi?.id) {
                  targetDudiId = existingDudi.id;
                } else {
                  const { data: newDudi, error: dudiErr } = await supabase
                    .from('dudi')
                    .insert([
                      {
                        name: dudiNameClean,
                        sector: 'Umum & Mitra Industri',
                        address: item.dudi_address?.trim() || 'Karawang',
                        city: 'Karawang',
                        contact_person: 'Pimpinan Perusahaan',
                        quota: 20,
                        radius_meters: 150,
                        is_active: true,
                      },
                    ])
                    .select('id')
                    .single();

                  if (!dudiErr && newDudi?.id) {
                    targetDudiId = newDudi.id;
                  } else if (dudiErr) {
                    console.warn('Gagal insert DUDI baru di Supabase:', dudiErr);
                  }
                }
              } catch (dErr) {
                console.warn('Exception resolve DUDI:', dErr);
              }

              // 2. Resolve Active Period in Supabase
              let activePeriodId: string | null = null;
              try {
                const { data: activePer } = await supabase
                  .from('pkl_periods')
                  .select('id')
                  .eq('is_active', true)
                  .maybeSingle();

                if (activePer?.id) {
                  activePeriodId = activePer.id;
                } else {
                  const { data: anyPer } = await supabase
                    .from('pkl_periods')
                    .select('id')
                    .limit(1)
                    .maybeSingle();
                  if (anyPer?.id) {
                    activePeriodId = anyPer.id;
                  } else {
                    const { data: createdPer } = await supabase
                      .from('pkl_periods')
                      .insert([
                        {
                          name: 'Gelombang 1 — Ganjil 2026/2027',
                          academic_year: '2026/2027',
                          start_date: '2026-07-15',
                          end_date: '2026-10-15',
                          is_active: true,
                          description: 'Pelaksanaan Praktik Kerja Lapangan 3 Bulan Gelombang Pertama',
                        },
                      ])
                      .select('id')
                      .single();
                    if (createdPer?.id) activePeriodId = createdPer.id;
                  }
                }
              } catch (pErr) {
                console.warn('Exception resolve Period:', pErr);
              }

              // 3. Resolve Teacher in Supabase
              let teacherId: string | null = null;
              try {
                if (item.class_id) {
                  const { data: clsData } = await supabase
                    .from('classes')
                    .select('homeroom_teacher_id')
                    .eq('id', item.class_id)
                    .maybeSingle();
                  if (clsData?.homeroom_teacher_id) {
                    teacherId = clsData.homeroom_teacher_id;
                  }
                }

                if (!teacherId) {
                  const { data: anyTeacher } = await supabase
                    .from('teachers')
                    .select('id')
                    .limit(1)
                    .maybeSingle();
                  if (anyTeacher?.id) {
                    teacherId = anyTeacher.id;
                  } else {
                    const { data: createdTeacher } = await supabase
                      .from('teachers')
                      .insert([
                        {
                          nip: '198507122010011002',
                          name: 'Gina Mardiana, S.Kom (Guru Pembimbing)',
                          email: 'ginam@smkn13bdg.sch.id',
                          phone_number: '081234567894',
                          is_active: true,
                        },
                      ])
                      .select('id')
                      .single();
                    if (createdTeacher?.id) teacherId = createdTeacher.id;
                  }
                }
              } catch (tErr) {
                console.warn('Exception resolve Teacher:', tErr);
              }

              // 4. Create or Update Placement in Supabase
              if (activePeriodId && targetDudiId && teacherId) {
                const startDate = item.start_date || '2026-07-15';
                const endDate = item.end_date || '2026-10-15';

                try {
                  const { data: existingPlace } = await supabase
                    .from('pkl_placements')
                    .select('id')
                    .eq('student_id', savedStudent.id)
                    .maybeSingle();

                  if (existingPlace?.id) {
                    let { error: updErr } = await supabase
                      .from('pkl_placements')
                      .update({
                        period_id: activePeriodId,
                        dudi_id: targetDudiId,
                        teacher_id: teacherId,
                        start_date: startDate,
                        end_date: endDate,
                        division: 'Praktik Industri',
                        status: 'aktif',
                        notes: 'Penempatan otomatis dari Impor Data Siswa Excel',
                      })
                      .eq('id', existingPlace.id);

                    if (updErr && updErr.message?.includes('division')) {
                      await supabase
                        .from('pkl_placements')
                        .update({
                          period_id: activePeriodId,
                          dudi_id: targetDudiId,
                          teacher_id: teacherId,
                          start_date: startDate,
                          end_date: endDate,
                          status: 'aktif',
                          notes: 'Penempatan otomatis dari Impor Data Siswa Excel',
                        })
                        .eq('id', existingPlace.id);
                    }
                  } else {
                    let { error: insErr } = await supabase.from('pkl_placements').insert([
                      {
                        period_id: activePeriodId,
                        student_id: savedStudent.id,
                        dudi_id: targetDudiId,
                        teacher_id: teacherId,
                        start_date: startDate,
                        end_date: endDate,
                        division: 'Praktik Industri',
                        status: 'aktif',
                        notes: 'Penempatan otomatis dari Impor Data Siswa Excel',
                      },
                    ]);

                    if (insErr && insErr.message?.includes('division')) {
                      const { error: insRetry } = await supabase.from('pkl_placements').insert([
                        {
                          period_id: activePeriodId,
                          student_id: savedStudent.id,
                          dudi_id: targetDudiId,
                          teacher_id: teacherId,
                          start_date: startDate,
                          end_date: endDate,
                          status: 'aktif',
                          notes: 'Penempatan otomatis dari Impor Data Siswa Excel',
                        },
                      ]);
                      if (insRetry) throw insRetry;
                    } else if (insErr) {
                      throw insErr;
                    }
                  }

                  await supabase.from('students').update({ pkl_status: 'sedang_pkl' }).eq('id', savedStudent.id);
                } catch (placeErr: any) {
                  console.error('Gagal simpan pkl_placements:', placeErr);
                  errorMessages.push(`Penempatan ${item.name}: ${placeErr.message || 'Gagal menyimpan penempatan'}`);
                }
              } else {
                console.warn('Placement skipped: missing references:', { activePeriodId, targetDudiId, teacherId });
              }
            }
          }
        } catch (rowErr: any) {
          console.error(`Gagal mengimpor siswa ${item.name} (${item.nis}):`, rowErr);
          errorMessages.push(`${item.name} (${item.nis}): ${rowErr.message || 'Gagal menyimpan ke database'}`);
        }
      }

      if (insertedStudents.length > 0) {
        return {
          count: insertedStudents.length,
          errors: errorMessages.length > 0 ? errorMessages : undefined,
        };
      } else if (errorMessages.length > 0) {
        throw new Error(errorMessages[0]);
      }
    }

    // Fallback in-memory
    formatted.forEach((s) => {
      const existingIdx = INITIAL_STUDENTS.findIndex((st) => st.nis === s.nis);
      const studentObj: Student = {
        id: existingIdx !== -1 ? INITIAL_STUDENTS[existingIdx].id : `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nis: s.nis,
        nisn: s.nisn,
        name: s.name,
        gender: s.gender,
        class_id: s.class_id,
        email: s.email,
        phone_number: s.phone_number || null,
        address: s.address || null,
        pkl_status: s.dudi_name ? 'sedang_pkl' : (s.pkl_status || 'belum_ditempatkan'),
        is_eligible: s.is_eligible ?? true,
        is_active: s.is_active ?? true,
      };

      if (existingIdx !== -1) {
        INITIAL_STUDENTS[existingIdx] = studentObj;
      } else {
        INITIAL_STUDENTS.push(studentObj);
      }
      insertedStudents.push(studentObj);
    });

    return { count: insertedStudents.length };
  },

  async batchInsertTeachers(teachers: Omit<Teacher, 'id'>[]): Promise<{ count: number }> {
    const formatted = teachers.map((t) => {
      const email =
        t.email || `${t.nip || t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@smkn13bdg.sch.id`;
      // Auto-create user account for each imported teacher
      this.ensureUserProfile(email, t.name, 'guru_pembimbing', t.phone_number);
      return { ...t, email };
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('teachers').insert(formatted).select();
        if (!error && data) return { count: data.length };
      } catch (err) {
        console.warn('Supabase batch insert teachers fallback:', err);
      }
    }
    formatted.forEach((t) => {
      INITIAL_TEACHERS.push({ id: `t-${Date.now()}-${Math.random()}`, ...t });
    });
    return { count: formatted.length };
  },

  async batchInsertClasses(classes: Omit<ClassItem, 'id'>[]): Promise<{ count: number }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('classes').insert(classes).select();
        if (!error && data) return { count: data.length };
      } catch (err) {
        console.warn('Supabase batch insert classes fallback:', err);
      }
    }
    classes.forEach((c) => {
      INITIAL_CLASSES.push({ id: `c-${Date.now()}-${Math.random()}`, ...c });
    });
    return { count: classes.length };
  },

  async batchInsertDudi(dudiList: Omit<Dudi, 'id'>[]): Promise<{ count: number }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dudi').insert(dudiList).select();
        if (!error && data) return { count: data.length };
      } catch (err) {
        console.warn('Supabase batch insert dudi fallback:', err);
      }
    }
    dudiList.forEach((d) => {
      INITIAL_DUDI.push({ id: `d-${Date.now()}-${Math.random()}`, ...d });
    });
    return { count: dudiList.length };
  },
};
