import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  FileText,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  Pen,
  Eye,
  Send,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  X,
  Download,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Mic
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { TextDocumentViewer } from '@/src/components/review/TextDocumentViewer';
import { PdfDocumentViewer } from '@/src/components/review/PdfDocumentViewer';
import { AIGrammarPanel } from '@/src/components/review/AIGrammarPanel';

export const AdminReviewSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('pdf');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [selectedAdviser, setSelectedAdviser] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [isNotesListening, setIsNotesListening] = useState(false);

  // Mock data
  const student = {
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    company: 'TechCorp Solutions Inc.',
    adviser: 'Dr. Smith',
    docType: 'Prelim Journal',
    submittedAt: 'May 4, 2026 – 2:30 PM',
    status: 'pending_admin'
  };

  const advisers = [
    { id: 'a1', name: 'Dr. Smith', students: 28 },
    { id: 'a2', name: 'Prof. Johnson', students: 22 },
    { id: 'a3', name: 'Ms. Garcia', students: 15 },
  ];

  const handleForward = () => {
    if (!selectedAdviser) return;
    setIsForwarding(true);
    setTimeout(() => {
      setIsForwarding(false);
      setShowForwardModal(false);
      navigate('/admin/documents');
    }, 1500);
  };

  const handleApprove = () => {
    setShowConfirmApprove(false);
    navigate('/admin/documents');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/documents')}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-black dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-black dark:text-white tracking-tight">Admin Review</h1>
              <Badge variant="neutral" className="text-[9px]">{student.docType}</Badge>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <User size={10} />
                {student.name}
              </div>
              <span>·</span>
              <span>{student.course}</span>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Clock size={10} />
                {student.submittedAt}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Pen size={14} />}
            onClick={() => navigate(`/admin/documents/${id}/edit`)}
          >
            Admin Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={() => setShowForwardModal(true)}
          >
            Pass to Adviser
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('pdf')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
            viewMode === 'pdf'
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
              : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
          )}
        >
          <FileText size={12} />
          Original PDF
        </button>
        <button
          onClick={() => setViewMode('text')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
            viewMode === 'text'
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
              : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
          )}
        >
          <FileText size={12} />
          Text View
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        {/* Left: Document Viewer */}
        <div className="space-y-4">
          {viewMode === 'text' ? (
            <TextDocumentViewer
              title={student.docType}
              studentName={student.name}
              course={student.course}
              company={student.company}
              period="April 01 - April 30, 2026"
              content={{
                objectives: "During this period, I focused on learning the company's tech stack including React, Node.js, and PostgreSQL. My goal was to understand the codebase and start contributing to minor features.",
                activities: "I recieved training on database management and worked on optimizing SQL queries. I also shadowed the senior frontend developer for two days to understand their component architecture.",
                challenges: "The main challenge I faced was adapting to the agile workflow and understanding the complex state management patterns used in the main application."
              }}
              annotations={[]} // We don't need highlights here anymore since editing moved
            />
          ) : (
            <PdfDocumentViewer
              title={student.docType}
              pdfUrl="/sample-journal.pdf"
              studentName={student.name}
            />
          )}
        </div>

        {/* Right: AI Grammar Checker + Admin Notes + Actions */}
        <div className="space-y-4 flex flex-col">
          {/* AI Grammar Checker */}
          <AIGrammarPanel
            onApplyCorrection={(issue) => {
              console.log('Applied correction:', issue);
            }}
            onApplyAll={(issues) => {
              console.log('Applied all corrections:', issues);
            }}
          />

          {/* Admin Notes */}
          <Card title="Admin Notes" className="flex flex-col">
            <div className="flex flex-col space-y-3">
              <p className="text-[10px] text-zinc-400 font-medium">
                Notes will be attached to the document and visible to the student.
              </p>
              <div className="relative">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your review notes, corrections, or instructions for the student..."
                  className="w-full min-h-[100px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 pb-12 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                />
                <button
                  onClick={() => {
                    setIsNotesListening(!isNotesListening);
                    if (!isNotesListening) {
                      setAdminNotes((prev) => prev + (prev ? ' ' : '') + 'Listening...');
                      setTimeout(() => {
                        setAdminNotes((prev) => prev.replace('Listening...', 'Please ensure all company names match exactly what is registered.'));
                        setIsNotesListening(false);
                      }, 2000);
                    } else {
                      setAdminNotes((prev) => prev.replace('Listening...', ''));
                    }
                  }}
                  className={cn(
                    "absolute bottom-4 right-4 p-2 rounded-full transition-all",
                    isNotesListening 
                      ? "bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse" 
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white"
                  )}
                  title="Speech to Text"
                >
                  <Mic size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>{adminNotes.replace('Listening...', '').length} characters</span>
                <span>Markdown supported</span>
              </div>
            </div>
          </Card>

          {/* Decision Actions */}
          <Card className="pt-0 px-0 pb-0 overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Final Decision</h3>
            </div>
            <div className="p-4 space-y-3">
              <Button
                variant="primary"
                className="w-full justify-center"
                icon={<CheckCircle2 size={14} />}
                onClick={() => setShowConfirmApprove(true)}
              >
                Save & Approve
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                icon={<RotateCcw size={14} />}
                onClick={() => navigate('/admin/documents')}
              >
                Return for Revision
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center text-zinc-400"
                icon={<UserPlus size={14} />}
                onClick={() => setShowForwardModal(true)}
              >
                Pass to Adviser Instead
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Forward to Adviser Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForwardModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                    <UserPlus size={16} className="text-white dark:text-zinc-950" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black dark:text-white">Pass to Adviser</h2>
                    <p className="text-[10px] text-zinc-400 font-medium">Forward this document for adviser review</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Document Summary */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-zinc-500" />
                    <span className="text-xs font-bold text-black dark:text-white">{student.docType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="text-zinc-400">Student:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{student.name}</span>
                    <span className="text-zinc-400">Course:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{student.course}</span>
                  </div>
                </div>

                {/* Select Adviser */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Select Adviser</label>
                  <div className="space-y-2">
                    {advisers.map(adv => (
                      <button
                        key={adv.id}
                        onClick={() => setSelectedAdviser(adv.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                          selectedAdviser === adv.id
                            ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border",
                            selectedAdviser === adv.id
                              ? "bg-white/20 border-white/30"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                          )}>
                            <User size={14} />
                          </div>
                          <span className="text-xs font-semibold">{adv.name}</span>
                        </div>
                        <span className={cn(
                          "text-[10px] font-medium",
                          selectedAdviser === adv.id ? "opacity-70" : "text-zinc-400"
                        )}>
                          {adv.students} students
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note to Adviser */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Note to Adviser (Optional)</label>
                  <textarea
                    value={forwardNote}
                    onChange={(e) => setForwardNote(e.target.value)}
                    placeholder="e.g. Please check the Activities section for accuracy..."
                    className="w-full min-h-[80px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowForwardModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={isForwarding ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Send size={14} /></motion.div> : <Send size={14} />}
                  onClick={handleForward}
                  disabled={!selectedAdviser || isForwarding}
                >
                  {isForwarding ? 'Forwarding...' : 'Forward Document'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {showConfirmApprove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmApprove(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={20} className="text-white dark:text-zinc-950" />
                </div>
                <h2 className="text-sm font-bold text-black dark:text-white mb-1">Approve Document?</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This will mark <strong className="text-black dark:text-white">{student.name}'s {student.docType}</strong> as approved. The student will be notified.
                </p>
              </div>
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowConfirmApprove(false)}>Cancel</Button>
                <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={handleApprove}>
                  Confirm Approval
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
