import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JournalRecord, JournalStatus } from '../types';
import { masterService } from './masterService';
import { pklService } from './pklService';

const INITIAL_JOURNALS: JournalRecord[] = [
  {
    id: 'j-1',
    placement_id: 'p-1',
    student_id: 's-1',
    date: new Date().toISOString().split('T')[0],
    activity: 'Pemasangan kabel fiber optik (FTTH) drop core dan splicing core di Optical Distribution Point (ODP).',
    competency: 'Teknologi Jaringan Berbasis Luas (WAN) & Fiber Optik',
    duration_hours: 8,
    obstacles: 'Konektor core sempat kotor sehingga redaman daya optik mencapai -28dBm.',
    solution: 'Membersihkan ujung ferrule dengan alcohol swab 99% dan memotong ulang menggunakan precision cleaver sehingga redaman normal di -18dBm.',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=400&fit=crop',
    status: 'submitted',
    teacher_notes: null,
    verified_at: null,
    verified_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'j-2',
    placement_id: 'p-2',
    student_id: 's-2',
    date: new Date().toISOString().split('T')[0],
    activity: 'Konfigurasi VLAN trunking dan routing inter-VLAN pada switch manageable Cisco Catalyst.',
    competency: 'Administrasi Infrastruktur Jaringan (AIJ)',
    duration_hours: 7.5,
    obstacles: 'Terjadi looping paket broadcast pada port trunk switch access.',
    solution: 'Mengaktifkan fitur Spanning Tree Protocol (STP) Rapid PVST+ dan BPDU Guard.',
    photo_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
    status: 'verified',
    teacher_notes: 'Bagus sekali! Logbook lengkap dan solusi teknis sangat tepat.',
    verified_at: new Date().toISOString(),
    verified_by: 't-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'j-3',
    placement_id: 'p-3',
    student_id: 's-3',
    date: new Date().toISOString().split('T')[0],
    activity: 'Perawatan berkala sistem transmisi dan penggantian oli gear mesin bubut CNC.',
    competency: 'Teknik Pemesinan Bubut & CNC',
    duration_hours: 8,
    obstacles: 'Baut penutup filter oli slek.',
    solution: 'Menggunakan screw extractor dan mengganti dengan baut M8 grade 8.8 baru.',
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop',
    status: 'revision',
    teacher_notes: 'Tolong tambahkan foto dokumentasi saat proses penggantian baut filter.',
    verified_at: null,
    verified_by: 't-2',
    created_at: new Date().toISOString(),
  },
];

export const journalService = {
  async getJournals(filter?: {
    studentId?: string;
    teacherId?: string;
    status?: JournalStatus;
    date?: string;
  }): Promise<JournalRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('journals')
          .select(`
            *,
            placement:pkl_placements(*, dudi:dudi(*), teacher:teachers(*)),
            student:students(*, class:classes(*))
          `)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (filter?.studentId) query = query.eq('student_id', filter.studentId);
        if (filter?.status) query = query.eq('status', filter.status);
        if (filter?.date) query = query.eq('date', filter.date);

        const { data, error } = await query;
        if (!error && data) return data as JournalRecord[];
      } catch (err) {
        console.warn('Supabase getJournals fallback:', err);
      }
    }

    const [students, placements, teachers] = await Promise.all([
      masterService.getStudents(),
      pklService.getPlacements(),
      masterService.getTeachers(),
    ]);

    let list = [...INITIAL_JOURNALS];
    if (filter?.studentId) list = list.filter((j) => j.student_id === filter.studentId);
    if (filter?.status) list = list.filter((j) => j.status === filter.status);
    if (filter?.date) list = list.filter((j) => j.date === filter.date);

    return list.map((j) => ({
      ...j,
      student: students.find((s) => s.id === j.student_id) || null,
      placement: placements.find((p) => p.id === j.placement_id) || null,
      verifier_teacher: teachers.find((t) => t.id === j.verified_by) || null,
    }));
  },

  async createJournal(journal: Omit<JournalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<JournalRecord> {
    if (isSupabaseConfigured) {
      try {
        const payload = {
          placement_id: journal.placement_id,
          student_id: journal.student_id,
          date: journal.date,
          activity_title: journal.activity_title,
          activity_description: journal.activity_description,
          competency_type: journal.competency_type,
          photo_url: journal.photo_url || null,
          status: journal.status || 'submitted',
        };
        const { data, error } = await supabase.from('journals').insert(payload).select().single();
        if (!error && data) return data as JournalRecord;
        if (error) console.warn('Supabase createJournal error:', error.message);
      } catch (err) {
        console.warn('Supabase createJournal error:', err);
      }
    }

    const newRecord: JournalRecord = {
      id: `j-${Date.now()}`,
      ...journal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    INITIAL_JOURNALS.unshift(newRecord);
    return newRecord;
  },

  async updateJournal(id: string, journal: Partial<JournalRecord>): Promise<JournalRecord> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('journals')
          .update({ ...journal, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as JournalRecord;
      } catch (err) {
        console.warn('Supabase updateJournal error:', err);
      }
    }

    const idx = INITIAL_JOURNALS.findIndex((j) => j.id === id);
    if (idx !== -1) {
      INITIAL_JOURNALS[idx] = {
        ...INITIAL_JOURNALS[idx],
        ...journal,
        updated_at: new Date().toISOString(),
      };
      return INITIAL_JOURNALS[idx];
    }
    throw new Error('Jurnal tidak ditemukan.');
  },

  async submitJournal(id: string): Promise<JournalRecord> {
    return this.updateJournal(id, { status: 'submitted' });
  },

  async verifyJournal(id: string, teacherId: string, notes?: string): Promise<JournalRecord> {
    return this.updateJournal(id, {
      status: 'verified',
      teacher_notes: notes || 'Jurnal diverifikasi dan disetujui.',
      verified_by: teacherId,
      verified_at: new Date().toISOString(),
    });
  },

  async requestRevision(id: string, teacherId: string, revisionNotes: string): Promise<JournalRecord> {
    if (!revisionNotes) {
      throw new Error('Catatan revisi wajib diisi untuk memberikan instruksi perbaikan.');
    }
    return this.updateJournal(id, {
      status: 'revision',
      teacher_notes: revisionNotes,
      verified_by: teacherId,
      verified_at: null,
    });
  },

  async deleteJournal(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('journals').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteJournal error:', err);
      }
    }
    const idx = INITIAL_JOURNALS.findIndex((j) => j.id === id);
    if (idx !== -1) INITIAL_JOURNALS.splice(idx, 1);
  },

  async getJournalMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const journals = await this.getJournals();
    const students = await masterService.getStudents();
    const activeStudents = students.filter((s) => s.pkl_status === 'sedang_pkl');

    const todayJournals = journals.filter((j) => j.date === today);
    const pendingVerification = journals.filter((j) => j.status === 'submitted').length;
    const verifiedCount = journals.filter((j) => j.status === 'verified').length;
    const unfiledToday = Math.max(activeStudents.length - todayJournals.length, 0);

    return {
      todayCount: todayJournals.length,
      unfiledToday,
      pendingVerification,
      verifiedCount,
    };
  },
};
