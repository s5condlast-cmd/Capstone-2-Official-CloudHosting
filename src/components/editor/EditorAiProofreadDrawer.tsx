import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileSearch,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { proofreadDocument, type AiSuggestion } from '../../lib/editorAiService';
import { toast } from 'sonner';

interface EditorAiProofreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  content?: any;
  getContent?: () => any;
  title: string;
  requirementId?: string;
  onApplySuggestion?: (suggestion: AiSuggestion) => void;
}

export function EditorAiProofreadDrawer({
  isOpen,
  onClose,
  content,
  getContent,
  title,
  requirementId,
  onApplySuggestion,
}: EditorAiProofreadDrawerProps) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Extract plain text string from Slate / Plate AST or raw content
  const extractNodeText = (node: any): string => {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.children)) {
      return node.children.map(extractNodeText).join('');
    }
    return '';
  };

  const extractText = (data: any): string => {
    if (typeof data === 'string') return data;
    if (!data) return '';
    if (Array.isArray(data)) {
      return data
        .map((block) => extractNodeText(block))
        .filter(Boolean)
        .join('\n');
    }
    return extractNodeText(data);
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      const rawContent = getContent ? getContent() : content;
      const text = extractText(rawContent);
      if (!text || text.trim().length < 5) {
        toast.info('Document is empty. Write some text first to run AI proofreading.');
        setSuggestions([]);
        return;
      }

      const results = await proofreadDocument(text, title, requirementId);
      setSuggestions(results);
      if (results.length === 0) {
        toast.success('No issues detected! Your document writing looks great.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Proofread check failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = (suggestion: AiSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
    setAppliedIds((prev) => new Set(prev).add(suggestion.id));
  };

  const contentElement = (
    <div className="fixed inset-0 z-[160] overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity pointer-events-auto"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-2xs">
                <FileSearch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Writing Recommendations
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {suggestions.length > 0 && (
                <button
                  onClick={handleScan}
                  disabled={loading}
                  title="Rescan Document"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestions List or Centered Scanner */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 my-auto">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-medium">Scanning entire editor text...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 my-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Everything looks clear!
                </h4>
                <p className="text-xs text-zinc-500 max-w-[240px] mb-6 leading-relaxed">
                  No grammar or spelling issues found in this document.
                </p>
                {/* Scanner button in the middle */}
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Scan Document</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const isApplied = appliedIds.has(suggestion.id);
                  return (
                    <div
                      key={suggestion.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isApplied
                          ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 opacity-70'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            suggestion.type === 'spelling'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : suggestion.type === 'grammar'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : suggestion.type === 'clarity'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {suggestion.type}
                        </span>

                        {isApplied && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Applied
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through text-red-500 font-medium bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            {suggestion.originalText}
                          </span>
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            {suggestion.suggestion}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                          {suggestion.explanation}
                        </p>
                      </div>

                      {!isApplied && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleApply(suggestion)}
                            className="px-3 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold text-primary border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Scan again button at bottom of suggestions */}
                <div className="pt-3 pb-2 flex justify-center">
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Scan Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(contentElement, document.body) : null;
}
