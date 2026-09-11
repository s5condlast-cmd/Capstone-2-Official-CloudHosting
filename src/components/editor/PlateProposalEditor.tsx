import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { normalizeStaticValue } from 'platejs';
import {
  Sparkles,
  Wand2,
  Check,
  RotateCcw,
  Send,
  Bold,
  Italic,
  List,
  Loader2,
  Bot,
  FileText,
  Target,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '@/src/lib/aiService';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';

export interface PlateProposalEditorProps {
  value?: string;
  onChange?: (plainText: string, rawValue?: any) => void;
  studentName?: string;
  programName?: string;
  companyName?: string;
  hoursRequired?: string;
  readOnly?: boolean;
}

const DEFAULT_PROPOSAL_TEXT = 
  `Greetings in the spirit of education and industry collaboration!\n\n` +
  `As part of the academic curriculum for the Bachelor of Science in Information Technology program at STI College, I am required to render a total of 486 hours of On-the-Job Training (OJT). This program is designed to bridge academic instruction with direct industrial immersion, providing students the opportunity to apply foundational technical competencies to practical industry challenges.\n\n` +
  `I respectfully submit this Proposal Letter to explore placement and internship opportunities within your reputable organization. Equipped with hands-on coursework in software development, database administration, and system design, I offer my dedication, discipline, and active service to support your team's day-to-day operations throughout my training duration.\n\n` +
  `Enclosed are my student credentials, academic curriculum vitae, and practicum objectives for your favorable consideration. Thank you very much for your valued time, guidance, and continuous support of student experiential learning.`;

function textToSlateNodes(text: string) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '');
  if (paragraphs.length === 0) {
    return [{ type: 'p', children: [{ text: '' }] }];
  }
  return paragraphs.map((p) => ({
    type: 'p',
    children: [{ text: p.replace(/\n/g, ' ').trim() }]
  }));
}

function slateNodesToText(nodes: any[]): string {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (node.children) {
        return node.children.map((c: any) => c.text || '').join('');
      }
      return node.text || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export const PlateProposalEditor: React.FC<PlateProposalEditorProps> = ({
  value,
  onChange,
  studentName = 'John Dwayne B. Guaniso',
  programName = 'Bachelor of Science in Information Technology',
  companyName = 'Host Training Partner',
  hoursRequired = '486',
  readOnly = false,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPromptAction, setLastPromptAction] = useState<string | null>(null);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [showPromptInput, setShowPromptInput] = useState(false);

  // Initial editor value
  const initialNodes = React.useMemo(() => {
    const raw = value && value.trim().length > 0 ? value : DEFAULT_PROPOSAL_TEXT;
    return normalizeStaticValue(textToSlateNodes(raw));
  }, []);

  const editor = usePlateEditor({
    value: initialNodes,
    plugins: [],
  }) as any;

  // Track plain text state
  const [plainText, setPlainText] = useState<string>(() => 
    value && value.trim().length > 0 ? value : DEFAULT_PROPOSAL_TEXT
  );

  // Synchronize when value changes from external reset
  useEffect(() => {
    if (value && value !== plainText && editor?.tf) {
      const newNodes = textToSlateNodes(value);
      try {
        editor.tf.setValue(newNodes);
        setPlainText(value);
      } catch (err) {
        console.warn('Failed to sync editor nodes', err);
      }
    }
  }, [value, plainText, editor]);

  const handleEditorChange = useCallback((options: any) => {
    const newNodes = options?.value || options;
    if (Array.isArray(newNodes)) {
      const text = slateNodesToText(newNodes);
      setPlainText(text);
      if (onChange) {
        onChange(text, newNodes);
      }
    }
  }, [onChange]);

  // Apply new text to the Plate editor
  const applyTextToEditor = (newText: string, actionLabel: string) => {
    setPreviousText(plainText);
    setPlainText(newText);
    setLastPromptAction(actionLabel);

    if (editor?.tf) {
      const newNodes = textToSlateNodes(newText);
      try {
        editor.tf.setValue(newNodes);
      } catch (e) {
        // Fallback: replace children directly
        editor.children = newNodes;
      }
    }

    if (onChange) {
      onChange(newText);
    }
  };

  // Revert back to previous text
  const handleRevert = () => {
    if (previousText) {
      applyTextToEditor(previousText, 'Reverted');
      setPreviousText(null);
      setLastPromptAction(null);
      toast.info('Reverted to previous proposal text.');
    }
  };

  // AI Generation trigger
  const handleAiAction = async (action: 'draft' | 'improve' | 'objectives' | 'custom', customMsg?: string) => {
    setIsGenerating(true);
    const actionNames: Record<string, string> = {
      draft: 'Draft Proposal Body',
      improve: 'Formal Tone Polish',
      objectives: 'BSIT Practicum Objectives',
      custom: customMsg || 'Custom Prompt',
    };

    try {
      toast.loading(`Plate AI: Generating ${actionNames[action]}...`, { id: 'plate-ai-loading' });

      const response = await aiService.generateProposalContent({
        action,
        studentName,
        programName,
        companyName,
        hoursRequired,
        currentDraft: plainText,
        customPrompt: customMsg || customPrompt,
      });

      if (response && response.text) {
        applyTextToEditor(response.text, actionNames[action]);
        toast.success(`Plate AI: Applied ${actionNames[action]}!`, { id: 'plate-ai-loading' });
        setCustomPrompt('');
        setShowPromptInput(false);
      } else {
        throw new Error('No text generated.');
      }
    } catch (error: any) {
      console.error('Plate AI generation failed:', error);
      toast.error(error?.message || 'Plate AI generation failed. Please try again.', { id: 'plate-ai-loading' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleAiAction('custom', customPrompt.trim());
  };

  return (
    <div className="w-full space-y-3">
      {/* Plate AI Assistant Bar */}
      {!readOnly && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-zinc-50/90 to-zinc-100/50 dark:from-zinc-900/90 dark:to-zinc-950/50 p-3 shadow-2xs space-y-2.5 transition-all">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles size={13} className={cn(isGenerating && "animate-spin text-primary")} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Plate AI Writing Assistant</span>
                <Badge variant="primary" className="text-[9px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wider">
                  Live AI
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {previousText && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Revert to prior draft"
                >
                  <RotateCcw size={11} />
                  <span>Undo AI</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPromptInput(prev => !prev)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                  showPromptInput
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                )}
              >
                <SlidersHorizontal size={12} />
                <span>{showPromptInput ? 'Hide Prompt' : 'Custom AI Prompt'}</span>
              </button>
            </div>
          </div>

          {/* Quick AI Action Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleAiAction('draft')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-zinc-900 hover:bg-primary/10 hover:text-primary border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Wand2 size={12} className="text-primary" />
              <span>Draft Full Proposal</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleAiAction('objectives')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-zinc-900 hover:bg-primary/10 hover:text-primary border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Target size={12} className="text-emerald-500" />
              <span>Generate Objectives</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleAiAction('improve')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-zinc-900 hover:bg-primary/10 hover:text-primary border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Check size={12} className="text-blue-500" />
              <span>Improve Formal Tone</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleAiAction('custom', 'Condense this proposal into two powerful, concise executive paragraphs.')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-zinc-900 hover:bg-primary/10 hover:text-primary border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <FileText size={12} className="text-amber-500" />
              <span>Make Concise</span>
            </button>
          </div>

          {/* Collapsible Custom Prompt Input Bar */}
          {showPromptInput && (
            <form onSubmit={handleCustomSubmit} className="pt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Emphasize cybersecurity skills, mention cloud infrastructure..."
                  disabled={isGenerating}
                  className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-2xs"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={isGenerating || !customPrompt.trim()}
                icon={isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                className="shrink-0"
              >
                Generate
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Editor Container Styled as Formal Document Paper Area */}
      <div className="relative rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:bg-white dark:focus-within:bg-zinc-950">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Interactive Proposal Body Canvas</span>
          </div>
          {lastPromptAction && (
            <span className="text-primary font-semibold lowercase italic">
              applied: {lastPromptAction}
            </span>
          )}
        </div>

        {/* Plate Editor Instance */}
        <Plate editor={editor} onChange={handleEditorChange}>
          <PlateContent
            readOnly={readOnly}
            placeholder="Type your proposal letter paragraphs here, or use the Plate AI buttons above to draft automatically..."
            className="w-full min-h-[160px] text-[11pt] leading-relaxed font-sans text-black dark:text-zinc-100 outline-none select-text cursor-text focus:outline-none"
          />
        </Plate>

        {isGenerating && (
          <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xs rounded-lg flex items-center justify-center gap-2 z-10">
            <Loader2 size={18} className="animate-spin text-primary" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Plate AI is generating proposal text...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
