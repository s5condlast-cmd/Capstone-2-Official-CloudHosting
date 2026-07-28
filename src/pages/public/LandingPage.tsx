import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
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
  Eye,
  ArrowUp,
  Check,
  HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  userRole?: string | null;
}

type StylePreset = 'minimal' | 'enterprise' | 'academic';
type RolePOV = 'student' | 'adviser' | 'supervisor' | 'admin';

export const LandingPage: React.FC<LandingPageProps> = ({ userRole }) => {
  const dashboardLink = userRole ? `/${userRole}` : '/login?role=student';
  const ctaText = userRole ? 'Go to Dashboard' : 'Access Portal';

  // Minimal Editorial Style Default
  const [activeStyle] = useState<StylePreset>('minimal');
  
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

  const handlePrevStep = () => {
    setActiveStep(prev => (prev === 1 ? 4 : prev - 1));
  };

  const handleNextStep = () => {
    setActiveStep(prev => (prev === 4 ? 1 : prev + 1));
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Feature Data
  const features = [
    {
      id: 'dtr',
      title: 'Automated DTR & Hour Computation',
      description: 'Real-time daily time record calculation with supervisor digital approvals. No more manual math or log discrepancies.',
      icon: Clock,
      badge: 'Zero Math Error',
      accentColor: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'docs',
      title: 'Paperless Document Engine',
      description: 'Instant filling and preview for STI official templates: MOA, Student Application, Consent Forms, and Journal logs.',
      icon: FileText,
      badge: '100% Compliant',
      accentColor: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'pipeline',
      title: 'Multi-Tier Clearance Pipeline',
      description: 'Structured approval flow connecting Students, Practicum Advisers, Department Chairs, and Industry Supervisors.',
      icon: ShieldCheck,
      badge: 'Audit Ready',
      accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'directory',
      title: 'Live Industry MOA Registry',
      description: 'Directory of verified partner companies, active MOA expiration alerts, and direct internship slot allocations.',
      icon: Building2,
      badge: 'Live Database',
      accentColor: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'reviewer',
      title: 'Adviser Annotation & Review Hub',
      description: 'In-browser document reviewer with inline DOCX feedback comments, instant revision requests, and status logs.',
      icon: UserCheck,
      badge: 'Instant Feedback',
      accentColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'analytics',
      title: 'Real-Time Deployment Funnel',
      description: 'Live analytics dashboard tracking student OJT phase progression, hour bottlenecks, and department reports.',
      icon: TrendingUp,
      badge: 'Real-Time Sync',
      accentColor: 'from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400'
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

  // Dynamic animation configuration based on active style preset
  const getStyleThemeClasses = () => {
    switch (activeStyle) {
      case 'academic':
        return {
          wrapper: 'bg-zinc-950 text-white selection:bg-blue-600 selection:text-white',
          nav: 'bg-zinc-950/90 border-blue-900/40 backdrop-blur-xl',
          card: 'bg-zinc-900/90 border-blue-500/30 hover:border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)]',
          accentGradient: 'from-blue-600 via-indigo-500 to-cyan-400',
          pillBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30',
          heroBackground: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-zinc-950 to-zinc-950'
        };
      case 'enterprise':
        return {
          wrapper: 'bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-primary selection:text-primary-fg',
          nav: 'bg-zinc-50/80 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md',
          card: 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-xl backdrop-blur-sm',
          accentGradient: 'from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400',
          pillBg: 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300',
          buttonPrimary: 'bg-primary text-primary-fg hover:opacity-90 transition-all shadow-md hover:shadow-lg',
          heroBackground: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200/60 via-zinc-50 to-zinc-50 dark:from-zinc-900/40 dark:via-zinc-950 dark:to-zinc-950'
        };
      case 'minimal':
      default:
        return {
          wrapper: 'bg-zinc-950 text-white selection:bg-white selection:text-zinc-950',
          nav: 'bg-zinc-950/80 border-zinc-800/80 backdrop-blur-xl text-white',
          card: 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 shadow-xl',
          accentGradient: 'from-white via-zinc-200 to-zinc-400',
          pillBg: 'bg-zinc-900 border border-zinc-800 text-zinc-300',
          buttonPrimary: 'bg-white hover:bg-zinc-100 text-zinc-950 font-bold shadow-md',
          heroBackground: 'bg-zinc-950 text-white'
        };
    }
  };

  const currentTheme = getStyleThemeClasses();

  return (
    <div className={cn("min-h-screen font-sans overflow-x-hidden transition-colors duration-500 bg-zinc-950 text-white", currentTheme.wrapper)}>

      {/* Main Navigation Bar */}
      <nav className="sticky top-0 inset-x-0 h-16 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black transition-transform duration-300 group-hover:scale-105 shadow-sm bg-white text-zinc-950 border border-white">
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">STI Practicum</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Portal v2.4
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Academic OJT & Document System
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#pov-preview" className="hover:text-white transition-colors flex items-center gap-1 font-bold text-white">
              <Eye size={14} />
              <span>Role POV</span>
            </a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {!userRole && (
              <Link 
                to="/login?role=faculty" 
                className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors hidden sm:block"
              >
                Faculty / Admin Login
              </Link>
            )}
            <Link
              to={dashboardLink}
              className="group relative inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-white text-zinc-950 hover:bg-zinc-100 shadow-md"
            >
              <span>{ctaText}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* FIRST VIEW OF THE USER ONLY (100% VIEWPORT HEIGHT & WIDTH POV) */}
      <section className="relative w-full h-[calc(100vh-4rem)] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center transition-all duration-500 border-b border-zinc-800/80 overflow-hidden bg-zinc-950 text-white">
        
        {/* Soft Radial Ambient Glow Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

        {/* Soft Radial-Masked Grid Background */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_30%,#000_20%,transparent_90%)] pointer-events-none" 
        />
        
        <div className="max-w-5xl mx-auto w-full h-full flex flex-col justify-between items-center relative z-10">
          
          <div className="my-auto space-y-5 lg:space-y-6 flex flex-col items-center">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white"
            >
              Streamlined OJT Tracking &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Paperless Document Clearance.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              The centralized STI platform designed for Students, Practicum Advisers, and Industry Supervisors. Compute DTR hours seamlessly, generate verified MOA & consent documents, and manage deployment clearance in real time.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto"
            >
              <Link
                to={dashboardLink}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold rounded-full transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 cursor-pointer bg-white text-zinc-950 hover:bg-zinc-100"
              >
                <span>{userRole ? 'Continue to Dashboard' : 'Student Portal Login'}</span>
                <ChevronRight size={18} />
              </Link>

              {!userRole && (
                <Link
                  to="/login?role=faculty"
                  className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-extrabold rounded-full border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <UserCheck size={16} />
                  <span>Faculty & Adviser Login</span>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Quick Metrics & Scroll Indicator Footer in First Viewport */}
          <div className="w-full space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left w-full"
            >
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">DTR Hours</p>
                  <p className="text-xs sm:text-sm font-extrabold text-white">Auto Computed</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Templates</p>
                  <p className="text-xs sm:text-sm font-extrabold text-white">100% STI Standard</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">MOA Status</p>
                  <p className="text-xs sm:text-sm font-extrabold text-white">Verified Partner</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Clearance</p>
                  <p className="text-xs sm:text-sm font-extrabold text-white">Audit Ready</p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* SECTION 2: INTERACTIVE ROLE POV SHOWCASE */}
      <section id="pov-preview" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 transition-all duration-500 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto w-full my-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
              Experience the Portal from Every Role POV.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base font-medium">
              Switch between perspectives to explore customized interfaces for Students, Advisers, Supervisors, and Department Admins.
            </p>
          </div>

          {/* Interactive Simulated App Window with Side < and > Arrow Controls */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-14">
            
            {/* Floating Left Arrow Button (<) */}
            <button
              onClick={handlePrevPOV}
              className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl border-2 border-zinc-900 dark:border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer"
              title="Previous Role POV (<)"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            {/* Floating Right Arrow Button (>) */}
            <button
              onClick={handleNextPOV}
              className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl border-2 border-zinc-900 dark:border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30 cursor-pointer"
              title="Next Role POV (>)"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>

            {/* Simulated App Window Frame */}
            <div className="w-full rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-left">
              
              {/* Window Header */}
              <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={handlePrevPOV}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                      title="Previous POV (<)"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={handleNextPOV}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                      title="Next POV (>)"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <span className="ml-1 text-xs font-mono text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                      https://practicum.sti.edu/{activePOV}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700">
                    {React.createElement(povSequence[currentPOVIndex].icon, { size: 12, className: "text-blue-600 dark:text-blue-400" })}
                    <span>{povSequence[currentPOVIndex].title} ({povSequence[currentPOVIndex].count})</span>
                  </span>
                </div>
              </div>

              {/* Simulated Live Viewport Body */}
              <div className="p-4 sm:p-8 min-h-[360px] flex flex-col justify-center">
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
                    <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">OJT Training Progress</h3>
                          <p className="text-xs text-zinc-500">STI College - Bachelor of Science in Information Technology</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Active Training
                        </span>
                      </div>

                      {/* Hour Progress Ring */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-extrabold">
                          <span>Hours Completed: 340 / 480 hrs</span>
                          <span className="text-blue-600 dark:text-blue-400">70.8%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full w-[70.8%] transition-all duration-500" />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold">Today DTR</span>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-600">8.0 hrs Signed</span>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-purple-500" />
                            <span className="text-xs font-bold">Weekly Journal</span>
                          </div>
                          <span className="text-xs font-extrabold text-purple-600">Submitted</span>
                        </div>
                      </div>
                    </div>

                    {/* Pre-OJT Documents Checklist */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <h3 className="text-base font-bold flex items-center justify-between">
                        <span>Pre-OJT Clearance</span>
                        <span className="text-xs font-semibold text-emerald-600">4/4 Complete</span>
                      </h3>
                      <div className="space-y-2.5 text-xs font-medium">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Student Application Letter
                          </span>
                          <span className="font-bold">Approved</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Parent Consent Form
                          </span>
                          <span className="font-bold">Approved</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> MOA Document
                          </span>
                          <span className="font-bold">Cleared</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> Endorsement Letter
                          </span>
                          <span className="font-bold">Generated</span>
                        </div>
                      </div>
                    </div>

                    {/* END LINE OF VIEW OF STUDENT */}
                    <div className="md:col-span-3 pt-3 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                      <span>— END OF STUDENT VIEWPORT —</span>
                      <span>REAL-TIME DTR & DOCUMENT CLEARANCE SYNCHRONIZED</span>
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
                    <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Class Section Clearance Queue</h3>
                          <p className="text-xs text-zinc-500">BSIT - Section 401 (42 Enrolled Students)</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600">
                          3 Pending Approvals
                        </span>
                      </div>

                      {/* Pending Review List */}
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                          <div>
                            <p className="text-sm font-bold">Juan Dela Cruz</p>
                            <p className="text-xs text-zinc-500">Submitted: Parent Consent Form (With Fee)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 text-xs font-bold">Review DOCX</span>
                            <button className="px-3 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">Open Session</button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                          <div>
                            <p className="text-sm font-bold">Maria Santos</p>
                            <p className="text-xs text-zinc-500">Submitted: MOA Partnership Verification</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 text-xs font-bold">MOA Ready</span>
                            <button className="px-3 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">Verify Partner</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <h3 className="text-base font-bold">Department Quick Stats</h3>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                          <p className="text-zinc-500 font-medium">Deploys Cleared</p>
                          <p className="text-2xl font-black text-zinc-900 dark:text-white">38 / 42</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                          <p className="text-zinc-500 font-medium">Avg Review Time</p>
                          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">&lt; 24 Hours</p>
                        </div>
                      </div>
                    </div>

                    {/* END LINE OF VIEW OF ADVISER */}
                    <div className="md:col-span-3 pt-3 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                      <span>— END OF ADVISER CLEARANCE QUEUE —</span>
                      <span>FACULTY REVIEW & ANNOTATION LOGS UPDATED</span>
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
                    <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Industry Supervisor Portal</h3>
                          <p className="text-xs text-zinc-500">TechCorp Solutions Inc. - Software Engineering Interns</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600">
                          1-Click DTR Approval
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              JD
                            </div>
                            <div>
                              <p className="text-sm font-bold">Juan Dela Cruz</p>
                              <p className="text-xs text-zinc-500">Today DTR: 08:00 AM - 05:00 PM (8.0 hrs)</p>
                            </div>
                          </div>
                          <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1">
                            <Check size={14} /> Approve DTR
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <h3 className="text-base font-bold">Performance Appraisal</h3>
                      <p className="text-xs text-zinc-500">Digital STI Appraisal Form with instant score rating.</p>
                      <button className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center gap-2">
                        <Award size={14} /> Complete Appraisal
                      </button>
                    </div>

                    {/* END LINE OF VIEW OF SUPERVISOR */}
                    <div className="md:col-span-3 pt-3 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                      <span>— END OF SUPERVISOR APPROVAL SHEET —</span>
                      <span>COMPANY ATTENDANCE & EVALUATION VERIFIED</span>
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
                    <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">STI Academic Compliance Hub</h3>
                          <p className="text-xs text-zinc-500">Overall Practicum Deployment & MOA Expiration Audit</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/10 text-purple-600">
                          System Audit Operational
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
                          <p className="text-2xl font-black">180+</p>
                          <p className="text-[11px] text-zinc-500">Active MOAs</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
                          <p className="text-2xl font-black text-emerald-600">460 hrs</p>
                          <p className="text-[11px] text-zinc-500">Avg Progress</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
                          <p className="text-2xl font-black text-blue-600">100%</p>
                          <p className="text-[11px] text-zinc-500">Audit Compliance</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <h3 className="text-base font-bold">Template Manager</h3>
                      <p className="text-xs text-zinc-500">Upload & sync official DOCX/PDF template tags across all sections.</p>
                      <button className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-extrabold">
                        Manage Templates
                      </button>
                    </div>

                    {/* END LINE OF VIEW OF ADMIN */}
                    <div className="md:col-span-3 pt-3 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                      <span>— END OF ADMIN COMPLIANCE AUDIT VIEW —</span>
                      <span>DEPARTMENT DEPLOYMENT & MOA DATABASE SECURE</span>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* End of Viewport Frame Footer Bar */}
            <div className="px-4 py-2.5 bg-zinc-200/80 dark:bg-zinc-900/90 border-t border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              <span>/// END OF ROLE VIEWPORT FRAME ///</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE PERSPECTIVE ACTIVE
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>

      {/* CONTINUOUS HORIZONTAL MARQUEE FEATURE SLIDER SECTION */}
      <section id="features" className="py-16 lg:py-24 overflow-hidden border-b border-zinc-800 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Complete Practicum Lifecycle Management.
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg font-medium">
              Designed to solve every paperwork bottleneck, attendance discrepancy, and compliance audit requirement. Hover your mouse to pause scrolling.
            </p>
          </div>

        </div>

        {/* CONTINUOUS HORIZONTAL SCROLLING MARQUEE CONTAINER */}
        <div className="relative w-full overflow-hidden py-4 group">
          {/* Subtle dark gradient side mask fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 w-max animate-marquee group-hover:[animation-play-state:paused] cursor-pointer">
            {[...features, ...features].map((feature, i) => (
              <div
                key={`${feature.id}-${i}`}
                className="w-[300px] sm:w-[350px] shrink-0 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 text-white shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", feature.accentColor)}>
                      <feature.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white text-zinc-950 border border-white">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold mb-2 text-white">{feature.title}</h3>
                  <p className="text-zinc-300 text-xs leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-400 hover:text-white transition-colors mt-4">
                  <span>View feature detail</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW TIMELINE SECTION */}
      <section id="workflow" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center bg-zinc-900 text-white dark:bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto w-full my-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-1">

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              4-Phase OJT Clearance Pipeline.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-medium">
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
                badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                items: [
                  { title: 'Student Application Letter', text: 'Fill student details, upload signature, and route to Practicum Adviser.', status: 'Template Ready', statusBg: 'bg-emerald-500/10 text-emerald-400', icon: FileText },
                  { title: 'Parent Consent Forms', text: 'Generate With Fee or Without Fee consent forms with guardian e-signature.', status: 'Template Ready', statusBg: 'bg-emerald-500/10 text-emerald-400', icon: FileText },
                  { title: 'MOA Clearance Verification', text: 'Verify active Memorandum of Agreement expiration and company accreditation.', status: 'Database Synced', statusBg: 'bg-emerald-500/10 text-emerald-400', icon: Building2 }
                ]
              },
              {
                step: '02',
                title: 'Company Placement',
                desc: 'Submit Endorsement Letter, receive acceptance, and set up Training Plan.',
                icon: Building2,
                badge: 'PHASE 02 • PLACEMENT & ENDORSEMENT',
                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                items: [
                  { title: 'Endorsement Letter', text: 'Auto-generate official STI endorsement letter with department seal.', status: 'Generated', statusBg: 'bg-blue-500/10 text-blue-400', icon: FileText },
                  { title: 'Proposal Letter to Industry', text: 'Submit proposal details for custom company partnership onboarding.', status: 'Pending Accept', statusBg: 'bg-amber-500/10 text-amber-400', icon: Building2 },
                  { title: 'Training Plan Form', text: 'Outline internship objectives, shift schedules, and target 480 hours.', status: 'Approved', statusBg: 'bg-purple-500/10 text-purple-400', icon: Award }
                ]
              },
              {
                step: '03',
                title: 'Active OJT Execution',
                desc: 'Log daily DTR hours, submit weekly journals, and get supervisor sign-offs.',
                icon: Clock,
                badge: 'PHASE 03 • ACTIVE OJT EXECUTION',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                items: [
                  { title: 'DTR Attendance Sheet', text: 'Real-time hour calculation with daily supervisor 1-click approvals.', status: 'Auto Math', statusBg: 'bg-emerald-500/10 text-emerald-400', icon: Clock },
                  { title: 'Weekly Journal Logs', text: 'Submit weekly learning reflection reports and task photo evidence.', status: 'Active Stream', statusBg: 'bg-blue-500/10 text-blue-400', icon: FileText },
                  { title: 'Adviser Consultation', text: 'In-browser annotation review with direct feedback & revision logs.', status: 'Live Comments', statusBg: 'bg-cyan-500/10 text-cyan-400', icon: UserCheck }
                ]
              },
              {
                step: '04',
                title: 'Final Clearance',
                desc: 'Submit Performance Appraisal, Integration Paper, and earn final OJT clearance.',
                icon: Award,
                badge: 'PHASE 04 • FINAL CLEARANCE',
                badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                items: [
                  { title: 'Performance Appraisal Form', text: 'Digital evaluation score sheet filled directly by industry supervisor.', status: 'Score Verified', statusBg: 'bg-purple-500/10 text-purple-400', icon: Award },
                  { title: 'Integration Paper', text: 'Final practicum synthesis report verified by department chair.', status: 'Passed Audit', statusBg: 'bg-emerald-500/10 text-emerald-400', icon: FileText },
                  { title: 'Final Clearance Certificate', text: 'Digital certificate issue declaring 100% completion of OJT requirements.', status: '100% Cleared', statusBg: 'bg-blue-500/10 text-blue-400', icon: CheckCircle2 }
                ]
              }
            ].map((item, idx) => {
              const isOpen = activeStep === idx + 1;
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer",
                    isOpen
                      ? "bg-zinc-800/90 border-blue-500/80 shadow-xl shadow-blue-500/10"
                      : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-500/60"
                  )}
                  onClick={() => setActiveStep(isOpen ? 0 : idx + 1)}
                >
                  {/* Card Header Bar */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl font-black tracking-tighter text-blue-400 font-mono">
                        {item.step}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border", item.badgeColor)}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>

                    <div className="p-2 rounded-full bg-zinc-900/60 text-zinc-400 border border-zinc-700 shrink-0">
                      <ChevronDown
                        size={18}
                        className={cn("transition-transform duration-300", isOpen && "rotate-180 text-blue-400")}
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
                        className="border-t border-zinc-700/60 bg-zinc-950/60 p-5 space-y-3"
                      >
                        <div className="text-[11px] font-mono uppercase text-blue-400 font-bold mb-2">
                          Key Deliverables & Clearance Steps:
                        </div>
                        <div className="space-y-3 pt-1">
                          {item.items.map((sub, sIdx) => (
                            <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-zinc-800/60 pb-2.5 last:border-b-0 last:pb-0">
                              <div className="flex items-start gap-2.5">
                                <sub.icon size={15} className="text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-white mr-2">{sub.title}:</span>
                                  <span className="text-zinc-300 text-xs font-normal">{sub.text}</span>
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
      <section id="faq" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-10 space-y-2">

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Frequently Asked Questions.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base font-medium">
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
                    "rounded-xl border transition-all overflow-hidden",
                    currentTheme.card,
                    isOpen ? "border-zinc-400 dark:border-zinc-600 shadow-sm" : ""
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer"
                  >
                    <span className="text-zinc-900 dark:text-white leading-snug">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "transition-transform duration-300 text-zinc-400 shrink-0",
                        isOpen ? "rotate-180 text-primary" : ""
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
                        className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3 font-medium"
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
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={cn(
            "rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl border",
            activeStyle === 'academic'
              ? "bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-950 text-white border-blue-500/40"
              : activeStyle === 'minimal'
              ? "bg-zinc-900 text-white border-2 border-zinc-900"
              : "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 text-white border-zinc-800"
          )}>
            <div className="max-w-3xl mx-auto space-y-4 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-white/10 text-white border border-white/20 inline-block">
                Ready to Access the System?
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                Empower Your OJT Experience Today.
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
                Log in as a Student, Practicum Adviser, or Admin to begin managing daily time records, documents, and company endorsements.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={dashboardLink}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-sm rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Access Student Portal</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login?role=faculty"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Faculty / Adviser Access</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">STI Practicum Portal</span>
              <p className="text-[11px] text-zinc-500">Official Practicum Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-zinc-500 dark:text-zinc-400">
            <span>© 2026 STI College</span>
            <button onClick={scrollToTop} className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
