import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Harap isi email dan kata sandi.', 'error');
      return;
    }

    try {
      await login(email, password);
      showToast('Login berhasil! Selamat datang di Portal E-PKL.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Email atau kata sandi tidak valid.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Masuk ke Portal E-PKL
        </h2>
        <p className="text-xs text-slate-500">
          Tampilan sistem otomatis menyesuaikan dengan peran login Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Alamat Email"
          type="email"
          required
          placeholder="nama@smkn13bdg.sch.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Kata Sandi"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Button
          type="submit"
          className="w-full"
          size="md"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Masuk ke Sistem
        </Button>
      </form>

      {/* Quick Demo Login Helper for Testing */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
          Akun Demo SMKN 13 Bandung (Klik untuk isi otomatis)
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setEmail('superadmin@smkn13bdg.sch.id');
              setPassword('smkn13bandung');
            }}
            className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 text-left transition-colors"
          >
            <div className="font-bold text-[11px]">Super Admin</div>
            <div className="text-[10px] text-slate-500 truncate">superadmin@smkn13bdg.sch.id</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('hubin@smkn13bdg.sch.id');
              setPassword('smkn13bandung');
            }}
            className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 text-left transition-colors"
          >
            <div className="font-bold text-[11px]">Admin Hubinmas</div>
            <div className="text-[10px] text-slate-500 truncate">hubin@smkn13bdg.sch.id</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('guru.fauzi@smkn13bdg.sch.id');
              setPassword('smkn13bandung');
            }}
            className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 text-left transition-colors"
          >
            <div className="font-bold text-[11px]">Guru Pembimbing</div>
            <div className="text-[10px] text-slate-500 truncate">guru.fauzi@smkn13bdg.sch.id</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('mentor.telkom@smkn13bdg.sch.id');
              setPassword('smkn13bandung');
            }}
            className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 text-left transition-colors"
          >
            <div className="font-bold text-[11px]">Mentor PT Telkom</div>
            <div className="text-[10px] text-slate-500 truncate">mentor.telkom@smkn13bdg.sch.id</div>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setEmail('siswa.rizky@smkn13bdg.sch.id');
            setPassword('smkn13bandung');
          }}
          className="w-full mt-1.5 p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 text-left transition-colors"
        >
          <div className="font-bold text-[11px]">Siswa (M. Rizky Pratama - XII RPL 1)</div>
          <div className="text-[10px] text-slate-500 truncate">siswa.rizky@smkn13bdg.sch.id</div>
        </button>
      </div>
    </div>
  );
};
