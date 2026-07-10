import React, { useEffect, useState, useRef } from 'react';
import { FileText, Download, ExternalLink, Edit3, X, AlertCircle } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { DTRPreview } from '@/src/components/templates/DTRPreview';
import { templateFields, getTemplateFilename, type FormField } from './templateFields';
import { templateStorage } from '@/src/lib/templateStorage';
import { extractTagsFromDocx } from '@/src/lib/templateParser';

interface PdfDocumentViewerProps {
  title: string;
  pdfUrl: string;
  docUrl?: string;
  studentName?: string;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  title,
  pdfUrl,
  docUrl,
  studentName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Live Preview & Dynamic Fields State
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([]);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback fields if dynamic extraction fails or hasn't run yet
  const filename = getTemplateFilename(pdfUrl);
  const staticFields: FormField[] = templateFields[filename] || [];
  const fieldsToUse = dynamicFields.length > 0 ? dynamicFields : staticFields;

  // Pre-fill student name if available
  useEffect(() => {
    if (studentName) {
      setFormData(prev => ({ ...prev, studentName }));
    }
  }, [studentName]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
  };

  // Load the base template when editing starts
  useEffect(() => {
    if (isEditing && !templateBuffer) {
      const loadTemplate = async () => {
        try {
          let buffer: ArrayBuffer | undefined = undefined;
          
          // 1. Try to find a dynamically uploaded template that matches the title
          const metadata = await templateStorage.getMetadata();
          if (metadata) {
            // Find by matching the title or if the docUrl contains the uploaded template name
            const match = metadata.find(m => title.toLowerCase().includes(m.name.toLowerCase()) || (docUrl && docUrl.includes(m.name)));
            if (match) {
              buffer = await templateStorage.getTemplateFile(match.id);
            }
          }

          // 2. Fallback to fetching the hardcoded docUrl
          if (!buffer && docUrl) {
            const response = await fetch(docUrl);
            if (response.ok) {
              buffer = await response.arrayBuffer();
            }
          }

          if (buffer) {
            setTemplateBuffer(buffer);
            // 3. Dynamically extract the {tags} from the .docx file to build the UI form!
            const extracted = await extractTagsFromDocx(buffer);
            if (extracted.length > 0) {
              setDynamicFields(extracted);
            }
          }
        } catch (err) {
          console.error("Failed to load template", err);
        }
      };
      
      loadTemplate();
    }
  }, [isEditing, docUrl, templateBuffer, title]);

  // Debounced live preview rendering
  useEffect(() => {
    if (!isEditing || !templateBuffer || !containerRef.current) return;

    let isStale = false;

    const renderPreview = async () => {
      setIsPreviewRendering(true);
      try {
        const { TemplateHandler } = await import('easy-template-x');
        const handler = new TemplateHandler();
        const outputBuffer = await handler.process(templateBuffer, formData);
        
        if (isStale) return;

        const { renderAsync } = await import('docx-preview');
        await renderAsync(outputBuffer, containerRef.current!, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: true,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          debug: false
        });
      } catch (err) {
        console.error("Live preview error:", err);
      } finally {
        if (!isStale) setIsPreviewRendering(false);
      }
    };

    const timeoutId = setTimeout(renderPreview, 400);
    return () => {
      isStale = true;
      clearTimeout(timeoutId);
    };
  }, [formData, templateBuffer, isEditing]);

  const downloadDocx = async () => {
    if (!templateBuffer) return;
    setIsGenerating(true);

    try {
      const { TemplateHandler } = await import('easy-template-x');
      const handler = new TemplateHandler();
      const outputBuffer = await handler.process(templateBuffer, formData);

      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_filled.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate DOCX:', error);
      alert('Could not generate the document. Make sure the template file exists and has {placeholder} tags added in Microsoft Word.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="min-h-[600px] flex flex-col pt-0 px-0 pb-0 overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center sticky top-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">{title}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              {studentName ? `Submitted by ${studentName}` : 'Document Template'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* We allow editing if there is a docUrl OR if we managed to load a template buffer dynamically */}
          {(docUrl || templateBuffer) && (
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-[10px] font-semibold"
              title={isEditing ? 'Close Editor' : 'Fill Form'}
            >
              {isEditing ? <X size={14} /> : <Edit3 size={14} />}
              <span className="hidden sm:inline-block">{isEditing ? 'Close' : 'Fill Form'}</span>
            </button>
          )}

          <Badge variant="outline" className="text-[10px] font-semibold uppercase border-black dark:border-white text-black dark:text-white hidden sm:inline-flex">
            {isEditing ? 'FORM' : '.PDF'}
          </Badge>

          {isEditing ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={downloadDocx}
              disabled={isGenerating || !templateBuffer}
              className="text-xs h-8 px-3"
            >
              {isGenerating ? 'Generating...' : 'Download .docx'}
            </Button>
          ) : (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900"
                title="Open in New Tab"
              >
                <ExternalLink size={14} />
              </a>
              <a
                href={pdfUrl}
                download
                className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900"
                title="Download PDF"
              >
                <Download size={14} />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative min-h-[550px]">
        {!isEditing ? (
          /* PDF Viewer */
          <div className="absolute inset-0 custom-scrollbar overflow-y-auto">
            {pdfUrl === '/sample-journal.pdf' ? (
              <div className="flex justify-center min-h-full">
                <div className="bg-white text-black w-full max-w-[800px] shadow-sm border-x border-zinc-300 p-12 sm:p-16 font-serif text-sm relative" style={{ minHeight: '1056px', height: 'fit-content' }}>
                  <div className="text-center mb-12 border-b-2 border-black pb-6">
                    <h1 className="font-bold text-2xl uppercase tracking-[0.2em] mb-2">{title}</h1>
                    <h2 className="text-sm tracking-widest uppercase text-zinc-600">On-the-Job Training Practicum</h2>
                    <div className="mt-4 flex justify-between text-xs font-bold text-left w-full">
                      <div>
                        <p>Student: {studentName}</p>
                        <p>Company: Tech Solutions Inc.</p>
                      </div>
                      <div className="text-right">
                        <p>Period: April 01 - April 30, 2026</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 text-justify leading-relaxed text-base">
                    <p><span className="ml-12"></span>During this period, I focused on learning the company's tech stack including React, Node.js, and PostgreSQL.</p>
                    <div className="mt-24 pt-8 grid grid-cols-2 gap-12">
                      <div className="text-center">
                        <div className="border-b border-black mb-2 w-full h-8"></div>
                        <p className="font-bold text-sm uppercase">{studentName}</p>
                        <p className="text-xs text-zinc-500">Student Trainee</p>
                      </div>
                      <div className="text-center">
                        <div className="border-b border-black mb-2 w-full h-8"></div>
                        <p className="font-bold text-sm uppercase">Mr. Juan Dela Cruz</p>
                        <p className="text-xs text-zinc-500">Industry Supervisor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : pdfUrl === '/sample-dtr.pdf' ? (
              <div className="flex justify-center min-h-full">
                <div className="bg-white dark:bg-zinc-950 text-black dark:text-white w-full max-w-[800px] shadow-sm border-x border-zinc-300 dark:border-zinc-800 p-8 font-sans text-sm relative" style={{ minHeight: '1056px', height: 'fit-content' }}>
                  <DTRPreview />
                </div>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-800 z-10">
                    <div className="w-10 h-10 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-400 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse tracking-wide">Loading PDF...</p>
                  </div>
                )}
                <iframe
                  src={`${pdfUrl}#toolbar=1&view=FitH`}
                  className={`absolute inset-0 w-full h-full border-0 bg-zinc-200 dark:bg-zinc-800 ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
                  title={`${title} - PDF Viewer`}
                  onLoad={() => setIsLoading(false)}
                />
              </>
            )}
          </div>
        ) : (
          /* Two-Panel Fill Form */
          <div className="absolute inset-0 flex overflow-hidden">
            {/* Left — Live DOCX Preview */}
            <div className="flex-1 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto bg-zinc-100 dark:bg-zinc-800 relative custom-scrollbar">
              <div className="absolute top-0 inset-x-0 p-2 bg-zinc-200 dark:bg-zinc-700 flex justify-center items-center gap-2 z-10">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Live Document Preview
                </span>
                {isPreviewRendering && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Updating preview..." />
                )}
              </div>
              
              {!templateBuffer ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <div className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-zinc-500">Loading Template Engine...</p>
                </div>
              ) : (
                <div className="pt-[40px] min-h-full w-full">
                  <div 
                    ref={containerRef} 
                    className="w-full h-full overflow-auto docx-preview-container"
                  />
                </div>
              )}
            </div>

            {/* Right — Form Panel */}
            <div className="w-[380px] shrink-0 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fill In The Blanks</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Watch the document update in real-time</p>
                {dynamicFields.length > 0 && (
                  <Badge variant="outline" className="mt-2 text-[9px] bg-blue-50 text-blue-600 border-blue-200">
                    Fields Auto-Generated
                  </Badge>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {fieldsToUse.length === 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">No template tags found</p>
                      <p className="mt-0.5 text-amber-600 dark:text-amber-500">Open the .docx file in Microsoft Word and add {'{'}<span>placeholder</span>{'}'} tags to the blank lines first.</p>
                    </div>
                  </div>
                )}

                {fieldsToUse.length > 0 && fieldsToUse.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full text-xs px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full text-xs px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Download Footer */}
              {fieldsToUse.length > 0 && (
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={downloadDocx}
                    disabled={isGenerating || !templateBuffer}
                    className="w-full text-xs h-9"
                  >
                    {isGenerating ? 'Generating Document...' : 'Download Filled .docx'}
                  </Button>
                  <p className="text-[10px] text-zinc-400 text-center mt-2">
                    The original formatting and layout will be preserved exactly.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
