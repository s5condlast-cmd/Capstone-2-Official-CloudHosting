import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  RefreshCw, 
  Save, 
  Send,
  ClipboardList,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSpeechToText } from '@/src/hooks/useSpeechToText';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  onApply: (content: string) => void;
  initialContent?: string;
  templateHints?: string[];
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  documentName,
  onApply,
  initialContent = '',
  templateHints = []
}) => {
  const [content, setContent] = useState(initialContent);
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaries, setSummaries] = useState<{a: string, b: string} | null>(null);
  const [savedDraft, setSavedDraft] = useState(false);
  const [lastAction, setLastAction] = useState<'dictate' | 'refine'>('dictate');

  const { isListening, transcript, interimTranscript, toggle, isSupported, setTranscript } = useSpeechToText();

  // Keep content in sync with initialContent and speech transcript
  useEffect(() => {
    if (isOpen) {
       setContent(initialContent);
       setTranscript(initialContent); // Prime the transcript with existing content
    }
  }, [isOpen, initialContent, setTranscript]);

  useEffect(() => {
    if (isListening || transcript) {
        setContent(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript, isListening]);


  const handleFixGrammar = () => {
    setIsGenerating(true);
    setIsImproving(true);
    setLastAction('refine');
    
    // Simulate AI Fix Grammar & Auto-fill format
    setTimeout(() => {
      const trimmed = content.trim();
      const sentenceCased = trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + (trimmed.match(/[.!?]$/) ? '' : '.');
      const titleCased = trimmed.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      setSummaries({
        a: sentenceCased,
        b: titleCased
      });
      setIsGenerating(false);
      setIsImproving(false);
    }, 1500);
  };

  const selectSummary = (version: 'a' | 'b') => {
    if (summaries) {
      const selected = version === 'a' ? summaries.a : summaries.b;
      setContent(selected);
      setTranscript(selected); // Update transcript so if they start recording again, it appends correctly
      setSummaries(null);
    }
  };

  const handleSaveDraft = () => {
    // In a real app, save to localStorage or backend
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const wordCount = content.split(/\s+/).filter(x => x).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                <span className="text-sm">📝</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Compose: {documentName}</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Type or use voice dictation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {/* Template Hints */}
            {templateHints.length > 0 && (
               <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3">
                 <ClipboardList size={18} className="text-blue-500 mt-0.5 shrink-0" />
                 <div>
                   <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wider">Suggested Content Checklist</p>
                   <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                     {templateHints.map((hint, i) => (
                       <li key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                         <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                         {hint}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            )}

            {/* AI Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isListening ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50" : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                )}>
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                       <MicOff size={18} className="relative z-10" />
                       <span className="absolute inset-0 rounded-full animate-ping bg-red-400/40" />
                    </div>
                  ) : <Mic size={18} />}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Writing Assist</p>
                  <div className="flex items-center gap-2">
                     <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Grammar & Format</p>
                     {!isSupported && <span className="text-[10px] text-red-500 font-medium">(Browser not supported)</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={isListening ? "danger" : "secondary"} size="sm"
                  onClick={toggle} disabled={!isSupported || isGenerating}
                >
                  {isListening ? "Stop Dictation" : "Dictate"}
                </Button>
                <Button 
                  variant="secondary" size="sm"
                  icon={<Sparkles size={14} className={isImproving ? "animate-spin" : ""} />}
                  onClick={handleFixGrammar} disabled={!content || isImproving || isGenerating || isListening}
                >
                  Fix Grammar / Format
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isGenerating && (
              <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-zinc-400" size={20} />
                <span className="text-xs font-medium text-zinc-500">AI is processing your content...</span>
              </div>
            )}

            {/* AI Suggestions */}
            {summaries && !isGenerating && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" /> Select fixed version:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['a', 'b'] as const).map((key, idx) => (
                    <button
                      key={key}
                      onClick={() => selectSummary(key)}
                      className="p-4 bg-white dark:bg-zinc-900 border border-amber-200/50 dark:border-amber-900/30 rounded-xl hover:border-amber-400 dark:hover:border-amber-600/50 cursor-pointer transition-all text-left group shadow-sm"
                    >
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2 font-bold uppercase tracking-wider">
                        {idx === 0 ? "Option 1: Fix Grammar" : "Option 2: Title Format"}
                      </p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{summaries[key]}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor Textarea */}
            <div className="relative group flex-1 flex flex-col min-h-[200px]">
               <textarea
                 value={content}
                 onChange={(e) => {
                     setContent(e.target.value);
                     setTranscript(e.target.value);
                 }}
                 placeholder="Start typing or use dictation to compose your content..."
                 className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 resize-none"
                 style={{ minHeight: '250px' }}
               />
               {isListening && (
                 <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full shadow-sm border border-red-100 dark:border-red-900/50">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening...
                 </div>
               )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div className="flex items-center gap-4">
                 <span className="text-xs font-medium text-zinc-500">
                   {wordCount} words
                 </span>
                 {savedDraft && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-300">
                       <CheckCircle2 size={14} /> Draft saved
                    </span>
                 )}
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                   variant="outline" 
                   size="sm" 
                   className="flex-1 sm:flex-none"
                   onClick={handleSaveDraft}
                   icon={<Save size={14} />}
                >
                   Save Draft
                </Button>
                <Button 
                   variant="primary" 
                   size="sm" 
                   className="flex-1 sm:flex-none"
                   onClick={() => onApply(content)}
                   icon={<Send size={14} />}
                   disabled={!content.trim()}
                >
                   Apply Content
                </Button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
