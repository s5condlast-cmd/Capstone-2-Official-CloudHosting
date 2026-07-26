import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  FileText,
  Eye,
  Sparkles,
  RotateCcw,
  Pencil,
  Printer,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { FormField } from '@/src/components/review/templateFields';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { cn } from '@/src/lib/utils';
import { templateStorage } from '@/src/lib/templateStorage';

import { EmptyState } from '@/src/components/ui/EmptyState';

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
  onSubmit?: () => void;
}

interface AutoWidthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  placeholder: string;
  hidePlaceholderInPrint?: boolean;
}

const AutoWidthInput: React.FC<AutoWidthInputProps> = ({ 
  value, 
  placeholder, 
  hidePlaceholderInPrint, 
  className, 
  ...props 
}) => {
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLSpanElement>(null);
  const hasValue = Boolean(value && value.trim() !== '');
  const activeText = hasValue ? value : placeholder;

  useLayoutEffect(() => {
    if (measureRef.current) {
      const textWidth = measureRef.current.getBoundingClientRect().width;
      setInputWidth(Math.ceil(textWidth) + 24);
    }
  }, [activeText, className]);

  const shouldPrint = hasValue || !hidePlaceholderInPrint;

  return (
    <span 
      style={{ width: inputWidth ? `${inputWidth}px` : 'auto' }}
      className="inline-block align-middle max-w-full relative"
    >
      <span 
        ref={measureRef}
        {...(shouldPrint ? { 'data-print-text': 'true' } : {})}
        className={cn(
          "absolute top-[-9999px] left-[-9999px] invisible whitespace-pre select-none pointer-events-none px-2 py-0.5",
          className
        )}
      >
        {activeText}
      </span>
      <input
        {...props}
        value={value}
        size={1}
        placeholder={hasValue ? '' : placeholder}
        className={cn(
          "w-full min-w-0 font-sans text-[11pt] px-2 py-0.5 font-normal text-black bg-zinc-100/80 border border-zinc-300 hover:border-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black rounded-md outline-none placeholder:text-zinc-500 transition-all shadow-2xs",
          className
        )}
      />
    </span>
  );
};

export const DocumentWorkflow: React.FC<DocumentWorkflowProps> = ({
  title,
  docUrl,
  templateId,
  fields,
  previewComponent: Preview,
  onSubmit
}) => {
  const isApplicationLetter = title.toLowerCase().includes('application letter');
  const [docBuffer, setDocBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'form'>('preview');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const initialFormData = {
    date: new Date().toISOString().split('T')[0],
    contactPerson: '',
    contactTitle: '',
    companyName: '',
    companyAddress: '',
    campusName: 'Marikina',
    hoursRequired: '486',
    programName: 'Bachelor of Science in Information Technology',
    signature: '',
    studentName: 'John Dwayne B. Guaniso',
  };

  const autoFillProfileData = {
    date: new Date().toISOString().split('T')[0],
    contactPerson: 'Mr. Alex Santos',
    contactTitle: 'Human Resources Director',
    companyName: 'InnoTech Solutions Inc.',
    companyAddress: '123 Innovation Way, Ortigas Center, Pasig City',
    campusName: 'Marikina',
    hoursRequired: '486',
    programName: 'Bachelor of Science in Information Technology',
    signature: '',
    studentName: 'John Dwayne B. Guaniso',
  };

  // Form State for inline document placeholders matching <TAGS>, Date, and ____
  const [formData, setFormData] = useState<Record<string, string>>(initialFormData);

const TITLE_TO_TEMPLATE_ID: Record<string, string> = {
  'student application letter': 'h11',
  'application letter': 'h11',
  'parent consent form (with fee)': 'h2_1',
  'parent consent (with fee)': 'h2_1',
  'parent consent form (without fee)': 'h2_2',
  'parent consent (without fee)': 'h2_2',
  'student consent form (with fee)': 'h2_3',
  'student consent (with fee)': 'h2_3',
  'student consent form (without fee)': 'h2_4',
  'student consent (without fee)': 'h2_4',
  'moa template': 'h3',
  'memorandum of agreement': 'h3',
  'endorsement letter': 'h4',
  'sti ojt endorsement letter': 'h4',
  'proposal letter': 'h12',
  'proposal letter to the industry': 'h12',
  'journal template': 'h5',
  'weekly journal': 'h5',
  'dtr form': 'h6',
  'daily time record (dtr)': 'h6',
  'daily time record': 'h6',
  'training plan form': 'h7',
  'ojt training plan': 'h7',
  'ojt training plan (bsit/bscs/bsis/act/itp)': 'h7',
  'ojt training plan (bscpe)': 'h7',
  'integration paper': 'h8',
  'integration paper template': 'h8',
  'performance appraisal': 'h10',
  'performance appraisal template': 'h10'
};

  useEffect(() => {
    const fetchDoc = async () => {
      let targetId = templateId || TITLE_TO_TEMPLATE_ID[title.toLowerCase().trim()] || '';
      
      if (!targetId) {
        try {
          const metadata = await templateStorage.getMetadata();
          const match = metadata?.find(t => t.name.toLowerCase().trim() === title.toLowerCase().trim());
          if (match) targetId = match.id;
        } catch (e) {}
      }

      let buffer: ArrayBuffer | undefined;
      let pdfBuf: ArrayBuffer | undefined;
      if (targetId) {
        buffer = await templateStorage.getTemplateFile(targetId);
        pdfBuf = await templateStorage.getTemplatePdfBackup(targetId);
        
      }

      // Fallback to fetching public docUrl if no custom upload exists in storage
      if (!buffer && docUrl) {
        try {
          const fetchUrl = docUrl.includes('?') ? `${docUrl}&t=${Date.now()}` : `${docUrl}?t=${Date.now()}`;
          const res = await fetch(fetchUrl);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const view = new Uint8Array(buf);
            // Check if public docUrl is actually a PDF or DOCX
            if (view.length > 4 && view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
              pdfBuf = buf;
            } else if (view.length > 4 && view[0] === 0x50 && view[1] === 0x4B) {
              buffer = buf;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch public docUrl", e);
        }
      }

      // Check if main buffer itself is a PDF (%PDF header bytes)
      if (buffer && buffer.byteLength > 4) {
        const view = new Uint8Array(buffer);
        if (view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
          pdfBuf = buffer;
          buffer = undefined; // Separate PDF buffer from DOCX buffer
        }
      }

      setDocBuffer(buffer || null);
      setPdfBuffer(pdfBuf || null);
    };

    fetchDoc();

    const handleUpdate = () => fetchDoc();
    window.addEventListener('template_updated', handleUpdate);

    return () => {
      window.removeEventListener('template_updated', handleUpdate);
    };
  }, [docUrl, templateId, title]);

  const pdfBlobUrl = React.useMemo(() => {
    if (!pdfBuffer) return null;
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [pdfBuffer]);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: string, val: string) => {
    // Restrict inputs to a maximum of 30 words
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length > 30) {
      let wordCount = 0;
      let cutoffIndex = val.length;
      let inWord = false;

      for (let i = 0; i < val.length; i++) {
        const isSpace = /\s/.test(val[i]);
        if (!isSpace && !inWord) {
          inWord = true;
          wordCount++;
          if (wordCount > 30) {
            cutoffIndex = i;
            break;
          }
        } else if (isSpace) {
          inWord = false;
        }
      }
      val = val.slice(0, cutoffIndex).trimEnd();
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleAutoFill = () => {
    setFormData(autoFillProfileData);
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
  };

  const handleDownloadDocx = async () => {
    setGenerationError(null);
    setIsGeneratingDocx(true);
    try {
      // Step 2: Data Extraction per AGENTS.md rules
      const placeholders = document.querySelectorAll('.editable-placeholder');
      const blankEdits: string[] = [];
      const dateEdits: string[] = [];
      const angleData: Record<string, string> = { ...formData };

      placeholders.forEach((el) => {
        const span = el as HTMLElement;
        const blankIndex = span.getAttribute('data-blank-index');
        const dateIndex = span.getAttribute('data-date-index');
        const original = span.getAttribute('data-original');

        if (blankIndex !== null) {
          const idx = parseInt(blankIndex, 10);
          blankEdits[idx] = formData.studentName || formData.signature || '';
        } else if (dateIndex !== null) {
          const idx = parseInt(dateIndex, 10);
          dateEdits[idx] = formData.date || new Date().toISOString().split('T')[0];
        } else if (original) {
          const strippedKey = original.replace(/^<|>$/g, '');
          if (formData[strippedKey]) {
            angleData[strippedKey] = formData[strippedKey];
          } else if (strippedKey.toLowerCase() === 'signature') {
            angleData[strippedKey] = ''; // Hide signature placeholder when empty
          }
        }
      });

      const blob = await documentGenerator.generateDocx(
        docUrl,
        formData,
        blankEdits,
        angleData,
        formData,
        dateEdits.length > 0 ? dateEdits : [formData.date],
        templateId,
        title
      );
      documentGenerator.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_Filled.docx`);
    } catch (err) {
      console.error(err);
      setGenerationError('Failed to generate DOCX. Please try again.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
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

    // Fallback to native browser print window
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col flex-1 h-full min-h-0 gap-5">
      {/* Header Info */}
      <div className="flex flex-col gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <Badge variant="neutral" className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[10px] uppercase font-bold tracking-wider">
            {viewMode === 'form' ? 'Interactive Form Mode' : 'Document Preview'}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {viewMode === 'form' 
            ? 'Fill in the boxed fields directly on the document layout below to generate your customized letter.'
            : 'Preview how your finalized document layout will appear once populated.'}
        </p>
      </div>

      {/* Action Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
        {/* Left: View Mode Switcher (Only available for Student Application Letter) */}
        {isApplicationLetter ? (
          <div className="bg-white dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1 text-xs shadow-2xs">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                viewMode === 'preview'
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Eye size={13} />
              <span>PDF Preview</span>
            </button>
            <button
              onClick={() => setViewMode('form')}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-xs",
                viewMode === 'form'
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Pencil size={13} />
              <span>Interactive Form</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
            <Eye size={13} />
            <span>PDF Preview</span>
          </div>
        )}

        {/* Center: Zoom Controls */}
        <div className="bg-white dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1 text-xs shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setZoomScale(prev => Math.max(0.65, parseFloat((prev - 0.05).toFixed(2))))}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 min-w-[36px] text-center select-none">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale(prev => Math.min(1.2, parseFloat((prev + 0.05).toFixed(2))))}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Right: Form Actions (Only shown for Application Letter in Form Mode) */}
        {isApplicationLetter && viewMode === 'form' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} className="text-zinc-700 dark:text-zinc-300" />}
              onClick={handleAutoFill}
              className="shadow-2xs"
            >
              Auto-Fill Profile
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetForm}
              className="shadow-2xs"
            >
              Reset
            </Button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Main Container: Document Paper Canvas */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-900/50 p-4 sm:p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800 custom-scrollbar flex items-center justify-center min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 4, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.995 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex justify-center items-center my-auto"
          >
            {viewMode === 'preview' ? (
              pdfBlobUrl ? (
                <div 
                  style={zoomScale !== 1 ? { transform: `scale(${zoomScale})`, transformOrigin: 'center center' } : undefined}
                  className="w-full max-w-[680px] h-[760px] transition-transform duration-150 my-auto"
                >
                  <iframe 
                    src={`${pdfBlobUrl}#toolbar=0&navpanes=0`} 
                    className="w-full h-full rounded-sm border border-zinc-200 shadow-md bg-white"
                    title={`${title} PDF Preview`}
                  />
                </div>
              ) : (
                <EmptyState
                  icon={<Eye size={24} />}
                  title="No PDF Template Uploaded"
                  description={`No PDF file has been uploaded yet for ${title}. Upload a PDF in the Admin Portal to preview it here.`}
                />
              )
            ) : !isApplicationLetter ? (
              /* Non-Application Letter Interactive Form Card */
              <div 
                style={zoomScale !== 1 ? { transform: `scale(${zoomScale})`, transformOrigin: 'center center' } : undefined}
                className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-md border border-zinc-200 dark:border-zinc-800 w-full max-w-[680px] p-6 sm:p-8 rounded-xl my-auto space-y-6"
              >
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Fill Document Information</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete the required fields below to populate your {title}.</p>
                </div>

                <div className="space-y-4">
                  {fields && fields.length > 0 ? (
                    fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {f.label}
                        </label>
                        {f.type === 'textarea' ? (
                          <textarea
                            value={formData[f.key] || ''}
                            onChange={(e) => handleInputChange(f.key, e.target.value)}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                            rows={3}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-none transition-all"
                          />
                        ) : (
                          <input
                            type={f.type || 'text'}
                            value={formData[f.key] || ''}
                            onChange={(e) => handleInputChange(f.key, e.target.value)}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Student Name</label>
                        <input
                          type="text"
                          value={formData.studentName || ''}
                          onChange={(e) => handleInputChange('studentName', e.target.value)}
                          placeholder="Full Name"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Date</label>
                        <input
                          type="text"
                          value={formData.date || ''}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          placeholder="Date"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div 
                style={zoomScale !== 1 ? { transform: `scale(${zoomScale})`, transformOrigin: 'center center' } : undefined}
                className="doc-preview-paper bg-white text-black shadow-md border border-zinc-200 dark:border-zinc-700 w-full max-w-[680px] min-h-[760px] p-6 sm:p-10 font-sans text-[11pt] leading-relaxed space-y-5 rounded-sm select-text flex flex-col justify-between transition-transform duration-150 my-auto"
              >
                <div className="space-y-5">
                {/* Date */}
                <div>
                  {viewMode === 'form' ? (
                    <AutoWidthInput
                      type="text"
                      value={formData.date || ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      placeholder="Date (e.g. July 26, 2026)"
                      className="[&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  ) : (
                    <span className="font-normal text-black text-[11pt]">
                      {formData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Recipient details */}
                <div className="space-y-1 text-black font-normal text-[11pt]">
                  <div>
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.contactPerson || ''}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        placeholder="<Name of Host Training Establishment Representative>"
                      />
                    ) : (
                      <span className="font-normal">{formData.contactPerson || '<Name of Host Training Establishment Representative>'}</span>
                    )}
                  </div>
                  <div>
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.contactTitle || ''}
                        onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                        placeholder="<Designation>"
                      />
                    ) : (
                      <span className="font-normal text-zinc-800">{formData.contactTitle || '<Designation>'}</span>
                    )}
                  </div>
                  <div>
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="<Name of Host Company>"
                      />
                    ) : (
                      <span className="font-normal">{formData.companyName || '<Name of Host Company>'}</span>
                    )}
                  </div>
                  <div>
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.companyAddress || ''}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                        placeholder="<Address>"
                      />
                    ) : (
                      <span className="font-normal text-zinc-800">{formData.companyAddress || '<Address>'}</span>
                    )}
                  </div>
                </div>

                {/* Salutation */}
                <div className="pt-1 text-[11pt]">
                  <p className="font-normal text-black leading-relaxed">
                    <span>Dear Mr./Ms. </span>
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.salutationName || ''}
                        onChange={(e) => handleInputChange('salutationName', e.target.value)}
                        placeholder="<Name of Host Training Establishment>"
                      />
                    ) : (
                      <span className="font-normal text-black">
                        {formData.salutationName || '<Name of Host Training Establishment>'}
                      </span>
                    )}
                    <span>:</span>
                  </p>
                </div>

                {/* Paragraph 1 */}
                <p className="text-left leading-relaxed text-black text-[11pt]">
                  I, a student of STI{' '}
                  {viewMode === 'form' ? (
                    <AutoWidthInput
                      type="text"
                      value={formData.campusName || ''}
                      onChange={(e) => handleInputChange('campusName', e.target.value)}
                      placeholder="<name of campus>"
                    />
                  ) : (
                    <span className="font-normal border-b border-black px-1">{formData.campusName || '<name of campus>'}</span>
                  )}
                  , am required to undergo{' '}
                  {viewMode === 'form' ? (
                    <AutoWidthInput
                      type="text"
                      value={formData.hoursRequired || ''}
                      onChange={(e) => handleInputChange('hoursRequired', e.target.value)}
                      placeholder="<no. of training hours>"
                    />
                  ) : (
                    <span className="font-normal border-b border-black px-1">{formData.hoursRequired || '<no. of training hours>'}</span>
                  )}{' '}
                  hours of On-the-Job Training (OJT) in partial fulfillment of the requirements for my{' '}
                  {viewMode === 'form' ? (
                    <AutoWidthInput
                      type="text"
                      value={formData.programName || ''}
                      onChange={(e) => handleInputChange('programName', e.target.value)}
                      placeholder="<Name of Program>"
                    />
                  ) : (
                    <span className="font-normal border-b border-black px-1">{formData.programName || '<Name of Program>'}</span>
                  )}{' '}
                  program.
                </p>

                {/* Paragraph 2 */}
                <p className="text-left leading-relaxed text-black text-[11pt]">
                  I can acquire valuable knowledge and skills to complement those I have learned from school with your company. In return, I offer my services and determination to be an asset to your company throughout my training period.
                </p>

                {/* Paragraph 3 */}
                <p className="text-left leading-relaxed text-black text-[11pt]">
                  Enclosed is an endorsement letter from my Program Head and my resume.
                </p>

                {/* Paragraph 4 */}
                <p className="text-left leading-relaxed text-black text-[11pt]">
                  I am hoping for your kind consideration.
                </p>

                {/* Closing */}
                <p className="text-black font-normal text-[11pt]">Thank you.</p>

                <div className="pt-1 text-[11pt]">
                  <p className="text-black font-normal">Respectfully yours,</p>
                </div>

                {/* Signature & Student Name Block */}
                <div className="pt-4 w-64 text-center flex flex-col items-center">
                  {/* Signature input area above line */}
                  <div className="w-full flex items-end justify-center min-h-[26px] mb-0.5">
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.signature || ''}
                        onChange={(e) => handleInputChange('signature', e.target.value)}
                        placeholder="<Signature>"
                        hidePlaceholderInPrint
                        className="text-center font-serif italic text-[11pt] py-0.5 px-2"
                      />
                    ) : formData.signature ? (
                      <span className="font-serif italic text-[12pt] text-zinc-900 select-none">
                        {formData.signature}
                      </span>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>

                  {/* Horizontal Line */}
                  <div className="border-b border-black w-full my-0.5" />

                  {/* Student Name */}
                  <div className="flex justify-center w-full mt-0.5">
                    {viewMode === 'form' ? (
                      <AutoWidthInput
                        type="text"
                        value={formData.studentName || ''}
                        onChange={(e) => handleInputChange('studentName', e.target.value)}
                        placeholder="<Name of Student Trainee>"
                        className="text-center font-normal text-[11pt]"
                      />
                    ) : (
                      <span className="font-normal uppercase tracking-wide text-black text-[11pt]">
                        {formData.studentName || '<Name of Student Trainee>'}
                      </span>
                    )}
                  </div>
                  <p className="text-black font-normal text-[11pt] text-center mt-0.5">OJT Applicant</p>
                </div>
              </div>
            </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <div>
          {generationError && (
            <p className="text-xs text-red-500 font-medium">{generationError}</p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            icon={<Printer size={16} />}
            onClick={handleDownloadPdf}
            disabled={isGeneratingDocx || isGeneratingPdf}
            className="flex-1 sm:flex-none"
          >
            Print / Save PDF
          </Button>
          <Button
            variant="primary"
            icon={<FileText size={16} />}
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx || isGeneratingPdf}
            className="flex-1 sm:flex-none"
          >
            {isGeneratingDocx ? 'Generating DOCX...' : 'Download Customized DOCX'}
          </Button>
        </div>
      </div>
    </div>
  );
};
