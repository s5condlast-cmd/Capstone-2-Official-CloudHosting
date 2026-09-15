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
  ChevronDown,
  Cloud,
  Lock,
  Send,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { DocumentWorkflow } from '@/src/components/compose/DocumentWorkflow';
import { templateFields, getTemplateFilename } from '@/src/components/review/templateFields';
import { submissionStorage } from '@/src/lib/submissionStorage';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { templateStorage } from '@/src/lib/templateStorage';
import { aiService } from '@/src/lib/aiService';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';


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
  isLocked?: boolean;
  lockedMessage?: string;
  extraSidebarContent?: React.ReactNode;
  headerAction?: React.ReactNode;
  showOneDriveCard?: boolean;
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
  adviserComments,
  isLocked = false,
  lockedMessage,
  extraSidebarContent,
  headerAction,
  showOneDriveCard = true
}) => {
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<{ title: string; description: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectedTemplate = templates[selectedTemplateIndex];

  // Proposal letter identification: suppress OneDrive card on Proposal Letter only
  const isProposalPage = templates.some(t =>
    t.title.toLowerCase().includes('proposal') ||
    (t.id && t.id.toLowerCase().includes('proposal'))
  ) || uploadTitle.toLowerCase().includes('proposal');

  const shouldShowOneDrive = showOneDriveCard && !isProposalPage;

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
  const { user } = useAuth();
  const studentName = user?.name || 'John Dwayne B. Guaniso';
  const studentCourse = user?.course || user?.section || 'BSIT 402';

  const [dbDoc, setDbDoc] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<'Pending' | 'Approved' | 'Returned'>(status);
  const [currentFeedback, setCurrentFeedback] = useState<string>(adviserFeedback);
  const [currentLastUpdated, setCurrentLastUpdated] = useState<string | undefined>(lastUpdated);

  React.useEffect(() => {
    async function loadLatest() {
      try {
        const doc = await submissionStorage.getLatestDocumentByType(studentName, selectedTemplate.title);
        if (doc) {
          setDbDoc(doc);
          if (doc.status === 'Approved') {
            setCurrentStatus('Approved');
            setCurrentFeedback(doc.adviser_feedback || 'Document successfully verified and approved.');
          } else if (doc.status === 'Revision Required') {
            setCurrentStatus('Returned');
            setCurrentFeedback(doc.adviser_feedback || 'Revision Required. Please re-upload your document.');
          } else {
            setCurrentStatus('Pending');
            setCurrentFeedback(doc.adviser_feedback || 'Waiting for adviser to verify your submission.');
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

  const handlePickedFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      toast.error('Only PDF or DOCX files are supported.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.');
      return;
    }
    setUploadedFileName(file.name);
    setSelectedFile(file);
    setIsSubmitted(false);
    toast.info(`Selected "${file.name}" (${(file.size / 1024).toFixed(0)} KB)`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePickedFile(file);
    }
  };

  const executeUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    try {
      const doc = await submissionStorage.uploadSubmission(
        fileToUpload,
        studentName,
        studentCourse,
        selectedTemplate.title,
        isUrgent ? 'high' : 'medium'
      );

      // Trigger AI Analysis in the background for PDFs
      const isPdf = fileToUpload.type === 'application/pdf' || fileToUpload.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          await submissionStorage.updateAiFindings(doc.id, 'Processing', null);
          const docUrl = await submissionStorage.getFileUrl(doc.file_path);
          const findings = await aiService.analyzeDocument(doc.id, docUrl, {
            name: studentName,
            course: studentCourse,
            docType: selectedTemplate.title,
            company: 'Industry Partner'
          });
          await submissionStorage.updateAiFindings(doc.id, 'Completed', findings);
        } catch (aiErr) {
          console.error("AI Analysis failed:", aiErr);
          await submissionStorage.updateAiFindings(doc.id, 'Failed', null);
        }
      } else {
        // Formatted DOCX submission
        await submissionStorage.updateAiFindings(doc.id, 'Completed', {
          overallAssessment: 'Valid Submission',
          grammarIssues: 0,
          missingInformation: [],
          consistencyIssues: ["Document uploaded in DOCX format and archived to Microsoft OneDrive."],
          recommendations: ["Adviser will review document formatting and signature."],
          confidence: 'High'
        });
      }

      setDbDoc(doc);
      setCurrentStatus('Pending');
      setCurrentFeedback('Waiting for adviser to verify your submission.');
      setCurrentLastUpdated(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      setIsSubmitted(true);

      if (doc.onedrive_url) {
        toast.success(
          <div>
            <p className="font-bold">Submitted to Adviser & Archived!</p>
            <p className="text-xs opacity-90">Your file is in the Adviser Review Hub and saved to Microsoft OneDrive.</p>
          </div>
        );
      } else {
        toast.success('Document submitted to adviser successfully!');
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error(error?.message || "Upload failed. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await executeUpload(selectedFile);
      return;
    }

    // If no file picked, auto-generate DOCX from template and submit
    toast.info("Generating DOCX to submit to adviser...");
    try {
      const blob = await documentGenerator.generateDocx(
        selectedTemplate.docUrl,
        {
          studentName,
          programName: studentCourse,
          date: new Date().toISOString().split('T')[0]
        },
        [],
        {},
        {},
        [],
        selectedTemplate.id,
        selectedTemplate.title
      );
      const cleanTitle = selectedTemplate.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      const file = new File([blob], `${cleanTitle}_Filled.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      setSelectedFile(file);
      setUploadedFileName(file.name);
      await executeUpload(file);
    } catch (e: any) {
      toast.error("Please select a DOCX or PDF file first.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left column - Document Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {templates.length > 1 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs space-y-2.5 shrink-0">
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
                        "px-3 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2 text-left cursor-pointer",
                        selectedTemplateIndex === idx
                          ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100 shadow-2xs"
                          : "bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[9px] font-black",
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
              key={selectedTemplate.id || selectedTemplate.title}
              title={selectedTemplate.title}
              docUrl={selectedTemplate.docUrl}
              pdfUrl={selectedTemplate.pdfUrl}
              templateId={selectedTemplate.id}
              fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">
          <Card title={uploadTitle} action={headerAction}>
            <div className="space-y-4">
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={14} />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Upload a clear PDF or DOCX file with required details and signatures.
                </p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all relative overflow-hidden group",
                  isLocked
                    ? "border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 cursor-not-allowed"
                    : isDragOver
                      ? "border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer scale-[1.01]"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/40 hover:bg-zinc-50/80 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/50 cursor-pointer"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isLocked) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (!isLocked && e.dataTransfer.files?.[0]) {
                    handlePickedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => !isLocked && fileInputRef.current?.click()}
              >
                {isLocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xs">
                    <Lock size={22} className="text-zinc-400 dark:text-zinc-500 mb-1.5" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{lockedMessage || 'Unlocks at 460 hours'}</span>
                  </div>
                )}
                <div className="w-11 h-11 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                  {isSubmitted ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : isUploading ? (
                    <Upload size={20} className="text-zinc-400 animate-bounce" />
                  ) : selectedFile ? (
                    <FileUp size={20} className="text-emerald-500" />
                  ) : (
                    <Upload size={20} className="text-zinc-500 dark:text-zinc-400" />
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                  {isSubmitted ? 'File Submitted' : isUploading ? 'Uploading & Archiving...' : selectedFile ? 'File Ready to Submit' : uploadDescription}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 truncate">
                  {isSubmitted
                    ? (uploadedFileName || 'Pending adviser review.')
                    : isUploading
                      ? 'Archiving to OneDrive & database...'
                      : selectedFile
                        ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)`
                        : 'PDF or DOCX · Max 15MB'}
                </p>
                <Button
                  variant={selectedFile && !isSubmitted ? "primary" : "secondary"}
                  size="sm"
                  className="h-8 text-[11px] font-bold cursor-pointer"
                  aria-label={`Select file for ${uploadTitle}`}
                  disabled={isLocked || isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {isSubmitted ? 'Upload Revision' : isUploading ? 'Uploading...' : selectedFile ? 'Change File' : 'Select File'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,application/pdf,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleFileSelect}
                  disabled={isLocked}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  disabled={isLocked}
                  className={cn(
                    "w-1/2 flex items-center justify-center gap-1.5 px-2 h-8 rounded-lg text-[11px] font-bold transition-all border shrink-0",
                    isLocked ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400" : "cursor-pointer",
                    isUrgent
                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100"
                      : "bg-zinc-50/60 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  )}
                >
                  <AlertCircle size={12} className={cn(isUrgent ? "animate-pulse" : "")} />
                  {isUrgent ? "High Priority" : "Mark Urgent"}
                </button>
                <Button
                  variant="primary"
                  className="w-1/2 h-8 text-[11px] font-bold justify-center shrink-0 px-2 cursor-pointer"
                  icon={currentStatus === 'Pending' && isSubmitted ? undefined : <ShieldCheck size={12} />}
                  onClick={handleSubmit}
                  disabled={isLocked || isUploading}
                >
                  {isUploading
                    ? 'Submitting...'
                    : isSubmitted
                      ? 'Re-Submit'
                      : 'Submit to Adviser'}
                </Button>
              </div>

              {shouldShowOneDrive && (
                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                  <a
                    href={dbDoc?.onedrive_url || "https://onedrive.live.com?cid=D9646D9033CEACF0&id=D9646D9033CEACF0!sbcec97914ef14503aaaa786bd628bc60"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all group",
                      isSubmitted || dbDoc?.onedrive_url
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-zinc-50/50 hover:bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                    title="Open STI_Practicum_Archive in Microsoft OneDrive"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Cloud size={16} className={isSubmitted || dbDoc?.onedrive_url ? "text-emerald-500" : "text-sky-500"} />
                      <div className="flex flex-col text-left truncate">
                        <span className="font-bold text-[11px] leading-tight text-zinc-900 dark:text-zinc-100">
                          {isSubmitted || dbDoc?.onedrive_url ? 'Archived in Microsoft OneDrive' : 'OneDrive Sync Connected'}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          STI_Practicum_Archive
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline group-hover:translate-x-0.5 transition-transform shrink-0">
                      Open OneDrive ↗
                    </span>
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card title={currentStatus === 'Pending' ? "Status" : "Review Status"}>
            <div className="space-y-4">
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                  currentStatus === 'Approved'
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : currentStatus === 'Returned'
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700/80"
                )}>
                  {currentStatus === 'Approved' ? (
                    <ShieldCheck size={17} />
                  ) : currentStatus === 'Returned' ? (
                    <AlertCircle size={17} />
                  ) : (
                    <Clock size={17} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {currentStatus === 'Approved' ? 'Approved' : currentStatus === 'Returned' ? 'Returned' : 'Pending Review'}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    {currentLastUpdated ? `Updated ${currentLastUpdated}` : 'No submission yet'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={11} /> Adviser Feedback
                </h4>
                <div className={cn(
                  "p-3 rounded-xl text-xs leading-relaxed font-medium border transition-all",
                  currentStatus === 'Returned'
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 border-l-3 border-l-amber-500"
                    : "bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                )}>
                  {currentFeedback}
                </div>
              </div>

              {currentStatus === 'Returned' && (
                <Button variant="primary" className="w-full h-8 text-[11px] font-bold justify-center" icon={<FileUp size={14} />}>
                  Upload Revised File
                </Button>
              )}
            </div>
          </Card>

          {extraSidebarContent}

          {((dbDoc && dbDoc.comments && dbDoc.comments.length > 0) || (adviserComments && adviserComments.length > 0)) && (
            <Card title="Adviser Comments">
              <div className="space-y-2.5">
                {((dbDoc && dbDoc.comments) || adviserComments || []).map((comment: any, i: number, arr: any[]) => (
                  <div key={i} className={cn(
                    "p-3 rounded-xl border text-xs space-y-1.5 transition-all",
                    i === arr.length - 1
                      ? "bg-zinc-50/90 dark:bg-zinc-900/70 border-zinc-200/80 dark:border-zinc-800/80 border-l-3 border-l-zinc-950 dark:border-l-zinc-100"
                      : "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80"
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
            <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {submissionInfo.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">{item.label}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.value}</span>
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
