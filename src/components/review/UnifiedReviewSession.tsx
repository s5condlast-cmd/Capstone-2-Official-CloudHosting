import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  ArrowLeft,
  User,
  Clock,
  History,
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
  auditLogs: ReviewAuditLog[];
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
    <div className="flex flex-col h-screen max-h-screen bg-zinc-50 dark:bg-zinc-950 pb-4 overflow-hidden absolute inset-0 z-50">
      
      {/* Top Header */}
      <div className="flex-none px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-black dark:text-white tracking-tight leading-none">
                Review Session
              </h1>
              <Badge variant="neutral" className="text-[10px] px-2 py-0.5 h-auto">
                {student.docType}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold">
                <User size={12} className="text-zinc-400" />
                {student.name}
              </div>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="uppercase tracking-wider">{student.course}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>{student.submissionId}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {docId && (
            <Button
              variant="outline"
              className={cn(
                "font-semibold uppercase text-[10px] tracking-wider h-8 transition-all border",
                showAiPanel 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-800 dark:text-indigo-400" 
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
              onClick={() => setShowAiPanel(!showAiPanel)}
              icon={<Brain size={14} />}
            >
              AI Assistant
            </Button>
          )}

          {!readOnly && (
            <>
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900 dark:hover:bg-red-900/30 font-semibold uppercase text-[10px] tracking-wider h-8"
                onClick={() => handleFinalDecision('reject')}
              >
                Reject
              </Button>
              <Button 
                variant="outline" 
                className="font-semibold uppercase text-[10px] tracking-wider h-8"
                onClick={() => handleFinalDecision('revise')}
                icon={<AlertTriangle size={14} />}
              >
                Request Revision
              </Button>
              {onSendToAdmin && (
                <Button 
                  variant="outline" 
                  className="font-semibold uppercase text-[10px] tracking-wider h-8 border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-white hover:bg-zinc-50"
                  onClick={() => handleFinalDecision('sendToAdmin')}
                  icon={<ShieldCheck size={14} />}
                >
                  Send to Admin
                </Button>
              )}
              <Button 
                variant="primary" 
                className="font-semibold uppercase text-[10px] tracking-wider h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                onClick={() => handleFinalDecision('approve')}
                icon={<Check size={14} />}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Queue, Versions, Audit) */}
        <div className="w-[300px] flex-none bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-y-auto">
           
           {/* Queue Status */}
           <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4">Review Status</h3>
             <div className="flex items-center gap-2">
               <div className={cn(
                 "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                 queueStatus === 'In Review' ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10" :
                 queueStatus === 'Completed' ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                 "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
               )}>
                 {queueStatus === 'Completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
               </div>
               <div>
                 <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{queueStatus}</p>
                 <p className="text-[10px] text-zinc-500">Only 1 reviewer can actively review</p>
               </div>
             </div>
           </div>

           {/* Version History */}
           <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
               <span>Version History</span>
               <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[9px]">{versions.length}</span>
             </h3>
             <div className="space-y-3">
               {versions.map((v) => (
                 <button 
                   key={v.id} 
                   className={cn(
                     "w-full flex items-start justify-between p-3 rounded-lg border text-left transition-colors",
                     v.isActive 
                       ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700 shadow-sm" 
                       : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-60 hover:opacity-100"
                   )}
                 >
                   <div>
                     <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">Version {v.version}</p>
                     <p className="text-[10px] text-zinc-500">{v.date}</p>
                   </div>
                   <Badge variant={
                     v.status === 'Approved' || v.status === 'Locked' ? 'success' :
                     v.status === 'Revision Required' ? 'warning' :
                     v.status === 'Archived' ? 'neutral' : 'default'
                   } className="text-[9px] px-1.5 py-0 capitalize">
                     {v.status}
                   </Badge>
                 </button>
               ))}
             </div>
           </div>

           {/* Audit Trail */}
           <div className="p-5">
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
               <History size={12} /> Audit Trail
             </h3>
             <div className="relative pl-3 space-y-4 before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                {auditLogs.map((log, i) => (
                  <div key={i} className="relative flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 absolute -left-[18.5px] top-1.5 border-2 border-white dark:border-zinc-950" />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{log.action}</p>
                      <p className="text-[10px] text-zinc-500">{log.time} · {log.actor}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>

            {/* Adviser/Admin Comments History */}
            {commentsList.length > 0 && (
              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 max-h-56 overflow-y-auto bg-white dark:bg-zinc-950">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Brain size={12} /> Comments History
                </h3>
                <div className="space-y-3">
                  {commentsList.map((comment, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{comment.author}</span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{comment.time}</span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-normal">{comment.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Comment */}
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 mt-auto bg-white dark:bg-zinc-950">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Add Comment</h3>
              <div className="space-y-3">
                <textarea 
                  placeholder="Type your comment..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-24 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                />
                <Button 
                  variant="primary" 
                  className="w-full h-8 text-[10px] uppercase tracking-wider font-semibold" 
                  icon={<Send size={12} />}
                  onClick={handlePostComment}
                  disabled={isPostingComment || !newCommentText.trim()}
                >
                  {isPostingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>

        </div>

        {/* Center/Right: EmbedPDF Workspace + AI Assistant */}
        <div className="flex-1 flex overflow-hidden bg-[#F3F4F6] dark:bg-zinc-900 relative">
          <div className="flex-1 h-full overflow-hidden">
            <EmbedPdfWorkspace 
              pdfUrl={pdfUrl} 
              studentName={student.name}
              docTitle={student.docType}
              readOnly={readOnly}
            />
          </div>

          {docId && showAiPanel && (
            <div className="w-[340px] shrink-0 h-full">
              <AiAssistantPanel 
                findings={aiFindings}
                aiStatus={aiStatus}
                onRunAnalysis={handleRunAiAnalysis}
              />
            </div>
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
