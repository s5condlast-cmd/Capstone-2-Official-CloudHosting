import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { User as UserType } from '@/src/types';

interface NotificationsProps {
  user: UserType | null;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const studentAlerts = [
    { type: 'ai', title: 'AI Analysis Alert', msg: 'Your Journal #4 was flagged for low technical detail. Expand your descriptions to meet compliance.', time: '10m ago' },
    { type: 'feedback', title: 'Dr. Smith Approved', msg: 'Memorandum of Agreement validated. You may now proceed with DTR logging for Cycle B.', time: '2h ago' },
    { type: 'system', title: 'Deadline Warning', msg: 'The window for Week 8 DTR submission expires in 24 hours. Ensure all logs match your journal.', time: '5h ago' },
    { type: 'ai', title: 'Compliance Scan Complete', msg: 'System check for DTR October 2023 passed successfully. Sent to adviser.', time: 'Yesterday' },
  ];

  const adviserAlerts = [
    { type: 'ai', title: 'AI Flag: Suspicious DTR', msg: 'Student Mark Reyes submitted a DTR with unusual weekend hours. Review recommended.', time: '15m ago' },
    { type: 'system', title: 'New Submissions', msg: '5 new student journals are pending your review and approval.', time: '1h ago' },
    { type: 'feedback', title: 'Admin Verification', msg: 'Admin has verified the MOA for TechCorp Solutions.', time: '3h ago' },
    { type: 'ai', title: 'Weekly Summary Ready', msg: 'AI has generated the weekly compliance report for your 45 assigned students.', time: '1d ago' },
  ];

  const alerts = user?.role === 'adviser' ? adviserAlerts : studentAlerts;

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card 
            title="Recent Alerts & Updates"
            action={<Button variant="outline" size="sm" icon={<Trash2 size={14} />}>Clear All</Button>}
           >
              <div className="divide-y divide-zinc-50">
                 {alerts.map((alert, i) => (
                    <div key={i} className="py-5 flex gap-4 items-start first:pt-0 group">
                       <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                          alert.type === 'ai' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900" : 
                          alert.type === 'feedback' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800" :
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 border-zinc-200 dark:border-zinc-800"
                       )}>
                          {alert.type === 'ai' ? <Sparkles size={18} /> : 
                           alert.type === 'feedback' ? <CheckCircle2 size={18} /> : 
                           <AlertTriangle size={18} />}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                             <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{alert.title}</h4>
                             <span className="text-[10px] font-bold text-zinc-300 uppercase shrink-0">{alert.time}</span>
                          </div>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed pr-8">{alert.msg}</p>
                          <div className="pt-2 flex gap-3">
                             <button className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors">Mark Read</button>
                             <button className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors">View Details</button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card title="Notification Preferences">
              <div className="space-y-4">
                 {[
                    { label: 'Cloud Mail Alerts', active: true },
                    { label: 'System Push Notifications', active: false },
                    { label: 'AI Quality Insights', active: true },
                    { label: 'Deadline Reminders', active: true },
                 ].map((opt, i) => (
                    <div key={i} className="flex justify-between items-center group cursor-pointer">
                       <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight group-hover:text-zinc-900 dark:text-zinc-100 transition-colors">{opt.label}</span>
                       <div className={cn(
                          "w-8 h-4 rounded-full relative transition-colors border",
                          opt.active ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
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
           
           <Card className="bg-zinc-50 dark:bg-zinc-900" title="Auto-Delete">
              <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">Notifications older than 30 days are automatically purged to maintain portal performance.</p>
           </Card>
        </div>
      </div>
    </div>
  );
};
