import React, { useState } from 'react';
import { Download, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';

export interface TextAnnotation {
  id: string;
  textToHighlight: string;
  comment: string;
  type: 'grammar' | 'missing' | 'suggestion';
  suggestions?: string[];
}

interface TextDocumentViewerProps {
  title: string;
  studentName: string;
  course: string;
  company: string;
  period: string;
  content: {
    objectives: string;
    activities: string;
    challenges: string;
    reflection?: string;
  };
  annotations?: TextAnnotation[];
  isEditable?: boolean;
}

export const TextDocumentViewer: React.FC<TextDocumentViewerProps> = ({
  title,
  studentName,
  course,
  company,
  period,
  content: initialContent,
  annotations = [],
  isEditable = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [activePopup, setActivePopup] = useState<{
    id: string;
    annotation: TextAnnotation;
    x: number;
    y: number;
  } | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  // Helper to render text with highlights
  const renderTextWithHighlights = (text: string) => {
    if (!text) return null;
    
    // Simplistic highlight logic for prototype
    let result = text;
    const segments: React.ReactNode[] = [];
    
    let lastIndex = 0;
    
    // Just finding the first matching annotation for simplicity in this prototype
    annotations.forEach(ann => {
      const index = result.indexOf(ann.textToHighlight);
      if (index !== -1) {
        segments.push(<span key={`t-${lastIndex}`}>{result.substring(lastIndex, index)}</span>);
        
        segments.push(
          <mark 
            key={ann.id} 
            contentEditable={false}
            onClick={(e) => {
              if (isEditable) {
                e.stopPropagation();
                // Get absolute position for the popup
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setActivePopup({
                  id: ann.id,
                  annotation: ann,
                  x: rect.left,
                  y: rect.bottom + window.scrollY + 8 // 8px padding below
                });
              }
            }}
            className={cn(
              "relative group inline-block bg-yellow-200/50 dark:bg-yellow-900/30 border-b border-yellow-400 dark:border-yellow-600 border-dashed transition-colors",
              isEditable ? "cursor-pointer hover:bg-yellow-300/50 dark:hover:bg-yellow-800/40" : "cursor-help"
            )}
          >
            {ann.textToHighlight}
            {!isEditable && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl text-center">
                 <div className="flex items-center justify-center gap-1.5 mb-1 text-yellow-400 dark:text-yellow-600">
                    <AlertCircle size={12} />
                    <span className="font-bold uppercase tracking-wider">AI Suggestion</span>
                 </div>
                 {ann.comment}
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45" />
              </div>
            )}
          </mark>
        );
        lastIndex = index + ann.textToHighlight.length;
      }
    });
    
    segments.push(<span key={`t-${lastIndex}`}>{result.substring(lastIndex)}</span>);
    
    return segments.length > 1 ? <>{segments}</> : <>{text}</>;
  };

  const wordCount = Object.values(content).join(' ').split(/\s+/).filter(x => x).length;

  return (
    <Card className="min-h-[600px] flex flex-col pt-0 px-0 pb-0 overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
       <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <FileText size={16} />
             </div>
             <div>
               <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">{title}</h3>
               <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Text Document</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900" title="Download as PDF">
               <Download size={14} />
             </button>
          </div>
       </div>

       <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 overflow-y-auto flex justify-center p-4 sm:p-8 custom-scrollbar min-h-[550px]">
          <div className="bg-white text-black w-full max-w-[800px] shadow-sm border border-zinc-300 p-12 sm:p-16 font-serif text-sm relative" style={{ minHeight: '1056px' }}>
              
              <div className="text-center mb-12 border-b-2 border-black pb-6">
                <h1 className="font-bold text-2xl uppercase tracking-[0.2em] mb-2">{title}</h1>
                <h2 className="text-sm tracking-widest uppercase text-zinc-600">On-the-Job Training Practicum</h2>
                <div className="mt-4 flex justify-between text-xs font-bold text-left w-full font-sans">
                  <div>
                    <p>Student: {studentName}</p>
                    <p>Company: {company}</p>
                  </div>
                  <div className="text-right">
                    <p>Period: {period}</p>
                  </div>
                </div>
              </div>

             {/* Document Body */}
             <div className="space-y-6 text-justify leading-relaxed text-base">
                 
                 <div className="outline-none" contentEditable={isEditable} suppressContentEditableWarning>
                   <p><span className="ml-12"></span>{renderTextWithHighlights(content.objectives)}</p>
                 </div>

                 <div className="outline-none" contentEditable={isEditable} suppressContentEditableWarning>
                   <p><span className="ml-12"></span>{renderTextWithHighlights(content.activities)}</p>
                 </div>

                 <div className="outline-none" contentEditable={isEditable} suppressContentEditableWarning>
                   <p><span className="ml-12"></span>{renderTextWithHighlights(content.challenges)}</p>
                 </div>

                 <div className="outline-none relative" contentEditable={isEditable} suppressContentEditableWarning>
                   {content.reflection ? (
                     <p className="pt-4"><span className="ml-12"></span>{renderTextWithHighlights(content.reflection)}</p>
                   ) : (
                     <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-start gap-3 mt-8 font-sans">
                       <AlertCircle size={16} className="mt-0.5 shrink-0" />
                       <div>
                         <p className="font-bold text-xs uppercase tracking-wider mb-1">Missing Section</p>
                         <p className="text-xs">The student did not include a reflection section in this journal entry.</p>
                       </div>
                     </div>
                   )}
                 </div>

                <div className="mt-24 pt-8 grid grid-cols-2 gap-12 font-sans" contentEditable={false}>
                   <div className="text-center">
                     <div className="border-b border-black mb-2 w-full h-8"></div>
                     <p className="font-bold text-sm uppercase">{studentName}</p>
                     <p className="text-xs text-zinc-500">Student Trainee</p>
                   </div>
                   <div className="text-center">
                     <div className="border-b border-black mb-2 w-full h-8"></div>
                     <p className="font-bold text-sm uppercase">Mr. Juan Dela Cruz</p>
                     <p className="text-xs text-zinc-500">Industry Supervisor</p>
                   </div>
                </div>
             </div>

             {/* Footer stats */}
             <div className="absolute bottom-12 left-16 right-16 flex justify-between items-center text-xs text-zinc-400 font-sans">
                <div>Document ID: DOC-{Math.random().toString(36).substring(7).toUpperCase()}</div>
                <div>{wordCount} words</div>
             </div>
          </div>
       </div>

       {/* Inline Correction Pop-up */}
       {activePopup && (
         <div 
           className="fixed z-50 w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden"
           style={{ left: activePopup.x, top: activePopup.y }}
           onClick={(e) => e.stopPropagation()} // Prevent clicks from bleeding to the document
         >
           <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-yellow-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">AI Suggestion</span>
              </div>
              <button onClick={() => setActivePopup(null)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                <Check size={14} className="opacity-0" /> {/* Just spacing, close is clicking outside, but could add X */}
              </button>
           </div>
           
           <div className="p-3 space-y-3">
             <p className="text-xs text-zinc-600 dark:text-zinc-400">{activePopup.annotation.comment}</p>
             
             {/* Word Recommendations */}
             {activePopup.annotation.suggestions && activePopup.annotation.suggestions.length > 0 && (
               <div className="space-y-1.5">
                 <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Recommended Replacements</p>
                 <div className="flex flex-wrap gap-2">
                   {activePopup.annotation.suggestions.map((sug, i) => (
                     <button
                       key={i}
                       className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium rounded-md transition-colors"
                       onClick={() => {
                         // Apply replacement - (In a real app, update DOM/content state here)
                         setActivePopup(null);
                       }}
                     >
                       {sug}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {/* Speech to Text */}
             <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
               <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Speech to Text</p>
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => {
                     setIsListening(!isListening);
                     if (!isListening) {
                       setSpokenText('Listening...');
                       setTimeout(() => {
                         setSpokenText('TechCorp Solutions Inc.');
                         setIsListening(false);
                       }, 2000);
                     } else {
                       setSpokenText('');
                     }
                   }}
                   className={cn(
                     "w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0",
                     isListening 
                       ? "bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse" 
                       : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white"
                   )}
                 >
                   <div className="w-3 h-3 rounded-sm border-2 border-current" /> {/* Mic mock icon */}
                 </button>
                 <input
                   type="text"
                   value={spokenText}
                   onChange={(e) => setSpokenText(e.target.value)}
                   placeholder="Click mic to speak..."
                   className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 focus:outline-none focus:border-zinc-400"
                 />
                 <button 
                   onClick={() => setActivePopup(null)}
                   className="bg-black dark:bg-white text-white dark:text-black rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                 >
                   Apply
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Overlay to catch clicks outside the popup */}
       {activePopup && (
         <div className="fixed inset-0 z-40" onClick={() => setActivePopup(null)} />
       )}
    </Card>
  );
};
