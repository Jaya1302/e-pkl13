import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS, ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  LogOut,
  ChevronLeft
} from 'lucide-react';

export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Master: true,
  });

  const toggleSubmenu = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Filter items based on user role
  const userRole = role || 'siswa';
  const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out',
          // Desktop & Tablet
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile Drawer
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img src="/logo.png" alt="Logo SMKN 13 Bandung" className="w-8 h-8 object-contain" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight block truncate">
                  E-PKL
                </span>
                <span className="text-[10px] text-slate-500 font-medium block truncate">
                  SMKN 13 Bandung
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button (Desktop & Tablet) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);
            const isSubmenuOpen = openSubmenus[item.title];
            const isExactActive = location.pathname === item.href;
            const isParentActive =
              location.pathname.startsWith(item.href) && item.href !== '/dashboard';
            const isActive = isExactActive || isParentActive;

            const Icon = item.icon;

            if (hasSubmenu) {
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors group',
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      isCollapsed && !isMobileOpen && 'justify-center px-0'
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-brand-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                          isSubmenuOpen && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Submenu links */}
                  {isSubmenuOpen && (!isCollapsed || isMobileOpen) && (
                    <div className="pl-9 pr-1 space-y-1">
                      {item.submenu
                        ?.filter((sub) => sub.roles.includes(userRole))
                        .map((sub) => {
                          const isSubActive = location.pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              to={sub.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                'block py-1.5 px-3 rounded-lg text-xs transition-colors',
                                isSubActive
                                  ? 'bg-brand-50 text-brand-700 font-bold'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                              )}
                            >
                              {sub.title}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  isCollapsed && !isMobileOpen && 'justify-center px-0'
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-brand-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate">{item.title}</span>
                )}
                {item.badge && (!isCollapsed || isMobileOpen) && (
                  <span className="ml-auto bg-brand-100 text-brand-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs',
              isCollapsed && !isMobileOpen && 'justify-center p-1.5'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Pengguna'}
                </p>
                <span
                  className={cn(
                    'inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border',
                    ROLE_BADGE_COLORS[userRole]
                  )}
                >
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            )}

            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
