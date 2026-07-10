import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Requirements: React.FC = () => {
  const requirements = [
    { name: 'Practicum Plan', status: 'Approved', due: '2024-10-15', completed: true },
    { name: 'Waiver Form', status: 'Approved', due: '2024-10-20', completed: true },
    { name: 'Medical Certificate', status: 'Under Review', due: '2024-10-25', completed: false },
    { name: 'Host Company MOA', status: 'Missing', due: '2024-10-30', completed: false },
    { name: 'Insurance Policy', status: 'Missing', due: '2024-11-05', completed: false },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card 
          title="Mandatory Documents" 
          className="lg:col-span-2"
          action={<Button size="sm" variant="outline" icon={<RefreshCw size={14} />}>Sync</Button>}
        >
          <div className="divide-y divide-zinc-100">
            {requirements.map((req, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                    req.completed ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-100"
                  )}>
                    {req.completed ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-sm font-bold tracking-tight",
                      req.completed ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-zinc-100"
                    )}>{req.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">By {req.due}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant={
                    req.status === 'Approved' ? 'success' : 
                    req.status === 'Returned' ? 'error' : 
                    req.status === 'Under Review' ? 'warning' : 'neutral'
                  }>
                    {req.status}
                  </Badge>
                  <button className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Portal Rules" className="bg-zinc-50 dark:bg-zinc-900 border-dashed">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Info size={18} className="text-zinc-900 dark:text-zinc-100 shrink-0" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  All documents must be uploaded in high-resolution PDF format. AI validation will automatically flag blurred or unsigned documents.
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block mb-2">Notice</span>
                <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">Final evaluation opens once yours hours reach 100%.</p>
              </div>
            </div>
          </Card>
          
          <Card title="Support">
             <Button variant="outline" className="w-full justify-start text-[11px]" icon={<AlertCircle size={14} />}>
               Report Document Issue
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
