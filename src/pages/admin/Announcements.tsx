import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Megaphone, Send, Trash2, Users } from 'lucide-react';
import { motion } from 'motion/react';

export const Announcements: React.FC = () => {
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const history = [
    { id: 1, title: 'Submission Deadline for MOA', date: 'Oct 25, 2024 - 10:00 AM', target: 'Students Only', sender: 'Admin User' },
    { id: 2, title: 'System Maintenance Notice', date: 'Oct 20, 2024 - 02:00 PM', target: 'All Users', sender: 'Admin User' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Announcements</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Broadcast official notices to specific roles or the entire institution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Compose Announcement">
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {['All Users', 'Advisers Only', 'Students Only', 'Specific Section'].map((t, i) => {
                    const value = t.toLowerCase().replace(' ', '-');
                    return (
                      <button
                        key={i}
                        onClick={() => setTarget(value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          target === value 
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' 
                            : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Users size={16} />
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Announcement Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Important Update Regarding DTR Submissions" 
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Message Body</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6} 
                  placeholder="Type your official announcement here..." 
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none" 
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" icon={<Send size={16} />} disabled={!title || !content}>
                  Send Announcement
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* History */}
        <div className="space-y-6">
          <Card title="Announcement History">
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {history.map((item) => (
                <div key={item.id} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Megaphone size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{item.target}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{item.title}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.date}</p>
                    </div>
                    <button className="text-zinc-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
