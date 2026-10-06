import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Award,
  Camera,
  Briefcase,
  BookOpen,
  Info,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants';
import { cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { AppNotification, NotificationType } from '../../types';
import { notificationService } from '../../services/notificationService';

export interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRole = role || 'siswa';

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({ id: user?.id, role: userRole });
      setNotifications(data);
      const count = await notificationService.getUnreadCount({ id: user?.id, role: userRole });
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, role]);

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead({ id: user?.id, role: userRole });
    loadNotifications();
  };

  // Handle Item Click
  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
      loadNotifications();
    }
    setIsNotifOpen(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  // Handle Delete
  const handleDeleteItem = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    await notificationService.deleteNotification(notifId);
    loadNotifications();
  };

  // Helper for notification type icon & colors
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'journal':
        return {
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'report':
        return {
          icon: <FileText className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200',
        };
      case 'assessment':
      case 'certificate':
        return {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'monitoring':
        return {
          icon: <Camera className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200',
        };
      case 'placement':
        return {
          icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200',
        };
      case 'warning':
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-100 border-slate-200',
        };
    }
  };

  // Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  const filteredNotifs = notifications.filter((n) => (notifFilter === 'unread' ? !n.is_read : true));

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Academic Year Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Tahun Ajaran <strong className="font-extrabold text-slate-900">2026/2027</strong>
          </span>
        </div>
      </div>

      {/* Right side: Search, Notifications & User Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari siswa, DUDI, jurnal..."
            className="w-52 lg:w-64 pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
          />
        </div>

        {/* Dynamic Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
              if (!isNotifOpen) loadNotifications();
            }}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors"
            title="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 animate-scale-up overflow-hidden">
              {/* Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tandai Semua Dibaca</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="px-3 pt-2 pb-1 border-b border-slate-100 flex gap-2">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    notifFilter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    notifFilter === 'unread'
                      ? 'bg-rose-100 text-rose-800'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">Tidak ada notifikasi {notifFilter === 'unread' ? 'baru' : ''}.</p>
                  </div>
                ) : (
                  filteredNotifs.map((notif) => {
                    const iconConfig = getNotificationIcon(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleItemClick(notif)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative ${
                          !notif.is_read ? 'bg-blue-50/40 font-medium' : ''
                        }`}
                      >
                        {/* Status dot */}
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 absolute left-1.5 top-4" />
                        )}

                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconConfig.bg}`}
                        >
                          {iconConfig.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {getRelativeTime(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteItem(e, notif.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to="/pengumuman"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <span>Lihat Semua Pengumuman PKL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || 'Pengguna'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {ROLE_LABELS[userRole]}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-scale-up">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <span
                  className={cn(
                    'mt-1.5 inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border',
                    ROLE_BADGE_COLORS[userRole]
                  )}
                >
                  {ROLE_LABELS[userRole]}
                </span>
              </div>

              <div className="p-1 space-y-0.5 text-xs">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profil Saya</span>
                </Link>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Aplikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
