import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AiFindings } from '@/src/lib/aiService';

interface AiAssistantPanelProps {
  findings: AiFindings | null;
  aiStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  onRunAnalysis: () => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  findings,
  aiStatus,
  onRunAnalysis
}) => {
  const isProcessing = aiStatus === 'Processing';

  // Overall Assessment color mappings
  const getAssessmentStyles = (status: string) => {
    switch (status) {
      case 'Good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800';
      case 'Needs Attention':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800';
      case 'Critical Issues':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'neutral';
      default:
        return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
      {/* Panel Header */}
      <div className="flex-none p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">AI Review Assistant</h2>
        </div>
        {!isProcessing && aiStatus !== 'Pending' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px] uppercase tracking-wider"
            onClick={onRunAnalysis}
            icon={<RefreshCw size={10} />}
          >
            Re-Analyze
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* State: Processing / Loading */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">AI is Analyzing Document</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Extracting text contents and cross-referencing information...</p>
            </div>
          </div>
        )}

        {/* State: Pending */}
        {aiStatus === 'Pending' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <Brain className="w-12 h-12 text-zinc-300 dark:text-zinc-700 animate-pulse" />
            <div>
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">AI analysis hasn't run yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px] mb-4">Run the AI assistant to scan this PDF for grammar, consistency, and completeness.</p>
              <Button size="sm" variant="primary" onClick={onRunAnalysis} className="h-8">
                Run AI Analysis
              </Button>
            </div>
          </div>
        )}

        {/* State: Failed */}
        {aiStatus === 'Failed' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div>
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Analysis Failed</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px] mb-4">We couldn't complete the AI document scan. Ensure the API key is configured.</p>
              <Button size="sm" variant="primary" onClick={onRunAnalysis} className="h-8">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* State: Completed with Findings */}
        {aiStatus === 'Completed' && findings && (
          <div className="space-y-6">
            {/* Overall Assessment Banner */}
            <div className={cn("p-4 rounded-xl border flex items-center justify-between", getAssessmentStyles(findings.overallAssessment))}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Overall Assessment</span>
                <p className="text-lg font-black tracking-tight">{findings.overallAssessment}</p>
              </div>
              <Badge variant={getConfidenceBadge(findings.confidence)} className="text-[9px] px-2 py-0.5 capitalize">
                {findings.confidence} Confidence
              </Badge>
            </div>

            {/* Metric Summary Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-lg text-center">
                <span className="text-lg font-black text-indigo-500 dark:text-indigo-400 block">{findings.grammarIssues}</span>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Grammar</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-lg text-center">
                <span className="text-lg font-black text-amber-500 dark:text-amber-400 block">{findings.missingInformation.length}</span>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Missing Info</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-lg text-center">
                <span className="text-lg font-black text-rose-500 dark:text-rose-400 block">{findings.consistencyIssues.length}</span>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Mismatch</span>
              </div>
            </div>

            {/* Alerts / Warnings section */}
            {(findings.consistencyIssues.length > 0 || findings.missingInformation.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Warnings & Errors</h3>
                <div className="space-y-2">
                  {findings.consistencyIssues.map((item, idx) => (
                    <div key={`cons-${idx}`} className="flex gap-2 p-3 rounded-lg bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-950 text-xs text-red-800 dark:text-red-400 leading-normal">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />
                      <p>{item}</p>
                    </div>
                  ))}
                  {findings.missingInformation.map((item, idx) => (
                    <div key={`miss-${idx}`} className="flex gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-950 text-xs text-amber-800 dark:text-amber-400 leading-normal">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
                      <p>Missing required field: <strong className="font-bold">{item}</strong></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Recommendations</h3>
              {findings.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {findings.recommendations.map((rec, idx) => (
                    <div key={`rec-${idx}`} className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed items-start">
                      <ChevronRight size={14} className="shrink-0 mt-0.5 text-zinc-400" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-950 text-xs text-emerald-800 dark:text-emerald-400 leading-normal">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                  <p>Document content aligns correctly. No immediate recommendations.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer warning */}
      <div className="flex-none p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal text-center">
          AI findings are advisory only. Reviewers must verify all information before official approval.
        </p>
      </div>
    </div>
  );
};
