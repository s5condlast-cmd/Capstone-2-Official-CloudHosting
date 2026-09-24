import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { User } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { CommandPalette } from '../ui/CommandPalette';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { cn } from '@/src/lib/utils';

interface MainLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const isEditorPage = location.pathname.startsWith('/student/editor') || location.pathname.endsWith('/edit');
  const isReviewPage = location.pathname.includes('/reviews');
  const isFullHeightPage = isEditorPage || isReviewPage;

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

      <SidebarInset className="bg-background h-screen max-h-screen flex flex-col overflow-hidden">
        <SiteHeader
          user={user}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          onLogout={onLogout}
        />

        <div className={cn(
          "flex-1 bg-background",
          isFullHeightPage ? "overflow-hidden flex flex-col min-h-0" : "overflow-y-auto editor-scrollbar"
        )}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className={cn(
              "px-3 sm:px-4 md:px-5 w-full max-w-[1720px] mx-auto",
              isFullHeightPage
                ? "flex-1 flex flex-col min-h-0 h-full py-3.5 md:py-4"
                : "py-2.5 sm:py-3 md:py-3.5"
            )}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

