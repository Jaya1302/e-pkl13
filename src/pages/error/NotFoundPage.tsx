import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
        <FileQuestion className="w-8 h-8" />
      </div>

      <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
        404
      </span>

      <div className="space-y-1 max-w-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Maaf, tautan atau halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
      </div>

      <Link to="/dashboard" className="pt-4">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
};
