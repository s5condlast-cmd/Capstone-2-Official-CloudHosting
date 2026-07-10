import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface GrammarIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: string;
  original: string;
  suggested: string;
  explanation: string;
  section: string;
  applied?: boolean;
  skipped?: boolean;
}

interface AIGrammarPanelProps {
  onApplyCorrection?: (issue: GrammarIssue) => void;
  onApplyAll?: (issues: GrammarIssue[]) => void;
}

export const AIGrammarPanel: React.FC<AIGrammarPanelProps> = ({
  onApplyCorrection,
  onApplyAll
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runGrammarCheck = () => {
    setIsAnalyzing(true);
    setIssues([]);
    setHasRun(false);

    setTimeout(() => {
      const mockIssues: GrammarIssue[] = [
        {
          id: 'g1',
          type: 'error',
          category: 'Spelling',
          original: 'recieved',
          suggested: 'received',
          explanation: '"recieved" is a common misspelling. The correct spelling is "received" (i before e, except after c).',
          section: 'Activities & Tasks',
        },
        {
          id: 'g2',
          type: 'error',
          category: 'Grammar',
          original: 'I also shadowed the senior frontend developer for two days to understand their component architecture.',
          suggested: 'I also shadowed a senior frontend developer for two days to understand the component architecture.',
          explanation: 'Use "a senior" instead of "the senior" unless referring to a previously mentioned specific person. "their" is ambiguous — use "the" for clarity.',
          section: 'Activities & Tasks',
        },
        {
          id: 'g3',
          type: 'warning',
          category: 'Data Inconsistency',
          original: 'TechCorp Solutions',
          suggested: 'TechCorp Solutions Inc.',
          explanation: 'The company name is written as "TechCorp Solutions" here, but the official system metadata lists it as "TechCorp Solutions Inc." Ensure the name matches exactly to avoid discrepancies.',
          section: 'Objectives',
        },
        {
          id: 'g4',
          type: 'warning',
          category: 'Name Formatting',
          original: 'mr. john doe',
          suggested: 'Mr. John Doe',
          explanation: 'The name is improperly capitalized. Names and proper nouns should have the first letter of each word capitalized.',
          section: 'Activities & Tasks',
        },
        {
          id: 'g5',
          type: 'suggestion',
          category: 'Completeness',
          original: '',
          suggested: '',
          explanation: 'The Reflection section is missing. Consider asking the student to add a brief reflection on lessons learned during this period.',
          section: 'Reflection',
        },
      ];
      setIssues(mockIssues);
      setIsAnalyzing(false);
      setHasRun(true);
    }, 2000);
  };

  const handleApply = (issue: GrammarIssue) => {
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, applied: true, skipped: false } : i));
    onApplyCorrection?.(issue);
  };

  const handleSkip = (id: string) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, skipped: true } : i));
  };

  const handleApplyAll = () => {
    const applicableIssues = issues.filter(i => !i.applied && !i.skipped && i.suggested);
    setIssues(prev => prev.map(i => {
      if (!i.applied && !i.skipped && i.suggested) {
        return { ...i, applied: true };
      }
      return i;
    }));
    onApplyAll?.(applicableIssues);
  };

  const activeIssues = issues.filter(i => !i.applied && !i.skipped);
  const errorCount = issues.filter(i => i.type === 'error' && !i.applied && !i.skipped).length;
  const warningCount = issues.filter(i => i.type === 'warning' && !i.applied && !i.skipped).length;
  const suggestionCount = issues.filter(i => i.type === 'suggestion' && !i.applied && !i.skipped).length;
  const appliedCount = issues.filter(i => i.applied).length;
  const applicableCount = issues.filter(i => !i.applied && !i.skipped && i.suggested).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'suggestion': return <Info size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <Card className="pt-0 px-0 pb-0 overflow-hidden border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <Sparkles size={14} className="text-white dark:text-zinc-950" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">AI Grammar Checker</h3>
            <p className="text-[9px] text-zinc-400 font-medium">Admin exclusive</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={hasRun ? 'outline' : 'primary'}
          icon={isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
          onClick={runGrammarCheck}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : hasRun ? 'Re-check' : 'Run Check'}
        </Button>
      </div>

      {/* Stats Bar */}
      {hasRun && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 flex-wrap"
        >
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertCircle size={12} />
              {errorCount} Error{errorCount > 1 ? 's' : ''}
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertTriangle size={12} />
              {warningCount} Warning{warningCount > 1 ? 's' : ''}
            </div>
          )}
          {suggestionCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Info size={12} />
              {suggestionCount} Tip{suggestionCount > 1 ? 's' : ''}
            </div>
          )}
          {appliedCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ml-auto">
              <CheckCircle2 size={12} />
              {appliedCount} Applied
            </div>
          )}
          {activeIssues.length === 0 && issues.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              All Clear
            </div>
          )}
        </motion.div>
      )}

      {/* Issues List */}
      <div className="max-h-[400px] overflow-y-auto">
        {!hasRun && !isAnalyzing && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-zinc-400" />
            </div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Grammar Checker Ready</p>
            <p className="text-[10px] text-zinc-400">Click "Run Check" to analyze the document for grammar, spelling, and writing quality.</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <RefreshCw size={20} className="text-zinc-400 animate-spin" />
            </div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Analyzing Document...</p>
            <p className="text-[10px] text-zinc-400">Checking grammar, spelling, clarity, and structure.</p>
          </div>
        )}

        <AnimatePresence>
          {issues.map((issue, i) => {
            const isExpanded = expandedId === issue.id;
            const isResolved = issue.applied || issue.skipped;

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: isResolved ? 0.5 : 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0 transition-opacity",
                  isResolved && "bg-zinc-50/50 dark:bg-zinc-900/30"
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                  className="w-full p-3.5 flex items-start gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className={cn(
                    "mt-0.5 shrink-0",
                    issue.applied ? "text-emerald-500" :
                    issue.skipped ? "text-zinc-300 dark:text-zinc-600" :
                    issue.type === 'error' ? "text-red-500 dark:text-red-400" :
                    issue.type === 'warning' ? "text-amber-500 dark:text-amber-400" :
                    "text-blue-500 dark:text-blue-400"
                  )}>
                    {issue.applied ? <CheckCircle2 size={14} /> : getIcon(issue.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">{issue.category}</span>
                      {issue.applied && <Badge variant="success" className="text-[8px]">Applied</Badge>}
                      {issue.skipped && <Badge variant="neutral" className="text-[8px]">Skipped</Badge>}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium">Section: {issue.section}</p>
                  </div>
                  <div className="shrink-0 text-zinc-300 dark:text-zinc-600">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5 space-y-3 ml-7">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{issue.explanation}</p>

                        {issue.original && issue.suggested && (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block mb-1">Original</span>
                              <span className="text-xs text-red-700 dark:text-red-300 line-through">{issue.original}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">Suggested</span>
                              <span className="text-xs text-emerald-700 dark:text-emerald-300">{issue.suggested}</span>
                            </div>
                          </div>
                        )}

                        {!isResolved && (
                          <div className="flex items-center gap-2 pt-1">
                            {issue.suggested && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Check size={12} />}
                                onClick={(e) => { e.stopPropagation(); handleApply(issue); }}
                                className="text-[10px]"
                              >
                                Apply
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<X size={12} />}
                              onClick={(e) => { e.stopPropagation(); handleSkip(issue.id); }}
                              className="text-[10px]"
                            >
                              Skip
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Apply All Footer */}
      {applicableCount > 0 && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center text-[10px]"
            icon={<Zap size={12} />}
            onClick={handleApplyAll}
          >
            Apply All Safe Corrections ({applicableCount})
          </Button>
        </div>
      )}
    </Card>
  );
};
