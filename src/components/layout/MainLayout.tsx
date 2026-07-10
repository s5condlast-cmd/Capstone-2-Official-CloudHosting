import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { User, Role } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { CommandPalette } from '../ui/CommandPalette';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Persist theme to localStorage
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('practicum_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('practicum_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (!user) return <Navigate to="/login" replace />;

  const getPageTitle = (path: string) => {
    const parts = path.split('/').filter(p => p !== '' && p !== 'admin' && p !== 'adviser' && p !== 'student');
    if (parts.length === 0) return 'Dashboard';
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace('-', ' ');
  };

  const getPageSubtitle = (path: string): string | undefined => {
    const key = path.split('/').filter(p => p !== '').pop() || '';
    const subtitles: Record<string, string> = {
      'student': 'Track your practicum progress and submissions',
      'admin': 'System overview and practicum management tools',
      'adviser': 'Review and manage student document submissions',
      'resume': 'Upload your professional CV for adviser review',
      'consent': 'Submit your signed parent or guardian consent form',
      'moa': 'Submit the signed Memorandum of Agreement',
      'endorsement': 'Request and submit your endorsement letter',
      'dtr': 'Upload your monthly Daily Time Record',
      'journal': 'Write and refine your practicum journal entries',
      'training-plan': 'Submit your OJT training plan and objectives',
      'evaluation': 'Final performance evaluation from your supervisor',
      'completion': 'Upload your letter of recognition and OJT certification',
      'notifications': 'Recent alerts, feedback, and system updates',
      'profile': 'Manage your account and personal information',
      'monitoring': 'System events, login activity, and alert history',
      'templates': 'Upload and manage official practicum document forms',
      'users': 'Manage student and adviser account records',
      'documents': 'Verify and validate submitted practicum documents',
      'reports': 'Practicum compliance and completion reports',
      'review': 'Review and annotate pending student documents',
      'approvals': 'Previously approved and verified documents',
      'students': 'View progress of assigned practicum students',
      'settings': 'Configure system preferences and policies',
    };
    return subtitles[key];
  };

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 selection:bg-zinc-950 dark:selection:bg-white selection:text-white dark:selection:text-zinc-950 relative transition-colors duration-300">
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen} 
        user={user} 
        onLogout={onLogout} 
      />
      
      <Sidebar 
        role={user.role} 
        onLogout={onLogout} 
        isOpen={isMobileMenuOpen} 
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar 
          title={getPageTitle(location.pathname)} 
          subtitle={getPageSubtitle(location.pathname)}
          user={user} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          theme={theme}
          onToggleTheme={toggleTheme}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          onLogout={onLogout}
        />
        
        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
