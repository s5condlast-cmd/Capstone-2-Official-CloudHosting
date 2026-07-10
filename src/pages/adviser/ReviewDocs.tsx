import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  FileSearch, 
  Check, 
  X, 
  User, 
  Calendar, 
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  SpellCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AICheck {
  status: 'passed' | 'warning' | 'failed';
  issues: string[];
  confidence: number;
}

interface ContentInsight {
  totalChecks: number;
  issues: number;
  score: number;
}

interface PendingDoc {
  id: string;
  student: string;
  type: string;
  time: string;
  course: string;
  urgency: 'high' | 'medium' | 'low';
  aiCheck: AICheck;
  contentInsight: ContentInsight;
}

export const ReviewDocs: React.FC = () => {
  const pendingDocs: PendingDoc[] = [
    { 
      id: '1', student: 'Alice Brown', type: 'Prelim Journal', time: '2 hours ago', course: '__BSIT 402_401__', urgency: 'high',
      aiCheck: { status: 'failed', issues: ['Word count below 500-word minimum (327 words)', 'No technical stack references detected'], confidence: 91 },
      contentInsight: { totalChecks: 14, issues: 5, score: 68 }
    },
    { 
      id: '2', student: 'Charlie Davis', type: 'DTR Week 8', time: '5 hours ago', course: 'BSIT 402', urgency: 'medium',
      aiCheck: { status: 'warning', issues: ['Company stamp area may be blank (confidence: 78%)'], confidence: 78 },
      contentInsight: { totalChecks: 9, issues: 2, score: 79 }
    },
    { 
      id: '3', student: 'Eva Green', type: 'MOA Revised', time: '1 day ago', course: '__BSIT 402_401__', urgency: 'low',
      aiCheck: { status: 'passed', issues: [], confidence: 96 },
      contentInsight: { totalChecks: 10, issues: 0, score: 94 }
    },
    { 
      id: '4', student: 'John Smith', type: 'Attendance Report', time: '2 days ago', course: 'BSIT 402', urgency: 'low',
      aiCheck: { status: 'warning', issues: ['Date format inconsistency on rows 3, 7'], confidence: 84 },
      contentInsight: { totalChecks: 6, issues: 1, score: 85 }
    },
  ];

  const navigate = useNavigate();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'needs_review' | 'history'>('needs_review');

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === pendingDocs.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(pendingDocs.map(d => d.id)));
    }
  };

  const flaggedCount = pendingDocs.filter(d => d.aiCheck.status !== 'passed').length;

  const getAIIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'failed': return <X size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">


      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button 
          onClick={() => setActiveTab('needs_review')}
          className={cn(
            "px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors",
            activeTab === 'needs_review' 
              ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          Needs Review
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors",
            activeTab === 'history' 
              ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          Approved / History
        </button>
      </div>

      <Card 
        title={activeTab === 'needs_review' ? "Pending Documents for Review" : "Document History"} 
        className="w-full"
        action={activeTab === 'needs_review' ? (
          <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mr-2">{pendingDocs.length} Requests</span>
           {selectedDocs.size > 0 && (
             <>
               <Badge variant="outline" className="mr-1">{selectedDocs.size} selected</Badge>
               <Button size="sm" variant="danger" icon={<X size={14} />}>Batch Reject</Button>
             </>
           )}
           <Button 
             size="sm" 
             variant="outline" 
             disabled={selectedDocs.size === 0}
             className={cn(selectedDocs.size === 0 && "opacity-50 cursor-not-allowed")}
           >
             Batch Approve
           </Button>
        </div>
        ) : undefined}
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedDocs.size === pendingDocs.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Submission Details</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">AI Check</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Content Insight</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Urgency</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {pendingDocs.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr className={cn(
                    "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group",
                    selectedDocs.has(doc.id) && "bg-zinc-50/80 dark:bg-zinc-800/20"
                  )}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors">
                          <User size={16} className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{doc.student}</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{doc.course}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 mb-1">
                          <span className="text-sm font-semibold">{doc.type}</span>
                          <button className="text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                             <ExternalLink size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                           <div className="flex items-center gap-1">
                              <Clock size={10} />
                              {doc.time}
                           </div>
                           <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              Oct 28
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedAI(expandedAI === doc.id ? null : doc.id); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider",
                          doc.aiCheck.status === 'passed' 
                            ? "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            : doc.aiCheck.status === 'warning'
                              ? "border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              : "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                      >
                        {getAIIcon(doc.aiCheck.status)}
                        {doc.aiCheck.status === 'passed' ? 'Passed' : doc.aiCheck.status === 'warning' ? `${doc.aiCheck.issues.length} Issue${doc.aiCheck.issues.length > 1 ? 's' : ''}` : `${doc.aiCheck.issues.length} Failed`}
                        <span className="text-zinc-400 dark:text-zinc-500 ml-1">{doc.aiCheck.confidence}%</span>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                          <SpellCheck size={12} className={cn(
                            doc.contentInsight.issues > 0 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            doc.contentInsight.issues > 0 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"
                          )}>
                            {doc.contentInsight.issues > 0
                              ? `${doc.contentInsight.issues} issue${doc.contentInsight.issues > 1 ? 's' : ''}`
                              : 'Clear'
                            }
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-600">{doc.contentInsight.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={doc.urgency === 'high' ? 'error' : doc.urgency === 'medium' ? 'warning' : 'neutral'}>
                         {doc.urgency.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <Button size="sm" variant="outline" onClick={() => navigate(`/adviser/review/${doc.id}`)} className="p-2 border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-900 dark:group-hover:border-zinc-100 shadow-none"><MessageSquare size={14} /></Button>
                         <Button size="sm" variant="danger" icon={<X size={14} />}>Reject</Button>
                         <Button size="sm" variant="primary" icon={<Check size={14} />}>Approve</Button>
                      </div>
                    </td>
                  </tr>
                  {/* AI Issues Expandable Row */}
                  <AnimatePresence>
                    {expandedAI === doc.id && doc.aiCheck.issues.length > 0 && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={7} className="px-6 py-0">
                          <motion.div 
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="ml-10 p-4 mb-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={12} className="text-zinc-500 dark:text-zinc-400" />
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Automated Validation Analysis · Confidence {doc.aiCheck.confidence}%</span>
                            </div>
                            <ul className="space-y-2">
                              {doc.aiCheck.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  <div className={cn(
                                    "mt-0.5 shrink-0",
                                    doc.aiCheck.status === 'failed' ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                                  )}>
                                    {doc.aiCheck.status === 'failed' ? <X size={12} /> : <AlertTriangle size={12} />}
                                  </div>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card title="Quick Review Tips">
            <ul className="space-y-3">
               {[
                 'Verify company stamp on all DTR documents.',
                 'Journal entries must reference specific tech stack used.',
                 'Cross-reference MOA dates with first DTR log entry.',
                 'Reject documents with blurred signatures.'
               ].map((tip, i) => (
                 <li key={i} className="flex gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mt-1.5 shrink-0" />
                    {tip}
                 </li>
               ))}
            </ul>
         </Card>
         <Card title="Feedback Templates">
            <div className="flex flex-wrap gap-2">
               {['Signature Missing', 'Insufficient Detail', 'Wrong Format', 'Incorrect Dates'].map((tmpl, i) => (
                 <button key={i} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all">
                   {tmpl}
                 </button>
               ))}
            </div>
         </Card>
      </div>
    </div>
  );
};
