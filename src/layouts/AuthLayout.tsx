import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md p-2 shadow-xl shadow-brand-500/20 mb-4 ring-4 ring-white/15">
          <img src="/logo.png" alt="Logo SMKN 13 Bandung" className="w-16 h-16 object-contain drop-shadow-md" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          E-PKL
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Sistem Informasi Praktik Kerja Lapangan SMKN 13 Bandung
        </p>
      </div>

      {/* Content Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SMK Negeri 13 Bandung. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
};
