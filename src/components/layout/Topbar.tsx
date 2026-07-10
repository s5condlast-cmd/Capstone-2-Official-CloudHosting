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
  Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
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
    <header className="min-h-[72px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 shrink-0 transition-colors duration-300">
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
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex items-center gap-2 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
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
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Notifications</span>
                  <Link to={getRoute('notifications')} onClick={() => setIsNotifOpen(false)} className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    View All
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-0.5">MOA Approved</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Your Memorandum of Agreement has been verified.</p>
                  </div>
                  <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-0.5">New Announcement</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Admin posted a new guideline for DTR submissions.</p>
                  </div>
                  <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-0.5">Evaluation Pending</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Please submit your supervisor's final evaluation.</p>
                  </div>
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
    </header>
  );
};
