/**
 * StudentDocumentRepository.tsx
 * STI eLMS Document Repository & Assignments page — /student/documents
 *
 * Implements the STI eLMS assignments layout from Reference Image 1:
 * - Clean institutional header with filter pill bar (All [count], Before OJT, In OJT, Final Phase, Grading Scale)
 * - Repository table with tray upload icons, blue/cyan requirement links, Start, Due, % of overall,
 *   Submitted (green checkmark), Graded (red cross / green checkmark), Score, and Grade columns
 * - Overall result summary footer
 * - Reconciles live drafts from `editor_drafts` and live submissions from `student_documents`
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  X,
  FileText,
  FileEdit,
  Eye,
  Download,
  Info,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  INSTITUTIONAL_REQUIREMENTS,
  InstitutionalRequirement,
} from '@/src/config/requirementRegistry';
import { templateStorage } from '@/src/lib/templateStorage';
import { StudentDocument } from '@/src/lib/submissionStorage';
import { getEditorTemplate } from '@/src/config/editorTemplates';
import { format, formatDistanceToNow } from 'date-fns';

interface DraftRow {
  id: string;
  user_id?: string;
  title: string;
  template_id: string | null;
  template_name: string | null;
  phase: string | null;
  status: 'draft' | 'submitted' | 'locked';
  submission_id: string | null;
  updated_at: string;
  word_count?: number;
  revision?: number;
}

type FilterTab = 'all' | 'analytics' | 'grading_scale' | 'performance';

// ── Institutional Grading Scale Reference Data (media_1790153033956.png) ───────
const INSTITUTIONAL_GRADING_SCALE = [
  { grade: '1.00', min: '97.5', letter: '97.5' },
  { grade: '1.25', min: '94.5', letter: '94.5' },
  { grade: '1.50', min: '91.5', letter: '91.5' },
  { grade: '1.75', min: '86.5', letter: '86.5' },
  { grade: '2.00', min: '81.5', letter: '81.5' },
  { grade: '2.25', min: '76', letter: '76' },
  { grade: '2.50', min: '70.5', letter: '70.5' },
  { grade: '2.75', min: '65', letter: '65' },
  { grade: '3.00', min: '59.5', letter: '59.5' },
  { grade: '5.00', min: '0', letter: '59' },
];

const SPECIAL_REMARKS = [
  { remark: 'Missing', percent: '0' },
  { remark: 'Incomplete', percent: '0' },
  { remark: 'Absent', percent: '0' },
];

/**
 * Convert a numeric score percentage (0-100) into an institutional grade based on
 * INSTITUTIONAL_GRADING_SCALE:
 * 97.5 - 100% -> 1.00
 * 94.5 - 97.4% -> 1.25
 * 91.5 - 94.4% -> 1.50
 * 86.5 - 91.4% -> 1.75
 * 81.5 - 86.4% -> 2.00
 * 76.0 - 81.4% -> 2.25
 * 70.5 - 75.9% -> 2.50
 * 65.0 - 70.4% -> 2.75
 * 59.5 - 64.9% -> 3.00
 * < 59.5%      -> 5.00
 */
export function getInstitutionalGrade(scorePercent: number): string {
  for (const item of INSTITUTIONAL_GRADING_SCALE) {
    if (scorePercent >= parseFloat(item.min)) {
      return item.grade;
    }
  }
  return '5.00';
}

/**
 * Clean phase label formatter for consistent display across all views.
 */
function formatPhaseName(phase?: string): string {
  if (!phase) return 'Before OJT';
  const lower = phase.toLowerCase().replace(/_/g, ' ');
  if (lower.includes('before')) return 'Before OJT';
  if (lower.includes('in') || lower.includes('during')) return 'In OJT';
  if (lower.includes('final')) return 'Final Phase';
  return phase;
}

/**
 * Concise two-line labels for SVG x-axis to prevent text collisions across deliverables.
 */
const CHART_SHORT_TITLES: Record<string, [string, string]> = {
  'student-application-letter': ['Application', 'Letter'],
  'parent-consent-with-fee': ['Parent Consent', '(With Fee)'],
  'parent-consent-without-fee': ['Parent Consent', '(No Fee)'],
  'student-consent-with-fee': ['Student Consent', '(With Fee)'],
  'student-consent-without-fee': ['Student Consent', '(No Fee)'],
  'moa-template': ['MOA Template', 'Agreement'],
  'endorsement-letter': ['Endorsement', 'Letter'],
  'proposal-letter': ['Proposal Letter', 'to Industry'],
  'weekly-journal': ['Weekly OJT', 'Journal'],
  'dtr-form': ['Daily Time', 'Record (DTR)'],
  'training-plan-form': ['Training Plan', 'Form'],
  'integration-paper': ['Integration', 'Paper'],
  'performance-appraisal': ['Performance', 'Appraisal'],
};

function formatChartLabel(id: string, name: string): [string, string] {
  if (CHART_SHORT_TITLES[id]) {
    return CHART_SHORT_TITLES[id];
  }
  const lowerName = name.toLowerCase();
  if (lowerName.includes('application')) return ['Application', 'Letter'];
  if (lowerName.includes('parent consent') && lowerName.includes('without')) return ['Parent Consent', '(No Fee)'];
  if (lowerName.includes('parent consent')) return ['Parent Consent', '(With Fee)'];
  if (lowerName.includes('student consent') && lowerName.includes('without')) return ['Student Consent', '(No Fee)'];
  if (lowerName.includes('student consent')) return ['Student Consent', 'Form'];
  if (lowerName.includes('moa') || lowerName.includes('memorandum')) return ['MOA Template', 'Agreement'];
  if (lowerName.includes('endorsement')) return ['Endorsement', 'Letter'];
  if (lowerName.includes('proposal')) return ['Proposal Letter', 'to Industry'];
  if (lowerName.includes('journal')) return ['Weekly OJT', 'Journal'];
  if (lowerName.includes('dtr')) return ['Daily Time', 'Record (DTR)'];
  if (lowerName.includes('training plan')) return ['Training Plan', 'Form'];
  if (lowerName.includes('integration')) return ['Integration', 'Paper'];
  if (lowerName.includes('appraisal') || lowerName.includes('performance')) return ['Performance', 'Appraisal'];

  if (lowerName.includes('untitled')) {
    const matchNum = name.match(/#(\d+)/);
    if (matchNum) {
      return ['Untitled', `Draft #${matchNum[1]}`];
    }
    return ['Untitled', 'Draft'];
  }

  const words = name.trim().split(/\s+/);
  if (words.length <= 1) {
    const w = words[0] || 'Document';
    return [w.length > 15 ? w.slice(0, 14) + '…' : w, ''];
  }
  if (words.length === 2) return [words[0], words[1]];
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return [
    line1.length > 16 ? line1.slice(0, 15) + '…' : line1,
    line2.length > 16 ? line2.slice(0, 15) + '…' : line2,
  ];
}

/**
 * Robust matching between a requirement and a student's active editor draft.
 */
function findMatchingDraft(drafts: DraftRow[], req: InstitutionalRequirement): DraftRow | undefined {
  return drafts.find(d => {
    // 1. Direct template ID match
    if (d.template_id && d.template_id === req.id) return true;
    // 2. Template name exact match
    if (d.template_name && d.template_name.toLowerCase() === req.name.toLowerCase()) return true;
    // 3. Draft title matches template name
    if (d.title && d.title.toLowerCase() === req.name.toLowerCase()) return true;
    // 4. Draft title contains requirement code or key keywords
    if (d.title && d.title !== 'Untitled Document' && d.title !== 'Untitled Practicum Document') {
      const lowerTitle = d.title.toLowerCase();
      if (lowerTitle.includes(req.code) && lowerTitle.includes('arg')) return true;
      if (req.id === 'student-application-letter' && lowerTitle.includes('application letter')) return true;
      if (req.id === 'parent-consent-with-fee' && lowerTitle.includes('parent consent')) return true;
      if (req.id === 'student-consent-with-fee' && lowerTitle.includes('student consent')) return true;
      if (req.id === 'moa-template' && (lowerTitle.includes('moa') || lowerTitle.includes('memorandum'))) return true;
      if (req.id === 'endorsement-letter' && lowerTitle.includes('endorsement')) return true;
      if (req.id === 'proposal-letter' && lowerTitle.includes('proposal')) return true;
      if (req.id === 'weekly-journal' && lowerTitle.includes('journal')) return true;
      if (req.id === 'dtr-form' && (lowerTitle.includes('dtr') || lowerTitle.includes('daily time'))) return true;
      if (req.id === 'training-plan-form' && lowerTitle.includes('training plan')) return true;
      if (req.id === 'integration-paper' && lowerTitle.includes('integration')) return true;
      if (req.id === 'performance-appraisal' && (lowerTitle.includes('appraisal') || lowerTitle.includes('performance'))) return true;
    }
    return false;
  });
}

/**
 * Resolves any draft or submission to its canonical institutional requirement if applicable.
 */
function matchInstitutionalRequirement(item: {
  template_id?: string | null;
  template_name?: string | null;
  title?: string | null;
  doc_type?: string | null;
}): InstitutionalRequirement | undefined {
  // 1. Direct template ID, code, or name match
  const directMatch = INSTITUTIONAL_REQUIREMENTS.find(req => {
    const tid = item.template_id?.toLowerCase();
    if (tid && (tid === req.id.toLowerCase() || tid.replace(/-/g, '_') === req.id.toLowerCase().replace(/-/g, '_'))) return true;
    const tname = (item.template_name || '').toLowerCase();
    if (tname && tname === req.name.toLowerCase()) return true;
    const dtype = (item.doc_type || '').toLowerCase();
    if (dtype && (dtype === req.name.toLowerCase() || dtype === req.id.toLowerCase() || dtype.includes(req.code.toLowerCase()))) return true;
    const title = (item.title || '').toLowerCase();
    if (title && title === req.name.toLowerCase()) return true;
    if (title && title.includes(req.code.toLowerCase()) && title.length > 2) return true;
    return false;
  });
  if (directMatch) return directMatch;

  // 2. Keyword heuristic matching for drafts or submissions with descriptive names
  const combined = ((item.title || '') + ' ' + (item.template_name || '') + ' ' + (item.doc_type || '')).toLowerCase();
  if (combined.includes('untitled document') || combined.includes('untitled practicum')) return undefined;

  return INSTITUTIONAL_REQUIREMENTS.find(req => {
    if (req.id === 'student-application-letter' && combined.includes('application letter')) return true;
    if (req.id === 'parent-consent-with-fee' && combined.includes('parent consent') && !combined.includes('without') && !combined.includes('no fee')) return true;
    if (req.id === 'parent-consent-without-fee' && combined.includes('parent consent') && (combined.includes('without') || combined.includes('no fee'))) return true;
    if (req.id === 'student-consent-with-fee' && combined.includes('student consent') && !combined.includes('without') && !combined.includes('no fee')) return true;
    if (req.id === 'student-consent-without-fee' && combined.includes('student consent') && (combined.includes('without') || combined.includes('no fee'))) return true;
    if (req.id === 'moa-template' && (combined.includes('moa') || combined.includes('memorandum'))) return true;
    if (req.id === 'endorsement-letter' && combined.includes('endorsement')) return true;
    if (req.id === 'proposal-letter' && combined.includes('proposal')) return true;
    if (req.id === 'weekly-journal' && combined.includes('journal')) return true;
    if (req.id === 'dtr-form' && (combined.includes('dtr') || combined.includes('daily time'))) return true;
    if (req.id === 'training-plan-form' && combined.includes('training plan')) return true;
    if (req.id === 'integration-paper' && combined.includes('integration')) return true;
    if (req.id === 'performance-appraisal' && (combined.includes('appraisal') || combined.includes('performance'))) return true;
    return false;
  });
}

// ── Sparkline Wave Generator Helpers for Counter Cards ──────────────────────
interface SparklineWaveResult {
  stroke: string;
  fill: string;
  secStroke: string;
  secFill: string;
  ratio: number;
}

function generateSubmittedWave(submittedCount: number, total: number = 11): SparklineWaveResult {
  const ratio = total > 0 ? Math.min(1, Math.max(0, submittedCount / total)) : 0;
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 37, 90 39, 140 37 C 190 35, 230 39, 300 37";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 9);
  const cp1y = Math.round(31 - ratio * 15);
  const p1y = Math.round(29 - ratio * 16);
  const cp2y = Math.round(35 - ratio * 12);
  const p2y = Math.round(32 - ratio * 14);
  const cp3y = Math.round(25 - ratio * 17);
  const pEnd = Math.round(22 - ratio * 14);

  const stroke = `M 0 ${yStart} C 45 ${cp1y}, 75 ${cp1y + 2}, 120 ${p1y} C 165 ${cp2y}, 195 ${cp2y - 2}, 240 ${p2y} C 265 ${cp3y}, 285 ${cp3y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 3} C 40 ${cp1y + 4}, 80 ${cp1y + 5}, 125 ${p1y + 3} C 170 ${cp2y + 4}, 200 ${cp2y + 2}, 245 ${p2y + 3} C 270 ${cp3y + 3}, 290 ${cp3y + 1}, 300 ${pEnd + 3}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generateDraftWave(draftCount: number): SparklineWaveResult {
  const ratio = Math.min(1, Math.max(0, draftCount / 4));
  if (ratio === 0) {
    const stroke = "M 0 38 C 50 38, 100 39, 150 38 C 200 37, 250 39, 300 38";
    const fill = `${stroke} L 300 45 L 0 45 Z`;
    return { stroke, fill, secStroke: stroke, secFill: fill, ratio: 0 };
  }
  const yStart = Math.round(35 - ratio * 6);
  const cp1y = Math.round(28 - ratio * 18);
  const p1y = Math.round(33 - ratio * 10);
  const cp2y = Math.round(24 - ratio * 18);
  const p2y = Math.round(30 - ratio * 12);
  const pEnd = Math.round(20 - ratio * 14);

  const stroke = `M 0 ${yStart} C 40 ${cp1y}, 75 ${cp1y}, 115 ${p1y} C 155 ${p1y + 3}, 180 ${cp2y}, 220 ${cp2y} C 250 ${p2y}, 275 ${p2y - 2}, 300 ${pEnd}`;
  const fill = `${stroke} L 300 45 L 0 45 Z`;

  const secStroke = `M 0 ${yStart + 2} C 45 ${cp1y + 3}, 80 ${cp1y + 3}, 120 ${p1y + 2} C 160 ${p1y + 4}, 185 ${cp2y + 3}, 225 ${cp2y + 3} C 255 ${p2y + 2}, 280 ${p2y}, 300 ${pEnd + 2}`;
  const secFill = `${secStroke} L 300 45 L 0 45 Z`;

  return { stroke, fill, secStroke, secFill, ratio };
}

function generateScoreWave(hasApproved: boolean): SparklineWaveResult {
  const stroke = "M 0 36 C 60 35, 120 37, 180 36 C 240 35, 270 36, 300 35";
  const fill = `${stroke} L 300 45 L 0 45 Z`;
  return { stroke, fill, secStroke: stroke, secFill: fill, ratio: hasApproved ? 1 : 0 };
}

// ── Grading Scale Component (Horizontal & Aligned with Crisp Lines) ───────────
function GradingScaleView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Card 1: Grade Scale */}
      <div className="lg:col-span-7 bg-card border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xs p-3.5 sm:p-4 flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <div className="bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 grid grid-cols-3 items-center text-xs font-bold text-foreground shadow-2xs mb-1">
            <span className="text-left font-bold tracking-tight">Grade</span>
            <span className="text-center font-bold tracking-tight">Minimum%</span>
            <span className="text-center font-bold tracking-tight">Letter%</span>
          </div>

          {/* Body Rows */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 border-b border-zinc-200 dark:border-zinc-700 text-xs sm:text-[13px]">
            {INSTITUTIONAL_GRADING_SCALE.map(row => (
              <div
                key={row.grade}
                className="grid grid-cols-3 items-center px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                {/* Grade Numbering - Monochrome black & white badge */}
                <div className="text-left">
                  <span className="inline-flex items-center justify-center font-bold text-xs min-w-12 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs transition-colors">
                    {row.grade}
                  </span>
                </div>

                {/* Minimum% Numbering - Clean sans, tabular, centered */}
                <div className="text-center font-semibold text-foreground tracking-tight tabular-nums">
                  {row.min}
                </div>

                {/* Letter% Numbering - Clean sans, tabular, centered */}
                <div className="text-center font-semibold text-foreground tracking-tight tabular-nums">
                  {row.letter}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Special Remarks */}
      <div className="lg:col-span-5 bg-card border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xs p-3.5 sm:p-4 flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <div className="bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 grid grid-cols-3 items-center text-xs font-bold text-foreground shadow-2xs mb-1">
            <span className="col-span-2 text-left font-bold tracking-tight">Special remark</span>
            <span className="col-span-1 text-center font-bold tracking-tight">%</span>
          </div>

          {/* Body Rows */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 border-b border-zinc-200 dark:border-zinc-700 text-xs sm:text-[13px]">
            {SPECIAL_REMARKS.map(row => (
              <div
                key={row.remark}
                className="grid grid-cols-3 items-center px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="col-span-2 text-left">
                  <span className="inline-flex items-center font-semibold text-xs px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs">
                    {row.remark}
                  </span>
                </div>
                <div className="col-span-1 text-center font-semibold text-foreground tracking-tight tabular-nums">
                  {row.percent}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Policy Note */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-muted-foreground leading-relaxed mt-4">
          <p className="font-semibold text-foreground mb-1">Evaluation Policy</p>
          Special remarks indicate non-submission or administrative unfulfilled status across practicum deliverables.
        </div>
      </div>
    </div>
  );
}

// ── Analytics Chart Component matching media_1790153048472.png ────────────────
export type ChartItemStatus = 'Approved' | 'Graded' | 'Submitted' | 'Draft' | 'Not Started';

export interface ChartDeliverableItem {
  id: string;
  name: string;
  code: string;
  phase: string;
  maxScore: number;
  score: number;
  scorePercent: number;
  grade: string;
  status: ChartItemStatus;
  targetId: string;
  draftId?: string;
  submissionId?: string;
  wordCount?: number;
  revision?: number;
  updatedAt?: string;
  shortLine1: string;
  shortLine2: string;
}

interface AnalyticsProps {
  submissions: StudentDocument[];
  drafts: DraftRow[];
  onNavigate: (item: ChartDeliverableItem) => void;
}

function AssignmentAnalyticsChart({ submissions, drafts, onNavigate }: AnalyticsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. All 11 institutional requirements overview
  const allRequirementItems = useMemo<ChartDeliverableItem[]>(() => {
    return INSTITUTIONAL_REQUIREMENTS.map(req => {
      const matchingSubmission = submissions.find(
        s =>
          s.doc_type && (
            s.doc_type.toLowerCase() === req.name.toLowerCase() ||
            s.doc_type.toLowerCase() === req.id.toLowerCase() ||
            s.doc_type.toLowerCase().includes(req.code)
          )
      );
      const matchingDraft = findMatchingDraft(drafts, req);

      const isApproved = matchingSubmission?.status === 'Approved';
      const isGraded =
        isApproved ||
        matchingSubmission?.status === 'Returned' ||
        matchingSubmission?.status === 'Revision Required';
      const isSubmitted =
        Boolean(matchingSubmission) || (matchingDraft && matchingDraft.status === 'submitted');
      const isDraft = !isSubmitted && !isApproved && !isGraded && Boolean(matchingDraft);

      const score = isApproved
        ? req.maxScore
        : (matchingSubmission as any)?.score != null
        ? (matchingSubmission as any).score
        : 0;
      const scorePercent = isApproved
        ? 100
        : (matchingSubmission as any)?.score != null
        ? Math.round(((matchingSubmission as any).score / req.maxScore) * 100)
        : 0;

      const grade = isApproved
        ? '1.00'
        : isGraded
        ? getInstitutionalGrade(scorePercent)
        : isSubmitted
        ? 'Pending'
        : isDraft
        ? 'Draft'
        : '-';
      const status: ChartItemStatus = isApproved
        ? 'Approved'
        : isGraded
        ? 'Graded'
        : isSubmitted
        ? 'Submitted'
        : isDraft
        ? 'Draft'
        : 'Not Started';

      const [shortLine1, shortLine2] = formatChartLabel(req.id, req.name);

      return {
        id: req.id,
        name: req.name,
        code: req.code,
        phase: req.phase,
        maxScore: req.maxScore,
        score,
        scorePercent,
        grade,
        status,
        targetId: isDraft ? matchingDraft!.id : matchingSubmission?.id || req.id,
        draftId: matchingDraft?.id,
        submissionId: matchingSubmission?.id,
        wordCount: matchingDraft?.word_count,
        revision: matchingDraft?.revision,
        updatedAt: matchingDraft?.updated_at,
        shortLine1,
        shortLine2,
      };
    });
  }, [submissions, drafts]);

  // 2. Templates & Drafts they actually did (existing or made) - Deduplicated & Phase-Ordered
  const draftsAndMadeItems = useMemo<ChartDeliverableItem[]>(() => {
    const itemMap = new Map<string, ChartDeliverableItem>();

    // Phase ranking for chronological practicum progression
    const getPhaseOrder = (phase?: string): number => {
      const p = (phase || '').toLowerCase();
      if (p.includes('before')) return 1;
      if (p.includes('in') || p.includes('during')) return 2;
      if (p.includes('final')) return 3;
      return 4;
    };

    // 1. Process formal submissions first
    submissions.forEach(sub => {
      const matchedReq = matchInstitutionalRequirement(sub);
      const isApproved = sub.status === 'Approved';
      const isGraded = isApproved || sub.status === 'Returned' || sub.status === 'Revision Required';
      const maxScore = matchedReq?.maxScore ?? 100;
      const score = isApproved ? maxScore : (sub as any).score != null ? (sub as any).score : 0;
      const scorePercent = isApproved
        ? 100
        : (sub as any).score != null
        ? Math.round(((sub as any).score / maxScore) * 100)
        : 0;
      const grade = isApproved ? '1.00' : isGraded ? getInstitutionalGrade(scorePercent) : 'Pending';
      const status: ChartItemStatus = isApproved ? 'Approved' : isGraded ? 'Graded' : 'Submitted';

      const displayName = matchedReq?.name || sub.doc_type || 'Submitted Document';
      const canonicalKey = matchedReq ? `req:${matchedReq.id}` : `doc:${displayName.toLowerCase().trim()}`;
      const [shortLine1, shortLine2] = formatChartLabel(matchedReq?.id || sub.id, displayName);

      const existing = itemMap.get(canonicalKey);
      if (!existing) {
        itemMap.set(canonicalKey, {
          id: sub.id,
          name: displayName,
          code: matchedReq?.code || 'Doc',
          phase: formatPhaseName(matchedReq?.phase || (sub as any).phase),
          maxScore,
          score,
          scorePercent,
          grade,
          status,
          targetId: sub.id,
          submissionId: sub.id,
          updatedAt: (sub as any).created_at || (sub as any).updated_at,
          shortLine1,
          shortLine2,
        });
      } else if (isApproved || (isGraded && existing.status !== 'Approved')) {
        itemMap.set(canonicalKey, {
          ...existing,
          id: sub.id,
          maxScore,
          score,
          scorePercent,
          grade,
          status,
          targetId: sub.id,
          submissionId: sub.id,
          updatedAt: (sub as any).created_at || (sub as any).updated_at || existing.updatedAt,
        });
      }
    });

    // 2. Process drafts (Deduplicate multiple drafts of same template, and consolidate untitled scratch drafts)
    const sortedDrafts = [...drafts].sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return timeB - timeA;
    });

    let hasIncludedUntitled = false;

    sortedDrafts.forEach(draft => {
      const matchedReq = matchInstitutionalRequirement(draft);
      const isUntitled =
        (!draft.title || draft.title.trim().toLowerCase() === 'untitled document' || draft.title.trim().toLowerCase() === 'untitled practicum document') &&
        (!draft.template_name || draft.template_name.trim().toLowerCase() === 'untitled document') &&
        !matchedReq;

      // Consolidate untitled drafts: keep at most ONE latest untitled draft
      if (isUntitled) {
        if (hasIncludedUntitled) return;
        hasIncludedUntitled = true;

        const canonicalKey = 'untitled:draft';
        const [shortLine1, shortLine2] = formatChartLabel('untitled', 'Untitled Draft');
        itemMap.set(canonicalKey, {
          id: draft.id,
          name: 'Untitled Draft',
          code: 'Draft',
          phase: 'Draft',
          maxScore: 100,
          score: 0,
          scorePercent: 0,
          grade: 'Draft',
          status: 'Draft',
          targetId: draft.id,
          draftId: draft.id,
          wordCount: draft.word_count,
          revision: draft.revision,
          updatedAt: draft.updated_at,
          shortLine1,
          shortLine2,
        });
        return;
      }

      // Institutional requirement draft
      if (matchedReq) {
        const canonicalKey = `req:${matchedReq.id}`;
        const existing = itemMap.get(canonicalKey);

        if (existing) {
          // If a submission already represents this requirement, attach the latest draft details if missing
          if (!existing.draftId) {
            existing.draftId = draft.id;
            existing.wordCount = draft.word_count ?? existing.wordCount;
            existing.revision = draft.revision ?? existing.revision;
          }
          return;
        }

        // If no submission exists, add as Draft deliverable
        const displayName = matchedReq.name;
        const [shortLine1, shortLine2] = formatChartLabel(matchedReq.id, displayName);
        itemMap.set(canonicalKey, {
          id: draft.id,
          name: displayName,
          code: matchedReq.code,
          phase: formatPhaseName(matchedReq.phase),
          maxScore: matchedReq.maxScore,
          score: 0,
          scorePercent: 0,
          grade: draft.status === 'submitted' ? 'Pending' : 'Draft',
          status: draft.status === 'submitted' ? 'Submitted' : 'Draft',
          targetId: draft.id,
          draftId: draft.id,
          wordCount: draft.word_count,
          revision: draft.revision,
          updatedAt: draft.updated_at,
          shortLine1,
          shortLine2,
        });
        return;
      }

      // Custom-named document
      const customTitle = (draft.title || draft.template_name || 'Custom Document').trim();
      const canonicalKey = `custom:${customTitle.toLowerCase()}`;
      if (!itemMap.has(canonicalKey)) {
        const [shortLine1, shortLine2] = formatChartLabel(draft.id, customTitle);
        itemMap.set(canonicalKey, {
          id: draft.id,
          name: customTitle,
          code: formatPhaseName(draft.phase),
          phase: formatPhaseName(draft.phase),
          maxScore: 100,
          score: 0,
          scorePercent: 0,
          grade: draft.status === 'submitted' ? 'Pending' : 'Draft',
          status: draft.status === 'submitted' ? 'Submitted' : 'Draft',
          targetId: draft.id,
          draftId: draft.id,
          wordCount: draft.word_count,
          revision: draft.revision,
          updatedAt: draft.updated_at,
          shortLine1,
          shortLine2,
        });
      }
    });

    const items = Array.from(itemMap.values());

    // Sort items logically by Practicum Phase progression:
    // 1. Before OJT -> 2. In OJT -> 3. Final Phase -> 4. Custom/Drafts
    items.sort((a, b) => {
      const orderA = getPhaseOrder(a.phase);
      const orderB = getPhaseOrder(b.phase);
      if (orderA !== orderB) return orderA - orderB;

      const reqIndexA = INSTITUTIONAL_REQUIREMENTS.findIndex(
        r => r.name.toLowerCase() === a.name.toLowerCase() || r.id === a.id
      );
      const reqIndexB = INSTITUTIONAL_REQUIREMENTS.findIndex(
        r => r.name.toLowerCase() === b.name.toLowerCase() || r.id === b.id
      );
      if (reqIndexA !== -1 && reqIndexB !== -1) return reqIndexA - reqIndexB;
      if (reqIndexA !== -1) return -1;
      if (reqIndexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [drafts, submissions]);

  // Mode: 'drafts' by default if student has any active drafts or submissions, else 'all'
  const [viewMode, setViewMode] = useState<'drafts' | 'all'>('drafts');

  const chartItems = viewMode === 'drafts' && draftsAndMadeItems.length > 0
    ? draftsAndMadeItems
    : allRequirementItems;

  const gradedCount = chartItems.filter(i => i.status === 'Approved' || i.status === 'Graded').length;
  const pendingCount = chartItems.filter(i => i.status === 'Submitted').length;
  const draftCount = chartItems.filter(i => i.status === 'Draft').length;
  const unsubmittedCount = chartItems.filter(i => i.status === 'Not Started').length;

  // Geometry: Dynamic width prevents labels and pills from compressing and stacking
  const minPointSpacing = 92;
  const contentWidth = Math.max(880, 100 + chartItems.length * minPointSpacing);
  const svgWidth = contentWidth;
  const svgHeight = 185;
  const xStart = 75;
  const xEnd = svgWidth - 55;
  const yTop = 26; // 100%
  const yMid = 76; // 50%
  const yBottom = 126; // 0%
  const chartHeight = yBottom - yTop; // 100px

  const points = chartItems.map((item, i) => {
    const cx = chartItems.length === 1
      ? (xStart + xEnd) / 2
      : xStart + (i / Math.max(1, chartItems.length - 1)) * (xEnd - xStart);
    const cy = yBottom - (item.scorePercent / 100) * chartHeight;
    return { cx, cy, item };
  });

  const pathD = points.length === 1
    ? `M ${points[0].cx - 50} ${points[0].cy} L ${points[0].cx + 50} ${points[0].cy}`
    : points.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`;
      }, '');

  const hasAnyScore = chartItems.some(i => i.scorePercent > 0);
  const areaD = points.length > 1 && hasAnyScore
    ? `${pathD} L ${points[points.length - 1].cx} ${yBottom} L ${points[0].cx} ${yBottom} Z`
    : '';

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-5">
      {/* ── Header & Action Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Document Performance & Score
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tracking grades, pending submissions, and active drafts
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          {/* View Mode Toggle: Active Deliverables vs All Requirements */}
          {draftsAndMadeItems.length > 0 && (
            <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode('drafts')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'drafts'
                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Active ({draftsAndMadeItems.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All Requirements ({allRequirementItems.length})
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground font-medium text-[11px] shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{gradedCount} Graded</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground font-medium text-[11px] shadow-2xs">
              <span className="size-2 rounded-full bg-amber-500 shrink-0" />
              <span>{pendingCount} Pending</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground font-medium text-[11px] shadow-2xs">
              <span className="size-2 rounded-full bg-[#2563eb] shrink-0" />
              <span>{draftCount} Drafts</span>
            </span>
            {viewMode === 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-muted-foreground font-medium text-[11px] shadow-2xs">
                <span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                <span>{unsubmittedCount} Not Started</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SVG Chart Section ──────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-thin">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ minWidth: `${svgWidth}px`, width: '100%' }}
          className="h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" className="text-primary" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" className="text-primary" />
            </linearGradient>
          </defs>

          {/* Rotated Y-Axis Label */}
          <text
            x={18}
            y={yMid}
            textAnchor="middle"
            transform={`rotate(-90, 18, ${yMid})`}
            className="text-[9.5px] font-semibold fill-muted-foreground uppercase tracking-widest"
          >
            Score
          </text>

          {/* Y-Axis Numeric Markers */}
          <text
            x={58}
            y={yTop + 3.5}
            textAnchor="end"
            className="text-[10px] font-medium fill-muted-foreground"
          >
            100
          </text>
          <text
            x={58}
            y={yMid + 3.5}
            textAnchor="end"
            className="text-[10px] font-medium fill-muted-foreground"
          >
            50
          </text>
          <text
            x={58}
            y={yBottom + 3.5}
            textAnchor="end"
            className="text-[10px] font-medium fill-muted-foreground"
          >
            0
          </text>

          {/* Grid Lines */}
          {/* 100% Horizontal Grid Line */}
          <line
            x1={68}
            y1={yTop}
            x2={svgWidth - 20}
            y2={yTop}
            className="stroke-emerald-500/20 dark:stroke-emerald-500/25"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* 50% Horizontal Grid Line */}
          <line
            x1={68}
            y1={yMid}
            x2={svgWidth - 20}
            y2={yMid}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Left Vertical Axis Line */}
          <line
            x1={68}
            y1={yTop}
            x2={68}
            y2={yBottom}
            className="stroke-border"
            strokeWidth="1"
          />
          {/* Baseline 0% Line */}
          <line
            x1={68}
            y1={yBottom}
            x2={svgWidth - 20}
            y2={yBottom}
            className="stroke-border"
            strokeWidth="1"
          />

          {/* Area fill when scores > 0 */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#scoreAreaGradient)"
              className="text-primary transition-all duration-300"
            />
          )}

          {/* Plotted Score Polyline */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />

          {/* Baseline Ticks & Deliverable Labels */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={pt.item.id}>
                {/* Downward tick mark */}
                <line
                  x1={pt.cx}
                  y1={yBottom}
                  x2={pt.cx}
                  y2={yBottom + 5}
                  className="stroke-border"
                  strokeWidth="1"
                />

                {/* Vertical hover guide line */}
                {isHovered && (
                  <line
                    x1={pt.cx}
                    y1={yTop}
                    x2={pt.cx}
                    y2={yBottom}
                    className="stroke-primary/30"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Deliverable Title (2 lines) */}
                <text
                  x={pt.cx}
                  y={yBottom + 17}
                  textAnchor="middle"
                  className={cn(
                    'text-[9.5px] transition-colors pointer-events-none select-none',
                    isHovered
                      ? 'fill-primary font-semibold'
                      : 'fill-foreground font-medium'
                  )}
                >
                  <tspan x={pt.cx} dy="0">
                    {pt.item.shortLine1}
                  </tspan>
                  <tspan x={pt.cx} dy="11" className="fill-muted-foreground text-[8.5px] font-normal">
                    {pt.item.shortLine2}
                  </tspan>
                </text>
              </g>
            );
          })}

          {/* Floating Status / Score Pill above each point */}
          {points.map((pt) => {
            const isDraft = pt.item.status === 'Draft';
            const isSubmitted = pt.item.status === 'Submitted';
            const isApproved = pt.item.status === 'Approved';
            const isGraded = pt.item.status === 'Graded';

            let labelText = '';
            let badgeWidth = 36;

            if (isApproved || isGraded) {
              labelText = `${pt.item.scorePercent}`;
              badgeWidth = 32;
            } else if (isSubmitted) {
              labelText = 'Pending';
              badgeWidth = 44;
            } else if (isDraft) {
              labelText = 'Draft';
              badgeWidth = 36;
            } else {
              labelText = '--';
              badgeWidth = 24;
            }

            const badgeX = -badgeWidth / 2;

            return (
              <g
                key={`badge-${pt.item.id}`}
                transform={`translate(${pt.cx}, ${pt.cy - 15})`}
                className="pointer-events-none select-none"
              >
                <rect
                  x={badgeX}
                  y={-8}
                  width={badgeWidth}
                  height={16}
                  rx={8}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-700"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  className="text-[9px] font-medium fill-foreground"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* Data Points & Hit Targets */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={`point-${pt.item.id}`}
                className="cursor-pointer"
                onClick={() => onNavigate(pt.item)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Large transparent click/hover target */}
                <circle cx={pt.cx} cy={pt.cy} r={18} fill="transparent" />

                {/* Visible Data Point Ring & Circle */}
                <circle
                  cx={pt.cx}
                  cy={pt.cy}
                  r={isHovered ? 6.5 : pt.item.status === 'Draft' ? 4.5 : 5}
                  strokeWidth="2"
                  className={cn(
                    'transition-all duration-150 stroke-card',
                    pt.item.status === 'Approved'
                      ? 'fill-emerald-500'
                      : pt.item.status === 'Graded'
                      ? 'fill-primary'
                      : pt.item.status === 'Submitted'
                      ? 'fill-amber-500'
                      : pt.item.status === 'Draft'
                      ? 'fill-muted-foreground'
                      : 'fill-muted'
                  )}
                />
              </g>
            );
          })}

          {/* Interactive Tooltip Popover */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <g
              transform={`translate(${Math.min(
                Math.max(115, points[hoveredIndex].cx),
                svgWidth - 125
              )}, ${Math.max(45, points[hoveredIndex].cy - 70)})`}
              className="pointer-events-none"
            >
              <rect
                x="-110"
                y="-15"
                width="220"
                height="62"
                rx="8"
                className="fill-zinc-900 dark:fill-zinc-100 filter drop-shadow-md"
              />
              <polygon
                points="-5,47 5,47 0,52"
                className="fill-zinc-900 dark:fill-zinc-100"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                className="text-[10px] font-bold fill-white dark:fill-zinc-900"
              >
                {points[hoveredIndex].item.name.length > 32
                  ? points[hoveredIndex].item.name.substring(0, 31) + '…'
                  : points[hoveredIndex].item.name}
              </text>
              <text
                x="0"
                y="21"
                textAnchor="middle"
                className="text-[9.5px] fill-zinc-300 dark:fill-zinc-700"
              >
                {points[hoveredIndex].item.status === 'Draft'
                  ? 'Draft in progress • Saved in cloud'
                  : `Score: ${points[hoveredIndex].item.scorePercent}% • Grade: ${points[hoveredIndex].item.grade}`}
              </text>
              <text
                x="0"
                y="37"
                textAnchor="middle"
                className={cn(
                  'text-[9px] font-medium',
                  points[hoveredIndex].item.status === 'Approved'
                    ? 'fill-emerald-400 dark:fill-emerald-600'
                    : points[hoveredIndex].item.status === 'Graded'
                    ? 'fill-primary'
                    : points[hoveredIndex].item.status === 'Submitted'
                    ? 'fill-amber-400 dark:fill-amber-600'
                    : points[hoveredIndex].item.status === 'Draft'
                    ? 'fill-zinc-400 dark:fill-zinc-500'
                    : 'fill-zinc-500'
                )}
              >
                {points[hoveredIndex].item.status === 'Draft'
                  ? 'Click to continue draft →'
                  : points[hoveredIndex].item.status === 'Submitted'
                  ? 'Submitted • Click to review →'
                  : points[hoveredIndex].item.status === 'Approved'
                  ? 'Approved • Click to view →'
                  : 'Not started • Click to open template →'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* ─── Templates & Drafts in Progress Table (Matching Deliverables Layout) ─── */}
      {draftsAndMadeItems.length > 0 && (
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Templates & Drafts in Progress
              </h3>
              <span className="size-5.5 rounded-full bg-muted border border-border text-foreground text-xs font-bold inline-flex items-center justify-center shrink-0 shadow-2xs">
                {draftsAndMadeItems.length}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Click any item to continue editing or view submission
            </span>
          </div>

          <div className="bg-card border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100/75 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-700 text-xs font-bold text-foreground">
                    <th className="px-4 py-2.5 font-bold">Document</th>
                    <th className="px-3.5 py-2.5 whitespace-nowrap font-bold">Updated</th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap font-bold">Status</th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap font-bold">Grade</th>
                    <th className="px-4 py-2.5 text-center whitespace-nowrap font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {draftsAndMadeItems.map(item => {
                    const isDraft = item.status === 'Draft';
                    const isSubmitted = item.status === 'Submitted';
                    const isApproved = item.status === 'Approved';
                    const updatedDate = item.updatedAt ? new Date(item.updatedAt) : null;
                    const gradeText = isApproved
                      ? (item.grade ?? '1.0')
                      : item.status === 'Graded'
                      ? (item.grade ?? `${item.scorePercent}%`)
                      : '?';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/40 hover:shadow-2xs transition-all duration-200 group cursor-pointer"
                        onClick={() => onNavigate(item)}
                      >
                        {/* Document: Open Book SVG + Title & Subtitle */}
                        <td className="px-4 py-2.5 align-middle min-w-[280px]">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(item);
                              }}
                              className="flex items-center justify-center cursor-pointer p-0.5 rounded-md hover:bg-muted/60 transition-all shrink-0"
                              title={item.name}
                            >
                              <img
                                src="/images/undraw_open-book_pet1.svg"
                                alt=""
                                className="w-5.5 sm:w-6 h-auto object-contain shrink-0 group-hover:scale-105 group-hover:drop-shadow-xs transition-all duration-200 select-none"
                                loading="lazy"
                              />
                            </button>
                            <div className="min-w-0 transition-all duration-200 ease-out group-hover:translate-x-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(item);
                                }}
                                className="font-semibold text-xs sm:text-[13px] text-foreground group-hover:text-primary text-left block leading-tight cursor-pointer transition-all duration-200 !no-underline hover:!no-underline group-hover:drop-shadow-sm px-1.5 py-0.5 -ml-1.5 rounded-lg group-hover:bg-primary/5 dark:group-hover:bg-primary/10 group-hover:shadow-2xs"
                              >
                                {item.name}
                              </button>
                              <p className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate leading-tight">
                                {formatPhaseName(item.phase)}
                                {item.wordCount != null && item.wordCount > 0
                                  ? ` · ${item.wordCount.toLocaleString()} words`
                                  : isDraft
                                  ? ' · 0 words'
                                  : ''}
                                {item.revision != null && ` · Rev ${item.revision}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Updated Date */}
                        <td className="px-3.5 py-2 text-xs text-foreground align-middle whitespace-nowrap">
                          {updatedDate ? (
                            <>
                              <div className="font-medium text-[11.5px] leading-tight">
                                {format(updatedDate, 'MMM d')}
                              </div>
                              <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">
                                {format(updatedDate, 'h:mm a').toLowerCase()}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground font-medium">-</span>
                          )}
                        </td>

                        {/* Status: Neutral text with colored dot */}
                        <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground shadow-2xs">
                            <span
                              className={cn(
                                'size-2 rounded-full shrink-0',
                                isApproved
                                  ? 'bg-emerald-500'
                                  : isSubmitted
                                  ? 'bg-amber-500'
                                  : isDraft
                                  ? 'bg-[#2563eb]'
                                  : 'bg-zinc-400 dark:bg-zinc-600'
                              )}
                            />
                            <span>
                              {isDraft
                                ? 'Draft in Progress'
                                : isSubmitted
                                ? 'Submitted'
                                : isApproved
                                ? 'Approved'
                                : item.status}
                            </span>
                          </span>
                        </td>

                        {/* Grade */}
                        <td className="px-3 py-2 text-center text-xs font-medium text-foreground align-middle tabular-nums">
                          {gradeText}
                        </td>

                        {/* Action Column */}
                        <td className="px-4 py-2 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {isDraft ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                                title="Edit Draft"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit Draft</span>
                              </button>
                            ) : isSubmitted ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title="View Submission"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="View"
                              >
                                <span>View</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentDocumentRepository() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const rawTabQuery = searchParams.get('tab') || searchParams.get('phase');
  const tabQuery = (rawTabQuery === 'performance' ? 'analytics' : rawTabQuery) as FilterTab | null;
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    if (tabQuery && ['all', 'analytics', 'grading_scale', 'performance'].includes(tabQuery)) {
      return tabQuery === 'performance' ? 'analytics' : tabQuery;
    }
    return 'all';
  });

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [submissions, setSubmissions] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync tab with query param
  useEffect(() => {
    if (tabQuery && ['all', 'analytics', 'grading_scale', 'performance'].includes(tabQuery)) {
      setActiveTab(tabQuery === 'performance' ? 'analytics' : tabQuery);
    }
  }, [tabQuery]);

  const handleTabChange = (tab: FilterTab) => {
    const resolvedTab = tab === 'performance' ? 'analytics' : tab;
    setActiveTab(resolvedTab);
    if (resolvedTab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: resolvedTab });
    }
  };

  // ── Load live drafts & submissions ──────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError(null);

    try {
      const [draftsRes, subsRes] = await Promise.all([
        supabase
          .from('editor_drafts')
          .select('id, title, template_id, template_name, phase, status, updated_at, submission_id, word_count, revision')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
        supabase
          .from('student_documents')
          .select('*')
          .or(`owner_id.eq.${user.id},student_name.eq.${user.name || (user as any).full_name || ''}`)
          .order('created_at', { ascending: false }),
      ]);

      if (draftsRes.error) throw new Error(draftsRes.error.message);
      const remoteDrafts = (draftsRes.data ?? []) as DraftRow[];

      let allDrafts: DraftRow[] = [...remoteDrafts];
      try {
        if (typeof window !== 'undefined' && user.id) {
          const { get } = await import('idb-keyval');
          const indexKey = `user-draft-index:${user.id}`;
          const draftIds = (await get<string[]>(indexKey)) ?? [];
          for (const dId of draftIds) {
            if (!allDrafts.some(d => d.id === dId)) {
              const cached = await get<any>(`ojt-draft:${user.id}:${dId}`);
              if (cached) {
                allDrafts.push({
                  id: cached.id,
                  title: cached.title || 'Untitled Document',
                  template_id: cached.templateId || null,
                  template_name: cached.templateName || null,
                  phase: cached.phase || null,
                  status: cached.status || 'draft',
                  updated_at: cached.updatedAt || new Date().toISOString(),
                  submission_id: cached.submissionId || null,
                  word_count: cached.wordCount,
                  revision: cached.revision,
                });
              }
            }
          }
        }
      } catch (localErr) {
        console.warn('Could not read local draft cache:', localErr);
      }

      setDrafts(allDrafts);
      setSubmissions((subsRes.data ?? []) as StudentDocument[]);
    } catch (e) {
      console.error('Failed to load document repository data:', e);
      setLoadError(e instanceof Error ? e.message : 'Could not load document repository.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Create blank document ───────────────────────────────────────────────
  const handleOpenBlankDocument = useCallback(async () => {
    if (!user?.id) return;
    const existingBlank = drafts.find(d => !d.template_id && d.status !== 'locked');
    if (existingBlank) {
      navigate(`/student/editor?draft=${existingBlank.id}`);
      return;
    }

    const draftId = crypto.randomUUID();
    try {
      const { error } = await supabase.rpc('create_editor_draft', {
        p_id: draftId,
        p_title: 'Untitled Practicum Document',
        p_template_id: null,
        p_template_name: null,
        p_phase: null,
        p_content: [{ type: 'p', children: [{ text: '' }] }],
        p_word_count: 0,
      });
      if (error) throw new Error(error.message);
      navigate(`/student/editor?draft=${draftId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create blank document.');
    }
  }, [drafts, navigate, user?.id]);

  // ── Filtered items ───────────────────────────────────────────────────────
  const filteredRequirements = INSTITUTIONAL_REQUIREMENTS;

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: INSTITUTIONAL_REQUIREMENTS.length,
    };
  }, []);

  // ── Metrics Calculation for Top Stat Counter Cards (Image 1 Counter Design) ──
  const metrics = useMemo(() => {
    let subCount = 0;
    let appCount = 0;
    let totalScore = 0;
    let scoredItemsCount = 0;

    for (const req of INSTITUTIONAL_REQUIREMENTS) {
      const matchingSub = submissions.find(
        s =>
          s.doc_type && (
            s.doc_type.toLowerCase() === req.name.toLowerCase() ||
            s.doc_type.toLowerCase() === req.id.toLowerCase() ||
            s.doc_type.toLowerCase().includes(req.code)
          )
      );
      const matchingDraft = findMatchingDraft(drafts, req);
      const isSub = Boolean(matchingSub) || (matchingDraft && matchingDraft.status === 'submitted');
      const isApp = matchingSub?.status === 'Approved';

      if (isSub) subCount++;
      if (isApp) {
        appCount++;
        totalScore += req.maxScore;
        scoredItemsCount++;
      } else if ((matchingSub as any)?.score != null && Number((matchingSub as any).score) > 0) {
        totalScore += Number((matchingSub as any).score);
        scoredItemsCount++;
      }
    }

    // Count distinct active deliverables in draft status
    const uniqueDraftKeys = new Set<string>();
    let hasUntitled = false;
    for (const d of drafts) {
      if (d.status !== 'draft') continue;
      const matchedReq = matchInstitutionalRequirement(d);
      if (matchedReq) {
        uniqueDraftKeys.add(`req:${matchedReq.id}`);
      } else {
        const isUnt =
          (!d.title || d.title.trim().toLowerCase() === 'untitled document' || d.title.trim().toLowerCase() === 'untitled practicum document') &&
          (!d.template_name || d.template_name.trim().toLowerCase() === 'untitled document');
        if (isUnt) {
          if (!hasUntitled) {
            hasUntitled = true;
            uniqueDraftKeys.add('untitled');
          }
        } else {
          uniqueDraftKeys.add(`custom:${d.title?.trim().toLowerCase()}`);
        }
      }
    }
    const activeDrafts = uniqueDraftKeys.size;

    // Follow institutional grading scale (1.00 to 5.00)
    // If no approved or graded deliverables, display '- / 1.00' (following scale grade for unfulfilled status)
    let scoreDisplay = '- / 1.00';
    if (scoredItemsCount > 0) {
      const avgPercent = (totalScore / (scoredItemsCount * 100)) * 100;
      const grade = getInstitutionalGrade(avgPercent);
      scoreDisplay = `${grade} / 1.00`;
    }

    return {
      submittedCount: subCount,
      approvedCount: appCount,
      activeDraftsCount: activeDrafts,
      scoreDisplay,
    };
  }, [submissions, drafts]);

  const submittedWave = useMemo(
    () => generateSubmittedWave(metrics.submittedCount, counts.all),
    [metrics.submittedCount, counts.all]
  );
  const draftWave = useMemo(
    () => generateDraftWave(metrics.activeDraftsCount),
    [metrics.activeDraftsCount]
  );
  const scoreWave = useMemo(
    () => generateScoreWave(metrics.approvedCount > 0),
    [metrics.approvedCount]
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Documents
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Institutional document repository & practicum deliverables tracker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData()}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all cursor-pointer"
            title="Refresh repository"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-primary')} />
          </button>
          <button
            onClick={handleOpenBlankDocument}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blank Document</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: 3 METRIC COUNTER STAT CARDS (Image 1 Counter Design) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: Submitted Deliverables (Those that are not drafts, with check green icon) */}
        <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-1 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight flex items-center gap-1.5">
              <span>Submitted Deliverables</span>
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                  title="More options"
                >
                  <MoreVertical size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleTabChange('all')}>
                  <CheckCircle2 className="size-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                  <span>View All Deliverables</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange('analytics')}>
                  <Target className="size-4 mr-2" />
                  <span>Deliverables Performance</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
              {metrics.submittedCount}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
              / {counts.all} deliverables ({metrics.approvedCount} approved)
            </span>
          </div>

          {/* Soft Light Sparkline Wave */}
          <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
            <svg
              viewBox="0 0 300 45"
              preserveAspectRatio="none"
              className={cn(
                "w-full h-5 overflow-visible transition-colors duration-200",
                metrics.submittedCount > 0
                  ? "text-emerald-500/80 dark:text-emerald-400/85"
                  : "text-muted-foreground/30"
              )}
            >
              <defs>
                <linearGradient id="docWaveGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={metrics.submittedCount > 0 ? "0.22" : "0.08"} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {metrics.submittedCount > 0 && (
                <path
                  d={submittedWave.secFill}
                  fill="currentColor"
                  className="opacity-15 animate-sparkline-float-secondary"
                />
              )}
              <path
                d={submittedWave.fill}
                fill="url(#docWaveGrad1)"
                className="animate-sparkline-fade animate-sparkline-float"
              />
              <path
                d={submittedWave.stroke}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-sparkline-draw animate-sparkline-float"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Drafts in Progress (Image 3 Design Counter) */}
        <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-1 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight flex items-center gap-1.5">
              <span>Drafts in Progress</span>
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                  title="More options"
                >
                  <MoreVertical size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpenBlankDocument}>
                  <Plus className="size-4 mr-2 text-sky-600 dark:text-sky-400" />
                  <span>New Blank Document</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void loadData()}>
                  <RefreshCw className="size-4 mr-2" />
                  <span>Refresh Drafts</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
              {metrics.activeDraftsCount}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
              {metrics.activeDraftsCount === 1 ? '1 active draft' : `${metrics.activeDraftsCount} active drafts`}
            </span>
          </div>

          {/* Soft Light Sparkline Wave */}
          <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
            <svg
              viewBox="0 0 300 45"
              preserveAspectRatio="none"
              className={cn(
                "w-full h-5 overflow-visible transition-colors duration-200",
                metrics.activeDraftsCount > 0
                  ? "text-sky-500/80 dark:text-sky-400/85"
                  : "text-muted-foreground/30"
              )}
            >
              <defs>
                <linearGradient id="docWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={metrics.activeDraftsCount > 0 ? "0.22" : "0.08"} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {metrics.activeDraftsCount > 0 && (
                <path
                  d={draftWave.secFill}
                  fill="currentColor"
                  className="opacity-15 animate-sparkline-float-secondary"
                />
              )}
              <path
                d={draftWave.fill}
                fill="url(#docWaveGrad2)"
                className="animate-sparkline-fade animate-sparkline-float"
              />
              <path
                d={draftWave.stroke}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-sparkline-draw animate-sparkline-float"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Institutional Score (Scoreboard Moved to Counter Box) */}
        <div className="bg-card border border-zinc-200 dark:border-border/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-1 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight flex items-center gap-1.5">
              <span>Institutional Score</span>
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-5.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                  title="More options"
                >
                  <MoreVertical size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleTabChange('grading_scale')}>
                  <Target className="size-4 mr-2" />
                  <span>Grading Scale Table</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange('analytics')}>
                  <Clock className="size-4 mr-2" />
                  <span>View Performance</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
              {metrics.scoreDisplay}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-none">
              Target: 1.00 Grade
            </span>
          </div>

          {/* Soft Light Sparkline Wave */}
          <div className="w-full pt-0.5 -mb-0.5 overflow-hidden pointer-events-none">
            <svg
              viewBox="0 0 300 45"
              preserveAspectRatio="none"
              className={cn(
                "w-full h-5 overflow-visible transition-colors duration-200",
                metrics.approvedCount > 0
                  ? "text-primary/80 dark:text-primary/85"
                  : "text-muted-foreground/30"
              )}
            >
              <defs>
                <linearGradient id="docWaveGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={metrics.approvedCount > 0 ? "0.22" : "0.08"} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={scoreWave.fill}
                fill="url(#docWaveGrad3)"
                className="animate-sparkline-fade animate-sparkline-float"
              />
              <path
                d={scoreWave.stroke}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-sparkline-draw animate-sparkline-float"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filter Pill Bar (Aligned with System Theme Color) ─────────── */}
      <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-2xs">
        {/* All Tab */}
        <button
          onClick={() => handleTabChange('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <span>All</span>
          <span
            className={cn(
              'size-4.5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 transition-colors',
              activeTab === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-zinc-200 dark:bg-zinc-800 text-muted-foreground'
            )}
          >
            {counts.all}
          </span>
        </button>

        {/* Performance Tab */}
        <button
          onClick={() => handleTabChange('analytics')}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
            activeTab === 'analytics' || (activeTab as string) === 'performance'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <span>Performance</span>
        </button>

        {/* Grading scale Tab */}
        <button
          onClick={() => handleTabChange('grading_scale')}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
            activeTab === 'grading_scale'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
          )}
        >
          <span>Grading scale</span>
        </button>
      </div>

      {/* ── Active View Rendering ────────────────────────────────────────────── */}
      {activeTab === 'grading_scale' ? (
        <GradingScaleView />
      ) : activeTab === 'analytics' ? (
        <AssignmentAnalyticsChart
          submissions={submissions}
          drafts={drafts}
          onNavigate={(item) => {
            if (item.status === 'Draft' && item.draftId) {
              navigate(`/student/editor?draft=${item.draftId}`);
            } else if (item.status === 'Submitted' || item.status === 'Approved' || item.status === 'Graded') {
              if (item.submissionId) {
                navigate(`/student/documents/${item.submissionId}`);
              } else {
                navigate(`/student/documents/${item.id}`);
              }
            } else {
              const tmpl = getEditorTemplate(item.id);
              if (tmpl && tmpl.editable) {
                navigate(`/student/editor?template=${item.id}`);
              } else {
                navigate(`/student/documents/${item.id}`);
              }
            }
          }}
        />
      ) : (
        /* ── Institutional Repository Table ───────────────────────────────────── */
        <div className="bg-card border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs font-semibold tracking-wider uppercase">Loading deliverables…</p>
            </div>
          ) : loadError ? (
            <div className="p-6 text-center space-y-2.5">
              <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">{loadError}</p>
              <button
                onClick={() => void loadData()}
                className="text-xs text-primary font-bold hover:underline"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100/75 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-700 text-xs font-bold text-foreground">
                    <th className="px-4 py-2.5 font-bold">Document</th>
                    <th className="px-3.5 py-2.5 whitespace-nowrap font-bold">Start</th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap font-bold">Submitted</th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap font-bold">Grade</th>
                    <th className="px-4 py-2.5 text-center whitespace-nowrap font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredRequirements.map(req => {
                    // Find matching submission or draft
                    const matchingSubmission = submissions.find(
                      s =>
                        s.doc_type && (
                          s.doc_type.toLowerCase() === req.name.toLowerCase() ||
                          s.doc_type.toLowerCase() === req.id.toLowerCase() ||
                          s.doc_type.toLowerCase().includes(req.code)
                        )
                    );
                    const matchingDraft = findMatchingDraft(drafts, req);

                    const isSubmitted =
                      Boolean(matchingSubmission) || (matchingDraft && matchingDraft.status === 'submitted');
                    const isApproved = matchingSubmission?.status === 'Approved';
                    const isDraft = !isSubmitted && !isApproved && Boolean(matchingDraft);

                    const gradeText = isApproved ? '1.0' : '?';

                    // Split start date into date & time
                    const startParts = req.startDate.split(', ');

                    const handleDeliverableClick = () => {
                      if (isDraft && matchingDraft) {
                        navigate(`/student/editor?draft=${matchingDraft.id}`);
                      } else if (matchingSubmission) {
                        navigate(`/student/documents/${matchingSubmission.id}`);
                      } else {
                        const tmpl = getEditorTemplate(req.id);
                        if (tmpl && tmpl.editable) {
                          navigate(`/student/editor?template=${req.id}`);
                        } else {
                          navigate(`/student/documents/${req.id}`);
                        }
                      }
                    };

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-muted/40 hover:shadow-2xs transition-all duration-200 group"
                      >
                        {/* Assignment: Book Icon + Title & Subtitle grouped together */}
                        <td className="px-4 py-2.5 align-middle min-w-[280px]">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleDeliverableClick}
                              className="flex items-center justify-center cursor-pointer p-0.5 rounded-md hover:bg-muted/60 transition-all shrink-0"
                              title={req.name}
                            >
                              <img
                                src="/images/undraw_open-book_pet1.svg"
                                alt=""
                                className="w-5.5 sm:w-6 h-auto object-contain shrink-0 group-hover:scale-105 group-hover:drop-shadow-xs transition-all duration-200 select-none"
                                loading="lazy"
                              />
                            </button>
                            <div className="min-w-0 transition-all duration-200 ease-out group-hover:translate-x-1.5">
                              <button
                                type="button"
                                onClick={handleDeliverableClick}
                                className="font-semibold text-xs sm:text-[13px] text-foreground group-hover:text-primary text-left block leading-tight cursor-pointer transition-all duration-200 !no-underline hover:!no-underline group-hover:drop-shadow-sm px-1.5 py-0.5 -ml-1.5 rounded-lg group-hover:bg-primary/5 dark:group-hover:bg-primary/10 group-hover:shadow-2xs"
                              >
                                {req.name}
                              </button>
                              <p className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate leading-tight">
                                {req.subtitle.replace(/^\d+\s*/, '')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Start Date */}
                        <td className="px-3.5 py-2 text-xs text-foreground align-middle whitespace-nowrap">
                          <div className="font-medium text-[11.5px] leading-tight">{startParts[0]}</div>
                          {startParts[1] && (
                            <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">{startParts[1]}</div>
                          )}
                        </td>

                        {/* Submitted status */}
                        <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                          {isSubmitted ? (
                            <Check className="size-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.8]" />
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-foreground shadow-2xs">
                              <span className="size-2 rounded-full bg-[#2563eb] shrink-0" />
                              <span>Draft in Progress</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-medium">-</span>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="px-3 py-2 text-center text-xs font-medium text-foreground align-middle tabular-nums">
                          {gradeText}
                        </td>

                        {/* Action: Center-aligned Review, Continue Draft, or View button */}
                        <td className="px-4 py-2 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {isSubmitted ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/student/review/${matchingSubmission?.id || req.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title="Review & Comments"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Review & Comments</span>
                              </button>
                            ) : isDraft ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/student/editor?draft=${matchingDraft!.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                                title="Continue Draft"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit Draft</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const tmpl = getEditorTemplate(req.id);
                                  if (tmpl && tmpl.editable) {
                                    navigate(`/student/editor?template=${req.id}`);
                                  } else {
                                    navigate(`/student/documents/${req.id}`);
                                  }
                                }}
                                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentDocumentRepository;
