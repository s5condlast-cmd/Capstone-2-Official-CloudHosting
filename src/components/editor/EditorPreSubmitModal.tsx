import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  FileCheck,
  UserCheck,
  Paperclip,
} from 'lucide-react';
import { auditDocumentBeforeSubmit, type PreSubmitAuditResult } from '../../lib/editorAiService';
import type { ReviewRequirementDefinition } from '../../lib/reviewSubmissionService';
import { toast } from 'sonner';

interface EditorPreSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: (options: {
    requirementId: string;
    remarks?: string;
    attachSourceDocx: boolean;
  }) => Promise<void>;
  title: string;
  content: any;
  defaultRequirementId?: string;
  requirements: ReviewRequirementDefinition[];
  studentProfile?: {
    hasAdviser: boolean;
    hasSupervisor: boolean;
    adviserName?: string;
    supervisorName?: string;
  } | null;
  submitting: boolean;
}

export function EditorPreSubmitModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  title,
  content,
  defaultRequirementId = '',
  requirements,
  studentProfile,
  submitting,
}: EditorPreSubmitModalProps) {
  const [selectedReqId, setSelectedReqId] = useState<string>(defaultRequirementId);
  const [remarks, setRemarks] = useState<string>('');
  const [attachSourceDocx, setAttachSourceDocx] = useState<boolean>(true);

  // AI audit state
  const [auditResult, setAuditResult] = useState<PreSubmitAuditResult | null>(null);
  const [auditing, setAuditing] = useState<boolean>(false);

  // Extract plain text string
  const extractText = (data: any): string => {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data
        .map((node) => {
          if (node.text) return node.text;
          if (node.children) return extractText(node.children);
          return '';
        })
        .join(' ');
    }
    return '';
  };

  useEffect(() => {
    if (defaultRequirementId && !selectedReqId) {
      setSelectedReqId(defaultRequirementId);
    } else if (!selectedReqId && requirements.length > 0) {
      setSelectedReqId(requirements[0].id);
    }
  }, [defaultRequirementId, requirements]);

  useEffect(() => {
    if (isOpen) {
      const runAudit = async () => {
        try {
          setAuditing(true);
          const text = extractText(content);
          const res = await auditDocumentBeforeSubmit(text, title, selectedReqId);
          setAuditResult(res);
        } catch (err) {
          console.warn('[EditorPreSubmitModal] Audit error:', err);
        } finally {
          setAuditing(false);
        }
      };
      runAudit();
    }
  }, [isOpen, selectedReqId]);

  if (!isOpen) return null;

  const selectedReq = requirements.find((r) => r.id === selectedReqId);
  const isSupervisorFirst = selectedReq?.review_route === 'supervisor_then_adviser';

  const handleConfirm = async () => {
    if (!selectedReqId) {
      toast.error('Please select an institutional requirement.');
      return;
    }

    if (isSupervisorFirst && !studentProfile?.hasSupervisor) {
      toast.error('This requirement requires supervisor approval, but you do not have an assigned supervisor.');
      return;
    }

    if (!studentProfile?.hasAdviser) {
      toast.error('No Academic Adviser assigned to your profile. Please contact your coordinator.');
      return;
    }

    await onConfirmSubmit({
      requirementId: selectedReqId,
      remarks: remarks || undefined,
      attachSourceDocx,
    });
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pre-Submission Compliance Audit
              </h3>
              <p className="text-xs text-zinc-500">
                Verify institutional requirement and review routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* AI Audit Summary Card */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>AI Compliance Check</span>
              </div>
              {auditing ? (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing text...</span>
                </div>
              ) : auditResult ? (
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  auditResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  Score: {auditResult.score}/100 • {auditResult.passed ? 'Ready to Submit' : 'Needs Review'}
                </span>
              ) : null}
            </div>

            {auditResult && (
              <>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {auditResult.summary}
                </p>
                {auditResult.findings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {auditResult.findings.map((f, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-1.5">
                        <span className={`px-1 rounded font-bold uppercase text-[9px] ${
                          f.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {f.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Requirement Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Practicum Requirement
            </label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {requirements.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.title} ({req.review_route === 'supervisor_then_adviser' ? 'Supervisor -> Adviser' : 'Direct to Adviser'})
                </option>
              ))}
            </select>
          </div>

          {/* Reviewer Routing Info */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1.5">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Review Routing:</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300">
              {isSupervisorFirst
                ? `1. OJT Supervisor (${studentProfile?.supervisorName || 'Pending assignment'}) -> 2. Academic Adviser (${studentProfile?.adviserName || 'Pending assignment'})`
                : `Direct to Academic Adviser (${studentProfile?.adviserName || 'Pending assignment'})`}
            </p>
          </div>

          {/* Source DOCX Option */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <input
              type="checkbox"
              id="attachDocx"
              checked={attachSourceDocx}
              onChange={(e) => setAttachSourceDocx(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
            />
            <label htmlFor="attachDocx" className="text-xs cursor-pointer">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                Preserve editable Word source (.docx)
              </div>
              <div className="text-zinc-500">
                Saves your formatted editor document alongside the PDF for reviewer inspection and future revisions.
              </div>
            </label>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Remarks or Notes to Reviewer (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any specific context or remarks for your reviewer..."
              rows={2}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting PDF...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

