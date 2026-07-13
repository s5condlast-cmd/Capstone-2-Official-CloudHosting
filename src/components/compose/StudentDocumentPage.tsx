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
  Info
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

  const selectedTemplate = templates[selectedTemplateIndex];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Document Preview */}
        <div className="lg:col-span-2 h-full flex flex-col gap-4">
          {templates.length > 1 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Required: Select Document Template</span>
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
                      "px-4 py-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2 text-left",
                      selectedTemplateIndex === idx
                        ? "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-50 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px]",
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
            </div>
          )}

          <DocumentWorkflow
            title={selectedTemplate.title}
            docUrl={selectedTemplate.docUrl}
            templateId={selectedTemplate.id}
            fields={templateFields[getTemplateFilename(selectedTemplate.pdfUrl)] || []}
            useDocxPreview={true}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          <Card title={uploadTitle}>
            <div className="space-y-5">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="text-zinc-500 dark:text-zinc-400 mt-0.5 shrink-0" size={13} />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  <strong>Reminder:</strong> We recommend uploading a scanned PDF. Please ensure all signatures are clearly visible and scanned correctly.
                </p>
              </div>

              <div 
                className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  {isSubmitted ? <CheckCircle2 size={22} className="text-emerald-500" /> : isUploading ? <Upload size={22} className="text-zinc-400 animate-bounce" /> : uploadedFileName ? <FileUp size={22} className="text-emerald-500" /> : <Upload size={22} className="text-zinc-500 dark:text-zinc-400" />}
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {isSubmitted ? 'File Successfully Submitted' : isUploading ? 'Uploading to Database...' : uploadedFileName ? 'File Selected' : uploadDescription}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                  {isSubmitted ? 'Your document is now pending review.' : isUploading ? 'Please wait...' : uploadedFileName ? uploadedFileName : 'PDF only · Max 10MB'}
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
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    isUrgent
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  )}
                >
                  <AlertCircle size={14} className={cn(isUrgent ? "animate-pulse" : "")} />
                  {isUrgent ? "High Priority Enabled" : "Mark as Urgent"}
                </button>
                <Button 
                  icon={status === 'Pending' ? undefined : <ShieldCheck size={14} />}
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : isUploading ? 'Processing...' : status === 'Pending' ? 'Submit for Review' : 'Submit for Processing'}
                </Button>
              </div>
            </div>
          </Card>

          <Card title={status === 'Pending' ? "Status" : "Review Status"}>
            <div className="space-y-5">
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                status === 'Returned' ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700" :
                  "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  status !== 'Pending' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950" :
                    "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                )}>
                  {status === 'Approved' ? (
                    <ShieldCheck size={18} />
                  ) : status === 'Returned' ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {status === 'Approved' ? 'Approved' : status === 'Returned' ? 'Returned' : 'Pending Review'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {lastUpdated ? `Updated ${lastUpdated}` : 'No submission yet'}
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
                  status === 'Returned'
                    ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                )}>
                  {adviserFeedback}
                </div>
              </div>

              {status === 'Returned' && (
                <Button variant="primary" className="w-full" icon={<FileUp size={16} />}>
                  Upload Revised File
                </Button>
              )}
            </div>
          </Card>

          {adviserComments && adviserComments.length > 0 && (
            <Card title="Adviser Comments">
              <div className="space-y-3">
                {adviserComments.map((comment, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-lg border text-sm space-y-1.5",
                    i === adviserComments.length - 1
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
