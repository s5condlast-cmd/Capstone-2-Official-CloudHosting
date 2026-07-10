import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  RefreshCw,
  BookOpen,
  UserCheck,
  CalendarCheck,
  SpellCheck,
  FileSearch,
  Link2,
  Eye
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import type { InsightReport, InsightCategory, InsightItem, InsightStatus } from '@/src/types';

// ──────────────────────────────────────────────
// Mock Insight Data Generator per Document Type
// ──────────────────────────────────────────────

const MANUAL_CHECKS = [
  'Font type (Arial / Times New Roman)',
  'Font size (12pt as required)',
  'Line spacing (1.5 as per template)',
  'Margin correctness (1" all sides)',
  'Layout alignment & visual structure',
];

export function generateMockInsight(docType: string): InsightReport {
  switch (docType) {
    case 'Prelim Journal':
    case 'Midterm Journal':
    case 'Pre-finals Journal':
    case 'Finals Journal':
      return {
        overallScore: 68,
        summaryText: '3 issues need attention before approval',
        analyzedAt: new Date().toISOString(),
        manualChecks: MANUAL_CHECKS,
        categories: [
          {
            title: 'Field Completeness',
            icon: 'UserCheck',
            items: [
              { label: 'Student name is present in the header', status: 'pass' },
              { label: 'Company name detected: "Tech Solutions Inc."', status: 'pass' },
              { label: 'Supervisor name field appears empty', status: 'fail', detail: 'Expected a supervisor name near the signature area but none was found', suggestion: 'Ask the student to include supervisor name above the signature line' },
            ],
          },
          {
            title: 'Spelling & Grammar',
            icon: 'SpellCheck',
            items: [
              { label: '"recieved" → "received"', status: 'warn', detail: 'Page 2, paragraph 3', suggestion: 'Common misspelling — "i before e except after c"' },
              { label: '"seperately" → "separately"', status: 'warn', detail: 'Page 3, paragraph 1' },
              { label: '"occured" → "occurred"', status: 'warn', detail: 'Page 3, paragraph 4' },
            ],
          },
          {
            title: 'Required Sections',
            icon: 'BookOpen',
            items: [
              { label: 'Objectives section found', status: 'pass' },
              { label: 'Activities section found', status: 'pass' },
              { label: 'Challenges section found', status: 'pass' },
              { label: 'Reflection section missing', status: 'fail', detail: 'No "Reflection" or "Learning Outcomes" heading detected', suggestion: 'Student should add a reflection paragraph summarizing key takeaways' },
            ],
          },
          {
            title: 'Date Validation',
            icon: 'CalendarCheck',
            items: [
              { label: 'Date range: April 01 – April 30, 2026', status: 'pass' },
              { label: 'All dates fall within MOA effective period', status: 'pass' },
              { label: 'Entry dated on a weekend (April 12, Saturday)', status: 'warn', detail: 'Unusual — verify if the student actually worked on this day' },
            ],
          },
          {
            title: 'Word Count & Density',
            icon: 'FileSearch',
            items: [
              { label: 'Total word count: 487 words', status: 'warn', detail: 'Below the 500-word minimum requirement', suggestion: 'Student should expand the Activities or Reflection sections' },
              { label: 'Technical density: 65% — Optimal', status: 'pass' },
            ],
          },
        ],
      };

    case 'Resume':
      return {
        overallScore: 82,
        summaryText: '1 issue found — generally well-structured',
        analyzedAt: new Date().toISOString(),
        manualChecks: MANUAL_CHECKS,
        categories: [
          {
            title: 'Field Completeness',
            icon: 'UserCheck',
            items: [
              { label: 'Student name found in header', status: 'pass' },
              { label: 'Email address detected', status: 'pass' },
              { label: 'Phone number detected', status: 'pass' },
              { label: 'Company name: "Tech Solutions Inc."', status: 'pass' },
            ],
          },
          {
            title: 'Spelling & Grammar',
            icon: 'SpellCheck',
            items: [
              { label: '"profecient" → "proficient"', status: 'warn', detail: 'Skills section', suggestion: 'Common misspelling in technical resumes' },
            ],
          },
          {
            title: 'Required Sections',
            icon: 'BookOpen',
            items: [
              { label: 'Education section found', status: 'pass' },
              { label: 'Experience section found', status: 'pass' },
              { label: 'Skills section found', status: 'pass' },
              { label: 'References section found', status: 'pass' },
            ],
          },
          {
            title: 'Cross-Document Consistency',
            icon: 'Link2',
            items: [
              { label: 'Company name matches MOA record', status: 'pass' },
              { label: 'Student ID matches enrollment record', status: 'pass' },
            ],
          },
        ],
      };

    case 'MOA':
    case 'MOA Revised':
      return {
        overallScore: 74,
        summaryText: '2 issues require verification',
        analyzedAt: new Date().toISOString(),
        manualChecks: MANUAL_CHECKS,
        categories: [
          {
            title: 'Field Completeness',
            icon: 'UserCheck',
            items: [
              { label: 'demo STI Marikina identified as Party A', status: 'pass' },
              { label: 'Company name "Tech Solutions Inc." identified as Party B', status: 'pass' },
              { label: '"Signature over Printed Name" text detected on all pages', status: 'pass' },
              { label: 'Notary section appears incomplete', status: 'warn', detail: 'Notary public name and commission number area may be blank' },
            ],
          },
          {
            title: 'Date Validation',
            icon: 'CalendarCheck',
            items: [
              { label: 'Effective date: March 15, 2026', status: 'pass' },
              { label: 'Expiration date: September 15, 2026', status: 'pass' },
              { label: 'Date range is logically valid (6-month period)', status: 'pass' },
            ],
          },
          {
            title: 'Spelling & Grammar',
            icon: 'SpellCheck',
            items: [
              { label: 'No spelling errors detected in body text', status: 'pass' },
              { label: '"Whereas" clause structure is grammatically correct', status: 'pass' },
            ],
          },
          {
            title: 'Cross-Document Consistency',
            icon: 'Link2',
            items: [
              { label: 'Company name matches student\'s registered company', status: 'pass' },
              { label: 'Student ID not found in document body', status: 'warn', detail: 'Student ID should appear in the list of deploying students', suggestion: 'Verify that the student is listed in the MOA appendix' },
            ],
          },
        ],
      };

    case 'DTR':
    case 'DTR Week 8':
      return {
        overallScore: 79,
        summaryText: '2 minor issues flagged',
        analyzedAt: new Date().toISOString(),
        manualChecks: MANUAL_CHECKS,
        categories: [
          {
            title: 'Date Validation',
            icon: 'CalendarCheck',
            items: [
              { label: 'All entries fall within reporting period', status: 'pass' },
              { label: 'Entry on April 12 (Saturday) flagged', status: 'warn', detail: 'Weekend entry detected — verify if legitimate overtime' },
              { label: 'No duplicate dates found', status: 'pass' },
            ],
          },
          {
            title: 'Field Completeness',
            icon: 'UserCheck',
            items: [
              { label: 'Student name present', status: 'pass' },
              { label: 'Daily hours recorded for all entries', status: 'pass' },
              { label: '"Verified by" signature text detected', status: 'pass' },
            ],
          },
          {
            title: 'Hour Calculations',
            icon: 'FileSearch',
            items: [
              { label: 'No single-day entry exceeds 8 hours', status: 'pass' },
              { label: 'Weekly total: 38 hours (within normal range)', status: 'pass' },
              { label: 'Date format inconsistency on rows 3, 7', status: 'warn', detail: 'Mixed format: "04/03/2026" vs "April 3, 2026"', suggestion: 'Use a consistent date format throughout' },
            ],
          },
        ],
      };

    default:
      return {
        overallScore: 85,
        summaryText: 'Document looks generally compliant',
        analyzedAt: new Date().toISOString(),
        manualChecks: MANUAL_CHECKS,
        categories: [
          {
            title: 'Field Completeness',
            icon: 'UserCheck',
            items: [
              { label: 'Student name detected', status: 'pass' },
              { label: 'Document date present', status: 'pass' },
            ],
          },
          {
            title: 'Spelling & Grammar',
            icon: 'SpellCheck',
            items: [
              { label: 'No major spelling errors detected', status: 'pass' },
            ],
          },
        ],
      };
  }
}

// ──────────────────────────────────
// Icon resolver helper
// ──────────────────────────────────

function getCategoryIcon(iconName: string) {
  const size = 14;
  switch (iconName) {
    case 'UserCheck': return <UserCheck size={size} />;
    case 'SpellCheck': return <SpellCheck size={size} />;
    case 'BookOpen': return <BookOpen size={size} />;
    case 'CalendarCheck': return <CalendarCheck size={size} />;
    case 'FileSearch': return <FileSearch size={size} />;
    case 'Link2': return <Link2 size={size} />;
    default: return <FileText size={size} />;
  }
}

function getStatusIcon(status: InsightStatus) {
  switch (status) {
    case 'pass': return <CheckCircle2 size={13} />;
    case 'warn': return <AlertTriangle size={13} />;
    case 'fail': return <X size={13} />;
  }
}

// ──────────────────────────────────
// Component Props
// ──────────────────────────────────

interface ContentInsightPanelProps {
  docType: string;
  onCopyToFeedback?: (text: string) => void;
}

// ──────────────────────────────────
// Main Component
// ──────────────────────────────────

export const ContentInsightPanel: React.FC<ContentInsightPanelProps> = ({ docType, onCopyToFeedback }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<InsightReport | null>(() => generateMockInsight(docType));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const handleReanalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setReport(generateMockInsight(docType));
      setIsAnalyzing(false);
    }, 2000);
  };

  const buildFeedbackText = () => {
    if (!report) return '';
    const lines: string[] = ['── AI Content Insight Review ──', ''];
    
    report.categories.forEach(cat => {
      const issues = cat.items.filter(i => i.status !== 'pass');
      if (issues.length === 0) return;
      lines.push(`▸ ${cat.title}`);
      issues.forEach(item => {
        const prefix = item.status === 'fail' ? '✗' : '⚠';
        lines.push(`  ${prefix} ${item.label}`);
        if (item.detail) lines.push(`    → ${item.detail}`);
        if (item.suggestion) lines.push(`    Suggestion: ${item.suggestion}`);
      });
      lines.push('');
    });

    lines.push('── Manual Checks (Adviser) ──');
    report.manualChecks.forEach(c => lines.push(`  • ${c}`));
    return lines.join('\n');
  };

  const handleCopyAll = () => {
    const text = buildFeedbackText();
    if (onCopyToFeedback) {
      onCopyToFeedback(text);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  const handleCopySingleIssue = (item: InsightItem, catIdx: number, itemIdx: number) => {
    const prefix = item.status === 'fail' ? '✗' : '⚠';
    let text = `${prefix} ${item.label}`;
    if (item.detail) text += `\n  → ${item.detail}`;
    if (item.suggestion) text += `\n  Suggestion: ${item.suggestion}`;
    if (onCopyToFeedback) {
      onCopyToFeedback(text);
      setCopiedIndex(catIdx * 100 + itemIdx);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  if (!report) return null;

  const totalIssues = report.categories.reduce(
    (sum, cat) => sum + cat.items.filter(i => i.status !== 'pass').length, 0
  );
  const totalChecks = report.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const passCount = totalChecks - totalIssues;

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden pt-0 px-0 pb-0">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <SpellCheck size={16} className="text-black dark:text-white" />
          <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
            Content Insight Review
          </span>
          <Badge variant="outline" className="ml-2 text-[10px] border-zinc-300 dark:border-zinc-700">
            {totalIssues === 0 ? 'All Clear' : `${totalIssues} Issue${totalIssues > 1 ? 's' : ''}`}
          </Badge>
        </div>
        <button className="text-zinc-500">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-200/80 dark:border-zinc-800/80"
          >
            <div className="p-6 space-y-6">

              {/* Analyzing State */}
              {isAnalyzing && (
                <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/50">
                  <RefreshCw className="animate-spin text-black dark:text-white" size={24} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Analyzing document content...
                  </span>
                </div>
              )}

              {!isAnalyzing && (
                <>
                  {/* Overall Score */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Content Quality Score
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {report.overallScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${report.overallScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn(
                          "h-full rounded-full",
                          report.overallScore >= 80
                            ? "bg-zinc-400 dark:bg-zinc-500"
                            : report.overallScore >= 60
                              ? "bg-zinc-700 dark:bg-zinc-300"
                              : "bg-zinc-900 dark:bg-zinc-100"
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                        {report.summaryText}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        <span>{passCount} passed</span>
                        <span>·</span>
                        <span>{totalIssues} flagged</span>
                      </div>
                    </div>
                  </div>

                  {/* Insight Categories */}
                  <div className="space-y-3">
                    {report.categories.map((cat, catIdx) => {
                      const catIssues = cat.items.filter(i => i.status !== 'pass').length;
                      const isExpanded = expandedCategories.has(cat.title);

                      return (
                        <div
                          key={cat.title}
                          className="border border-zinc-100 dark:border-zinc-800/50 rounded-xl overflow-hidden"
                        >
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(cat.title)}
                            className="w-full p-3 flex items-center justify-between bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                                catIssues > 0
                                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                              )}>
                                {getCategoryIcon(cat.icon)}
                              </div>
                              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                                {cat.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {catIssues > 0 ? (
                                <Badge variant="error" className="text-[9px]">
                                  {catIssues} ISSUE{catIssues > 1 ? 'S' : ''}
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[9px]">
                                  ALL CLEAR
                                </Badge>
                              )}
                              {isExpanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                            </div>
                          </button>

                          {/* Category Items */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-zinc-100 dark:border-zinc-800/50"
                              >
                                <div className="p-3 space-y-1.5">
                                  {cat.items.map((item, itemIdx) => (
                                    <motion.div
                                      key={itemIdx}
                                      initial={{ opacity: 0, x: -6 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: itemIdx * 0.04 }}
                                      className={cn(
                                        "group flex items-start gap-2.5 p-2.5 rounded-lg transition-colors",
                                        item.status === 'pass'
                                          ? "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                          : item.status === 'warn'
                                            ? "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                      )}
                                    >
                                      <div className={cn(
                                        "mt-0.5 shrink-0",
                                        item.status === 'pass'
                                          ? "text-zinc-300 dark:text-zinc-600"
                                          : item.status === 'warn'
                                            ? "text-zinc-600 dark:text-zinc-300"
                                            : "text-zinc-900 dark:text-zinc-100"
                                      )}>
                                        {getStatusIcon(item.status)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className={cn(
                                          "text-[11px] font-medium leading-relaxed",
                                          item.status === 'pass'
                                            ? "text-zinc-400 dark:text-zinc-500"
                                            : item.status === 'warn'
                                              ? "text-zinc-700 dark:text-zinc-200"
                                              : "text-zinc-900 dark:text-zinc-100 font-semibold"
                                        )}>
                                          {item.label}
                                        </span>
                                        {item.detail && (
                                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                                            {item.detail}
                                          </p>
                                        )}
                                        {item.suggestion && (
                                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 italic flex items-start gap-1">
                                            <Sparkles size={10} className="mt-0.5 shrink-0" />
                                            {item.suggestion}
                                          </p>
                                        )}
                                      </div>
                                      {/* Copy individual issue to feedback */}
                                      {item.status !== 'pass' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCopySingleIssue(item, catIdx, itemIdx); }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-black dark:hover:text-white shrink-0 mt-0.5"
                                          title="Add to feedback"
                                        >
                                          {copiedIndex === catIdx * 100 + itemIdx ? (
                                            <CheckCircle2 size={12} />
                                          ) : (
                                            <Copy size={12} />
                                          )}
                                        </button>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual Checks Disclaimer */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Manual Checks Required
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-3 leading-relaxed">
                      The following cannot be verified by AI content analysis. Please verify these against the admin template manually:
                    </p>
                    <ul className="space-y-1.5">
                      {report.manualChecks.map((check, i) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                          <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 flex-1"
                      onClick={handleCopyAll}
                      icon={copiedIndex === -1 ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    >
                      {copiedIndex === -1 ? 'Added to Feedback' : 'Copy Issues to Feedback'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
                      onClick={handleReanalyze}
                      icon={<RefreshCw size={14} />}
                    >
                      Re-analyze
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
