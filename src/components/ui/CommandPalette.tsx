import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Home, Settings, LogOut, Bell, Monitor, BarChart2, Activity, User as UserIcon } from 'lucide-react';
import { User } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, setIsOpen, user, onLogout }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!user) return null;

  const actions = [
    { id: 'home', label: 'Go to Dashboard', icon: Home, role: 'all', action: () => navigate(`/${user.role}`) },
    { id: 'monitoring', label: 'System Monitoring', icon: Monitor, role: 'admin', action: () => navigate('/admin/monitoring') },
    { id: 'users', label: 'User Management', icon: Users, role: 'admin', action: () => navigate('/admin/users') },
    { id: 'docs', label: 'Document Verification', icon: FileText, role: 'admin', action: () => navigate('/admin/documents') },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2, role: 'admin', action: () => navigate('/admin/reports') },
    { id: 'announcements', label: 'Announcements', icon: Activity, role: 'admin', action: () => navigate('/admin/announcements') },
    { id: 'settings', label: 'System Settings', icon: Settings, role: 'admin', action: () => navigate('/admin/settings') },
    
    { id: 'mystudents', label: 'My Students', icon: Users, role: 'adviser', action: () => navigate('/adviser/students') },
    { id: 'review', label: 'Consolidate Reviews', icon: FileText, role: 'adviser', action: () => navigate('/adviser/review') },
    
    { id: 'application-letter', label: 'Submit Application Letter', icon: FileText, role: 'student', action: () => navigate('/student/application-letter') },
    { id: 'journal', label: 'Weekly Journal', icon: FileText, role: 'student', action: () => navigate('/student/journal') },
    { id: 'dtr', label: 'DTR Submissions', icon: FileText, role: 'student', action: () => navigate('/student/dtr') },
    { id: 'eval', label: 'Final Evaluation', icon: FileText, role: 'student', action: () => navigate('/student/evaluation') },
    
    { id: 'profile', label: 'View Profile', icon: UserIcon, role: 'all', action: () => navigate(`/${user.role}/profile`) },
    { id: 'logout', label: 'Log Out', icon: LogOut, role: 'all', action: onLogout },
  ];

  const filteredActions = actions.filter(
    (action) =>
      (action.role === 'all' || action.role === user.role) &&
      action.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50">
              <Search size={18} className="text-zinc-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded ml-3">ESC</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredActions.length > 0 ? (
                filteredActions.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group text-left"
                  >
                    <action.icon size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white mr-3 transition-colors" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-zinc-400">
                  No results found for "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
