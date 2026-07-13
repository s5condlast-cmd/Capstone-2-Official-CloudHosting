import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard as LayoutDashboardIcon,
  Settings as SettingsIcon,
  GraduationCap as GraduationCapIcon,
  FileText as FileTextIcon,
  BarChart as BarChartIcon,
  Activity as ActivityIcon,
  CheckCircle as CheckCircleIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  BookOpen as BookOpenIcon,
  UserCircle as UserCircleIcon,
  Bell as BellIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
  Award as AwardIcon,
  ClipboardList as ClipboardListIcon,
  FilePlus2 as FilePlus2Icon,
  UserCheck as UserCheckIcon,
  Lock as LockIcon,
  Building2 as BuildingIcon
} from 'lucide-react';
import { Role } from '@/src/types';
import { usePhaseLock } from '@/src/hooks/usePhaseLock';

interface SidebarProps {
  role: Role;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface LinkItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  locked?: boolean;
}

interface LinkGroup {
  group: string;
  items: LinkItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ role, onLogout, isOpen, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const { locks } = usePhaseLock();

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    
    const handleSetCollapsed = (e: Event) => {
      const customEvent = e as CustomEvent<{ collapsed: boolean }>;
      setIsCollapsed(customEvent.detail.collapsed);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('set-sidebar-collapsed', handleSetCollapsed);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('set-sidebar-collapsed', handleSetCollapsed);
    };
  }, []);

  const getLinks = (): LinkGroup[] => {
    switch (role) {
      case 'admin':
        return [
          {
            group: 'Overview', items: [
              { to: '/admin', icon: LayoutDashboardIcon, label: 'Dashboard' },
              { to: '/admin/monitoring', icon: ActivityIcon, label: 'System Monitoring' },
            ]
          },
          {
            group: 'Management', items: [
              { to: '/admin/users', icon: UsersIcon, label: 'Accounts', badge: 3 },
              { to: '/admin/companies', icon: BuildingIcon, label: 'Companies' },
              { to: '/admin/documents', icon: FileTextIcon, label: 'Documents', badge: 38 },
              { to: '/admin/templates', icon: ClipboardListIcon, label: 'Templates' },
              { to: '/admin/announcements', icon: BellIcon, label: 'Announcements' },
              { to: '/admin/reports', icon: BarChartIcon, label: 'Reports' },
            ]
          },
          {
            group: 'System', items: [
              { to: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
            ]
          },
        ];
      case 'adviser':
        return [
          {
            group: 'Overview', items: [
              { to: '/adviser', icon: LayoutDashboardIcon, label: 'Dashboard' },
            ]
          },
          {
            group: 'Management', items: [
              { to: '/adviser/students', icon: GraduationCapIcon, label: 'My Students' },
              { to: '/adviser/endorsements', icon: ClipboardCheckIcon, label: 'Endorsements' },
              { to: '/adviser/moa', icon: UsersIcon, label: 'MOA Oversight' },
            ]
          },
          {
            group: 'Review Hub', items: [
              { to: '/adviser/review', icon: SearchIcon, label: 'Document Review', badge: 4 },
              { to: '/adviser/evaluations', icon: CheckCircleIcon, label: 'Company Evaluations' },
              { to: '/adviser/comparison', icon: ClipboardListIcon, label: 'Rating Comparison' },
            ]
          },
          {
            group: 'Reports', items: [
              { to: '/adviser/class-reports', icon: BarChartIcon, label: 'Class Progress' },
            ]
          },
        ];
      case 'student':
        return [
          {
            group: 'Overview', items: [
              { to: '/student', icon: LayoutDashboardIcon, label: 'Dashboard' },
            ]
          },
          {
            group: 'Before OJT', items: [
              { to: '/student/application-letter', icon: FileTextIcon, label: 'Student Application Letter', locked: locks.beforeOjt },
              { to: '/student/consent', icon: UserCheckIcon, label: 'Consent Form', locked: locks.beforeOjt },
              { to: '/student/proposal', icon: FilePlus2Icon, label: 'Proposal Letter', locked: locks.beforeOjt },
              { to: '/student/moa', icon: UsersIcon, label: 'Memorandum of Agreement', locked: locks.beforeOjt },
              { to: '/student/endorsement', icon: ClipboardCheckIcon, label: 'Endorsement Letter', locked: locks.beforeOjt },
            ]
          },
          {
            group: 'In OJT', items: [
              { to: '/student/journal', icon: BookOpenIcon, label: 'Weekly Journal', locked: locks.inOjt },
              { to: '/student/dtr', icon: CalendarIcon, label: 'Daily Time Record', locked: locks.inOjt },
              { to: '/student/training-plan', icon: ClipboardListIcon, label: 'OJT Training Plan', locked: locks.inOjt },
            ]
          },
          {
            group: 'Final', items: [
              { to: '/student/completion', icon: AwardIcon, label: 'Integration Paper', locked: locks.finals },
              { to: '/student/evaluation', icon: CheckCircleIcon, label: 'Performance Appraisal', locked: locks.finals },
            ]
          },
        ];
      case 'supervisor':
        return [
          {
            group: 'Overview', items: [
              { to: '/supervisor', icon: LayoutDashboardIcon, label: 'Dashboard' },
            ]
          },
          {
            group: 'My Interns', items: [
              { to: '/supervisor/interns', icon: GraduationCapIcon, label: 'Assigned Interns' },
            ]
          },
          {
            group: 'Reviews', items: [
              { to: '/supervisor/dtr', icon: CalendarIcon, label: 'DTR Approval', badge: 5 },
              { to: '/supervisor/evaluate', icon: ClipboardListIcon, label: 'Performance Appraisal', badge: 1 },
            ]
          },
          {
            group: 'Completion', items: [
              { to: '/supervisor/completion', icon: AwardIcon, label: 'Intern Clearance' },
            ]
          },
        ];
    }
  };

  const linkGroups = getLinks();


  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '240px',
        x: isDesktop ? 0 : (isOpen ? 0 : -240)
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen z-40 shrink-0 transition-[transform] duration-300",
        isDesktop ? "sticky top-0" : "fixed top-0 left-0"
      )}
    >
      {/* ── Header / Logo ── */}
      <div className={cn("flex items-center min-h-[72px]", isCollapsed ? "justify-center" : "justify-between px-5")}>
        <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shrink-0">
            <GraduationCapIcon size={20} />
          </div>
          <AnimatePresence>
            {(!isCollapsed || !isDesktop) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col leading-tight overflow-hidden"
              >
                <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap text-zinc-900 dark:text-zinc-100 leading-none">
                  Web-Based Practicum
                </span>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide mt-0.5 whitespace-nowrap">
                  demo STI Marikina
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 w-8 h-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm z-40 transition-colors hidden md:flex"
        >
          {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="px-3 flex-1 flex flex-col gap-0.5 overflow-y-auto mt-1 custom-scrollbar">
        {linkGroups.map((section, sIdx) => (
          <div key={section.group} className={cn(sIdx > 0 && "mt-4")}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5 px-3 block whitespace-nowrap"
              >
                {section.group}
              </motion.span>
            )}
            {isCollapsed && sIdx > 0 && (
              <div className="mx-3 mb-1.5 border-t border-zinc-100 dark:border-zinc-800" />
            )}
            {section.items.map((link) => (
              <NavLink
                key={link.to}
                to={link.locked ? "#" : link.to}
                onClick={(e) => link.locked && e.preventDefault()}
                end={link.to === '/admin' || link.to === '/adviser' || link.to === '/student'}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
                  isActive && !link.locked
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  link.locked && 'opacity-60 cursor-not-allowed hover:bg-transparent hover:text-zinc-500 dark:hover:text-zinc-400',
                  isCollapsed && 'justify-center'
                )}
              >
                {({ isActive }) => (
                  <>
                    <link.icon size={18} className={cn("transition-colors shrink-0", isActive && !link.locked ? "text-primary-fg" : "text-zinc-400 dark:text-zinc-500", !link.locked && "group-hover:text-zinc-900 dark:group-hover:text-zinc-100")} />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="truncate flex-1"
                        title={link.label}
                      >
                        {link.label}
                      </motion.span>
                    )}
                    {/* Badge */}
                    {link.badge && !isCollapsed && !link.locked && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[20px] text-center",
                        isActive
                          ? "bg-white/20 dark:bg-black/20 text-white dark:text-zinc-950"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      )}>
                        {link.badge}
                      </span>
                    )}
                    {link.locked && !isCollapsed && (
                      <LockIcon size={14} className="text-zinc-400 dark:text-zinc-500" />
                    )}
                    {link.badge && isCollapsed && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    )}
                    {isActive && !isCollapsed && (
                      <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-5 bg-white dark:bg-zinc-950 rounded-r-full" />
                    )}
                    {isCollapsed && isActive && (
                      <motion.div layoutId="active-pill-collapsed" className="absolute left-0 w-1 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Card + Logout ── */}
      <div className="p-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/50">

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative w-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOutIcon size={18} className="transition-colors shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="whitespace-nowrap"
            >
              Log Out
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
