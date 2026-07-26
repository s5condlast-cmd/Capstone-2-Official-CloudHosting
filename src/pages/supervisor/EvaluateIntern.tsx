import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';
import { 
  Star, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CriteriaScore {
  technicalSkills: number;
  communication: number;
  punctuality: number;
  initiative: number;
  teamwork: number;
}

interface EvaluationRecord {
  id: string;
  name: string;
  course: string;
  position: string;
  status: 'Pending' | 'Completed';
  scores: CriteriaScore | null;
  overallScore: number | null;
  remarks: string | null;
  submittedDate: string | null;
}

const mockEvaluations: EvaluationRecord[] = [
  {
    id: 'eval-1',
    name: 'Maria Santos',
    course: 'BSIT 402',
    position: 'Frontend Dev Intern',
    status: 'Completed',
    scores: {
      technicalSkills: 4.5,
      communication: 4.0,
      punctuality: 5.0,
      initiative: 4.5,
      teamwork: 4.0
    },
    overallScore: 4.4,
    remarks: 'Excellent initiative. Contributed to 3 major sprint deliverables.',
    submittedDate: 'May 5, 2026'
  },
  {
    id: 'eval-2',
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    position: 'QA Engineer Intern',
    status: 'Pending',
    scores: null,
    overallScore: null,
    remarks: null,
    submittedDate: null
  },
  {
    id: 'eval-3',
    name: 'John Smith',
    course: 'BSIT 402',
    position: 'System Admin Intern',
    status: 'Pending',
    scores: null,
    overallScore: null,
    remarks: null,
    submittedDate: null
  }
];

export const EvaluateIntern: React.FC = () => {
  const [evals, setEvals] = useState<EvaluationRecord[]>(mockEvaluations);
  const [selectedEvalId, setSelectedEvalId] = useState<string>('eval-2');

  // Form State
  const [scores, setScores] = useState<CriteriaScore>({
    technicalSkills: 4,
    communication: 4,
    punctuality: 4,
    initiative: 4,
    teamwork: 4
  });
  const [remarks, setRemarks] = useState('');

  const currentEval = evals.find(e => e.id === selectedEvalId) || evals[0];

  const handleScoreChange = (criteria: keyof CriteriaScore, val: number) => {
    setScores(prev => ({
      ...prev,
      [criteria]: val
    }));
  };

  const computeOverallScore = (s: CriteriaScore) => {
    const sum = s.technicalSkills + s.communication + s.punctuality + s.initiative + s.teamwork;
    return Math.round((sum / 5) * 10) / 10;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!remarks.trim()) {
      toast.error("Please provide qualitative remarks and recommendations.");
      return;
    }

    const overall = computeOverallScore(scores);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    setEvals(prev => prev.map(ev => {
      if (ev.id === selectedEvalId) {
        return {
          ...ev,
          status: 'Completed',
          scores,
          overallScore: overall,
          remarks,
          submittedDate: today
        };
      }
      return ev;
    }));

    toast.success(`Performance appraisal for ${currentEval.name} submitted successfully!`);
    setRemarks('');
  };

  const renderScoreBar = (score: number) => (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" 
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 w-6 text-right">{score.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Performance Appraisal Form</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Rate your interns' skills, punctuality, teamwork, and overall workplace performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Intern Selection */}
        <div className="space-y-4">
          <Card title="Appraisal Pipelines">
            <div className="space-y-2">
              {evals.map(ev => (
                <div 
                  key={ev.id}
                  onClick={() => {
                    setSelectedEvalId(ev.id);
                    if (ev.scores) {
                      setScores(ev.scores);
                      setRemarks(ev.remarks || '');
                    } else {
                      setScores({ technicalSkills: 4, communication: 4, punctuality: 4, initiative: 4, teamwork: 4 });
                      setRemarks('');
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative",
                    selectedEvalId === ev.id
                      ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white text-white dark:text-zinc-950 shadow-md"
                      : "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={cn("text-sm font-bold tracking-tight", selectedEvalId === ev.id ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                        {ev.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {ev.position}
                      </p>
                    </div>
                    <Badge variant={ev.status === 'Completed' ? 'success' : 'warning'}>
                      {ev.status}
                    </Badge>
                  </div>
                  {ev.overallScore && (
                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-zinc-100/10 dark:border-zinc-800/30">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Overall Score</span>
                      <span className="text-sm font-black flex items-center gap-1">
                        <Star size={13} className="fill-current text-yellow-500" />
                        {ev.overallScore.toFixed(1)} / 5.0
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Form / Review View */}
        <div className="lg:col-span-2">
          {currentEval.status === 'Completed' ? (
            /* Review completed appraisal */
            <Card 
              title={`Submitted Appraisal: ${currentEval.name}`}
              subtitle={`Submitted on ${currentEval.submittedDate}`}
              action={
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-semibold text-xs">
                  <FileCheck size={16} />
                  <span>Evaluation Completed</span>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Criteria Breakdown</h4>
                  <div className="space-y-3.5">
                    {currentEval.scores && Object.entries(currentEval.scores).map(([key, val]) => {
                      const title = key.replace(/([A-Z])/g, ' $1');
                      const capitalized = title.charAt(0).toUpperCase() + title.slice(1);
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            <span>{capitalized}</span>
                          </div>
                          {renderScoreBar(val as number)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Qualitative Remarks & Recommendations</span>
                  <p className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm italic text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    "{currentEval.remarks}"
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            /* Active rating form */
            <Card title={`Evaluate ${currentEval.name}`}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Evaluation Metrics (Scale of 1-5)</h4>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                      <Star size={13} className="fill-current text-yellow-500" />
                      Live Average: {computeOverallScore(scores).toFixed(1)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(['technicalSkills', 'communication', 'punctuality', 'initiative', 'teamwork'] as const).map(key => {
                      const title = key.replace(/([A-Z])/g, ' $1');
                      const capitalized = title.charAt(0).toUpperCase() + title.slice(1);
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-zinc-700 dark:text-zinc-300">{capitalized}</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                className="w-16 text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-center border-transparent font-bold outline-none focus:ring-2 focus:ring-zinc-500"
                                value={scores[key]}
                                onChange={e => {
                                  let val = parseFloat(e.target.value);
                                  if (isNaN(val)) val = 1;
                                  if (val < 1) val = 1;
                                  if (val > 5) val = 5;
                                  handleScoreChange(key, val);
                                }}
                              />
                              <span className="text-zinc-400 text-[10px]">/ 5.0</span>
                            </div>
                          </div>
                          <input 
                            type="range"
                            min="1"
                            max="5"
                            step="0.1"
                            className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                            value={scores[key]}
                            onChange={e => handleScoreChange(key, parseFloat(e.target.value))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Supervisor Remarks & Industry Recommendations</label>
                  <textarea 
                    rows={5}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none font-medium leading-relaxed"
                    placeholder="Enter observations on performance, strengths, weaknesses, and recommend areas of skill refinement..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button variant="primary" icon={<ChevronRight size={14} />}>Submit Performance Appraisal</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
