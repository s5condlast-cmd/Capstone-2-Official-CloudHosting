import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Send,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  Play
} from 'lucide-react';
import { FormField } from '@/src/components/review/templateFields';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface DocumentWorkflowProps {
  title: string;
  docUrl: string;
  fields: FormField[];
  previewComponent: React.ComponentType<{
    fieldValues: Record<string, string>,
    onFieldClick: (label: string) => void,
    activeField?: string
  }>;
  onSubmit?: () => void;
}

export const DocumentWorkflow: React.FC<DocumentWorkflowProps> = ({
  title,
  docUrl,
  fields,
  previewComponent: Preview,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Drawer state
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [popoverTop, setPopoverTop] = useState(24);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Focus input and calculate position when drawer opens
  useEffect(() => {
    if (activeFieldIndex !== null && previewRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);

      // Find the active field in the DOM
      const activeField = fields[activeFieldIndex];
      const el = previewRef.current.querySelector(`[data-label="${activeField.label}"]`) as HTMLElement;
      if (el) {
        const containerRect = previewRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Calculate offset top relative to the scroll container's viewport
        let topOffset = elRect.top - containerRect.top;

        // Scroll into view if it's too far up or down
        if (topOffset < 20 || topOffset > containerRect.height - 100) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // We set it roughly to center since we are smooth scrolling
          topOffset = containerRect.height / 2 - 50;
        }

        // Clamp between top (24px) and bottom
        if (topOffset < 24) topOffset = 24;
        const maxTop = containerRect.height - 300; // rough height of popover
        if (topOffset > maxTop) topOffset = maxTop;

        setPopoverTop(topOffset);
      } else {
        setPopoverTop(24); // Fallback
      }
    }
  }, [activeFieldIndex, fields]);

  const normalize = (s: string) => s.toLowerCase().replace(/[\s\/\-_]+/g, '');

  const handleFieldClick = (label: string) => {
    // First try exact match
    let index = fields.findIndex(f => f.label === label);
    // Fallback: normalized match (handles spacing / casing diffs between Preview labels and templateFields labels)
    if (index === -1) {
      const norm = normalize(label);
      index = fields.findIndex(f => normalize(f.label) === norm);
    }
    if (index !== -1) setActiveFieldIndex(index);
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error as user types
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (strict = true): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach(f => {
      const val = formData[f.key] || '';
      if (strict && !val.trim()) {
        newErrors[f.key] = `${f.label} is required`;
      } else if (val.trim() && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) {
        newErrors[f.key] = `Invalid email format`;
      }
    });
    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstErrorIndex = fields.findIndex(f => f.key === errorKeys[0]);
      if (firstErrorIndex !== -1) {
        setActiveFieldIndex(firstErrorIndex);
      }
    }

    return errorKeys.length === 0;
  };

  const handleDownloadDocx = async () => {
    setGenerationError(null);
    if (!validate(true)) return;
    setIsGeneratingDocx(true);
    try {
      const blob = await documentGenerator.generateDocx(docUrl, formData);
      documentGenerator.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_Filled.docx`);
    } catch (err) {
      console.error(err);
      setGenerationError('Failed to generate DOCX. Please ensure the template exists.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGenerationError(null);
    if (!validate(false)) return;
    
    // Switch to native browser print which supports modern CSS (oklch)
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSubmit = () => {
    if (!validate(true)) return;
    setIsSubmitted(true);
    if (onSubmit) onSubmit();
  };

  const handleNext = () => {
    if (activeFieldIndex === null) return;
    if (activeFieldIndex < fields.length - 1) {
      setActiveFieldIndex(activeFieldIndex + 1);
    } else {
      setActiveFieldIndex(null); // Close drawer if at the end
    }
  };

  const handlePrev = () => {
    if (activeFieldIndex === null) return;
    if (activeFieldIndex > 0) {
      setActiveFieldIndex(activeFieldIndex - 1);
    }
  };

  const allFilled = fields.every(f => !!formData[f.key]?.trim());
  const activeField = activeFieldIndex !== null ? fields[activeFieldIndex] : null;

  // Build a label-keyed map so Preview components can look up values via val('Label')
  // Also include key-keyed entries for backward compatibility with previews that use val('key')
  const labelValues: Record<string, string> = {};
  fields.forEach(f => {
    const v = formData[f.key] || '';
    labelValues[f.label] = v;
    labelValues[f.key] = v;
    // Also store a normalized version so val('Parent/Guardian Name') finds 'Parent / Guardian Name'
    labelValues[normalize(f.label)] = v;
  });

  if (isSubmitted) {
    return (
      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Document Submitted</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
          Your <strong>{title}</strong> has been successfully generated and submitted to your adviser for review.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => setIsSubmitted(false)}>
          Submit Another Document
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-500">Fill in the blanks by clicking them or using the "Start Filling" button.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={allFilled ? 'default' : 'outline'} className={allFilled ? 'bg-emerald-500 text-white' : ''}>
            {allFilled ? 'Ready to Generate' : 'Incomplete'}
          </Badge>
          <Button
            icon={<Play size={16} />}
            onClick={() => setActiveFieldIndex(0)}
            disabled={activeFieldIndex !== null}
          >
            Start Filling
          </Button>
        </div>
      </div>

      {/* Main Layout: Preview taking full width, Drawer floating on top */}
      <div className="relative flex-1 min-h-[400px] flex">
        {/* Document Preview */}
        <div className="flex-1 w-full h-full p-0 overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex flex-col relative transition-all rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Eye size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Live Preview</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative min-h-[400px]">
            <div
              className="absolute inset-0 custom-scrollbar overflow-y-auto bg-zinc-100/50 dark:bg-zinc-950/50"
              ref={previewRef}
            >
              <div className="flex justify-center min-h-full py-8 px-4 md:px-6">
                {/* Paper container — shrinks to fit content exactly or expands to 100% */}
                <div className="preview-paper doc-preview-paper bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-300 dark:border-zinc-800 w-full max-w-[760px] p-10 sm:p-14 relative shrink-0 h-full min-h-full">
                  <Preview
                    fieldValues={labelValues}
                    onFieldClick={handleFieldClick}
                    activeField={activeField?.label}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Right-Side Panel */}
        <AnimatePresence>
          {activeField && (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95, top: popoverTop }}
              animate={{ opacity: 1, x: 0, scale: 1, top: popoverTop }}
              exit={{ opacity: 0, x: 50, scale: 0.95, top: popoverTop }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
              className="absolute right-6 w-72 z-50"
            >
              <Card className="flex flex-col p-0 border-blue-200 dark:border-blue-900/50 shadow-2xl shadow-blue-900/10 ring-1 ring-blue-500/20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                      {activeFieldIndex! + 1}
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      of {fields.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveFieldIndex(null)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      {activeField.label}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {activeField.placeholder ? `Example: ${activeField.placeholder}` : `Please enter your ${activeField.label.toLowerCase()}.`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {activeField.type === 'textarea' ? (
                      <textarea
                        ref={inputRef as any}
                        value={formData[activeField.key] || ''}
                        onChange={e => handleChange(activeField.key, e.target.value)}
                        placeholder={activeField.placeholder}
                        rows={3}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        className={cn(
                          "w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 resize-none transition-all shadow-sm",
                          errors[activeField.key]
                            ? "border-red-300 focus:ring-red-500/20"
                            : "border-blue-200 dark:border-blue-800 focus:ring-blue-500/30 focus:border-blue-400"
                        )}
                      />
                    ) : (
                      <input
                        ref={inputRef as any}
                        type={activeField.type}
                        value={formData[activeField.key] || ''}
                        onChange={e => handleChange(activeField.key, e.target.value)}
                        placeholder={activeField.placeholder}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        className={cn(
                          "w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm",
                          errors[activeField.key]
                            ? "border-red-300 focus:ring-red-500/20"
                            : "border-blue-200 dark:border-blue-800 focus:ring-blue-500/30 focus:border-blue-400"
                        )}
                      />
                    )}
                    {errors[activeField.key] && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 mt-2">
                        <AlertCircle size={12} /> {errors[activeField.key]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 text-xs py-1.5 h-8"
                    onClick={handlePrev}
                    disabled={activeFieldIndex === 0}
                  >
                    <ChevronLeft size={14} /> Prev
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 text-xs py-1.5 h-8"
                    onClick={handleNext}
                  >
                    {activeFieldIndex === fields.length - 1 ? 'Done' : 'Next'} <ChevronRight size={14} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section: Final Actions (Only show if drawer is closed or all filled) */}
      <div className={cn(
        "flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 transition-opacity",
        activeField ? "opacity-50 pointer-events-none" : "opacity-100"
      )}>
        {generationError && (
          <p className="text-xs text-red-500 font-medium flex-1 px-4">{generationError}</p>
        )}
        <Button
          variant="outline"
          icon={<FileText size={16} />}
          onClick={handleDownloadDocx}
          disabled={isGeneratingDocx || isGeneratingPdf}
        >
          {isGeneratingDocx ? 'Generating DOCX...' : 'Download DOCX'}
        </Button>
        <Button
          variant="outline"
          icon={<Download size={16} />}
          onClick={handleDownloadPdf}
          disabled={isGeneratingDocx || isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Preparing...' : 'Print / Save PDF'}
        </Button>
        <Button
          icon={<Send size={16} />}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          Submit for Review
        </Button>
      </div>
    </div>
  );
};
