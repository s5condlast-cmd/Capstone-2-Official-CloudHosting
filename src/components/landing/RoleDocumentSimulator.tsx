import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  RotateCcw,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Calendar,
  Building2,
  User,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type RoleTabId = 'student' | 'faculty' | 'supervisor' | 'admin';

interface RoleDocumentSimulatorProps {
  activeRole?: RoleTabId;
  color?: string;
}

export const RoleDocumentSimulator: React.FC<RoleDocumentSimulatorProps> = ({
  color = '#18181B'
}) => {
  // ─────────────────────────────────────────────────────────────
  // STUDENT INTERN STATE (Interactive Fillable Document)
  // ─────────────────────────────────────────────────────────────
  const [studentName, setStudentName] = useState('Juan Dela Cruz');
  const [companyName, setCompanyName] = useState('Accenture Philippines');
  const [course, setCourse] = useState('BS Information Technology');
  const [hours, setHours] = useState('300 Hours');
  const [startDate, setStartDate] = useState('November 3, 2026');
  const [isSigned, setIsSigned] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  const handleResetStudent = () => {
    setStudentName('');
    setCompanyName('');
    setCourse('');
    setHours('');
    setStartDate('');
    setIsSigned(false);
    triggerToast('All inputs cleared');
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      triggerToast('Downloaded document (DOCX buffer)');
    }, 600);
  };

  return (
    <div className="w-full relative">
      {/* Toast notification badge */}
      {feedbackToast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -top-3 right-0 z-20 text-[10px] font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-300 shadow-sm"
        >
          {feedbackToast}
        </motion.div>
      )}

      {/* Main 2-Sided Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT SIDE (5 cols): Fillable Inputting Panel */}
        <div className="lg:col-span-5 rounded-2xl bg-zinc-50/90 border border-zinc-200 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header with Larger Reset Button */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h4 className="text-xs font-bold text-black uppercase font-mono tracking-wider">
                  Fillable Document Inputs
                </h4>
                <p className="text-[11px] text-zinc-500">Edit fields to update the preview</p>
              </div>
              <button
                type="button"
                onClick={handleResetStudent}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Clear all fields"
              >
                <RotateCcw size={14} className="text-zinc-700" />
                <span>Reset</span>
              </button>
            </div>

            {/* Input 1: Student Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <User size={15} className="text-black shrink-0" />
                <span>Student Full Name</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-2xs placeholder:text-zinc-400"
              />
            </div>

            {/* Input 2: Degree Program */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <GraduationCap size={15} className="text-black shrink-0" />
                <span>Degree Program</span>
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BS Information Technology"
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-2xs placeholder:text-zinc-400"
              />
            </div>

            {/* Input 3: Host Company */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <Building2 size={15} className="text-black shrink-0" />
                <span>Target Host Company</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Accenture Philippines"
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-2xs placeholder:text-zinc-400"
              />
            </div>

            {/* Input 4: Hours & Start Date in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Clock size={14} className="text-black shrink-0" />
                  <span>Required Hours</span>
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="300 Hours"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-zinc-300 text-black focus:outline-none focus:border-black transition-all shadow-2xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Calendar size={14} className="text-black shrink-0" />
                  <span>Start Date</span>
                </label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Nov 3, 2026"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-zinc-300 text-black focus:outline-none focus:border-black transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (7 cols): Black & White Templated Document Example */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-zinc-300 shadow-md p-6 sm:p-8 flex flex-col justify-between space-y-6 font-sans relative">
          <div className="space-y-5">
            {/* Monochrome Letterhead Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-black text-sm shadow-2xs">
                  STI
                </div>
                <div>
                  <p className="text-xs font-black tracking-tight text-black uppercase">STI COLLEGE PRACTICUM PROGRAM</p>
                  <p className="text-[10px] font-mono text-zinc-500">FT-CRD-137-01 • Student Application Letter</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-zinc-100 text-black border border-zinc-300">
                <span>Required</span>
              </div>
            </div>

            {/* Document Paragraph Flow with Proper Spacing & Alignment */}
            <div className="text-xs sm:text-[13px] text-zinc-900 leading-relaxed space-y-3.5">
              <p className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                To the Practicum Coordinator & Host Training Partner:
              </p>
              <p className="leading-relaxed text-zinc-800 text-justify">
                I,{' '}
                <span className={cn(
                  "font-bold text-black border-b border-black pb-0.5 transition-all inline-block",
                  !studentName && "text-zinc-400 italic border-zinc-300"
                )}>
                  {studentName || '________________________'}
                </span>
                , an officially enrolled student of STI College under the degree program{' '}
                <span className={cn(
                  "font-bold text-black border-b border-black pb-0.5 transition-all inline-block",
                  !course && "text-zinc-400 italic border-zinc-300"
                )}>
                  {course || '________________________'}
                </span>
                , respectfully submit my formal application to render{' '}
                <span className={cn(
                  "font-bold text-black border-b border-black pb-0.5 transition-all inline-block",
                  !hours && "text-zinc-400 italic border-zinc-300"
                )}>
                  {hours || '300 Hours'}
                </span>{' '}
                of industry practicum at{' '}
                <span className={cn(
                  "font-bold text-black border-b border-black pb-0.5 transition-all inline-block",
                  !companyName && "text-zinc-400 italic border-zinc-300"
                )}>
                  {companyName || '________________________'}
                </span>{' '}
                commencing on{' '}
                <span className={cn(
                  "font-bold text-black border-b border-black pb-0.5 transition-all inline-block",
                  !startDate && "text-zinc-400 italic border-zinc-300"
                )}>
                  {startDate || '________________________'}
                </span>
                .
              </p>
            </div>

            {/* Digital Signature Block (Clean Flush-Left Table Style) */}
            <div className="pt-4 border-t border-zinc-200">
              <p className="text-[11px] text-zinc-600 font-medium">Respectfully yours,</p>
              <div className="w-52 mt-2 text-center">
                <div className="border-b-2 border-black pb-0">
                  {isSigned ? (
                    <span className="font-serif italic font-black text-base text-black block select-none leading-none">
                      {studentName || 'Juan Dela Cruz'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-600 font-mono font-bold block uppercase tracking-wider">
                      Signature Required
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-black mt-1 truncate">
                  {studentName || 'Juan Dela Cruz'}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 leading-tight">Student Trainee Signatory</p>
              </div>
            </div>
          </div>

          {/* Single Download Button */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Download size={15} />
              <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
