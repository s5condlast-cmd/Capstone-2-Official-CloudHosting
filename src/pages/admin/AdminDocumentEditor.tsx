import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, RefreshCw, User, Building, Calendar, PenLine, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDocumentEditor: React.FC = () => {
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

  const [spokenText, setSpokenText] = useState('');

  // Editable header fields
  const [headerFields, setHeaderFields] = useState({
    studentName: 'Alice Brown',
    course: 'BSIT 402-401',
    company: 'TechCorp Solutions Inc.',
    periodStart: 'April 01, 2026',
    periodEnd: 'April 30, 2026',
    journalType: 'Prelim Journal',
  });

  const initialContent = `
    <h3>Objectives</h3>
    <p>During this period, I focused on learning the company's tech stack including React, Node.js, and PostgreSQL. My goal was to understand the codebase and start contributing to minor features.</p>
    <br/>
    <h3>Activities & Tasks</h3>
    <p>I recieved training on database management and worked on optimizing SQL queries. I also shadowed the senior frontend developer for two days to understand their component architecture.</p>
    <br/>
    <h3>Challenges Faced</h3>
    <p>The main challenge I faced was adapting to the agile workflow and understanding the complex state management patterns used in the main application.</p>
  `;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      if (editorRef.current) {
        let html = editorRef.current.innerHTML;

        const markClass = "bg-amber-100/80 dark:bg-amber-900/30 border-b-2 border-amber-400 dark:border-amber-600 cursor-pointer rounded-sm px-0.5";

        html = html.replace('recieved', `<mark class="${markClass}" data-issue="typo">recieved</mark>`);
        html = html.replace("company's", `<mark class="${markClass}" data-issue="format">company's</mark>`);

        editorRef.current.innerHTML = html;
        setIssuesFound(2);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.tagName.toLowerCase() === 'mark') {
      const word = target.textContent || '';
      const rect = target.getBoundingClientRect();

      setSpokenText('');

      const range = document.createRange();
      range.selectNode(target);

      setActivePopup({
        word,
        x: rect.left,
        y: rect.bottom + 8,
        range
      });
      return;
    }

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

  const getRecommendations = (word: string) => {
    const w = word.toLowerCase();
    if (w === 'recieved') return ['received'];
    if (w === "company's") return ['TechCorp Solutions Inc.', 'TechCorp'];
    if (w === 'shadowed') return ['observed', 'assisted'];
    return ['clarify', 'rephrase'];
  };

  const getIssueType = (word: string) => {
    const w = word.toLowerCase();
    if (w === 'recieved') return 'Spelling Error';
    if (w === "company's") return 'Format Issue';
    return 'Review Item';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/documents/${id}`)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-black dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-black dark:text-white tracking-tight">Admin Edit Mode</h1>
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
            onClick={() => navigate(`/admin/documents/${id}`)}
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

            {/* Document Header */}
            <div className="text-center mb-10 border-b-2 border-black pb-5" contentEditable={false}>
              <h1 className="font-bold text-xl uppercase tracking-widest mb-1">Practicum Journal</h1>
              <h2 className="text-sm tracking-widest uppercase text-zinc-600">{headerFields.journalType}</h2>
              <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-left text-xs max-w-md mx-auto pt-3 border-t border-zinc-200 font-sans">
                <span className="text-zinc-400 font-medium">Student:</span>
                <span className="font-semibold">{headerFields.studentName}</span>
                <span className="text-zinc-400 font-medium">Course:</span>
                <span className="font-semibold">{headerFields.course}</span>
                <span className="text-zinc-400 font-medium">Company:</span>
                <span className="font-semibold">{headerFields.company}</span>
                <span className="text-zinc-400 font-medium">Period:</span>
                <span className="font-semibold">{headerFields.periodStart} - {headerFields.periodEnd}</span>
              </div>
            </div>

            {/* Editable Body */}
            <div
              ref={editorRef}
              className="prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] cursor-text"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onClick={handleEditorClick}
              dangerouslySetInnerHTML={{ __html: initialContent }}
            />
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
                label="Course"
                value={headerFields.course}
                onChange={e => setHeaderFields(p => ({ ...p, course: e.target.value }))}
              />
              <Input
                label="Company"
                value={headerFields.company}
                onChange={e => setHeaderFields(p => ({ ...p, company: e.target.value }))}
                icon={<Building size={12} />}
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

      {/* Inline Correction Pop-up */}
      <AnimatePresence>
        {activePopup && (
          <>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">AI Suggestion</span>
                </div>
                <Badge variant="warning" className="text-[9px]">{getIssueType(activePopup.word)}</Badge>
              </div>

              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Original</p>
                  <p className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 rounded-md px-2 py-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 break-all">
                    "{activePopup.word}"
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Recommended</p>
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
