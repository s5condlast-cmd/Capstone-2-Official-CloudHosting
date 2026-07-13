import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { DocxViewer } from '@/src/components/review/DocxViewer';
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
  Pencil,
  X
} from 'lucide-react';
import { FormField } from '@/src/components/review/templateFields';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { templateStorage } from '@/src/lib/templateStorage';
import { Input } from '@/src/components/ui/Input';

interface DocumentWorkflowProps {
  title: string;
  docUrl: string;
  templateId?: string;
  fields: FormField[];
  previewComponent?: React.ComponentType<{
    fieldValues: Record<string, string>,
    onFieldClick: (label: string) => void,
    activeField?: string
  }>;
  useDocxPreview?: boolean;
  onSubmit?: () => void;
}

export const DocumentWorkflow: React.FC<DocumentWorkflowProps> = ({
  title,
  docUrl,
  templateId,
  fields,
  previewComponent: Preview,
  useDocxPreview = false,
  onSubmit
}) => {
  const [docBuffer, setDocBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!useDocxPreview || !docUrl) return;

      let buffer: ArrayBuffer | undefined;
      // 1. Try to load an admin replacement from IndexedDB first
      if (templateId) {
        buffer = await templateStorage.getTemplateFile(templateId);
      }

      // 2. Fall back to the default server file if no replacement exists
      if (!buffer) {
        const fetchUrl = docUrl.includes('?') ? `${docUrl}&t=${Date.now()}` : `${docUrl}?t=${Date.now()}`;
        const response = await fetch(fetchUrl);
        buffer = await response.arrayBuffer();
      }

      setDocBuffer(buffer);
    };

    fetchDoc();
  }, [useDocxPreview, docUrl, templateId]);

  const [isEditable, setIsEditable] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // New state for live editing
  const [angleData, setAngleData] = useState<Record<string, string>>({});
  const [squareData, setSquareData] = useState<Record<string, string>>({});
  const [blankEdits, setBlankEdits] = useState<Record<number, string>>({});
  const [dateEdits, setDateEdits] = useState<Record<number, string>>({});

  const previewRef = useRef<HTMLDivElement>(null);

  // Extract data from DOM when document renders
  useEffect(() => {
    const handleDocxRendered = () => {
      if (!previewRef.current) return;
      
      const newAngleData: Record<string, string> = {};
      const newSquareData: Record<string, string> = {};
      const newBlankEdits: Record<number, string> = {};
      const newDateEdits: Record<number, string> = {};
      
      previewRef.current.querySelectorAll('.editable-placeholder[data-original^="<"]').forEach((el) => {
        const original = el.getAttribute('data-original');
        if (!original) return;
        const key = original.replace(/^<\s*|\s*>$/g, '');
        // Only set if not already set, to avoid overriding user input on re-renders
        newAngleData[key] = el.textContent === original ? '' : (el.textContent || '');
      });

      previewRef.current.querySelectorAll('.editable-placeholder[data-original^="["]').forEach((el) => {
        const original = el.getAttribute('data-original');
        if (!original) return;
        const key = original.replace(/^\[\s*|\s*\]$/g, '');
        newSquareData[key] = el.textContent === original ? '' : (el.textContent || '');
      });

      previewRef.current.querySelectorAll('.editable-placeholder[data-blank-index]').forEach((el) => {
        const index = parseInt(el.getAttribute('data-blank-index') || '0', 10);
        const original = '_________';
        newBlankEdits[index] = el.textContent && el.textContent.includes('_') ? '' : (el.textContent || '');
      });

      previewRef.current.querySelectorAll('.editable-placeholder[data-date-index]').forEach((el) => {
        const index = parseInt(el.getAttribute('data-date-index') || '0', 10);
        const original = el.getAttribute('data-original') || 'Date';
        newDateEdits[index] = el.textContent === original ? '' : (el.textContent || '');
      });
      
      setAngleData(prev => ({ ...newAngleData, ...prev }));
      setSquareData(prev => ({ ...newSquareData, ...prev }));
      setBlankEdits(prev => ({ ...newBlankEdits, ...prev }));
      setDateEdits(prev => ({ ...newDateEdits, ...prev }));
    };

    const container = previewRef.current;
    if (container) {
      container.addEventListener('docx-rendered', handleDocxRendered);
      setTimeout(handleDocxRendered, 100);
    }
    return () => {
      if (container) container.removeEventListener('docx-rendered', handleDocxRendered);
    };
  }, [docBuffer, useDocxPreview]);

  // Sync state back to DOM in real-time
  useEffect(() => {
    if (!isEditable || !previewRef.current) return;
    
    Object.entries(angleData).forEach(([key, value]) => {
      previewRef.current!.querySelectorAll(`.editable-placeholder[data-original="<${key}>"], .editable-placeholder[data-original="< ${key} >"]`).forEach((el) => {
        el.textContent = value || `<${key}>`;
      });
    });

    Object.entries(squareData).forEach(([key, value]) => {
      previewRef.current!.querySelectorAll(`.editable-placeholder[data-original="[${key}]"], .editable-placeholder[data-original="[ ${key} ]"]`).forEach((el) => {
        el.textContent = value || `[${key}]`;
      });
    });

    Object.entries(blankEdits).forEach(([index, value]) => {
      previewRef.current!.querySelectorAll(`.editable-placeholder[data-blank-index="${index}"]`).forEach((el) => {
        el.textContent = value || '_________';
      });
    });

    Object.entries(dateEdits).forEach(([index, value]) => {
      previewRef.current!.querySelectorAll(`.editable-placeholder[data-date-index="${index}"]`).forEach((el) => {
        el.textContent = value || el.getAttribute('data-original') || 'Date';
      });
    });
  }, [angleData, squareData, blankEdits, dateEdits, isEditable]);

  const handleDownloadDocx = async () => {
    setGenerationError(null);
    setIsGeneratingDocx(true);
    try {
      const formData: Record<string, string> = {};
      const blankArray: string[] = [];
      Object.entries(blankEdits).forEach(([idx, val]) => {
        blankArray[parseInt(idx, 10)] = val as string;
      });
      for (let i = 0; i < blankArray.length; i++) {
        if (blankArray[i] === undefined) blankArray[i] = '';
      }

      const dateArray: string[] = [];
      Object.entries(dateEdits).forEach(([idx, val]) => {
        dateArray[parseInt(idx, 10)] = val as string;
      });
      for (let i = 0; i < dateArray.length; i++) {
        if (dateArray[i] === undefined) dateArray[i] = '';
      }

      const blob = await documentGenerator.generateDocx(docUrl, formData, blankArray, angleData, squareData, dateArray, templateId);
      documentGenerator.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_Template.docx`);
    } catch (err) {
      console.error(err);
      setGenerationError('Failed to generate DOCX. Please ensure the template exists.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    // 1. If it's natively a PDF template, docBuffer is the actual PDF file!
    if (!useDocxPreview && docBuffer) {
      const blob = new Blob([docBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Template.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // 2. If it's a DOCX template, check if an admin uploaded a PDF backup
    if (templateId) {
      try {
        const buffer = await templateStorage.getTemplatePdfBackup(templateId);
        if (buffer) {
          const blob = new Blob([buffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.replace(/\s+/g, '_')}_Backup.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }
      } catch (err) {
        console.error("Failed to download PDF backup", err);
      }
    }

    // Fallback to native browser print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-500">Edit directly in your browser or download to edit locally.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isEditable ? 'primary' : 'outline'}
            icon={isEditable ? <X size={16} /> : <Pencil size={16} />}
            onClick={() => {
              const newEditableState = !isEditable;
              setIsEditable(newEditableState);
              window.dispatchEvent(new CustomEvent('set-sidebar-collapsed', { 
                detail: { collapsed: newEditableState } 
              }));
            }}
            className={cn(isEditable ? "bg-blue-600 text-white hover:bg-blue-700" : "")}
          >
            {isEditable ? 'Stop Editing' : 'Edit Document'}
          </Button>
        </div>
      </div>

      {/* Main Layout: Preview taking full width */}
      <div className="relative flex-1 min-h-[400px] flex gap-6">
        {/* Document Preview */}
        <div className={cn(
          "h-full p-0 overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex flex-col relative transition-all duration-300 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs",
          isEditable ? "flex-[2]" : "flex-[3]"
        )}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Eye size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Live Preview</span>
            </div>
            {isEditable && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse">
                Editing Mode Active
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative min-h-[400px]">
            {useDocxPreview ? (
              <div
                className="absolute inset-0 custom-scrollbar overflow-y-auto"
                ref={previewRef}
              >
                <div className={cn(
                  "doc-preview-paper min-h-full flex flex-col",
                  isEditable ? "ring-2 ring-blue-400 ring-inset" : "",
                  "[&_span]:!text-black [&_p]:!text-black [&_div]:!text-black [&_td]:!border-zinc-300 [&_table]:!text-black",
                  "[&_.docx-wrapper]:!bg-zinc-100 dark:[&_.docx-wrapper]:!bg-zinc-900/50 [&_.docx-wrapper]:!p-8",
                  "[&_section]:!w-full [&_section]:!max-w-full [&_section]:!box-border"
                )}>
                  {docBuffer ? <DocxViewer buffer={docBuffer} isEditable={isEditable} /> : <div className="text-center p-12">Loading Document...</div>}
                </div>
              </div>
            ) : (
              <div
                className="absolute inset-0 custom-scrollbar overflow-y-auto bg-zinc-100/50 dark:bg-zinc-950/50"
                ref={previewRef}
              >
                <div className="flex justify-center items-start min-h-full py-8 px-4 md:px-6">
                  {/* Paper container */}
                  <div className={cn(
                    "preview-paper doc-preview-paper relative shrink-0 min-h-[1056px] rounded-2xl",
                    "w-full max-w-[760px] p-10 sm:p-14 bg-zinc-100 dark:bg-zinc-900 shadow-sm border border-zinc-300 dark:border-zinc-700 transition-colors duration-300 flex flex-col mx-auto overflow-hidden",
                    isEditable ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-100 dark:ring-offset-zinc-900" : ""
                  )}>
                    {Preview ? (
                      <Preview
                        fieldValues={{}}
                        onFieldClick={() => { }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Sidebar Editor */}
        <AnimatePresence>
          {isEditable && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '33.333333%' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Pencil size={16} className="text-blue-500" />
                  Live Editor
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Changes sync instantly to the document.</p>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                
                {/* Angle Bracket Data */}
                {Object.keys(angleData).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Document Variables</h4>
                    <div className="space-y-3">
                      {Object.keys(angleData).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{key}</label>
                          <Input
                            value={angleData[key]}
                            onChange={(e) => setAngleData({ ...angleData, [key]: e.target.value })}
                            placeholder={`Enter ${key.toLowerCase()}`}
                            className="bg-white dark:bg-zinc-950"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Square Bracket Data */}
                {Object.keys(squareData).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Specific Details</h4>
                    <div className="space-y-3">
                      {Object.keys(squareData).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{key}</label>
                          <Input
                            value={squareData[key]}
                            onChange={(e) => setSquareData({ ...squareData, [key]: e.target.value })}
                            placeholder={`Enter ${key.toLowerCase()}`}
                            className="bg-white dark:bg-zinc-950"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blank Data */}
                {Object.keys(blankEdits).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fill-in Blanks</h4>
                    <div className="space-y-3">
                      {Object.keys(blankEdits).map((key) => (
                        <div key={`blank-${key}`} className="space-y-1">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Blank #{parseInt(key) + 1}</label>
                          <Input
                            value={blankEdits[parseInt(key)]}
                            onChange={(e) => setBlankEdits({ ...blankEdits, [parseInt(key)]: e.target.value })}
                            placeholder="Enter text..."
                            className="bg-white dark:bg-zinc-950"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Data */}
                {Object.keys(dateEdits).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Date Fields</h4>
                    <div className="space-y-3">
                      {Object.keys(dateEdits).map((key) => (
                        <div key={`date-${key}`} className="space-y-1">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Date #{parseInt(key) + 1}</label>
                          <Input
                            type="date"
                            value={dateEdits[parseInt(key)]}
                            onChange={(e) => setDateEdits({ ...dateEdits, [parseInt(key)]: e.target.value })}
                            className="bg-white dark:bg-zinc-950"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(angleData).length === 0 && Object.keys(squareData).length === 0 && Object.keys(blankEdits).length === 0 && Object.keys(dateEdits).length === 0 && (
                  <div className="text-center p-8 text-zinc-500 text-sm">
                    No editable fields found in this document.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section: Final Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {generationError && (
          <p className="text-xs text-red-500 font-medium flex-1 px-4">{generationError}</p>
        )}
        <Button
          variant="outline"
          icon={<Download size={16} />}
          onClick={handleDownloadPdf}
          disabled={isGeneratingDocx || isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Preparing...' : 'Print / Save PDF'}
        </Button>
        <Button
          variant="primary"
          icon={<FileText size={16} />}
          onClick={handleDownloadDocx}
          disabled={isGeneratingDocx || isGeneratingPdf}
          className="w-full sm:w-auto"
        >
          {isGeneratingDocx ? 'Preparing Download...' : 'Download Editable DOCX'}
        </Button>
      </div>
    </div>
  );
};
