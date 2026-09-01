import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { User } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { CommandPalette } from '../ui/CommandPalette';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Persist theme to localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('practicum_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('practicum_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider defaultOpen={true}>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen} 
        user={user} 
        onLogout={onLogout} 
      />

      <AppSidebar
        user={user}
        onLogout={onLogout}
        onSearchClick={() => setIsCommandPaletteOpen(true)}
      />

      <SidebarInset className="bg-background min-h-screen flex flex-col overflow-hidden transition-colors duration-200">
        <SiteHeader
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          onLogout={onLogout}
        />

        <div className="flex-1 overflow-y-auto bg-background transition-colors duration-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-4 md:px-6 py-5 md:py-6 w-full max-w-[1720px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

