import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  ArrowRight,
  Clock,
  FileText,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Briefcase,
  UserCheck,
  Building2,
  Award,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  Check
} from 'lucide-react';

interface LandingPageProps {
  userRole?: string | null;
}

type RolePOV = 'student' | 'adviser' | 'supervisor' | 'admin';

export const LandingPage: React.FC<LandingPageProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const dashboardLink = userRole ? `/${userRole}` : '/login?role=student';
  const ctaText = userRole ? 'Go to Dashboard' : 'Access Portal';
  
  // Interactive POV Showcase State
  const [activePOV, setActivePOV] = useState<RolePOV>('student');

  // POV List Sequence for Arrow Navigation (< >)
  const povSequence: { id: RolePOV; title: string; count: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'student', title: 'Student Perspective', count: '1 of 4', icon: GraduationCap },
    { id: 'adviser', title: 'Practicum Adviser Perspective', count: '2 of 4', icon: UserCheck },
    { id: 'supervisor', title: 'Industry Supervisor Perspective', count: '3 of 4', icon: Briefcase },
    { id: 'admin', title: 'Admin / Chair Perspective', count: '4 of 4', icon: ShieldCheck }
  ];

  const currentPOVIndex = povSequence.findIndex(p => p.id === activePOV);

  const handlePrevPOV = () => {
    const prevIdx = (currentPOVIndex - 1 + povSequence.length) % povSequence.length;
    setActivePOV(povSequence[prevIdx].id);
  };

  const handleNextPOV = () => {
    const nextIdx = (currentPOVIndex + 1) % povSequence.length;
    setActivePOV(povSequence[nextIdx].id);
  };

  // FAQ Accordion State (all closed by default until user clicks)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Workflow Active Step State
  const [activeStep, setActiveStep] = useState<number>(1);

  // Scroll detection for floating rounded navbar UI
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Feature Data
  const features = [
    {
      id: 'dtr',
      title: 'Automated DTR & Hour Computation',
      description: 'Real-time daily time record calculation with supervisor digital approvals. No more manual math or log discrepancies.',
      icon: Clock,
      badge: 'Zero Math Error',
      accentColor: 'from-blue-500/20 to-indigo-500/20 text-blue-600'
    },
    {
      id: 'docs',
      title: 'Paperless Document Engine',
      description: 'Instant filling and preview for STI official templates: MOA, Student Application, Consent Forms, and Journal logs.',
      icon: FileText,
      badge: '100% Compliant',
      accentColor: 'from-purple-500/20 to-pink-500/20 text-purple-600'
    },
    {
      id: 'pipeline',
      title: 'Multi-Tier Clearance Pipeline',
      description: 'Structured approval flow connecting Students, Practicum Advisers, Department Chairs, and Industry Supervisors.',
      icon: ShieldCheck,
      badge: 'Audit Ready',
      accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-600'
    },
    {
      id: 'directory',
      title: 'Live Industry MOA Registry',
      description: 'Directory of verified partner companies, active MOA expiration alerts, and direct internship slot allocations.',
      icon: Building2,
      badge: 'Live Database',
      accentColor: 'from-amber-500/20 to-orange-500/20 text-amber-600'
    },
    {
      id: 'reviewer',
      title: 'Adviser Annotation & Review Hub',
      description: 'In-browser document reviewer with inline DOCX feedback comments, instant revision requests, and status logs.',
      icon: UserCheck,
      badge: 'Instant Feedback',
      accentColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-600'
    },
    {
      id: 'analytics',
      title: 'Real-Time Deployment Funnel',
      description: 'Live analytics dashboard tracking student OJT phase progression, hour bottlenecks, and department reports.',
      icon: TrendingUp,
      badge: 'Real-Time Sync',
      accentColor: 'from-rose-500/20 to-red-500/20 text-rose-600'
    }
  ];

  // FAQ Items
  const faqItems = [
    {
      q: 'How do students log into the Practicum Portal?',
      a: 'Students sign in using their official STI credentials or assigned student ID account. Pre-filled profile data syncs automatically with active section assignments.'
    },
    {
      q: 'How does the automated DTR hour computation work?',
      a: 'Students log daily check-in and check-out times. The system automatically computes total hours worked, subtracts lunch breaks, flags weekend overtime caps, and sends daily summaries to supervisors for 1-click verification.'
    },
    {
      q: 'What happens if a document requires revision by the Practicum Adviser?',
      a: 'The adviser marks specific fields or adds inline comments using the built-in document editor. The student receives an instant notification, updates the document, and resubmits without starting over.'
    },
    {
      q: 'Are MOA templates compliant with STI academic standards?',
      a: 'Yes. All templates (MOA, Consent Forms, Application Letters, Appraisal Forms) strictly adhere to official STI academic guidelines and tag structures for seamless DOCX/PDF generation.'
    },
    {
      q: 'Can supervisors access the portal on mobile devices?',
      a: 'Absolutely. Supervisors receive instant mobile-friendly approval links via email to approve DTR sheets and complete intern performance appraisals with zero software installation.'
    }
  ];

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#F8F9FA] text-[#111827] selection:bg-zinc-900 selection:text-white">

      {/* Floating Island Navigation Bar (Always follows scroll to the end) */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pointer-events-none">
        <nav className={cn(
          "max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between transition-all duration-300 pointer-events-auto rounded-2xl sm:rounded-full",
          isScrolled 
            ? "bg-white/95 backdrop-blur-xl border border-[#E5E7EB] shadow-md" 
            : "bg-white/75 backdrop-blur-md border border-[#E5E7EB]/60 shadow-xs"
        )}>
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 group cursor-pointer"
          >
            <img 
              src="/images/Landing Page Icons/Logo.svg" 
              alt="Practicum Logo" 
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="flex items-center gap-1.5 font-black text-base sm:text-lg tracking-tight leading-none">
              <span className="text-[#111827]">Practicum</span>
              <span className="text-[#4B5563]">Website</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#4B5563]">
            <button 
              type="button"
              onClick={() => scrollToSection('pov-preview')} 
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              Role POV
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('features')} 
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('workflow')} 
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              Workflow
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('faq')} 
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {!userRole && (
              <button 
                type="button"
                onClick={() => navigate('/login?role=faculty')} 
                className="text-xs sm:text-sm font-semibold text-[#4B5563] hover:text-[#111827] transition-colors hidden sm:block cursor-pointer"
              >
                Faculty / Admin Login
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(dashboardLink)}
              className="group relative inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-[#111827] text-white hover:bg-zinc-800 shadow-xs cursor-pointer"
            >
              <span>{ctaText}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </nav>
      </header>

      {/* FIRST VIEW OF THE USER ONLY (100% VIEWPORT HEIGHT & WIDTH POV - NO LINES) */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 sm:pt-24 sm:pb-12 text-center transition-all duration-500 overflow-hidden bg-[#F8F9FA] text-[#111827]">
        
        {/* Soft Ambient Radial Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.035),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto w-full h-full flex flex-col justify-center items-center relative z-10">
          
          <div className="space-y-6 lg:space-y-8 flex flex-col items-center">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.18] text-[#111827] flex flex-col items-center justify-center text-center gap-2 sm:gap-3.5"
            >
              {/* Line 1: Upload Your Documents. [Post/Document Icon] */}
              <div className="relative inline-flex items-center justify-center">
                <span>Upload Your Documents.</span>
                <img 
                  src="/images/Landing Page Icons/Landing Page Post.svg" 
                  alt="Post Icon" 
                  className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 sm:-ml-2 md:-ml-3 h-9 sm:h-13 md:h-18 lg:h-22 w-auto object-contain pointer-events-none select-none drop-shadow-md transition-transform duration-300 hover:scale-110" 
                />
              </div>

              {/* Line 2: [Key Points Icon] Track Your Work Hours. */}
              <div className="relative inline-flex items-center justify-center">
                {/* Key Points Icon beside first word 'Track' */}
                <img 
                  src="/images/Landing Page Icons/Landing Page key Points.svg" 
                  alt="Key Points Icon" 
                  className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 sm:-mr-2 md:-mr-3 h-9 sm:h-13 md:h-18 lg:h-22 w-auto object-contain -rotate-12 pointer-events-none select-none drop-shadow-md transition-transform duration-300 hover:-rotate-18 hover:scale-110" 
                />
                
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111827] via-[#374151] to-[#6B7280]">
                  Track Your Work Hours.
                </span>
              </div>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Submit practicum requirements online, log daily time in and out, and clear your OJT milestones with instant adviser and supervisor approvals.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => navigate(dashboardLink)}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold rounded-full transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 cursor-pointer bg-[#111827] text-white hover:bg-zinc-800"
              >
                <span>{userRole ? 'Continue to Dashboard' : 'Student Portal Login'}</span>
                <ChevronRight size={18} />
              </button>

              {!userRole && (
                <button
                  type="button"
                  onClick={() => navigate('/login?role=faculty')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-zinc-50 text-[#111827] text-sm font-extrabold rounded-full border border-[#E5E7EB] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <UserCheck size={16} />
                  <span>Faculty & Adviser Login</span>
                </button>
              )}
            </motion.div>
          </div>

        </div>
      </section>

      {/* SECTION 2: INTERACTIVE ROLE POV SHOWCASE */}
      <section id="pov-preview" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 transition-all duration-500 border-b border-[#E5E7EB] bg-[#F3F4F6]/70 text-[#111827]">
        <div className="max-w-6xl mx-auto w-full my-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2 text-[#111827]">
              Experience the Portal from Every Role POV.
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base font-medium">
              Switch between perspectives to explore customized interfaces for Students, Advisers, Supervisors, and Department Admins.
            </p>
          </div>

          {/* Interactive Simulated App Window with Side < and > Arrow Controls */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-14">
            
            {/* Floating Left Arrow Button (<) */}
            <button
              type="button"
              onClick={handlePrevPOV}
              className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-[#111827] shadow-lg border border-[#E5E7EB] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            {/* Floating Right Arrow Button (>) */}
            <button
              type="button"
              onClick={handleNextPOV}
              className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-[#111827] shadow-lg border border-[#E5E7EB] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>

            {/* Simulated App Window Frame */}
            <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E5E7EB] bg-white shadow-xl overflow-hidden text-left">
              
              {/* Window Header */}
              <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={handlePrevPOV}
                      className="p-1 rounded hover:bg-zinc-200 text-[#4B5563] transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPOV}
                      className="p-1 rounded hover:bg-zinc-200 text-[#4B5563] transition-colors cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-white text-[#111827] flex items-center gap-1.5 border border-[#E5E7EB] shadow-xs">
                    {React.createElement(povSequence[currentPOVIndex].icon, { size: 12, className: "text-blue-600" })}
                    <span>{povSequence[currentPOVIndex].title} ({povSequence[currentPOVIndex].count})</span>
                  </span>
                </div>
              </div>

              {/* Simulated Live Viewport Body */}
              <div className="p-4 sm:p-8 min-h-[360px] flex flex-col justify-center bg-white">
              <AnimatePresence mode="wait">
                
                {/* STUDENT POV */}
                {activePOV === 'student' && (
                  <motion.div
                    key="student-pov"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {/* DTR Tracker Card */}
                    <div className="md:col-span-2 p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">OJT Training Progress</h3>
                          <p className="text-xs text-[#6B7280]">STI College - Bachelor of Science in Information Technology</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700">
                          Active Training
                        </span>
                      </div>

                      {/* Hour Progress Ring */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-extrabold">
                          <span className="text-[#374151]">Hours Completed: 340 / 480 hrs</span>
                          <span className="text-blue-600">70.8%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full w-[70.8%] transition-all duration-500" />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-emerald-600" />
                            <span className="text-xs font-bold text-[#111827]">Today DTR</span>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-700">8.0 hrs Signed</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-purple-600" />
                            <span className="text-xs font-bold text-[#111827]">Weekly Journal</span>
                          </div>
                          <span className="text-xs font-extrabold text-purple-700">Submitted</span>
                        </div>
                      </div>
                    </div>

                    {/* Pre-OJT Documents Checklist */}
                    <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-[#111827] flex items-center justify-between">
                        <span>Pre-OJT Clearance</span>
                        <span className="text-xs font-semibold text-emerald-700">4/4 Complete</span>
                      </h3>
                      <div className="space-y-2.5 text-xs font-medium">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-800">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Student Application Letter
                          </span>
                          <span className="font-bold">Approved</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-800">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Parent Consent Form
                          </span>
                          <span className="font-bold">Approved</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-800">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> MOA Document
                          </span>
                          <span className="font-bold">Cleared</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-800">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Endorsement Letter
                          </span>
                          <span className="font-bold">Generated</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ADVISER POV */}
                {activePOV === 'adviser' && (
                  <motion.div
                    key="adviser-pov"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div className="md:col-span-2 p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">Class Section Clearance Queue</h3>
                          <p className="text-xs text-[#6B7280]">BSIT - Section 401 (42 Enrolled Students)</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-700">
                          3 Pending Approvals
                        </span>
                      </div>

                      {/* Pending Review List */}
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between bg-white shadow-xs">
                          <div>
                            <p className="text-sm font-bold text-[#111827]">Juan Dela Cruz</p>
                            <p className="text-xs text-[#6B7280]">Submitted: Parent Consent Form (With Fee)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-700 text-xs font-bold">Review DOCX</span>
                            <button 
                              type="button"
                              onClick={() => navigate('/adviser/review')}
                              className="px-3 py-1 rounded-lg bg-[#111827] text-white text-xs font-bold cursor-pointer"
                            >
                              Open Session
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between bg-white shadow-xs">
                          <div>
                            <p className="text-sm font-bold text-[#111827]">Maria Santos</p>
                            <p className="text-xs text-[#6B7280]">Submitted: MOA Partnership Verification</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-700 text-xs font-bold">MOA Ready</span>
                            <button 
                              type="button"
                              onClick={() => navigate('/adviser/moa')}
                              className="px-3 py-1 rounded-lg bg-[#111827] text-white text-xs font-bold cursor-pointer"
                            >
                              Verify Partner
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-[#111827]">Department Quick Stats</h3>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                          <p className="text-[#6B7280] font-medium">Deploys Cleared</p>
                          <p className="text-2xl font-black text-[#111827]">38 / 42</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                          <p className="text-[#6B7280] font-medium">Avg Review Time</p>
                          <p className="text-2xl font-black text-blue-600">&lt; 24 Hours</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUPERVISOR POV */}
                {activePOV === 'supervisor' && (
                  <motion.div
                    key="supervisor-pov"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div className="md:col-span-2 p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">Industry Supervisor Portal</h3>
                          <p className="text-xs text-[#6B7280]">TechCorp Solutions Inc. - Software Engineering Interns</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700">
                          1-Click DTR Approval
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-[#E5E7EB] flex items-center justify-between bg-white shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              JD
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#111827]">Juan Dela Cruz</p>
                              <p className="text-xs text-[#6B7280]">Today DTR: 08:00 AM - 05:00 PM (8.0 hrs)</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => navigate('/supervisor/dtr')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check size={14} /> Approve DTR
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-[#111827]">Performance Appraisal</h3>
                      <p className="text-xs text-[#6B7280]">Digital STI Appraisal Form with instant score rating.</p>
                      <button 
                        type="button"
                        onClick={() => navigate('/supervisor/completion')}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Award size={14} /> Complete Appraisal
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ADMIN POV */}
                {activePOV === 'admin' && (
                  <motion.div
                    key="admin-pov"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div className="md:col-span-2 p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">STI Academic Compliance Hub</h3>
                          <p className="text-xs text-[#6B7280]">Overall Practicum Deployment & MOA Expiration Audit</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/10 text-purple-700">
                          System Audit Operational
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-center shadow-xs">
                          <p className="text-2xl font-black text-[#111827]">180+</p>
                          <p className="text-[11px] text-[#6B7280]">Active MOAs</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-center shadow-xs">
                          <p className="text-2xl font-black text-emerald-700">460 hrs</p>
                          <p className="text-[11px] text-[#6B7280]">Avg Progress</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-center shadow-xs">
                          <p className="text-2xl font-black text-blue-600">100%</p>
                          <p className="text-[11px] text-[#6B7280]">Audit Compliance</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-[#111827]">Template Manager</h3>
                      <p className="text-xs text-[#6B7280]">Upload & sync official DOCX/PDF template tags across all sections.</p>
                      <button 
                        type="button"
                        onClick={() => navigate('/admin/templates')}
                        className="w-full py-2.5 rounded-xl bg-[#111827] text-white text-xs font-extrabold shadow-xs cursor-pointer"
                      >
                        Manage Templates
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Viewport Frame Footer Bar */}
            <div className="px-4 py-2.5 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-end text-[11px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE PERSPECTIVE ACTIVE
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>

      {/* CONTINUOUS HORIZONTAL MARQUEE FEATURE SLIDER SECTION */}
      <section id="features" className="py-16 lg:py-24 overflow-hidden border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
              Complete Practicum Lifecycle Management.
            </h2>
            <p className="text-[#4B5563] text-base sm:text-lg font-medium">
              Designed to solve every paperwork bottleneck, attendance discrepancy, and compliance audit requirement. Hover your mouse to pause scrolling.
            </p>
          </div>

        </div>

        {/* CONTINUOUS HORIZONTAL SCROLLING MARQUEE CONTAINER */}
        <div className="relative w-full overflow-hidden py-4 group">
          {/* Soft neutral gradient side mask fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 w-max animate-marquee group-hover:[animation-play-state:paused] cursor-pointer">
            {[...features, ...features].map((feature, i) => (
              <div
                key={`${feature.id}-${i}`}
                className="w-[300px] sm:w-[350px] shrink-0 p-6 rounded-2xl border border-[#E5E7EB] bg-white text-[#111827] shadow-xs flex flex-col justify-between hover:border-zinc-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-xs", feature.accentColor)}>
                      <feature.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#111827] text-white border border-[#111827]">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold mb-2 text-[#111827]">{feature.title}</h3>
                  <p className="text-[#4B5563] text-xs leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors mt-4">
                  <span>View feature detail</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW TIMELINE SECTION */}
      <section id="workflow" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center bg-[#F3F4F6]/70 text-[#111827] border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto w-full my-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-1">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
              4-Phase OJT Clearance Pipeline.
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base font-medium">
              From pre-OJT application clearance to final performance evaluation and graduation clearance.
            </p>
          </div>

          {/* Interactive Accordion Cards for 4 Workflow Phases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto w-full text-left">
            {[
              {
                step: '01',
                title: 'Pre-OJT Requirements',
                desc: 'Generate Application Letter, Parent Consent, and verify company MOA clearance.',
                icon: FileText,
                badge: 'PHASE 01 • PRE-OJT CLEARANCE',
                badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
                items: [
                  { title: 'Student Application Letter', text: 'Fill student details, upload signature, and route to Practicum Adviser.', status: 'Template Ready', statusBg: 'bg-emerald-500/10 text-emerald-700', icon: FileText },
                  { title: 'Parent Consent Forms', text: 'Generate With Fee or Without Fee consent forms with guardian e-signature.', status: 'Template Ready', statusBg: 'bg-emerald-500/10 text-emerald-700', icon: FileText },
                  { title: 'MOA Clearance Verification', text: 'Verify active Memorandum of Agreement expiration and company accreditation.', status: 'Database Synced', statusBg: 'bg-emerald-500/10 text-emerald-700', icon: Building2 }
                ]
              },
              {
                step: '02',
                title: 'Company Placement',
                desc: 'Submit Endorsement Letter, receive acceptance, and set up Training Plan.',
                icon: Building2,
                badge: 'PHASE 02 • PLACEMENT & ENDORSEMENT',
                badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
                items: [
                  { title: 'Endorsement Letter', text: 'Auto-generate official STI endorsement letter with department seal.', status: 'Generated', statusBg: 'bg-blue-500/10 text-blue-700', icon: FileText },
                  { title: 'Proposal Letter to Industry', text: 'Submit proposal details for custom company partnership onboarding.', status: 'Pending Accept', statusBg: 'bg-amber-500/10 text-amber-700', icon: Building2 },
                  { title: 'Training Plan Form', text: 'Outline internship objectives, shift schedules, and target 480 hours.', status: 'Approved', statusBg: 'bg-purple-500/10 text-purple-700', icon: Award }
                ]
              },
              {
                step: '03',
                title: 'Active OJT Execution',
                desc: 'Log daily DTR hours, submit weekly journals, and get supervisor sign-offs.',
                icon: Clock,
                badge: 'PHASE 03 • ACTIVE OJT EXECUTION',
                badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
                items: [
                  { title: 'DTR Attendance Sheet', text: 'Real-time hour calculation with daily supervisor 1-click approvals.', status: 'Auto Math', statusBg: 'bg-emerald-500/10 text-emerald-700', icon: Clock },
                  { title: 'Weekly Journal Logs', text: 'Submit weekly learning reflection reports and task photo evidence.', status: 'Active Stream', statusBg: 'bg-blue-500/10 text-blue-700', icon: FileText },
                  { title: 'Adviser Consultation', text: 'In-browser annotation review with direct feedback & revision logs.', status: 'Live Comments', statusBg: 'bg-cyan-500/10 text-cyan-700', icon: UserCheck }
                ]
              },
              {
                step: '04',
                title: 'Final Clearance',
                desc: 'Submit Performance Appraisal, Integration Paper, and earn final OJT clearance.',
                icon: Award,
                badge: 'PHASE 04 • FINAL CLEARANCE',
                badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
                items: [
                  { title: 'Performance Appraisal Form', text: 'Digital evaluation score sheet filled directly by industry supervisor.', status: 'Score Verified', statusBg: 'bg-purple-500/10 text-purple-700', icon: Award },
                  { title: 'Integration Paper', text: 'Final practicum synthesis report verified by department chair.', status: 'Passed Audit', statusBg: 'bg-emerald-500/10 text-emerald-700', icon: FileText },
                  { title: 'Final Clearance Certificate', text: 'Digital certificate issue declaring 100% completion of OJT requirements.', status: '100% Cleared', statusBg: 'bg-blue-500/10 text-blue-700', icon: CheckCircle2 }
                ]
              }
            ].map((item, idx) => {
              const isOpen = activeStep === idx + 1;
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer bg-white",
                    isOpen
                      ? "border-blue-600 shadow-md ring-1 ring-blue-600/20"
                      : "border-[#E5E7EB] hover:border-zinc-300 shadow-xs"
                  )}
                  onClick={() => setActiveStep(isOpen ? 0 : idx + 1)}
                >
                  {/* Card Header Bar */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl font-black tracking-tighter text-blue-600 font-mono">
                        {item.step}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#111827]">{item.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border", item.badgeColor)}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#4B5563] leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>

                    <div className="p-2 rounded-full bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB] shrink-0">
                      <ChevronDown
                        size={18}
                        className={cn("transition-transform duration-300", isOpen && "rotate-180 text-blue-600")}
                      />
                    </div>
                  </div>

                  {/* Dropdown Details Accordion Content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-[#E5E7EB] bg-[#F8F9FA] p-5 space-y-3"
                      >
                        <div className="text-[11px] font-mono uppercase text-blue-600 font-bold mb-2">
                          Key Deliverables & Clearance Steps:
                        </div>
                        <div className="space-y-3 pt-1">
                          {item.items.map((sub, sIdx) => (
                            <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#E5E7EB] pb-2.5 last:border-b-0 last:pb-0">
                              <div className="flex items-start gap-2.5">
                                <sub.icon size={15} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-[#111827] mr-2">{sub.title}:</span>
                                  <span className="text-[#4B5563] text-xs font-normal">{sub.text}</span>
                                </div>
                              </div>
                              <span className={cn("px-2.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 self-start sm:self-center ml-6 sm:ml-0", sub.statusBg)}>
                                {sub.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* RIGHT-SIZED FAQ ACCORDION SECTION */}
      <section id="faq" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#111827]">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827]">
              Frequently Asked Questions.
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base font-medium">
              Everything you need to know about system access, DTR calculation, and document clearance.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl border transition-all overflow-hidden bg-white border-[#E5E7EB] hover:border-zinc-300 shadow-xs",
                    isOpen ? "border-zinc-400 shadow-sm" : ""
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer"
                  >
                    <span className="text-[#111827] leading-snug">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "transition-transform duration-300 text-[#6B7280] shrink-0",
                        isOpen ? "rotate-180 text-blue-600" : ""
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#E5E7EB] pt-3 font-medium bg-[#F8F9FA]"
                      >
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F3F4F6]/70">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl border bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white border-zinc-800">
            <div className="max-w-3xl mx-auto space-y-4 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-white/10 text-white border border-white/20 inline-block">
                Ready to Access the System?
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Empower Your OJT Experience Today.
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
                Log in as a Student, Practicum Adviser, or Admin to begin managing daily time records, documents, and company endorsements.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(dashboardLink)}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-sm rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Access Student Portal</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login?role=faculty')}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Faculty / Adviser Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E5E7EB] bg-[#F8F9FA] text-[#111827]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img 
              src="/images/Landing Page Icons/Logo.svg" 
              alt="Practicum Logo" 
              className="h-9 sm:h-10 w-auto object-contain" 
            />
            <div className="flex items-center gap-1.5 font-extrabold text-base sm:text-lg tracking-tight leading-none">
              <span className="text-[#111827]">Practicum</span>
              <span className="text-[#4B5563]">Website</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-[#4B5563]">
            <span>© 2026 STI College</span>
            <button 
              type="button"
              onClick={scrollToTop} 
              className="hover:text-[#111827] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
