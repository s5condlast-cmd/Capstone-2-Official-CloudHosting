import React, { ReactNode } from 'react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Download, Printer, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

interface PaperWrapperProps {
  title: string;
  onDownload: () => void;
  children: ReactNode;
  className?: string;
  metadata?: {
    type: string;
    version: string;
    size: string;
  };
  onAutoFill?: () => void;
}

export const PaperWrapper: React.FC<PaperWrapperProps> = ({ 
  title, 
  onDownload, 
  children,
  className,
  metadata = { type: 'DOCX', version: 'v1.0', size: '250 KB' },
  onAutoFill
}) => {
  const handlePrint = () => {
    toast.success('Document prepared for printing!');
    window.print();
  };

  const handleDownloadClick = () => {
    toast.success('Document downloaded successfully!');
    onDownload();
  };

  return (
    <div className={cn(
      "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[600px] lg:min-h-[800px] h-full",
      className
    )}>
      {/* Header Bar */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-zinc-400" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>{metadata.type}</span>
          <span>·</span>
          <span>{metadata.version}</span>
          <span>·</span>
          <span>{metadata.size}</span>
        </div>
      </div>

      {/* Scrollable Paper Container */}
      <div className="flex-1 overflow-y-auto bg-zinc-100/50 dark:bg-zinc-900/50 p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-950 shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 min-h-[800px]">
          {/* STI Letterhead */}
          <div className="text-center pb-6 border-b-2 border-zinc-900 dark:border-zinc-100 mb-8 space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white uppercase tracking-[0.2em]">
              {title} - DEMO
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">289 L. de Guzman Street, Concepcion I, Marikina City, 1807 Metro Manila</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Tel: (02) 8682-1234 | practicum@stimarikina.edu.ph</p>
          </div>

          {/* Document Content */}
          <div className="text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div>
          {onAutoFill && (
            <Button variant="outline" size="sm" icon={<Wand2 size={14} className="text-amber-500" />} onClick={onAutoFill}>
              Auto-fill Profile Data
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>
            Print
          </Button>
          <Button size="sm" icon={<Download size={14} />} onClick={handleDownloadClick}>
            Download Template
          </Button>
        </div>
      </div>
    </div>
  );
};
