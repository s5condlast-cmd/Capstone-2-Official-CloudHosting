import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { 
  CheckCircle2, 
  User as UserIcon,
  CheckCheck,
  Settings,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { User as UserType } from '@/src/types';

interface NotificationsProps {
  user: UserType | null;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'revisions'>('revisions');

  const [preferences, setPreferences] = useState([
    { id: 'push', label: 'System Push Notifications', active: true, desc: 'Browser popups for active deadlines & announcements' },
    { id: 'reminders', label: 'Deadline Reminders', active: true, desc: '24-hour advance warnings before submission cutoffs' },
  ]);

  const togglePreference = (id: string) => {
    setPreferences(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Notifications Feed */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Your notifications
              </h2>
              <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
                <button title="Mark all as read" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  <CheckCheck size={18} />
                </button>
                <button title="Notification Settings" className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'all'
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>View all</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeTab === 'all' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  6
                </span>
              </button>

              <button
                onClick={() => setActiveTab('verified')}
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'verified'
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>Verified</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeTab === 'verified' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  2
                </span>
              </button>

              <button
                onClick={() => setActiveTab('revisions')}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'revisions'
                    ? "bg-zinc-950 dark:bg-zinc-900 text-white dark:text-white border border-zinc-800 dark:border-zinc-700 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>Revisions</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  activeTab === 'revisions' ? "bg-zinc-800 dark:bg-zinc-800 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  1
                </span>
              </button>
            </div>

            {/* Notification List matching reference image */}
            <div className="space-y-6 pt-2">
              {(activeTab === 'revisions' || activeTab === 'all') && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-2xs">
                      <UserIcon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> requested revisions on{' '}
                        <strong className="text-zinc-900 dark:text-white font-bold">Journal #4</strong>
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Thursday 11:30 AM</p>
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5 font-medium">1 day ago</span>
                  </div>

                  {/* Indented Message Box */}
                  <div className="ml-11 p-4 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    Hey <span className="font-semibold text-zinc-950 dark:text-white">@you</span>, please expand section 2 with specific supervisor feedback and detailed daily tasks.
                  </div>
                </div>
              )}

              {(activeTab === 'verified' || activeTab === 'all') && (
                <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold shrink-0 shadow-2xs">
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong className="text-zinc-900 dark:text-white font-bold">Dr. Sarah Johnson</strong> verified your{' '}
                        <strong className="text-zinc-900 dark:text-white font-bold">MOA Document</strong>
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Yesterday 3:45 PM</p>
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 self-start mt-0.5 font-medium">2 days ago</span>
                  </div>

                  <div className="ml-11 p-4 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    Your Memorandum of Agreement with InnoTech Labs has been officially approved. You may begin logging DTR hours.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Notification Settings Card Box */}
        <div className="lg:col-span-4 space-y-6">
          <Card title="Notification Settings">
            <div className="space-y-4">
              {preferences.map((opt) => (
                <div 
                  key={opt.id} 
                  onClick={() => togglePreference(opt.id)}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight">
                      {opt.desc}
                    </p>
                  </div>
                  <div className={cn(
                    "w-8 h-4 rounded-full relative transition-colors border shrink-0 mt-0.5",
                    opt.active ? "bg-zinc-950 dark:bg-zinc-100 border-zinc-950 dark:border-zinc-100" : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-2.5 h-2.5 bg-white dark:bg-zinc-950 rounded-full transition-all",
                      opt.active ? "left-4.5" : "left-0.5"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Auto-Archive Policy">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <Trash2 size={14} className="text-zinc-400" />
                <span>Automated Purge</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Notifications older than 30 days are automatically archived to ensure portal performance and clean feed maintenance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
