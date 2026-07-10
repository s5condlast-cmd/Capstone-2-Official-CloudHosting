import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  FileSearch, 
  Check, 
  X, 
  User, 
  Calendar, 
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Search
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/Input';

export const DocumentVerification: React.FC = () => {
  const navigate = useNavigate();
  const pendingDocs = [
    { id: '1', student: 'Alice Brown', adviser: 'Dr. Smith', type: 'Journal #4', time: '2 hours ago', course: '__BSIT 402_401__', status: 'escalated' },
    { id: '2', student: 'Charlie Davis', adviser: 'Prof. Johnson', type: 'MOA Document', time: '5 hours ago', course: 'BSIT 402', status: 'pending_legal' },
    { id: '3', student: 'Eva Green', adviser: 'Dr. Smith', type: 'MOA Revised', time: '1 day ago', course: '__BSIT 402_401__', status: 'escalated' },
    { id: '4', student: 'John Smith', adviser: 'Prof. Johnson', type: 'Endorsement', time: '2 days ago', course: 'BSIT 402', status: 'pending_admin' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <Card 
        title="Global Document Verification" 
        className="w-full"
        action={<div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mr-2">{pendingDocs.length} Issues</span>
           <Button size="sm" variant="outline" icon={<Search size={14} />}>Search</Button>
        </div>}
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student / Adviser</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Document Details</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">System Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {pendingDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/50 dark:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-white dark:bg-zinc-950 transition-colors">
                        <User size={16} className="text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{doc.student}</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Adv: {doc.adviser}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 mb-1">
                        <span className="text-sm font-semibold">{doc.type}</span>
                        <button className="text-zinc-300 hover:text-zinc-900 dark:text-zinc-100 transition-colors">
                           <ExternalLink size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                         <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {doc.time}
                         </div>
                         <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                            <Calendar size={10} />
                            Oct 28
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={doc.status === 'escalated' ? 'error' : doc.status === 'pending_legal' ? 'warning' : 'neutral'}>
                       {doc.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button size="sm" variant="outline" onClick={() => navigate(`/admin/documents/${doc.id}`)} className="p-2 border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-900 shadow-none"><MessageSquare size={14} /></Button>
                       <Button size="sm" variant="danger" icon={<X size={14} />}>Reject</Button>
                       <Button size="sm" variant="primary" icon={<Check size={14} />}>Clear</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card title="Admin Oversight Policies">
            <ul className="space-y-3">
               {[
                 'Escalated documents require manual override.',
                 'MOA documents must be verified by the legal team.',
                 'Endorsement letters must be stamped by the department head.',
                 'Override adviser decisions only with written consent.'
               ].map((tip, i) => (
                 <li key={i} className="flex gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mt-1.5 shrink-0" />
                    {tip}
                 </li>
               ))}
            </ul>
         </Card>
         <Card title="System Announcements">
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <ShieldAlert size={16} className="text-black dark:text-zinc-950 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-black dark:text-zinc-950">High Volume Alert</p>
                        <p className="text-[10px] text-black dark:text-zinc-950 mt-0.5 leading-relaxed">There are currently 45+ pending MOAs requiring signature. Please process them ASAP.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-xl">
                    <Clock size={16} className="text-zinc-500 dark:text-zinc-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">System Maintenance</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">Scheduled downtime for document API integration tonight at 2:00 AM.</p>
                    </div>
                </div>
            </div>
         </Card>
      </div>
    </div>
  );
};
