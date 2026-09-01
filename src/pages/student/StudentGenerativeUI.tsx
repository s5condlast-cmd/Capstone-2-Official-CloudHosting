import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Sliders,
  Send,
  FileCode,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export const StudentGenerativeUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journal' | 'checker' | 'dtr' | 'templates'>('journal');
  
  // Journal state
  const [journalInput, setJournalInput] = useState('');
  const [journalTone, setJournalTone] = useState<'professional' | 'reflective' | 'technical'>('professional');
  const [generatedJournal, setGeneratedJournal] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // DTR calculator state
  const [requiredHours, setRequiredHours] = useState(486);
  const [loggedHours, setLoggedHours] = useState(184);
  const [dailyAverage, setDailyAverage] = useState(8);

  const handleGenerateJournal = () => {
    if (!journalInput.trim()) {
      toast.error('Please input your tasks or key activities first.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      let reflection = '';
      if (journalTone === 'technical') {
        reflection = `During this practicum interval, I focused on system-level implementation and engineering tasks: "${journalInput}". Through this activity, I applied core computer science and software development concepts, verified behavioral consistency across components, and solved edge-case defects under industry supervision.`;
      } else if (journalTone === 'reflective') {
        reflection = `This week's hands-on experience deepened my practical understanding in the workplace. While addressing "${journalInput}", I learned how to effectively collaborate with senior mentors, navigate unforeseen hurdles, and continuously adapt to industry development timelines.`;
      } else {
        reflection = `Throughout this practicum cycle, I performed assigned workplace responsibilities centered on: "${journalInput}". This hands-on engagement strengthened my professional work habits, ensured compliance with institutional quality standards, and contributed directly to project objectives.`;
      }
      setGeneratedJournal(reflection);
      setIsGenerating(false);
      toast.success('Reflection generated successfully!');
    }, 450);
  };

  const handleCopy = () => {
    if (generatedJournal) {
      navigator.clipboard.writeText(generatedJournal);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const remainingHours = Math.max(0, requiredHours - loggedHours);
  const progressPct = Math.min(100, Math.max(0, (loggedHours / requiredHours) * 100)).toFixed(1);
  const daysRemaining = Math.ceil(remainingHours / (dailyAverage || 8));

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-white p-6 sm:p-8 border border-zinc-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles size={13} className="text-blue-400 animate-pulse" />
              <span>Student AI Practicum Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Generative UI & Practicum Co-Pilot
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Accelerate your practicum workflow: automatically compose Weekly Journal reflections, run automated pre-submission compliance checks, and forecast your DTR completion milestones.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/student/journal">
              <Button variant="primary" size="sm" icon={<BookOpen size={14} />}>
                Go to Journal
              </Button>
            </Link>
            <Link to="/student/dtr">
              <Button variant="outline" size="sm" icon={<Calendar size={14} />} className="text-white border-zinc-700 hover:bg-zinc-800">
                Log DTR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 max-w-2xl">
        {[
          { id: 'journal', label: 'Journal Generator', icon: BookOpen },
          { id: 'checker', label: 'Compliance Checker', icon: ShieldCheck },
          { id: 'dtr', label: 'DTR Forecaster', icon: Clock },
          { id: 'templates', label: 'Prompt Hub', icon: FileCode },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'text-primary' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Journal Generator */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card title="Task Input & Tone Configuration" subtitle="Draft notes or bullet points from your work shift">
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Shift Activities & Accomplishments
                  </label>
                  <textarea
                    rows={4}
                    value={journalInput}
                    onChange={(e) => setJournalInput(e.target.value)}
                    placeholder="e.g., Configured PostgreSQL triggers, fixed UI layout alignment on responsive mobile views, tested Supabase storage uploads..."
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Reflection Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'professional', label: 'Professional' },
                      { id: 'technical', label: 'Technical' },
                      { id: 'reflective', label: 'Reflective' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setJournalTone(tone.id as any)}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer',
                          journalTone === tone.id
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        )}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleGenerateJournal}
                  disabled={isGenerating}
                  icon={isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                >
                  {isGenerating ? 'Generating Entry...' : 'Generate Weekly Journal Entry'}
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card
              title="Generated Practicum Reflection"
              subtitle="Ready for pasting into your Weekly Journal submission"
              action={
                generatedJournal ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    icon={copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                ) : undefined
              }
            >
              <div className="min-h-[220px] flex flex-col justify-between pt-2">
                {generatedJournal ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                      {generatedJournal}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Tone: <strong className="capitalize text-zinc-600 dark:text-zinc-300">{journalTone}</strong>
                      </span>
                      <Link to="/student/journal">
                        <Button variant="primary" size="sm" icon={<ArrowRight size={12} />}>
                          Apply to Weekly Journal
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400 space-y-2">
                    <Sparkles size={28} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-xs">Type your shift tasks on the left and hit generate to draft a full reflection.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Compliance Checker */}
      {activeTab === 'checker' && (
        <Card title="Automated Pre-Submission Compliance Checklist" subtitle="Instant rule verification for all required practicum documents">
          <div className="space-y-3 pt-2">
            {[
              { title: 'Student Application Letter', status: 'pass', desc: 'Recipient company address and internship dates properly aligned.' },
              { title: 'Parent / Guardian Consent Form', status: 'pass', desc: 'Parent signature present and emergency contact numbers verified.' },
              { title: 'Memorandum of Agreement (MOA)', status: 'warning', desc: 'Ensure notary seal and company representative sign-off are legible.' },
              { title: 'STI Endorsement Letter', status: 'pass', desc: 'Program head endorsement signature confirmed.' },
              { title: 'Daily Time Record (DTR)', status: 'pass', desc: 'Log entries strictly follow 24-hour timestamp formatting standard.' },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                    doc.status === 'pass'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  )}>
                    {doc.status === 'pass' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{doc.title}</h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{doc.desc}</p>
                  </div>
                </div>
                <Badge variant={doc.status === 'pass' ? 'success' : 'warning'}>
                  {doc.status === 'pass' ? 'COMPLIANT' : 'ATTENTION'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: DTR Hours Calculator */}
      {activeTab === 'dtr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card title="Practicum Target & Logged Hours" subtitle="Set your total target and log pace">
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Required Target Hours</label>
                  <input
                    type="number"
                    value={requiredHours}
                    onChange={(e) => setRequiredHours(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Logged Hours To Date</label>
                  <input
                    type="number"
                    value={loggedHours}
                    onChange={(e) => setLoggedHours(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Daily Average Shift Hours</label>
                  <input
                    type="number"
                    value={dailyAverage}
                    onChange={(e) => setDailyAverage(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <Card title="Completion Milestones & Forecast" subtitle="Projected timeline based on your current logging pace">
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-700 dark:text-zinc-300">Overall Practicum Completion</span>
                    <span className="text-primary font-black">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hours Done</span>
                    <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{loggedHours} hrs</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Remaining</span>
                    <div className="text-lg font-black text-primary mt-0.5">{remainingHours} hrs</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Work Days Left</span>
                    <div className="text-lg font-black text-emerald-600 mt-0.5">~{daysRemaining} days</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Prompt Hub */}
      {activeTab === 'templates' && (
        <Card title="Practicum Prompt Hub" subtitle="Quick prompt templates to speed up journal writing and reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {[
              {
                title: 'Bug Fix & Code Review Entry',
                prompt: 'I diagnosed a state synchronization bug in the client dashboard, wrote unit tests to replicate the edge case, and submitted a pull request with documentation.',
              },
              {
                title: 'Database Schema Optimization',
                prompt: 'I assisted the backend team with designing Postgres table structures, applying RLS security policies, and writing index optimization queries.',
              },
              {
                title: 'Sprint Planning & Standup Sync',
                prompt: 'I participated in the weekly engineering sprint planning, aligned milestone deadlines with my mentor, and defined deliverables for the upcoming release.',
              },
              {
                title: 'API Integration & Testing',
                prompt: 'I integrated third-party REST API endpoints, handled error response statuses, and validated JSON payloads against frontend data models.',
              },
            ].map((tmpl, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{tmpl.title}</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono leading-relaxed">
                    "{tmpl.prompt}"
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setJournalInput(tmpl.prompt);
                    setActiveTab('journal');
                    toast.info('Prompt loaded into Journal Generator');
                  }}
                  icon={<Sparkles size={12} />}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

