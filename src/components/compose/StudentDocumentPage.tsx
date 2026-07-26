import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  Upload,
  FileUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  Info,
  UserCheck,
  Users,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { submissionStorage } from '@/src/lib/submissionStorage';
import { aiService } from '@/src/lib/aiService';


export interface DocumentTemplate {
  title: string;
  pdfUrl: string;
  docUrl: string;
  id?: string;
  description?: string;
  instructionsModal?: {
    title: string;
    description: string;
  };
}

export interface StudentDocumentPageProps {
  uploadTitle: string;
  uploadDescription: string;
  templates: DocumentTemplate[];
  status: 'Pending' | 'Approved' | 'Returned';
  submissionInfo: { label: string; value: string }[];
  adviserFeedback: string;
  lastUpdated?: string;
  adviserComments?: { author: string; msg: string; time: string }[];
}

interface ConsentOption {
  label: string;
  index: number;
  template: DocumentTemplate;
}

interface ConsentGroup {
  title: string;
  icon: React.ElementType;
  options: ConsentOption[];
}

const ConsentDropdownButton: React.FC<{
  group: ConsentGroup;
  selectedIndex: number;
  onSelect: (index: number) => void;
}> = ({ group, selectedIndex, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = group.options.find((o) => o.index === selectedIndex);
  const isGroupActive = !!selectedOption;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative flex-1"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all border flex items-center justify-between gap-2.5 shadow-2xs group cursor-pointer",
          isGroupActive
            ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100"
            : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            isGroupActive
              ? "bg-white/20 dark:bg-zinc-950/20 text-white dark:text-zinc-950"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          )}>
            <group.icon size={15} />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-bold text-xs truncate leading-tight">{group.title}</span>
            <span className={cn(
              "text-[10px] truncate font-medium leading-tight",
              isGroupActive ? "opacity-80" : "text-zinc-400 dark:text-zinc-500"
            )}>
              {selectedOption ? selectedOption.label : "Select fee type"}
            </span>
          </div>
        </div>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={15} className={isGroupActive ? "opacity-80" : "text-zinc-400"} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-40 space-y-1"
          >
            {group.options.map((opt) => {
              const isOptionActive = opt.index === selectedIndex;
              return (
                <button
                  key={opt.index}
                  onClick={() => {
                    onSelect(opt.index);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group cursor-pointer",
                    isOptionActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      isOptionActive ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400"
                    )} />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isOptionActive && <CheckCircle2 size={15} className="text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const StudentDocumentPage: React.FC<StudentDocumentPageProps> = ({
  uploadTitle,
  uploadDescription,
  templates,
  status,
  submissionInfo,
  adviserFeedback,
  lastUpdated,
  adviserComments
}) => {
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<{ title: string; description: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedTemplate = templates[selectedTemplateIndex];

  // Consent form grouping
  const isConsentPage = templates.some(t =>
    t.title.toLowerCase().includes('consent') ||
    (t.id && t.id.toLowerCase().includes('consent'))
  );

  const consentGroups: ConsentGroup[] = isConsentPage ? [
    {
      title: "Student Consent Form",
      icon: UserCheck,
      options: [
        {
          label: "With Training Fee",
          index: templates.findIndex(t => t.title.includes('Student Consent') && t.title.includes('With Fee')),
          template: templates.find(t => t.title.includes('Student Consent') && t.title.includes('With Fee'))!
        },
        {
          label: "Without Training Fee",
          index: templates.findIndex(t => t.title.includes('Student Consent') && t.title.includes('Without Fee')),
          template: templates.find(t => t.title.includes('Student Consent') && t.title.includes('Without Fee'))!
        }
      ].filter(o => o.index !== -1)
    },
    {
      title: "Parent Consent Form",
      icon: Users,
      options: [
        {
          label: "With Training Fee",
          index: templates.findIndex(t => t.title.includes('Parent Consent') && t.title.includes('With Fee')),
          template: templates.find(t => t.title.includes('Parent Consent') && t.title.includes('With Fee'))!
        },
        {
          label: "Without Training Fee",
          index: templates.findIndex(t => t.title.includes('Parent Consent') && t.title.includes('Without Fee')),
          template: templates.find(t => t.title.includes('Parent Consent') && t.title.includes('Without Fee'))!
        }
      ].filter(o => o.index !== -1)
    }
  ].filter(g => g.options.length > 0) : [];

  // Dynamic status/feedback state from Supabase
  const [dbDoc, setDbDoc] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<'Pending' | 'Approved' | 'Returned'>(status);
  const [currentFeedback, setCurrentFeedback] = useState<string>(adviserFeedback);
  const [currentLastUpdated, setCurrentLastUpdated] = useState<string | undefined>(lastUpdated);

  React.useEffect(() => {
    async function loadLatest() {
      try {
        const doc = await submissionStorage.getLatestDocumentByType('John Dwayne B. Guaniso', selectedTemplate.title);
        if (doc) {
          setDbDoc(doc);
          if (doc.status === 'Approved') {
            setCurrentStatus('Approved');
            setCurrentFeedback('Document successfully verified and approved.');
          } else if (doc.status === 'Revision Required') {
            setCurrentStatus('Returned');
            setCurrentFeedback('Revision Required. Please re-upload your document.');
          } else {
            setCurrentStatus('Pending');
            setCurrentFeedback('Waiting for adviser to verify your submission.');
          }
          setCurrentLastUpdated(new Date(doc.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        } else {
          setDbDoc(null);
          setCurrentStatus(status);
          setCurrentFeedback(adviserFeedback);
          setCurrentLastUpdated(lastUpdated);
        }
      } catch (err) {
        console.error("Failed to load latest submission", err);
      }
    }
    loadLatest();
  }, [selectedTemplate.title, status, adviserFeedback, lastUpdated, isSubmitted]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setSelectedFile(file);
      setIsSubmitted(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const doc = await submissionStorage.uploadSubmission(
        selectedFile,
        'John Dwayne B. Guaniso',
        'BSIT 402',
        selectedTemplate.title,
        isUrgent ? 'high' : 'medium'
      );

      // Trigger AI Analysis in the background
      const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
      if (isPdf) {
        try {
          await submissionStorage.updateAiFindings(doc.id, 'Processing', null);
          const docUrl = submissionStorage.getFileUrl(doc.file_path);
          const findings = await aiService.analyzeDocument(doc.id, docUrl, {
            name: 'John Dwayne B. Guaniso',
            course: 'BSIT 402',
            docType: selectedTemplate.title,
            company: 'Industry Partner'
          });
          await submissionStorage.updateAiFindings(doc.id, 'Completed', findings);
        } catch (aiErr) {
          console.error("AI Analysis failed:", aiErr);
          await submissionStorage.updateAiFindings(doc.id, 'Failed', null);
        }
      } else {
        // Fallback for non-PDFs (e.g. template docx)
        await submissionStorage.updateAiFindings(doc.id, 'Failed', {
          overallAssessment: 'Needs Attention',
          grammarIssues: 0,
          missingInformation: [],
          consistencyIssues: ["Document uploaded is not a PDF. AI Review Assistant only supports PDF analysis."],
          recommendations: ["Please convert your document to PDF to enable AI analysis."],
          confidence: 'Low'
        });
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left column - Document Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {templates.length > 1 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-3.5 rounded-xl shadow-2xs space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2 flex-wrap px-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                  Required Document Template
                </span>
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 italic">
                  Click a template below to select option
                </span>
              </div>
              {isConsentPage && consentGroups.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  {consentGroups.map((group, idx) => (
                    <ConsentDropdownButton
                      key={idx}
                      group={group}
                      selectedIndex={selectedTemplateIndex}
                      onSelect={(index) => {
                        setSelectedTemplateIndex(index);
                        const t = templates[index];
                        if (t?.instructionsModal) {
                          setActiveModal(t.instructionsModal);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTemplateIndex(idx);
                        if (template.instructionsModal) {
                          setActiveModal(template.instructionsModal);
                        }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2 text-left cursor-pointer",
                        selectedTemplateIndex === idx
                          ? "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-50 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[9px]",
                        selectedTemplateIndex === idx
                          ? "border-white dark:border-zinc-950 bg-white/20 dark:bg-zinc-950/20"
                          : "border-zinc-300 dark:border-zinc-700"
                      )}>
                        {selectedTemplateIndex === idx && "✓"}
                      </div>
                      <span className="leading-snug">{template.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <DocumentWorkflow
              title={selectedTemplate.title}
              docUrl={selectedTemplate.docUrl}
              templateId={selectedTemplate.id}
              fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">
          <Card title={uploadTitle}>
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 flex items-start gap-2">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={13} />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                  Upload a clear scanned PDF with visible signatures.
                </p>
              </div>

              <div
                className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  {isSubmitted ? <CheckCircle2 size={20} className="text-emerald-500" /> : isUploading ? <Upload size={20} className="text-zinc-400 animate-bounce" /> : uploadedFileName ? <FileUp size={20} className="text-emerald-500" /> : <Upload size={20} className="text-zinc-500 dark:text-zinc-400" />}
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5">
                  {isSubmitted ? 'File Submitted' : isUploading ? 'Uploading...' : uploadedFileName ? 'File Selected' : uploadDescription}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 truncate">
                  {isSubmitted ? 'Pending adviser review.' : isUploading ? 'Please wait...' : uploadedFileName ? uploadedFileName : 'PDF or DOCX · Max 10MB'}
                </p>
                <Button
                  variant={uploadedFileName && !isSubmitted ? "primary" : "secondary"}
                  size="sm"
                  aria-label={`Select file for ${uploadTitle}`}
                  disabled={isUploading || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : isUploading ? 'Uploading...' : uploadedFileName ? 'Change File' : 'Select File'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer",
                    isUrgent
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  )}
                >
                  <AlertCircle size={13} className={cn(isUrgent ? "animate-pulse" : "")} />
                  {isUrgent ? "High Priority" : "Mark Urgent"}
                </button>
                <Button
                  icon={currentStatus === 'Pending' ? undefined : <ShieldCheck size={14} />}
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : isUploading ? 'Processing...' : currentStatus === 'Pending' ? 'Submit' : 'Submit File'}
                </Button>
              </div>
            </div>
          </Card>

          <Card title={currentStatus === 'Pending' ? "Status" : "Review Status"}>
            <div className="space-y-5">
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                currentStatus === 'Returned' ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700" :
                  "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  currentStatus !== 'Pending' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" :
                    "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                )}>
                  {currentStatus === 'Approved' ? (
                    <ShieldCheck size={18} />
                  ) : currentStatus === 'Returned' ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentStatus === 'Approved' ? 'Approved' : currentStatus === 'Returned' ? 'Returned' : 'Pending Review'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {currentLastUpdated ? `Updated ${currentLastUpdated}` : 'No submission yet'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <MessageSquare size={13} />
                  <span className="text-[11px] font-medium">Adviser Feedback</span>
                </div>
                <div className={cn(
                  "p-3 rounded-lg text-sm leading-relaxed",
                  currentStatus === 'Returned'
                    ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                )}>
                  {currentFeedback}
                </div>
              </div>

              {currentStatus === 'Returned' && (
                <Button variant="primary" className="w-full" icon={<FileUp size={16} />}>
                  Upload Revised File
                </Button>
              )}
            </div>
          </Card>

          {((dbDoc && dbDoc.comments && dbDoc.comments.length > 0) || (adviserComments && adviserComments.length > 0)) && (
            <Card title="Adviser Comments">
              <div className="space-y-3">
                {((dbDoc && dbDoc.comments) || adviserComments || []).map((comment: any, i: number, arr: any[]) => (
                  <div key={i} className={cn(
                    "p-3 rounded-lg border text-sm space-y-1.5",
                    i === arr.length - 1
                      ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                      : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                  )}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{comment.author}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">{comment.time}</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{comment.msg}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Submission Info">
            <div className="space-y-3">
              {submissionInfo.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.label}</span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                  <Info size={16} className="text-zinc-500" />
                  <span>Important Instructions</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">
                    {activeModal.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {activeModal.description}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setActiveModal(null)}>
                  Understood
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
