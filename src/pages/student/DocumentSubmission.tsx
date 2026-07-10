import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { 
  FileUp, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  FileText,
  Clock,
  History,
  Info,
  Building,
  UserCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SubmissionProps {
  title: string;
  type: string;
  desc: string;
}

export const DocumentSubmission: React.FC<SubmissionProps> = ({ title, type, desc }) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card title={title}>
              <div className="space-y-8">
                  <div className="p-4 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center gap-4 text-white dark:text-zinc-950">
                    <div className="p-2 bg-white/10 rounded-lg">
                       <Info size={20} className="text-zinc-300" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Official Policy</span>
                       <p className="text-xs font-medium leading-tight">Must be high-resolution PDF with verifiable digital or ink signatures.</p>
                    </div>
                 </div>

                 <div className="border border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-xl p-8 text-center hover:bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-zinc-200 dark:border-zinc-800 transition-all group cursor-pointer relative overflow-hidden">
                    <div className="relative z-10">
                       <div className="w-20 h-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                          <FileUp size={32} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100" />
                       </div>
                       <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Drop your {type} file here</h3>
                       <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-4">Supports PDF up to 10MB</p>
                       <Button variant="secondary" size="lg">Select File</Button>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex gap-2">
                       <HelpCircle size={14} className="text-zinc-300" />
                       <span className="text-[10px] font-bold text-zinc-300 uppercase">Need help with this document ?</span>
                    </div>
                    <Button icon={<ShieldCheck size={18} />}>Submit for Review</Button>
                 </div>
              </div>
           </Card>
           
           <Card title="Current Status">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                 <div className="flex items-center gap-4">
                    <History size={18} className="text-zinc-400 dark:text-zinc-500" />
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No active submission</span>
                       <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Awaiting file upload</span>
                    </div>
                 </div>
                 <Badge>empty</Badge>
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card title="Document Specs" className="bg-zinc-50 dark:bg-zinc-900 border-dashed">
              <div className="space-y-4">
                 <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed pr-4">
                    {desc}
                 </p>
                 <ul className="space-y-2">
                    {['256-bit encryption', 'AI Signature Detection', 'Adviser notified instantly'].map((x, i) => (
                       <li key={i} className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                          <ShieldCheck size={12} className="text-zinc-900 dark:text-zinc-100" />
                          {x}
                       </li>
                    ))}
                 </ul>
              </div>
           </Card>

           <Card title="Submission Guide">
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-semibold text-[10px]">1</div>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">Download Template</span>
                       <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Get the latest {type} format from student resources.</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-semibold text-[10px]">2</div>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">Industry Signature</span>
                       <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Secure the supervisor's ink or digital sign-off.</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
