import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ProfilePage: React.FC = () => {
  const { user, role, updateProfile } = useAuth();
  const { showToast } = useToast();
  const userRole = role || 'siswa';

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        phone_number: phoneNumber,
      });
      showToast('Profil pengguna berhasil disimpan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Profil Pengguna
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola informasi identitas akun dan kredensial akses E-PKL NSC Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Profile Card */}
        <Card className="md:col-span-4 flex flex-col items-center text-center p-6 space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg ring-4 ring-slate-100">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <Badge variant="default" className={ROLE_BADGE_COLORS[userRole]}>
            {ROLE_LABELS[userRole]}
          </Badge>

          <div className="w-full pt-4 border-t border-slate-100 text-xs text-left space-y-2 text-slate-500">
            <div className="flex justify-between">
              <span>Status Akun:</span>
              <span className="font-bold text-emerald-600">Aktif</span>
            </div>
            <div className="flex justify-between">
              <span>ID Akun:</span>
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[150px]">
                {user?.id}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Side: Edit Form */}
        <Card className="md:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Perbarui nama, kontak telepon, dan email Anda</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <Input
              label="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Alamat Email"
              type="email"
              value={user?.email || ''}
              disabled
              helperText="Email akun dikelola oleh administrator sekolah dan Supabase Auth"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Nomor WhatsApp / HP"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="081234567890"
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
