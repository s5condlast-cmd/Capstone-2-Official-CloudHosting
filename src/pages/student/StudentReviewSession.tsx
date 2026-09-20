/**
 * StudentReviewSession.tsx
 * Dedicated student page to inspect submitted documents, track adviser verification
 * status, read institutional feedback, reply to comment threads, and submit revisions.
 * Works seamlessly for both PDF and DOCX submissions.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Send,
  Upload,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  Cloud,
  FileUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { EmbedPdfWorkspace } from '@/src/components/review/EmbedPdfWorkspace';
import { submissionStorage, StudentDocument } from '@/src/lib/submissionStorage';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export function StudentReviewSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState<StudentDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [originalDocxUrl, setOriginalDocxUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Discussion comments state
  const [commentsList, setCommentsList] = useState<{ author: string; msg: string; time: string }[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);

  // Revision re-upload state
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studentName = user?.name || (user as any)?.full_name || 'Student';
  const studentCourse = user?.course || user?.section || 'BSIT';

  // ── Load document and assets ─────────────────────────────────────────────
  const loadDocument = async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const fetchedDoc = await submissionStorage.getDocumentById(id);
      setDoc(fetchedDoc);
      if (fetchedDoc) {
        if (fetchedDoc.comments && Array.isArray(fetchedDoc.comments)) {
          setCommentsList(fetchedDoc.comments);
        }
        const resolvedPdf = await submissionStorage.resolvePdfUrl(fetchedDoc);
        setPdfUrl(resolvedPdf);
        const resolvedDocx = await submissionStorage.resolveOriginalDocxUrl(fetchedDoc);
        setOriginalDocxUrl(resolvedDocx);
      }
    } catch (err: any) {
      console.error('Failed to load document session:', err);
      setLoadError(err?.message || 'Failed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocument();
  }, [id]);

  // ── Post comment reply ───────────────────────────────────────────────────
  const handlePostReply = async () => {
    if (!replyText.trim() || !id) return;
    setIsPostingReply(true);
    try {
      await submissionStorage.postComment(id, studentName, replyText.trim());

      const newEntry = {
        author: studentName,
        msg: replyText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' +
              new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      };
      setCommentsList((prev) => [...prev, newEntry]);
      setReplyText('');
      toast.success('Your reply was posted.');
    } catch (err: any) {
      console.error('Failed to post reply:', err);
      toast.error(err?.message || 'Could not post your reply. Please retry.');
    } finally {
      setIsPostingReply(false);
    }
  };

  // ── Handle revision re-upload ────────────────────────────────────────────
  const handleRevisionFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doc) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      toast.error('Only PDF or DOCX files are supported.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.');
      return;
    }

    setIsUploadingRevision(true);
    try {
      const updatedDoc = await submissionStorage.uploadSubmission(
        file,
        studentName,
        studentCourse,
        doc.doc_type,
        doc.urgency || 'medium'
      );
      toast.success(`Revised document "${file.name}" uploaded successfully!`);
      // Navigate to the newly submitted revision
      navigate(`/student/review/${updatedDoc.id}`);
    } catch (err: any) {
      console.error('Revision upload failed:', err);
      toast.error(err?.message || 'Failed to upload revised document.');
    } finally {
      setIsUploadingRevision(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Loading Document Review Session…
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !doc) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        <EmptyState
          icon={<AlertTriangle size={32} className="text-amber-500" />}
          title="Document Not Found"
          description={loadError || 'The requested document could not be found or you do not have permission to view it.'}
          action={
            <Button onClick={() => navigate('/student/documents')}>
              Back to Documents
            </Button>
          }
        />
      </div>
    );
  }

  const isApproved = doc.status === 'Approved';
  const isReturned = doc.status === 'Revision Required' || doc.status === 'Returned';
  const isPending = !isApproved && !isReturned;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/student/documents')}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Back to Documents"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {doc.doc_type}
            </h1>
            <Badge
              variant={isApproved ? 'success' : isReturned ? 'warning' : 'neutral'}
              className="text-[11px] px-2.5 py-0.5"
            >
              {doc.status}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Submitted on {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}
            Submission ID: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{doc.id.substring(0, 8)}</span>
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {doc.onedrive_url && (
            <a
              href={doc.onedrive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-colors"
            >
              <Cloud size={14} />
              <span>OneDrive ↗</span>
            </a>
          )}

          {originalDocxUrl && (
            <a
              href={originalDocxUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
            >
              <Download size={14} />
              <span>Download DOCX</span>
            </a>
          )}

          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadDocument()}
            icon={<RefreshCw size={13} />}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Layout (9 col / 3 col grid) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: EmbedPDF Preview (8-9 cols) */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col space-y-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl flex flex-col shadow-xs overflow-hidden h-[760px]">
            <div className="flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-900/60 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Document Preview
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  Official submission copy stored in cloud practicum storage
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-500">
                  {doc.doc_type}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <EmbedPdfWorkspace
                pdfUrl={pdfUrl}
                studentName={doc.student_name}
                docTitle={doc.doc_type}
                onedriveUrl={doc.onedrive_url}
                originalDocxUrl={originalDocxUrl}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Right Column: Status, Adviser Feedback, Discussion, Actions (4 cols) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col space-y-4">
          {/* Status Overview Card */}
          <Card title="Verification Status">
            <div className="space-y-3">
              <div className={cn(
                'p-3.5 rounded-xl border flex items-center gap-3',
                isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : isReturned
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : isReturned
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}>
                  {isApproved ? (
                    <ShieldCheck size={18} />
                  ) : isReturned ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">
                    {isApproved ? 'Approved & Verified' : isReturned ? 'Revision Required' : 'Pending Verification'}
                  </h4>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {isApproved
                      ? 'This document satisfies institutional standards.'
                      : isReturned
                        ? 'Your adviser requested revisions before approval.'
                        : 'Your adviser will review your submission shortly.'}
                  </p>
                </div>
              </div>

              {/* Adviser Feedback Box */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Adviser Remarks
                </span>
                <div className={cn(
                  'p-3 rounded-xl text-xs leading-relaxed font-medium border',
                  isReturned
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-950 dark:text-amber-200 border-l-4 border-l-amber-500'
                    : isApproved
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 border-l-4 border-l-emerald-500'
                      : 'bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}>
                  {doc.adviser_feedback || 'No remarks provided yet. Awaiting adviser review.'}
                </div>
              </div>
            </div>
          </Card>

          {/* Revision Action Card (if revision requested) */}
          {isReturned && (
            <Card title="Submit Revised File">
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Your adviser marked this document as requiring changes. Upload an updated PDF or DOCX file to submit your revision.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleRevisionFilePicked}
                  className="hidden"
                />

                <Button
                  variant="primary"
                  className="w-full h-9 text-xs font-bold justify-center"
                  icon={isUploadingRevision ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingRevision}
                >
                  {isUploadingRevision ? 'Uploading Revision…' : 'Upload Revised Document'}
                </Button>
              </div>
            </Card>
          )}

          {/* Interactive Comment / Feedback Thread Card */}
          <Card title="Feedback & Discussion Thread">
            <div className="space-y-3">
              {/* Message List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {commentsList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
                    <p className="text-xs text-zinc-400">No discussion messages yet.</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Send a note to your adviser below.</p>
                  </div>
                ) : (
                  commentsList.map((c, i) => {
                    const isSelf = c.author.toLowerCase() === studentName.toLowerCase() ||
                                   c.author.toLowerCase() === 'student';
                    return (
                      <div
                        key={i}
                        className={cn(
                          'p-2.5 rounded-xl border text-xs space-y-1',
                          isSelf
                            ? 'bg-primary/5 border-primary/20 ml-3'
                            : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 mr-3'
                        )}
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                            {c.author}
                          </span>
                          <span className="text-[9px] text-zinc-400 shrink-0">
                            {c.time}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                          {c.msg}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply or question for your adviser…"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePostReply}
                  disabled={!replyText.trim() || isPostingReply}
                  icon={isPostingReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  className="w-full text-xs font-semibold justify-center h-8"
                >
                  {isPostingReply ? 'Sending…' : 'Send Message'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Submission Info Card */}
          <Card title="Submission Metadata">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              <div className="py-2 first:pt-0 flex justify-between items-center">
                <span className="text-zinc-500">Student</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{doc.student_name}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-zinc-500">Course & Section</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{doc.course}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-zinc-500">Document Type</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{doc.doc_type}</span>
              </div>
              <div className="py-2 last:pb-0 flex justify-between items-center">
                <span className="text-zinc-500">Urgency</span>
                <span className="capitalize font-semibold text-zinc-800 dark:text-zinc-200">{doc.urgency || 'Normal'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export default StudentReviewSession;

