import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants';

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();
  const currentRoleLabel = role ? ROLE_LABELS[role] : 'Tamu';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-2 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-4xl font-extrabold text-rose-600 tracking-tight">
        403
      </span>

      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold text-slate-900">
          Akses Ditolak (Unauthorized)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Akun Anda saat ini (<strong>{currentRoleLabel}</strong>) tidak memiliki izin hak akses untuk membuka halaman atau fitur yang Anda tuju.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Link to="/dashboard">
          <Button leftIcon={<Home className="w-4 h-4" />}>
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
};
