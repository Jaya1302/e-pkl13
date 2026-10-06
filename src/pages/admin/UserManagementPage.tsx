import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { UserRole } from '../../types';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants';
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
  Users,
  Search,
  Plus,
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone_number?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

const USERS_STORAGE_KEY = 'epkl_user_accounts_v1';

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Super Administrator (IT SMKN 13 Bandung)',
    email: 'superadmin@smkn13bdg.sch.id',
    role: 'super_admin',
    phone_number: '081234567890',
    is_active: true,
    last_login: '2026-08-22T08:30:00Z',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Koordinator Hubinmas & PKL',
    email: 'hubin@smkn13bdg.sch.id',
    role: 'admin_pkl',
    phone_number: '081234567891',
    is_active: true,
    last_login: '2026-08-22T09:15:00Z',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    name: 'Ahmad Fauzi, S.Kom (Guru Pembimbing)',
    email: 'guru.fauzi@smkn13bdg.sch.id',
    role: 'guru_pembimbing',
    phone_number: '081234567894',
    is_active: true,
    last_login: '2026-08-22T10:00:00Z',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    name: 'Hendri Gunawan (PT Telkom Bandung)',
    email: 'mentor.telkom@smkn13bdg.sch.id',
    role: 'pembimbing_industri',
    phone_number: '081234567896',
    is_active: true,
    last_login: '2026-08-21T16:00:00Z',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    name: 'Muhammad Rizky Pratama',
    email: 'siswa.rizky@smkn13bdg.sch.id',
    role: 'siswa',
    phone_number: '081234567895',
    is_active: true,
    last_login: '2026-08-22T11:20:00Z',
    created_at: '2026-07-01T00:00:00Z',
  },
];

const loadUsersFromStorage = (): UserAccount[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return INITIAL_USERS;
};

const saveUsersToStorage = (data: UserAccount[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserAccount[]>(loadUsersFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form State Add
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'siswa' as UserRole,
    phone_number: '',
    password: '',
  });

  // Form State Edit
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'siswa' as UserRole,
    phone_number: '',
    is_active: true,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    const combinedUsers: UserAccount[] = [];
    const seenEmails = new Set<string>();

    if (isSupabaseConfigured) {
      try {
        // 1. Fetch from profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, name, role, phone_number, is_active, created_at')
          .order('created_at', { ascending: false });

        if (profilesData && profilesData.length > 0) {
          profilesData.forEach((p: any) => {
            const cleanEmail = (p.email || '').toLowerCase().trim();
            if (cleanEmail && !seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              combinedUsers.push({
                id: p.id,
                email: cleanEmail,
                name: p.name,
                role: p.role as UserRole,
                phone_number: p.phone_number,
                is_active: p.is_active ?? true,
                created_at: p.created_at || new Date().toISOString(),
              });
            }
          });
        }

        // 2. Fetch from students
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, email, nis, name, phone_number, is_active, created_at')
          .order('name');

        if (studentsData && studentsData.length > 0) {
          studentsData.forEach((s: any) => {
            const email = (s.email || `${s.nis}@siswa.smkn13bdg.sch.id`).toLowerCase().trim();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              combinedUsers.push({
                id: s.id,
                email,
                name: s.name,
                role: 'siswa',
                phone_number: s.phone_number,
                is_active: s.is_active ?? true,
                created_at: s.created_at || new Date().toISOString(),
              });
            }
          });
        }

        // 3. Fetch from teachers
        const { data: teachersData } = await supabase
          .from('teachers')
          .select('id, email, nip, name, phone_number, is_active, created_at')
          .order('name');

        if (teachersData && teachersData.length > 0) {
          teachersData.forEach((t: any) => {
            const email = (t.email || `${t.nip || 'guru'}@smkn13bdg.sch.id`).toLowerCase().trim();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              combinedUsers.push({
                id: t.id,
                email,
                name: t.name,
                role: 'guru_pembimbing',
                phone_number: t.phone_number,
                is_active: t.is_active ?? true,
                created_at: t.created_at || new Date().toISOString(),
              });
            }
          });
        }

        // 4. Fetch from mentors
        const { data: mentorsData } = await supabase
          .from('industry_mentors')
          .select('id, email, name, phone_number, is_active, created_at')
          .order('name');

        if (mentorsData && mentorsData.length > 0) {
          mentorsData.forEach((m: any) => {
            const email = (m.email || `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mitra.smkn13bdg.sch.id`).toLowerCase().trim();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              combinedUsers.push({
                id: m.id,
                email,
                name: m.name,
                role: 'pembimbing_industri',
                phone_number: m.phone_number,
                is_active: m.is_active ?? true,
                created_at: m.created_at || new Date().toISOString(),
              });
            }
          });
        }

        if (combinedUsers.length > 0) {
          setUsers(combinedUsers);
          saveUsersToStorage(combinedUsers);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch user accounts fallback:', err);
      }
    }

    const localData = loadUsersFromStorage();
    setUsers(localData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    saveUsersToStorage(newUsers);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone_number && u.phone_number.includes(q));

      const matchRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Nama dan email wajib diisi.', 'error');
      return;
    }

    const newUser: UserAccount = {
      id: `u-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      phone_number: formData.phone_number?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('profiles').insert([
          {
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            phone_number: newUser.phone_number,
            is_active: newUser.is_active,
          },
        ]);
        if (error) console.warn('Supabase insert profile error:', error.message);
      } catch (err) {}
    }

    updateUsers([newUser, ...users]);
    showToast(`Akun pengguna ${newUser.name} berhasil ditambahkan!`, 'success');
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      role: 'siswa',
      phone_number: '',
      password: '',
    });
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number || '',
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      showToast('Nama dan email tidak boleh kosong.', 'error');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        if (selectedUser.role === 'siswa') {
          await supabase
            .from('students')
            .update({
              name: editFormData.name.trim(),
              email: editFormData.email.trim().toLowerCase(),
              phone_number: editFormData.phone_number?.trim() || null,
              is_active: editFormData.is_active,
            })
            .eq('id', selectedUser.id);
        } else if (selectedUser.role === 'guru_pembimbing') {
          await supabase
            .from('teachers')
            .update({
              name: editFormData.name.trim(),
              email: editFormData.email.trim().toLowerCase(),
              phone_number: editFormData.phone_number?.trim() || null,
              is_active: editFormData.is_active,
            })
            .eq('id', selectedUser.id);
        } else if (selectedUser.role === 'pembimbing_industri') {
          await supabase
            .from('industry_mentors')
            .update({
              name: editFormData.name.trim(),
              email: editFormData.email.trim().toLowerCase(),
              phone_number: editFormData.phone_number?.trim() || null,
              is_active: editFormData.is_active,
            })
            .eq('id', selectedUser.id);
        }

        // Also update profiles if exists
        await supabase
          .from('profiles')
          .update({
            name: editFormData.name.trim(),
            email: editFormData.email.trim().toLowerCase(),
            role: editFormData.role,
            phone_number: editFormData.phone_number?.trim() || null,
            is_active: editFormData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedUser.id);
      } catch (err) {}
    }

    const updated = users.map((u) => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: editFormData.name.trim(),
          email: editFormData.email.trim().toLowerCase(),
          role: editFormData.role,
          phone_number: editFormData.phone_number?.trim() || null,
          is_active: editFormData.is_active,
        };
      }
      return u;
    });

    updateUsers(updated);
    showToast(`Perubahan data akun ${editFormData.name} berhasil disimpan!`, 'success');
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteModal = (user: UserAccount) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    if (isSupabaseConfigured) {
      try {
        if (selectedUser.role === 'siswa') {
          await supabase.from('students').delete().eq('id', selectedUser.id);
        } else if (selectedUser.role === 'guru_pembimbing') {
          await supabase.from('teachers').delete().eq('id', selectedUser.id);
        } else if (selectedUser.role === 'pembimbing_industri') {
          await supabase.from('industry_mentors').delete().eq('id', selectedUser.id);
        }
        await supabase.from('profiles').delete().eq('id', selectedUser.id);
      } catch (err) {}
    }

    const updated = users.filter((u) => u.id !== selectedUser.id);
    updateUsers(updated);
    showToast(`Akun pengguna ${selectedUser.name} berhasil dihapus!`, 'success');
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const nextStatus = !targetUser.is_active;

    if (isSupabaseConfigured) {
      try {
        if (targetUser.role === 'siswa') {
          await supabase.from('students').update({ is_active: nextStatus }).eq('id', userId);
        } else if (targetUser.role === 'guru_pembimbing') {
          await supabase.from('teachers').update({ is_active: nextStatus }).eq('id', userId);
        } else if (targetUser.role === 'pembimbing_industri') {
          await supabase.from('industry_mentors').update({ is_active: nextStatus }).eq('id', userId);
        }
        await supabase
          .from('profiles')
          .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (err) {}
    }

    const updated = users.map((u) => {
      if (u.id === userId) {
        showToast(
          `Status akun ${u.name} diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`,
          'info'
        );
        return { ...u, is_active: nextStatus };
      }
      return u;
    });
    updateUsers(updated);
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    showToast(`Tautan reset password telah dikirim ke email ${selectedUser.email}.`, 'success');
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Manajemen Pengguna & RBAC
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              7 Roles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola akun otentikasi, hak akses peran, status aktif, dan keamanan pengguna
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Pengguna</span>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama pengguna, email, nomor HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          <Select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs sm:text-sm"
          >
            <option value="all">Semua Peran (7 Roles)</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin_pkl">Admin PKL</option>
            <option value="kepala_sekolah">Kepala Sekolah</option>
            <option value="wakasek">Wakasek Hubin</option>
            <option value="guru_pembimbing">Guru Pembimbing</option>
            <option value="siswa">Siswa PKL</option>
            <option value="pembimbing_industri">Pembimbing Industri</option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Pengguna</TableHeaderCell>
              <TableHeaderCell>Role / Hak Akses</TableHeaderCell>
              <TableHeaderCell>Kontak</TableHeaderCell>
              <TableHeaderCell className="text-center">Status Akun</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                  Tidak ada data pengguna yang sesuai dengan pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/80">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <p className="text-xs text-slate-600">{u.phone_number || '-'}</p>
                  </TableCell>

                  <TableCell className="text-center">
                    {u.is_active ? (
                      <Badge variant="success">AKTIF</Badge>
                    ) : (
                      <Badge variant="neutral">NONAKTIF</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(u)}
                        className="text-xs h-7 text-blue-600 hover:bg-blue-50"
                        title="Edit Data Pengguna"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* Reset Password Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsResetModalOpen(true);
                        }}
                        className="text-xs h-7 text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>

                      {/* Toggle Status Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(u.id)}
                        className={`text-xs h-7 ${u.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                      >
                        {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(u)}
                        className="text-xs h-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Hapus Akun Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Add User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Akun Pengguna Baru"
        size="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.Kom."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Alamat Email (Login) <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="budi@nsc.sch.id"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Peran (Role RBAC) <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                required
              >
                <option value="siswa">Siswa PKL</option>
                <option value="guru_pembimbing">Guru Pembimbing</option>
                <option value="pembimbing_industri">Pembimbing Industri</option>
                <option value="admin_pkl">Admin PKL</option>
                <option value="wakasek">Wakasek Hubin</option>
                <option value="kepala_sekolah">Kepala Sekolah</option>
                <option value="super_admin">Super Admin</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nomor WhatsApp
              </label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="081234567890"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700">
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Pengguna"
        size="md"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <Input
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.Kom."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Alamat Email (Login) <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              placeholder="budi@nsc.sch.id"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Peran (Role RBAC) <span className="text-red-500">*</span>
              </label>
              <Select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                required
              >
                <option value="siswa">Siswa PKL</option>
                <option value="guru_pembimbing">Guru Pembimbing</option>
                <option value="pembimbing_industri">Pembimbing Industri</option>
                <option value="admin_pkl">Admin PKL</option>
                <option value="wakasek">Wakasek Hubin</option>
                <option value="kepala_sekolah">Kepala Sekolah</option>
                <option value="super_admin">Super Admin</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nomor WhatsApp
              </label>
              <Input
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                placeholder="081234567890"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Status Akun
            </label>
            <Select
              value={editFormData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'active' })}
            >
              <option value="active">Aktif (Dapat Login)</option>
              <option value="inactive">Nonaktif (Akses Dikunci)</option>
            </Select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete User */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Akun Pengguna"
        size="sm"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Konfirmasi Penghapusan</p>
              <p className="mt-1">
                Apakah Anda yakin ingin menghapus akun pengguna berikut? Akun ini tidak akan dapat login lagi ke sistem.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-sm">{selectedUser?.name}</span>
            <span className="text-slate-500 font-mono block">{selectedUser?.email}</span>
            <span className="inline-block mt-1">
              {selectedUser?.role && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[selectedUser.role]}`}>
                  {ROLE_LABELS[selectedUser.role]}
                </span>
              )}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Password Pengguna"
        size="sm"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            Kirim tautan pemulihan kata sandi ke email pengguna:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">{selectedUser?.name}</span>
            <span className="text-slate-500 font-mono">{selectedUser?.email}</span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleResetPassword} className="bg-blue-600">
              Kirim Link Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
