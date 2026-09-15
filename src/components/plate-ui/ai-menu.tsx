/**
 * ai-menu.tsx
 * AI Writing Assistant Dialog component matching @plate/editor-ai.
 * Provides instant institutional writing actions: Improve, Fix Grammar, Make Formal, Summarize, Continue.
 */
import * as React from 'react';
import {
  Sparkles,
  CheckCheck,
  Briefcase,
  FileText,
  PenTool,
  Loader2,
  X,
  CornerDownLeft,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export interface AiMenuDialogProps {
  open: boolean;
  onClose: () => void;
  editor: any;
}

type AiAction = 'improve' | 'fix_grammar' | 'make_formal' | 'summarize' | 'continue_writing' | 'custom';

interface QuickActionItem {
  id: AiAction;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'improve',
    label: 'Improve writing',
    description: 'Enhance clarity, vocabulary, and flow',
    icon: Sparkles,
  },
  {
    id: 'fix_grammar',
    label: 'Fix grammar & spelling',
    description: 'Correct typos and punctuation',
    icon: CheckCheck,
  },
  {
    id: 'make_formal',
    label: 'Make more formal',
    description: 'Institutional practicum tone',
    icon: Briefcase,
  },
  {
    id: 'summarize',
    label: 'Summarize text',
    description: 'Concise executive summary',
    icon: FileText,
  },
  {
    id: 'continue_writing',
    label: 'Continue writing',
    description: 'Generate next logical paragraphs',
    icon: PenTool,
  },
];

export function AiMenuDialog({ open, onClose, editor }: AiMenuDialogProps) {
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [selectedText, setSelectedText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // When dialog opens, extract selected text or active context
  React.useEffect(() => {
    if (open) {
      setResult(null);
      setCustomPrompt('');
      setCopied(false);

      const domSelection = window.getSelection();
      const text = domSelection?.toString().trim() || '';
      setSelectedText(text);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Keyboard shortcut ESC to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleExecuteAction = async (action: AiAction, userCustomPrompt?: string) => {
    setLoading(true);
    setResult(null);

    // Extract all text content from the editor for background context
    let fullContext = '';
    try {
      if (editor?.children) {
        fullContext = JSON.stringify(editor.children);
      }
    } catch { /* non-fatal */ }

    try {
      const response = await fetch('/api/ai/editor-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: selectedText,
          customPrompt: userCustomPrompt || customPrompt,
          documentContext: fullContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI generation failed');
      }

      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyResult = () => {
    if (!result || !editor) return;

    try {
      // Split into paragraphs for proper block insertion
      const paragraphs = result.split(/\n\n+/).filter(Boolean);

      if (paragraphs.length === 1 && !result.includes('\n')) {
        // Single inline string
        if (editor?.tf?.insert?.text) {
          editor.tf.insert.text(result);
        } else if (editor?.insertText) {
          editor.insertText(result);
        }
      } else {
        // Multi-paragraph node array
        const nodes = paragraphs.map((p) => ({
          type: 'p',
          children: [{ text: p.replace(/\n/g, ' ').trim() }],
        }));

        if (editor?.tf?.insert?.nodes) {
          editor.tf.insert.nodes(nodes);
        }
      }

      toast.success('AI content applied to document.');
      onClose();
    } catch {
      toast.error('Could not apply text to document.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Writing Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Custom Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPrompt.trim()) {
                void handleExecuteAction('custom', customPrompt.trim());
              }
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                selectedText
                  ? `Ask AI about selected text (${selectedText.slice(0, 30)}…)`
                  : 'Ask AI to generate, rewrite, or continue…'
              }
              className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={!customPrompt.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-fg disabled:opacity-40 hover:bg-primary-hover transition-all"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Selected Text Preview Pill */}
          {selectedText && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Selected:</span>
              <span className="truncate italic">"{selectedText}"</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Generating enhancement with AI…</span>
            </div>
          )}

          {/* AI Result Card */}
          {!loading && result && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                AI Suggestion
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {result}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteAction('improve')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyResult}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg hover:bg-primary-hover shadow-xs transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{selectedText ? 'Replace Selection' : 'Insert into Document'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Chips (shown when no result is currently active) */}
          {!loading && !result && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => void handleExecuteAction(action.id)}
                      className="flex items-start gap-3 p-3 text-left rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {action.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

