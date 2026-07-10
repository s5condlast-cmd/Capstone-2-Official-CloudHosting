import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, RefreshCw, User, Building, Calendar, PenLine, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const AdviserDocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [isScanning, setIsScanning] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);
  const [issuesFound, setIssuesFound] = useState(0);
  const [issuesFixed, setIssuesFixed] = useState(0);
  const [activePopup, setActivePopup] = useState<{
    word: string;
    x: number;
    y: number;
    range: Range;
  } | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  // Editable header fields
  const [headerFields, setHeaderFields] = useState({
    studentName: 'Alice Brown',
    company: 'Tech Solutions Inc.',
    periodStart: 'April 01, 2026',
    periodEnd: 'April 30, 2026',
    supervisor: 'Mr. Juan Dela Cruz',
    journalType: 'Prelim Journal',
  });

  const initialContent = `
    <p><span style="margin-left: 3rem;"></span>During this&nbsp;&nbsp;&nbsp;period, I focused on learning the company's tech stack including React, Node.js, and PostgreSQL. My goal &nbsp;was to understand the codebase and start contributing to &nbsp;minor features.</p>
    <p><span style="margin-left: 3rem;"></span>I recieved training on database &nbsp;&nbsp;management and worked on optimizing SQL queries. I also shadowed the senior frontend developer for two&nbsp; days to understand their &nbsp;&nbsp;component architecture.</p>
    <p><span style="margin-left: 3rem;"></span>The main challenge I faced was adapting to the agile workflow&nbsp;&nbsp;and understanding the complex &nbsp;state management patterns used in the main&nbsp;&nbsp;application.</p>
    <p><span style="margin-left: 3rem;"></span>Additionally, I was tasked with creating a new feature that allows administrators to export user data as a PDF. This required me to research various libraries and I eventually decided to use jsPDF. The implementation took longer than expected due to some styling inconsistencies in the generated document, but it was a great learning experience.</p>
  `;

  useEffect(() => {
    // Simulate initial scan on page load
    const timer = setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      if (editorRef.current) {
        let html = editorRef.current.innerHTML;
        
        // Mark typos and formatting — NO contenteditable="false" so users can type to edit
        const markClass = "bg-amber-100/80 dark:bg-amber-900/30 border-b-2 border-amber-400 dark:border-amber-600 cursor-pointer rounded-sm px-0.5";
        
        html = html.replace('recieved', `<mark class="${markClass}" data-issue="typo">recieved</mark>`);
        html = html.replace("shadowed", `<mark class="${markClass}" data-issue="word-choice">shadowed</mark>`);
        html = html.replace("Additionally", `<mark class="${markClass}" data-issue="word-choice">Additionally</mark>`);
        html = html.replace("longer", `<mark class="${markClass}" data-issue="word-choice">longer</mark>`);
        
        // Mark inconsistent spacing
        const spacingMarkClass = "bg-blue-100/80 dark:bg-blue-900/30 border-b-2 border-blue-400 dark:border-blue-600 cursor-pointer rounded-sm px-0.5";
        const spacingErrors = [
          'this&nbsp;&nbsp;&nbsp;period', 'goal &nbsp;was', 
          'database &nbsp;&nbsp;management', 'two&nbsp; days', 
          'workflow&nbsp;&nbsp;and', 'complex &nbsp;state', 
          'main&nbsp;&nbsp;application'
        ];
        
        spacingErrors.forEach(err => {
          html = html.replace(new RegExp(err, 'g'), `<mark class="${spacingMarkClass}" data-issue="spacing">${err}</mark>`);
        });

        editorRef.current.innerHTML = html;
        setIssuesFound(4 + spacingErrors.length);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 1. Check if user clicked exactly on a <mark>
    if (target.tagName.toLowerCase() === 'mark') {
      const word = target.textContent || '';
      const rect = target.getBoundingClientRect();
      
      setSpokenText('');
      setIsListening(false);
      
      const range = document.createRange();
      range.selectNode(target);

      // Position popup relative to the editor container for proper alignment
      const containerRect = editorContainerRef.current?.getBoundingClientRect();
      const popupX = rect.left;
      const popupY = rect.bottom + 8;
      
      setActivePopup({
        word,
        x: popupX,
        y: popupY,
        range
      });
      return;
    }

    // 2. Fallback to normal text selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (selection.isCollapsed) {
      selection.modify('move', 'backward', 'word');
      selection.modify('extend', 'forward', 'word');
    }

    const word = selection.toString().trim();
    
    if (!word || word.length < 2) {
       setActivePopup(null);
       return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSpokenText('');
    setIsListening(false);

    setActivePopup({
      word,
      x: rect.left,
      y: rect.bottom + 8,
      range
    });
  };

  const applyCorrection = (newText: string) => {
    if (!activePopup) return;
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(activePopup.range);
    document.execCommand('insertText', false, newText);
    
    setIssuesFixed(prev => prev + 1);
    setActivePopup(null);
  };

  // Mock recommendations based on the clicked word
  const getRecommendations = (word: string) => {
    const w = word.toLowerCase();
    
    // Auto-fix spacing issues (replace any combo of spaces and NBSPs with a single space)
    const normalized = word.replace(/[\s\u00A0]+/g, ' ');
    if (word !== normalized && word.length > 2) {
       return [normalized];
    }

    if (w === 'recieved') return ['received'];
    if (w === "shadowed") return ['assisted', 'collaborated with'];
    if (w === "additionally") return ['Furthermore', 'In addition'];
    if (w === "longer") return ['more time', 'extended duration'];
    return ['clarify', 'rephrase', 'fix formatting', 'realign'];
  };

  const getIssueType = (word: string) => {
    const w = word.toLowerCase();
    const normalized = word.replace(/[\s\u00A0]+/g, ' ');
    if (word !== normalized && word.length > 2) return 'Spacing Issue';
    if (w === 'recieved') return 'Spelling Error';
    if (w === 'shadowed' || w === 'additionally' || w === 'longer') return 'Word Choice';
    return 'Review Item';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/adviser/review/${id}`)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-black dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-black dark:text-white tracking-tight">Adviser Edit Mode</h1>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{headerFields.journalType} · {headerFields.studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/50"
              >
                <RefreshCw size={12} className="animate-spin" />
                Scanning Document...
              </motion.div>
            )}
            {scanComplete && !isScanning && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Badge variant="warning" className="text-[10px]">
                  {issuesFound - issuesFixed} issues remaining
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="primary"
            size="sm"
            icon={<Save size={14} />}
            onClick={() => navigate(`/adviser/review/${id}`)}
          >
            Save & Return
          </Button>
        </div>
      </header>

      {/* Main Content — Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document Editor */}
        <main ref={editorContainerRef} className="flex-1 bg-zinc-200/60 dark:bg-zinc-900/60 overflow-y-auto flex justify-center p-4 sm:p-6 custom-scrollbar">
          <div className="bg-white text-black w-full max-w-[800px] shadow-sm border border-zinc-300 dark:border-zinc-700 p-10 sm:p-14 font-serif text-sm relative" style={{ minHeight: '1056px' }}>
            
            {/* Document Header — now reflects editable fields */}
            <div className="text-center mb-10 border-b-2 border-black pb-5" contentEditable={false}>
              <h1 className="font-bold text-2xl uppercase tracking-[0.2em] mb-2">{headerFields.journalType}</h1>
              <h2 className="text-sm tracking-widest uppercase text-zinc-600">On-the-Job Training Practicum</h2>
              <div className="mt-4 flex justify-between text-xs font-bold text-left w-full font-sans">
                <div>
                  <p>Student: {headerFields.studentName}</p>
                  <p>Company: {headerFields.company}</p>
                </div>
                <div className="text-right">
                  <p>Period: {headerFields.periodStart} - {headerFields.periodEnd}</p>
                </div>
              </div>
            </div>

            {/* Editable Body — users can type directly to change content */}
            <div
              ref={editorRef}
              className="focus:outline-none min-h-[500px] space-y-6 text-justify leading-relaxed text-base cursor-text"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onClick={handleEditorClick}
              dangerouslySetInnerHTML={{ __html: initialContent }}
            />

            {/* Signature Block — reflects editable fields */}
            <div className="mt-24 pt-8 grid grid-cols-2 gap-12 font-sans" contentEditable={false}>
               <div className="text-center">
                 <div className="border-b border-black mb-2 w-full h-8"></div>
                 <p className="font-bold text-sm uppercase">{headerFields.studentName}</p>
                 <p className="text-xs text-zinc-500">Student Trainee</p>
               </div>
               <div className="text-center">
                 <div className="border-b border-black mb-2 w-full h-8"></div>
                 <p className="font-bold text-sm uppercase">{headerFields.supervisor}</p>
                 <p className="text-xs text-zinc-500">Industry Supervisor</p>
               </div>
            </div>
          </div>
        </main>

        {/* Right: Editing Sidebar */}
        <aside className="w-[320px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto p-4 space-y-4 hidden lg:block custom-scrollbar shrink-0">
          {/* Document Info Fields */}
          <Card title="Document Info">
            <div className="space-y-3">
              <Input
                label="Student Name"
                value={headerFields.studentName}
                onChange={e => setHeaderFields(p => ({ ...p, studentName: e.target.value }))}
                icon={<User size={12} />}
              />
              <Input
                label="Company"
                value={headerFields.company}
                onChange={e => setHeaderFields(p => ({ ...p, company: e.target.value }))}
                icon={<Building size={12} />}
              />
              <Input
                label="Supervisor"
                value={headerFields.supervisor}
                onChange={e => setHeaderFields(p => ({ ...p, supervisor: e.target.value }))}
                icon={<User size={12} />}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Period Start"
                  value={headerFields.periodStart}
                  onChange={e => setHeaderFields(p => ({ ...p, periodStart: e.target.value }))}
                  icon={<Calendar size={12} />}
                />
                <Input
                  label="Period End"
                  value={headerFields.periodEnd}
                  onChange={e => setHeaderFields(p => ({ ...p, periodEnd: e.target.value }))}
                  icon={<Calendar size={12} />}
                />
              </div>
            </div>
          </Card>

          {/* Scan Results */}
          <Card title="Scan Results">
            <div className="space-y-3">
              {scanComplete ? (
                <>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Issues Found</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{issuesFound}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Fixed</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{issuesFixed}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${issuesFound > 0 ? (issuesFixed / issuesFound) * 100 : 0}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="pt-2 space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Legend</p>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Typo / Word Choice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Spacing Issue</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 justify-center py-4 text-zinc-400">
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="text-xs font-medium">Scanning...</span>
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card title="How to Edit">
            <div className="space-y-2">
              {[
                { icon: <PenLine size={12} />, text: 'Click any highlighted word to see suggestions' },
                { icon: <Sparkles size={12} />, text: 'Choose a replacement or type your own' },
                { icon: <PenLine size={12} />, text: 'Type directly on any text to edit freely' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="mt-0.5 shrink-0 text-zinc-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Inline Correction Pop-up — properly aligned */}
      <AnimatePresence>
        {activePopup && (
          <>
            {/* Invisible overlay to close popup */}
            <div className="fixed inset-0 z-40" onClick={() => setActivePopup(null)} />
            
            <motion.div 
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden"
              style={{ 
                left: Math.max(16, Math.min(activePopup.x, window.innerWidth - 340)),
                top: Math.min(activePopup.y, window.innerHeight - 240)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <AlertCircle size={14} className="text-amber-500" />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">Review Suggestion</span>
                 </div>
                 <Badge variant="warning" className="text-[9px]">{getIssueType(activePopup.word)}</Badge>
              </div>
              
              <div className="p-3 space-y-3">
                {/* Original Word Display */}
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Original</p>
                  <p className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 rounded-md px-2 py-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 break-all">
                    "{activePopup.word}"
                  </p>
                </div>

                {/* Word Recommendations */}
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Recommended Replacement</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getRecommendations(activePopup.word).map((sug, i) => (
                      <button
                        key={i}
                        className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 text-xs font-medium rounded-md transition-all"
                        onClick={() => applyCorrection(sug)}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Custom Replacement</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spokenText}
                      onChange={(e) => setSpokenText(e.target.value)}
                      placeholder="Type replacement text..."
                      className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && spokenText.trim()) {
                          applyCorrection(spokenText);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (spokenText.trim()) {
                          applyCorrection(spokenText);
                        }
                      }}
                      disabled={!spokenText.trim()}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                        spokenText.trim()
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      )}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
