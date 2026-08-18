import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
  Download,
  FileText,
  ChevronRight,
  ShieldCheck,
  Send,
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { EmbedPdfWorkspace } from './EmbedPdfWorkspace';
import { AiAssistantPanel } from './AiAssistantPanel';
import { submissionStorage } from '@/src/lib/submissionStorage';
import { aiService } from '@/src/lib/aiService';
import { Brain } from 'lucide-react';


export interface ReviewAuditLog {
  time: string;
  action: string;
  actor: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  status: 'Submitted' | 'Reviewed' | 'Revision Required' | 'Approved' | 'Archived' | 'Locked';
  date: string;
  isActive: boolean;
}

export interface StudentInfo {
  name: string;
  course: string;
  docType: string;
  submissionId: string;
  company: string;
}

export interface UnifiedReviewSessionProps {
  student: StudentInfo;
  pdfUrl: string;
  queueStatus: 'Pending' | 'Assigned' | 'In Review' | 'Completed';
  versions: DocumentVersion[];
  auditLogs?: ReviewAuditLog[];
  onBack: () => void;
  onApprove: (remarks?: string) => void;
  onRequestRevision: (remarks?: string) => void;
  onReject: (remarks?: string) => void;
  readOnly?: boolean;
  docId?: string;
  initialAiStatus?: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  initialAiFindings?: any;
  onSendToAdmin?: () => void;
}

export const UnifiedReviewSession: React.FC<UnifiedReviewSessionProps> = ({
  student,
  pdfUrl,
  queueStatus,
  versions,
  auditLogs,
  onBack,
  onApprove,
  onRequestRevision,
  onReject,
  readOnly = false,
  docId,
  initialAiStatus = 'Pending',
  initialAiFindings = null,
  onSendToAdmin
}) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionAction, setCompletionAction] = useState<'approve' | 'revise' | 'reject' | 'sendToAdmin' | null>(null);
  
  // AI Review Assistant States
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [aiStatus, setAiStatus] = useState<'Pending' | 'Processing' | 'Completed' | 'Failed'>(initialAiStatus);
  const [aiFindings, setAiFindings] = useState<any>(initialAiFindings);

  // Dynamic comments list & decision remarks
  const [commentsList, setCommentsList] = useState<{ author: string; msg: string; time: string }[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState('');

  useEffect(() => {
    async function loadComments() {
      if (!docId || docId.length <= 10) return;
      try {
        const doc = await submissionStorage.getDocumentById(docId);
        if (doc && doc.comments) {
          setCommentsList(doc.comments);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      }
    }
    loadComments();
  }, [docId]);

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !docId) return;
    setIsPostingComment(true);
    try {
      const author = 'Admin';
      if (docId.length > 10) {
        await submissionStorage.postComment(docId, author, newCommentText);
      }
      
      const newComment = {
        author,
        msg: newCommentText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
      };
      setCommentsList(prev => [...prev, newComment]);
      setNewCommentText('');
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!docId || !pdfUrl) return;
    setAiStatus('Processing');
    try {
      if (docId.length <= 10) {
        // Simulate analysis for mock documents
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAiFindings({
          overallAssessment: 'Needs Attention',
          confidence: 'High',
          grammarIssues: 4,
          missingInformation: [
            'DTR Reference (Mismatch between log dates and submitted journal page dates.)'
          ],
          consistencyIssues: [
            'Date format on Section 2 differs from main header date.'
          ],
          recommendations: [
            'Ensure all date fields follow the YYYY-MM-DD standard format.',
            'Cross check the total OJT hours with the supervisor signature block.'
          ]
        });
        setAiStatus('Completed');
        return;
      }

      const findings = await aiService.analyzeDocument(docId, pdfUrl, {
        name: student.name,
        course: student.course,
        docType: student.docType,
        company: student.company
      });
      
      setAiFindings(findings);
      setAiStatus('Completed');
    } catch (err) {
      console.error("Manual AI Analysis failed:", err);
      setAiStatus('Failed');
    }
  };

  const handleFinalDecision = (action: 'approve' | 'revise' | 'reject' | 'sendToAdmin') => {
    setCompletionAction(action);
    setShowCompletionModal(true);
  };

  const confirmAction = () => {
    if (completionAction === 'approve') onApprove(decisionRemarks);
    else if (completionAction === 'sendToAdmin' && onSendToAdmin) onSendToAdmin();
    else if (completionAction === 'revise') onRequestRevision(decisionRemarks);
    else if (completionAction === 'reject') onReject(decisionRemarks);
    setShowCompletionModal(false);
    setDecisionRemarks('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Overview Header (Matching WeeklyJournalReview.tsx) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Back to Review Hub"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Document Review Session
            </h1>
            <Badge variant="neutral" className="text-[10px] px-2 py-0.5 ml-2">
              {student.docType}
            </Badge>
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Reviewing document submission for <span className="font-bold text-zinc-900 dark:text-zinc-100">{student.name}</span> ({student.course} · ID: {student.submissionId}).
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            icon={<ArrowLeft size={14} />}
            className="text-xs font-semibold"
          >
            Back to List
          </Button>
        </div>
      </div>

      {/* Main Content Area (Matching WeeklyJournalReview 9-col / 3-col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: EmbedPDF Workspace Card (9 cols) */}
        <div className="lg:col-span-9 flex flex-col space-y-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex flex-col shadow-xs overflow-hidden h-[720px]">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-3 border-b border-zinc-200/60 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Document Preview: {student.name} ({student.docType})
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                  Inspecting submitted document and attendance matrix log
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 text-xs font-bold transition-colors"
                  >
                    <Download size={13} /> Download File
                  </a>
                )}
              </div>
            </div>

            {/* EmbedPDF Workspace Canvas */}
            <div className="flex-1 w-full min-h-0 overflow-hidden relative bg-zinc-900 flex">
              <div className="flex-1 h-full overflow-hidden">
                <EmbedPdfWorkspace 
                  pdfUrl={pdfUrl} 
                  studentName={student.name}
                  docTitle={student.docType}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification & Action Cards (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: Review Status & Version Pipeline */}
          <Card title="Status & Version History">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2",
                    queueStatus === 'In Review' ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10" :
                    queueStatus === 'Completed' ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                    "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                  )}>
                    {queueStatus === 'Completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{queueStatus}</p>
                    <p className="text-[10px] text-zinc-500">Active Review Session</p>
                  </div>
                </div>
                <Badge variant={readOnly ? 'neutral' : 'warning'} className="text-[9px]">
                  {readOnly ? 'Audit Mode' : 'In Review'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Version History</span>
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[9px]">{versions.length}</span>
                </h4>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div 
                      key={v.id} 
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors text-xs",
                        v.isActive 
                          ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700 font-bold" 
                          : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 opacity-60"
                      )}
                    >
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">Version {v.version}</p>
                        <p className="text-[10px] text-zinc-500 font-normal">{v.date}</p>
                      </div>
                      <Badge variant={v.status === 'Approved' ? 'success' : 'warning'} className="text-[9px]">
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Reviewer Actions & Verification Feedback */}
          <Card title={readOnly ? "Read-Only Audit Overview" : "Verification & Feedback"}>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                  {readOnly ? "Audit Note" : "Reviewer Instructions / Remarks"}
                </label>
                <textarea 
                  placeholder={readOnly ? "Read-only audit view..." : "Provide specific feedback or revision instructions..."} 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={readOnly}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-20 placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                />
              </div>

              {!readOnly ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-1/2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900 text-xs h-8 justify-center font-bold"
                      onClick={() => handleFinalDecision('reject')}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-1/2 text-xs h-8 justify-center font-bold"
                      onClick={() => handleFinalDecision('revise')}
                      icon={<AlertTriangle size={13} />}
                    >
                      Revise
                    </Button>
                  </div>

                  {onSendToAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full text-xs h-8 justify-center font-bold border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-white hover:bg-zinc-50"
                      onClick={() => handleFinalDecision('sendToAdmin')}
                      icon={<ShieldCheck size={13} />}
                    >
                      Send to Admin
                    </Button>
                  )}

                  <Button 
                    variant="primary" 
                    className="w-full text-xs h-8 justify-center font-bold"
                    onClick={() => handleFinalDecision('approve')}
                    icon={<Check size={13} />}
                  >
                    Approve Document
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-center space-y-1 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Read-Only Audit Mode</span>
                  <p className="text-[10px] text-zinc-500">Admins have read-only document inspection access.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Comments History (if comments exist) */}
          {commentsList.length > 0 && (
            <Card title="Comments History">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commentsList.map((comment, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                      <span>{comment.author}</span>
                      <span>{comment.time}</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium">"{comment.msg}"</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

      </div>

      {/* Review Completion Screen Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center border-b border-zinc-100 dark:border-zinc-800">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
                  completionAction === 'approve' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" :
                  completionAction === 'sendToAdmin' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20" :
                  completionAction === 'revise' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" :
                  "bg-red-100 text-red-600 dark:bg-red-500/20"
                )}>
                  {completionAction === 'approve' ? <Check size={24} /> :
                   completionAction === 'sendToAdmin' ? <ShieldCheck size={24} /> :
                   completionAction === 'revise' ? <AlertTriangle size={24} /> :
                   <X size={24} />}
                </div>
                <h2 className="text-base font-bold text-black dark:text-white mb-1">
                  {completionAction === 'approve' ? 'Approve Document?' :
                   completionAction === 'sendToAdmin' ? 'Send to Admin?' :
                   completionAction === 'revise' ? 'Request Revision?' :
                   'Reject Document?'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You are about to mark this document as <strong className="text-black dark:text-white capitalize">
                    {completionAction === 'revise' ? 'Revision Required' : 
                     completionAction === 'sendToAdmin' ? 'Pending Final Approval' : 
                     completionAction === 'approve' ? 'Approved' : 
                     completionAction}
                  </strong>.
                </p>
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                 <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Review Summary</h3>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-medium">Document</span>
                   <span className="text-zinc-900 dark:text-zinc-100 font-bold">{student.docType}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-medium">Student</span>
                   <span className="text-zinc-900 dark:text-zinc-100 font-bold">{student.name}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-medium">Reviewed On</span>
                   <span className="text-zinc-900 dark:text-zinc-100 font-bold">{new Date().toLocaleDateString()}</span>
                 </div>
                 
                 {/* Decision Remarks/Feedback Input */}
                 <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                   <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Adviser Feedback / Remarks</label>
                   <textarea
                     placeholder="Provide feedback details (e.g. explain why revision is required or stamp signature confirmation)..."
                     value={decisionRemarks}
                     onChange={(e) => setDecisionRemarks(e.target.value)}
                     className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-20 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                   />
                 </div>
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-950">
                <Button variant="outline" size="sm" onClick={() => setShowCompletionModal(false)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={confirmAction}
                  className={cn(
                    completionAction === 'approve' ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" :
                    completionAction === 'sendToAdmin' ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600" :
                    completionAction === 'revise' ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" :
                    "bg-red-600 hover:bg-red-700 text-white border-red-600"
                  )}
                  icon={completionAction === 'approve' ? <Check size={14} /> : completionAction === 'sendToAdmin' ? <ShieldCheck size={14} /> : undefined}
                >
                  Confirm & Lock
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
