import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { StatCard } from '@/src/components/ui/StatCard';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar,
  CheckCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

const mockInterns = [
  {
    id: '1',
    name: 'Maria Santos',
    course: 'BSIT 402',
    email: 'm.santos@edu.ph',
    phone: '+63 912 345 6789',
    phase: 'In OJT',
    status: 'Active',
    hoursCompleted: 310,
    hoursRequired: 460,
    startDate: 'March 1, 2026',
    position: 'Frontend Dev Intern',
    adviser: 'Dr. Sarah Johnson'
  },
  {
    id: '2',
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    email: 'alice.b@edu.ph',
    phone: '+63 923 456 7890',
    phase: 'In OJT',
    status: 'Active',
    hoursCompleted: 280,
    hoursRequired: 460,
    startDate: 'March 15, 2026',
    position: 'QA Engineer Intern',
    adviser: 'Prof. Mike Ross'
  },
  {
    id: '3',
    name: 'John Smith',
    course: 'BSIT 402',
    email: 'j.smith@edu.ph',
    phone: '+63 934 567 8901',
    phase: 'In OJT',
    status: 'Active',
    hoursCompleted: 50,
    hoursRequired: 460,
    startDate: 'April 20, 2026',
    position: 'System Admin Intern',
    adviser: 'Dr. Sarah Johnson'
  }
];

export const MyInterns: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInterns = mockInterns.filter(intern => 
    intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intern.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInterns = filteredInterns.length;
  const totalCompletedHours = filteredInterns.reduce((acc, intern) => acc + intern.hoursCompleted, 0);
  const totalRequiredHours = filteredInterns.reduce((acc, intern) => acc + intern.hoursRequired, 0);
  const avgHours = totalInterns > 0 ? Math.round(totalCompletedHours / totalInterns) : 0;
  const phaseCompletion = totalRequiredHours > 0 ? Math.round((totalCompletedHours / totalRequiredHours) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Assigned Interns</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">View and track the students currently deployed to your department.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Interns Deployed" value={totalInterns.toString()} icon={<Users size={18} />} />
        <StatCard label="Avg. Rendered Hours" value={`${avgHours} hrs`} icon={<Calendar size={18} />} />
        <StatCard label="Phase Completion" value={`${phaseCompletion}%`} icon={<CheckCircle size={18} />} />
      </div>

      {/* Filter and Search */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input 
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-9 text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" 
            placeholder="Search interns by name or role..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Interns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterns.map(intern => {
          const progressPercent = Math.round((intern.hoursCompleted / intern.hoursRequired) * 100);

          return (
            <Card key={intern.id} className="overflow-hidden flex flex-col justify-between h-full border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                {/* Header Profile Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shrink-0">
                      {intern.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">{intern.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{intern.course}</p>
                    </div>
                  </div>
                  <Badge variant={intern.status === 'Active' ? 'success' : 'neutral'}>
                    {intern.status}
                  </Badge>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Briefcase size={13} className="text-zinc-400" />
                    <span>{intern.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Calendar size={13} className="text-zinc-400" />
                    <span>Started: {intern.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Mail size={13} className="text-zinc-400" />
                    <span className="truncate">{intern.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Phone size={13} className="text-zinc-400" />
                    <span>{intern.phone}</span>
                  </div>
                </div>

                {/* Hours Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">OJT Progress</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{intern.hoursCompleted} / {intern.hoursRequired} hrs ({progressPercent}%)</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  icon={<FileText size={12} />}
                  onClick={() => navigate('/supervisor/dtr')}
                >
                  Verify DTR
                </Button>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="flex-1 text-xs"
                  icon={<MessageSquare size={12} />}
                  onClick={() => navigate('/supervisor/evaluate')}
                >
                  Evaluate
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
