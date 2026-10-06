import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserCheck, ClipboardList, FileCheck, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileNav: React.FC = () => {
  const items = [
    { label: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Presensi', href: '/absensi', icon: UserCheck },
    { label: 'Jurnal', href: '/jurnal', icon: ClipboardList },
    { label: 'Nilai', href: '/penilaian', icon: FileCheck },
    { label: 'Profil', href: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all duration-150',
                  isActive
                    ? 'text-brand-700 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
