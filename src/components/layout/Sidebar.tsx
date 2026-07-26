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
  Bell as BellIcon,
  Search as SearchIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
  Award as AwardIcon,
  ClipboardList as ClipboardListIcon,
  FilePlus2 as FilePlus2Icon,
  UserCheck as UserCheckIcon,
  Lock as LockIcon,
  Building2 as BuildingIcon,
  Menu as MenuIcon
} from 'lucide-react';
import { Role, User } from '@/src/types';
import { usePhaseLock } from '@/src/hooks/usePhaseLock';

interface SidebarProps {
  role: Role;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  user?: User | null;
  onSearchClick?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  onLogout,
  isOpen,
  user,
  onSearchClick
}) => {
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Management: true,
    System: true,
    'Before OJT': true,
    'In OJT': true,
    Final: true,
    'My Interns': true,
    Reviews: true,
    Completion: true,
    Reports: true,
    'Review Hub': true,
  });
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const { locks } = usePhaseLock();

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getLinks = (): LinkGroup[] => {
    switch (role) {
      case 'admin':
        return [
          {
            group: 'Overview',
            items: [
              { to: '/admin', icon: LayoutDashboardIcon, label: 'Dashboard' },
              { to: '/admin/monitoring', icon: ActivityIcon, label: 'System Monitoring' },
            ],
          },
          {
            group: 'Management',
            items: [
              { to: '/admin/users', icon: UsersIcon, label: 'Accounts', badge: 3 },
              { to: '/admin/companies', icon: BuildingIcon, label: 'Companies' },
              { to: '/admin/documents', icon: FileTextIcon, label: 'Documents', badge: 38 },
              { to: '/admin/templates', icon: ClipboardListIcon, label: 'Templates' },
              { to: '/admin/announcements', icon: BellIcon, label: 'Announcements' },
              { to: '/admin/reports', icon: BarChartIcon, label: 'Reports' },
            ],
          },
          {
            group: 'System',
            items: [{ to: '/admin/settings', icon: SettingsIcon, label: 'Settings' }],
          },
        ];
      case 'adviser':
        return [
          {
            group: 'Overview',
            items: [{ to: '/adviser', icon: LayoutDashboardIcon, label: 'Dashboard' }],
          },
          {
            group: 'Management',
            items: [
              { to: '/adviser/students', icon: GraduationCapIcon, label: 'My Students' },
              { to: '/adviser/endorsements', icon: ClipboardCheckIcon, label: 'Endorsements' },
              { to: '/adviser/moa', icon: UsersIcon, label: 'MOA Oversight' },
            ],
          },
          {
            group: 'Review Hub',
            items: [
              { to: '/adviser/review', icon: SearchIcon, label: 'Document Review', badge: 4 },
              { to: '/adviser/evaluations', icon: CheckCircleIcon, label: 'Company Evaluations' },
              { to: '/adviser/comparison', icon: ClipboardListIcon, label: 'Rating Comparison' },
            ],
          },
          {
            group: 'Reports',
            items: [{ to: '/adviser/class-reports', icon: BarChartIcon, label: 'Class Progress' }],
          },
        ];
      case 'student':
        return [
          {
            group: 'Overview',
            items: [{ to: '/student', icon: LayoutDashboardIcon, label: 'Dashboard' }],
          },
          {
            group: 'Before OJT',
            items: [
              { to: '/student/application-letter', icon: FileTextIcon, label: 'Student Application Letter', locked: locks.beforeOjt },
              { to: '/student/consent', icon: UserCheckIcon, label: 'Consent Form', locked: locks.beforeOjt },
              { to: '/student/proposal', icon: FilePlus2Icon, label: 'Proposal Letter', locked: locks.beforeOjt },
              { to: '/student/moa', icon: UsersIcon, label: 'Memorandum of Agreement', locked: locks.beforeOjt },
              { to: '/student/endorsement', icon: ClipboardCheckIcon, label: 'Endorsement Letter', locked: locks.beforeOjt },
            ],
          },
          {
            group: 'In OJT',
            items: [
              { to: '/student/journal', icon: BookOpenIcon, label: 'Weekly Journal', locked: locks.inOjt },
              { to: '/student/dtr', icon: CalendarIcon, label: 'Daily Time Record', locked: locks.inOjt },
              { to: '/student/training-plan', icon: ClipboardListIcon, label: 'OJT Training Plan', locked: locks.inOjt },
            ],
          },
          {
            group: 'Final',
            items: [
              { to: '/student/completion', icon: AwardIcon, label: 'Integration Paper', locked: locks.finals },
              { to: '/student/evaluation', icon: CheckCircleIcon, label: 'Performance Appraisal', locked: locks.finals },
            ],
          },
        ];
      case 'supervisor':
        return [
          {
            group: 'Overview',
            items: [{ to: '/supervisor', icon: LayoutDashboardIcon, label: 'Dashboard' }],
          },
          {
            group: 'My Interns',
            items: [{ to: '/supervisor/interns', icon: GraduationCapIcon, label: 'Assigned Interns' }],
          },
          {
            group: 'Reviews',
            items: [
              { to: '/supervisor/dtr', icon: CalendarIcon, label: 'DTR Approval', badge: 5 },
              { to: '/supervisor/evaluate', icon: ClipboardListIcon, label: 'Performance Appraisal', badge: 1 },
            ],
          },
          {
            group: 'Completion',
            items: [{ to: '/supervisor/completion', icon: AwardIcon, label: 'Intern Clearance' }],
          },
        ];
    }
  };

  const linkGroups = getLinks();
  const isExpanded = isDesktop ? !isPinnedCollapsed : isOpen;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isDesktop ? (isExpanded ? 240 : 76) : 240,
        x: isDesktop ? 0 : isOpen ? 0 : -260,
      }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onMouseLeave={() => setActiveFlyout(null)}
      className={cn(
        'bg-white dark:bg-zinc-900 border-r-0 flex flex-col h-screen z-40 shrink-0 overflow-hidden transition-[transform] duration-300 select-none rounded-none',
        isDesktop ? 'sticky top-0' : 'fixed top-0 left-0'
      )}
    >
      {/* ── Header / Logo & Menu Toggle ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0 min-h-[64px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            title={isPinnedCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-fg flex items-center justify-center shrink-0 shadow-xs font-bold transition-all relative overflow-hidden group cursor-pointer hover:opacity-90"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLogoHovered ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <MenuIcon size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="cap"
                  initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                >
                  <GraduationCapIcon size={22} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col leading-tight overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  Web Practicum
                </span>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide truncate">
                  STI Marikina
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* ── Body (Search, Navigation, Profile) ── */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-zinc-200/80 dark:border-zinc-800/80">
        {/* ── Search Bar ── */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          {isExpanded ? (
            <button
              onClick={onSearchClick}
              className="w-full h-10 px-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-between text-xs font-medium group"
            >
              <div className="flex items-center gap-2.5">
                <SearchIcon
                  size={16}
                  className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
                />
                <span>Search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onSearchClick}
                title="Search (⌘K)"
                className="w-10 h-10 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all flex items-center justify-center group"
              >
                <SearchIcon size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="px-3 flex-1 overflow-y-auto space-y-3 py-2 custom-scrollbar">
          {linkGroups.map((section) => {
            const isGroupOpen = openGroups[section.group] ?? true;
            return (
              <div
                key={section.group}
                className="relative"
                onMouseEnter={() => !isExpanded && setActiveFlyout(section.group)}
                onMouseLeave={() => !isExpanded && setActiveFlyout(null)}
              >
                {isExpanded ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleGroup(section.group)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors rounded-lg group/btn cursor-pointer"
                    >
                      <span>{section.group}</span>
                      <motion.div
                        animate={{ rotate: isGroupOpen ? 0 : -90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronDownIcon size={12} className="opacity-60 group-hover/btn:opacity-100" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden pl-2 border-l border-zinc-200 dark:border-zinc-800/80 ml-3 space-y-1 my-1"
                        >
                          {section.items.map((link) => (
                            <NavLinkItem key={link.to} link={link} isExpanded={true} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-1 flex flex-col items-center">
                    {section.items.map((link) => (
                      <NavLinkItem key={link.to} link={link} isExpanded={false} />
                    ))}
                  </div>
                )}

                {!isExpanded && activeFlyout === section.group && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full top-0 ml-3 w-52 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                      {section.group}
                    </div>
                    {section.items.map((link) => (
                      <NavLinkItem key={link.to} link={link} isExpanded={true} />
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── User & Logout Footer ── */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 shrink-0">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : role.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 capitalize truncate">
                    {role}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 relative group">
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs hover:opacity-90 transition-opacity"
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : role.slice(0, 2).toUpperCase()}
              </button>

              {/* Tooltip on Collapsed Profile */}
              <div className="absolute left-full ml-3.5 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs rounded-xl shadow-xl font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="font-semibold">{user?.name || role}</div>
                <div className="text-[10px] opacity-75">Click to Log Out</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

const NavLinkItem: React.FC<{ link: LinkItem; isExpanded: boolean }> = ({ link, isExpanded }) => {
  return (
    <NavLink
      to={link.locked ? '#' : link.to}
      onClick={(e) => link.locked && e.preventDefault()}
      end={link.to === '/admin' || link.to === '/adviser' || link.to === '/student' || link.to === '/supervisor'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
          isActive && !link.locked
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-semibold shadow-2xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60',
          link.locked && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          !isExpanded && 'justify-center w-10 h-10 p-0'
        )
      }
    >
      {({ isActive }) => (
        <>
          <link.icon
            size={18}
            className={cn(
              'transition-colors shrink-0',
              isActive && !link.locked
                ? 'text-primary'
                : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
            )}
          />

          {isExpanded && (
            <span className="truncate flex-1" title={link.label}>
              {link.label}
            </span>
          )}

          {/* Badge */}
          {link.badge && isExpanded && !link.locked && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[18px] text-center',
                isActive
                  ? 'bg-primary text-primary-fg'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              )}
            >
              {link.badge}
            </span>
          )}

          {link.locked && isExpanded && (
            <LockIcon size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          )}

          {link.badge && !isExpanded && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          )}

          {/* Hover Tooltip in Collapsed Mode */}
          {!isExpanded && (
            <div className="absolute left-full ml-3.5 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs rounded-xl shadow-xl font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {link.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

