import React, { useState, useRef, useEffect } from 'react';
import {
  Bell as BellIcon,
  GraduationCap as GraduationCapIcon,
  Menu as MenuIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  ChevronRight as ChevronRightIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Activity as ActivityIcon,
  Search as SearchIcon,
  LogOut,
  User as UserIcon,
  Settings,
  CheckCheck,
  CheckCircle2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User as UserType } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  user: UserType | null;
  onMenuClick: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSearchClick?: () => void;
  onLogout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, user, onMenuClick, theme, onToggleTheme, onSearchClick, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'verified' | 'revisions'>('all');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoute = (path: string) => {
    return user ? `/${user.role}/${path}` : `/${path}`;
  };

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  // Build breadcrumbs from path
  const buildBreadcrumbs = () => {
    if (!user) return [];
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return []; // Dashboard level — no breadcrumbs

    const crumbs: { label: string; path: string }[] = [];
    // First crumb is always the role dashboard
    crumbs.push({ label: roleLabel, path: `/${user.role}` });

    // Build remaining crumbs
    let currentPath = `/${segments[0]}`;
    for (let i = 1; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace('-', ' ');
      crumbs.push({ label, path: currentPath });
    }
    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();
  const showBreadcrumbs = breadcrumbs.length > 0;

  return (
    <header className="min-h-[64px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 md:px-6 flex items-center sticky top-0 z-20 shrink-0 transition-colors duration-300">
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between">
        {/* Left: Menu + Title + Role Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 md:hidden transition-colors shrink-0"
          >
            <MenuIcon size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold text-base md:text-lg text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">{title}</h2>
              {user?.role && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shrink-0 hidden sm:inline-block">
                  {roleLabel}
                </span>
              )}
            </div>
            {/* Breadcrumbs or Subtitle */}
            {showBreadcrumbs ? (
              <nav className="flex items-center gap-1 mt-0.5 hidden sm:flex">
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.path}>
                    {i > 0 && <ChevronRightIcon size={10} className="text-zinc-300 dark:text-zinc-600 shrink-0" />}
                    {i < breadcrumbs.length - 1 ? (
                      <Link
                        to={crumb.path}
                        className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : (
              subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Role-specific indicators + Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">

          {/* Command Palette Trigger */}
          <button
            onClick={onSearchClick}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-zinc-800"
          >
            <SearchIcon size={14} />
            <span className="text-[11px] font-semibold hidden lg:inline-block">Search...</span>
            <div className="hidden lg:flex items-center gap-0.5 ml-2">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">CMD</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">K</span>
            </div>
          </button>

          {/* Admin: System Status */}
          {user?.role === 'admin' && (
            <Link
              to="/admin/monitoring"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Operational</span>
            </Link>
          )}

          {/* Adviser: Pending Reviews */}
          {user?.role === 'adviser' && (
            <Link
              to="/adviser/review"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <FileTextIcon size={12} className="text-white dark:text-zinc-900" />
              <span className="text-[10px] font-bold text-white dark:text-zinc-900 uppercase tracking-wide">4 Pending</span>
            </Link>
          )}

          {/* Student: Hours Progress */}
          {user?.role === 'student' && (
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
              <ClockIcon size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">122<span className="text-zinc-400 dark:text-zinc-500">/460</span></span>
                <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: '27%' }} />
                </div>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">hrs</span>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                if (!isNotifOpen) {
                  setActiveNotifTab('all');
                }
                setIsNotifOpen(!isNotifOpen);
              }}
              className="relative flex items-center gap-2 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              title="Notifications"
            >
              <div className="relative">
                <BellIcon size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-zinc-950 dark:bg-white border-2 border-white dark:border-zinc-950 rounded-full"></span>
              </div>
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-4 space-y-3.5"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      Your notifications
                    </h3>
                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                      <button title="Mark all as read" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                        <CheckCheck size={16} />
                      </button>
                      <button title="Notification Settings" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills Bar (View all default active) */}
                  <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setActiveNotifTab('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                        activeNotifTab === 'all'
                          ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <span>View all</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                        activeNotifTab === 'all' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        6
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveNotifTab('verified')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                        activeNotifTab === 'verified'
                          ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <span>Verified</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                        activeNotifTab === 'verified' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        2
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveNotifTab('revisions')}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                        activeNotifTab === 'revisions'
                          ? "bg-zinc-950 dark:bg-zinc-900 text-white dark:text-white border border-zinc-800 dark:border-zinc-700 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <span>Revisions</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                        activeNotifTab === 'revisions' ? "bg-zinc-800 dark:bg-zinc-800 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        1
                      </span>
                    </button>
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-[230px] overflow-y-auto space-y-3 pt-1 pr-1.5 scrollbar-thin">
                    {(activeNotifTab === 'revisions' || activeNotifTab === 'all') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-2xs">
                            <UserIcon size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                              <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> requested revisions on{' '}
                              <strong className="text-zinc-900 dark:text-white font-bold">Journal #4</strong>
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Thursday 11:30 AM</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5">1 day ago</span>
                        </div>

                        <div className="ml-9 p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                          Hey <span className="font-semibold text-zinc-950 dark:text-white">@you</span>, please expand section 2 with specific supervisor feedback and detailed daily tasks.
                        </div>
                      </div>
                    )}

                    {(activeNotifTab === 'verified' || activeNotifTab === 'all') && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-2xs">
                            <CheckCircle2 size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                              <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> verified your{' '}
                              <strong className="text-zinc-900 dark:text-white font-bold">MOA Document</strong>
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Yesterday 3:45 PM</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5">2 days ago</span>
                        </div>

                        <div className="ml-9 p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                          Your Memorandum of Agreement with InnoTech Labs has been officially approved. You may begin logging DTR hours.
                        </div>
                      </div>
                    )}

                    {activeNotifTab === 'all' && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold shrink-0 shadow-2xs">
                            <UserIcon size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                              <strong className="text-zinc-900 dark:text-white font-bold">Engr. Paolo Reyes</strong> posted a{' '}
                              <strong className="text-zinc-900 dark:text-white font-bold">New Announcement</strong>
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Friday 9:00 AM</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5">3 days ago</span>
                        </div>

                        <div className="ml-9 p-3 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                          Updated guidelines for DTR submission cycle B are now available in the portal. Please review.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View All Page Footer Button */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate(`/${user.role}/notifications`);
                      }}
                      className="w-full py-2 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 transition-colors cursor-pointer"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg py-1.5 px-2 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-col items-start hidden md:flex text-left">
                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] leading-tight">
                  {user?.role === 'student' ? 'John Dwayne B. Guaniso' : (user?.name || 'User')}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-tight">
                  {roleLabel}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 p-1.5"
                >
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 mb-1.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {user?.role === 'student' ? 'John Dwayne B. Guaniso' : (user?.name || 'User')}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <Link
                      to={getRoute('profile')}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <UserIcon size={16} />
                      My Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to={getRoute('settings')}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                    )}

                    <div className="px-3 py-2 mt-1">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Accent Color</p>
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'default', color: 'bg-zinc-900 dark:bg-zinc-100', name: 'Monochrome' },
                          { id: 'theme-deep-sky', color: 'bg-[#3B82C4]', name: 'Deep Sky Blue' },
                          { id: 'theme-blue', color: 'bg-[#2563eb]', name: 'Modern Blue' },
                          { id: 'theme-indigo', color: 'bg-[#4f46e5]', name: 'Indigo' },
                          { id: 'theme-sti', color: 'bg-[#1d4ed8]', name: 'STI Inspired' }
                        ].map(t => {
                          const currentTheme = localStorage.getItem('app-theme') || 'default';
                          return (
                            <button
                              key={t.id}
                              title={t.name}
                              onClick={() => {
                                ['theme-deep-sky', 'theme-blue', 'theme-indigo', 'theme-sti', 'theme-cyan'].forEach(cls => document.documentElement.classList.remove(cls));
                                if (t.id !== 'default') document.documentElement.classList.add(t.id);
                                localStorage.setItem('app-theme', t.id);
                                setIsProfileOpen(false);
                              }}
                              className={cn(
                                "w-6 h-6 rounded-full transition-transform hover:scale-110 shadow-sm",
                                t.color,
                                currentTheme === t.id && "ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-950"
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {onToggleTheme && (
                      <button
                        onClick={onToggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
                          Dark Mode
                        </div>
                        <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full relative transition-colors">
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                            theme === 'dark' ? "left-[18px] bg-zinc-400" : "left-0.5 bg-zinc-500"
                          )} />
                        </div>
                      </button>
                    )}

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
