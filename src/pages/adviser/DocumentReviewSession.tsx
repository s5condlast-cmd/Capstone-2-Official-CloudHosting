import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { 
  FileText, 
  Send, 
  Sparkles, 
  Mic,
  MicOff,
  History,
  CheckCircle2,
  RefreshCw,
  User,
  Clock,
  Calendar,
  X,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Download
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ContentInsightPanel } from '@/src/components/review/ContentInsightPanel';
import { TextDocumentViewer } from '@/src/components/review/TextDocumentViewer';
import { PdfDocumentViewer } from '@/src/components/review/PdfDocumentViewer';

export const DocumentReviewSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [content, setContent] = useState('');
  const [summaries, setSummaries] = useState<{a: string, b: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'Encouraging' | 'Rigorous' | 'Standard'>('Standard');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('pdf');


  // Mock Student Data
  const student = {
    name: 'Alice Brown',
    course: '__BSIT 402_401__',
    hours: 240,
    required: 300,
    company: 'Tech Solutions Inc.',
    submissionId: 'DOC-9021',
    docType: 'Prelim Journal'
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsGenerating(true);
      // Simulate AI generating feedback
      setTimeout(() => {
        setSummaries({
          a: "AI FEEDBACK A: The journal entry lacks specific details on the technical implementation of the database optimization. Please revise and include the queries you've used.",
          b: "AI FEEDBACK B: Good start, but you need to elaborate more on the impact of eager loading on system performance. Quantify the improvements."
        });
        setIsGenerating(false);
      }, 2000);
    } else {
      setIsRecording(true);
      setSummaries(null);
    }
  };

  const handleImprove = () => {
    setIsGenerating(true);
    setIsImproving(true);
    setTimeout(() => {
      setSummaries({
        a: "REFINED FEEDBACK A: This entry provides a general overview but falls short on technical specifics. To meet the 500-word requirement with adequate technical depth, please revise this entry to include the exact SQL queries refactored and the metrics showing the latency reduction.",
        b: "REFINED FEEDBACK B: While the progress is noted, the reflection lacks measurable outcomes. Please expand on the specific bottlenecks addressed and how the jsPDF integration solves the administrative workflow issues."
      });
      setIsGenerating(false);
      setIsImproving(false);
    }, 1500);
  };

  const selectSummary = (version: 'a' | 'b') => {
    if (summaries) {
      const selected = version === 'a' ? summaries.a : summaries.b;
      setContent(prev => prev + (prev ? '\n\n' : '') + selected);
      setSummaries(null);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
         <div className="flex items-center gap-3 relative">
           <h1 className="text-lg font-semibold text-black dark:text-zinc-950 uppercase tracking-tight">Review Session: {student.docType}</h1>
           <div className="group relative">
             <button className="p-1 text-zinc-400 hover:text-black dark:hover:text-zinc-950 transition-colors">
               <Info size={18} />
             </button>
             {/* Student Info Popover */}
             <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <div className="flex items-center gap-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                 <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <User size={16} className="text-zinc-500" />
                 </div>
                 <div>
                   <p className="font-bold text-sm text-black dark:text-white">{student.name}</p>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase">{student.course}</p>
                 </div>
               </div>
               <div className="space-y-2 text-[11px]">
                 <div className="flex justify-between">
                   <span className="text-zinc-500 font-semibold uppercase">Company</span>
                   <span className="text-black dark:text-white font-bold">{student.company}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-zinc-500 font-semibold uppercase">Submission</span>
                   <span className="text-black dark:text-white font-bold">{student.submissionId}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-zinc-500 font-semibold uppercase">Progress</span>
                   <span className="text-black dark:text-white font-bold">{student.hours} / {student.required} hrs</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
         <div className="flex gap-2 relative">
            <Button variant="outline" onClick={() => navigate(-1)} className="border border-zinc-200/80 dark:border-zinc-800/80 font-semibold uppercase tracking-wide text-[10px]">Back</Button>
            
            <Button variant="outline" onClick={() => navigate(`/adviser/review/${id}/edit`)} className="border border-zinc-200/80 dark:border-zinc-800/80 font-semibold uppercase tracking-wide text-[10px]">Adviser Edit</Button>

            {/* Action Dropdown */}
            <div className="relative">
              <Button 
                variant="primary" 
                className="bg-black dark:bg-white text-white dark:text-zinc-950 font-semibold uppercase tracking-wide text-[10px] pr-2"
                onClick={() => setShowActionMenu(!showActionMenu)}
              >
                Approve Document <ChevronDown size={14} className="ml-2 opacity-70" />
              </Button>
              <AnimatePresence>
                {showActionMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                  >
                    <button className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                      <AlertTriangle size={14} /> Request Revision
                    </button>
                    <button className="px-4 py-3 text-left text-xs font-bold uppercase text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
                      <X size={14} /> Reject Document
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
         </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
         <button
           onClick={() => setViewMode('pdf')}
           className={cn(
             "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
             viewMode === 'pdf'
               ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
               : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
           )}
         >
           <FileText size={12} />
           Original PDF
         </button>
         <button
           onClick={() => setViewMode('text')}
           className={cn(
             "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
             viewMode === 'text'
               ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
               : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
           )}
         >
           <FileText size={12} />
           Text View
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        
        {/* Left: Document Viewer */}
        <div className="space-y-3">

           {viewMode === 'text' ? (
              <TextDocumentViewer 
                 title={student.docType}
                 studentName={student.name}
                 course={student.course.replace(/_/g, '')}
                 company={student.company}
                 period="April 01 - April 30, 2026"
                 content={{
                    objectives: "During this period, I focused on learning the company's tech stack including React, Node.js, and PostgreSQL. My goal was to understand the codebase and start contributing to minor features.",
                    activities: "I recieved training on database management and worked on optimizing SQL queries. I also shadowed the senior frontend developer for two days to understand their component architecture.",
                    challenges: "The main challenge I faced was adapting to the agile workflow and understanding the complex state management patterns used in the main application.",
                    reflection: "Additionally, I was tasked with creating a new feature that allows administrators to export user data as a PDF. This required me to research various libraries and I eventually decided to use jsPDF. The implementation took longer than expected due to some styling inconsistencies in the generated document, but it was a great learning experience."
                 }}
                 annotations={[
                    {
                       id: 'a1',
                       textToHighlight: 'recieved',
                       comment: 'Spelling error. Consider changing to "received".',
                       type: 'grammar'
                    }
                 ]}
              />
           ) : (
              <PdfDocumentViewer 
                 title={student.docType}
                 pdfUrl="/sample-journal.pdf"
                 studentName={student.name}
              />
           )}
        </div>

        {/* Right: Feedback Generator */}
        <div className="space-y-4 flex flex-col">
           {/* Content Insight Review Panel */}
           <ContentInsightPanel
             docType={student.docType}
             onCopyToFeedback={(text) => setContent(prev => prev + (prev ? '\n\n' : '') + text)}
           />

           <Card 
            id="feedback-editor"
            title="Feedback Generator"
            className="flex-1 flex flex-col"
           >
               <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-col gap-4">
                     <div className="flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                        <div className="flex items-center justify-between gap-3 text-black dark:text-white">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800/80 shrink-0",
                                isRecording ? "bg-black dark:bg-white text-white dark:text-zinc-950 animate-pulse border-black dark:border-white" : "bg-white dark:bg-zinc-950 text-black dark:text-white"
                              )}>
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                              </div>
                              <div>
                                 <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Feedback Hub</p>
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold uppercase tracking-tight">Dictate Feedback</p>
                                    {isRecording && (
                                      <div className="flex items-center gap-1 ml-2">
                                        {[1, 2, 3, 4, 5].map((bar) => (
                                          <motion.div
                                            key={bar}
                                            className="w-1 bg-black dark:bg-white rounded-full"
                                            animate={{ height: [6, Math.random() * 16 + 6, 6] }}
                                            transition={{ repeat: Infinity, duration: 0.5, delay: bar * 0.1 }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Tone Selection Moved Here for Alignment */}
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tone:</span>
                              <select 
                                value={aiTone}
                                onChange={(e) => setAiTone(e.target.value as any)}
                                className="bg-transparent border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 rounded-md px-2 py-1 focus:ring-0 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 cursor-pointer"
                              >
                                <option value="Standard">Standard</option>
                                <option value="Encouraging">Encouraging</option>
                                <option value="Rigorous">Rigorous</option>
                              </select>
                           </div>
                        </div>
                        
                        <div className="flex gap-2 pt-1 mt-1">
                          <Button 
                            size="sm"
                            variant={isRecording ? "default" : "outline"}
                            className={cn(
                              "font-semibold uppercase tracking-wide text-[10px] flex-1",
                              isRecording ? "bg-black dark:bg-white hover:bg-black dark:bg-white text-white dark:text-zinc-950 border-black dark:border-white" : "border-black dark:border-white text-black dark:text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-800"
                            )}
                            onClick={handleRecord}
                            disabled={isGenerating}
                          >
                            {isRecording ? "Stop Dictation" : "Start Dictation"}
                          </Button>
                          <Button 
                            size="sm"
                            id="btn-ai-improve"
                            variant="outline" 
                            className="border border-zinc-200/80 dark:border-zinc-800/80 font-semibold uppercase tracking-wide text-[10px] flex-1 text-black dark:text-zinc-950 hover:bg-black dark:bg-white hover:text-white dark:text-zinc-950"
                            icon={<Sparkles size={14} className={isImproving ? "animate-spin" : ""} />}
                            onClick={handleImprove}
                            disabled={!content || isImproving || isGenerating}
                          >
                            {isImproving ? 'Refining...' : 'Generative Fix'}
                          </Button>
                        </div>
                     </div>

                     {isGenerating && (
                       <div className="p-5 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3 bg-zinc-50/50 dark:bg-zinc-800/50">
                         <RefreshCw className="animate-spin text-black dark:text-zinc-950" size={24} />
                         <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">AI HUB Processing...</span>
                       </div>
                     )}

                     {summaries && !isGenerating && (
                       <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                         <div className="flex items-center gap-2 px-2">
                           <Sparkles size={14} className="text-black dark:text-zinc-950" />
                           <span className="text-[10px] font-semibold uppercase tracking-wide text-black dark:text-zinc-950">Select an AI variation</span>
                         </div>
                         <div className="grid grid-cols-1 gap-3">
                           <div 
                             onClick={() => selectSummary('a')}
                             className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl hover:border-black dark:border-white cursor-pointer transition-all group active:scale-[0.98]"
                           >
                             <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:text-zinc-950 transition-colors">Option A</p>
                                <div className="w-4 h-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 group-hover:border-black dark:border-white flex items-center justify-center">
                                   <div className="w-2 h-2 bg-black dark:bg-white rounded-full scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                             </div>
                             <p className="text-[11px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:text-zinc-950">{summaries.a}</p>
                           </div>
                           <div 
                             onClick={() => selectSummary('b')}
                             className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl hover:border-black dark:border-white cursor-pointer transition-all group active:scale-[0.98]"
                           >
                             <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:text-zinc-950 transition-colors">Option B</p>
                                <div className="w-4 h-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 group-hover:border-black dark:border-white flex items-center justify-center">
                                   <div className="w-2 h-2 bg-black dark:bg-white rounded-full scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                             </div>
                             <p className="text-[11px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:text-zinc-950">{summaries.b}</p>
                           </div>
                         </div>
                       </div>
                     )}

                     <div className="flex-1 flex flex-col min-h-[250px] gap-2">
                        <Input 
                          label="Official Feedback" 
                          as="textarea" 
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Your recorded feedback will appear here for final adjustments before sending to the student..." 
                          className="flex-1 min-h-[250px] text-sm font-medium leading-relaxed text-black dark:text-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl focus:ring-0 focus:border-black dark:border-white p-4" 
                        />
                     </div>
                  </div>
               </div>
           </Card>
        </div>

      </div>
    </div>
  );
};
