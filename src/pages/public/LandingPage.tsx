import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Building2,
  Award,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Clean Two-Stroke Hand-Painted Inward Brush Highlighter Component
// Exactly two main brush strokes: Stroke 1 sweeps from the Left; Stroke 2 sweeps from the Right with a slight upward tilt and delay.
const RoughHighlight: React.FC<{
  children: React.ReactNode;
  color?: string;
  className?: string;
}> = ({ children, color = '#FEF08A', className }) => {
  return (
    <span className={cn("relative inline-block whitespace-nowrap px-1.5", className)}>
      <span className="relative z-10">{children}</span>
      
      {/* Hand-Painted Two-Stroke Inward Brush SVG */}
      <svg
        className="absolute inset-0 top-[15%] bottom-[4%] -left-1.5 -right-1.5 w-[calc(100%+12px)] h-[85%] pointer-events-none -z-0 select-none overflow-visible"
        viewBox="0 0 200 36"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Stroke 1 (From Left): Primary Hand-Painted Brush Body */}
        <motion.path
          d="M 1 6 C 50 3, 120 4, 198 7 C 200 13, 199 26, 195 30 C 140 34, 60 34, 2 28 C 0 21, -1 12, 1 6 Z"
          fill={color}
          fillOpacity="0.85"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0 }}
        />

        {/* Stroke 2 (From Right, Tilted Slightly Upward): Secondary Hand-Painted Brush Body */}
        <motion.path
          d="M 199 14 C 145 7, 75 4, 2 6 C 0 12, 2 23, 6 27 C 65 29, 140 31, 198 30 C 200 24, 201 18, 199 14 Z"
          fill="#FDE047"
          fillOpacity="0.72"
          initial={{ scaleX: 0, opacity: 0, rotate: -2 }}
          whileInView={{ scaleX: 1, opacity: 1, rotate: -2 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.95, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 1, originY: 0.5 }}
        />
      </svg>
    </span>
  );
};

interface LandingPageProps {
  userRole?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const dashboardLink = userRole ? `/${userRole}` : '/login?role=student';
  const ctaText = userRole ? 'Go to Dashboard' : 'Access Portal';

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
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 rotate-6 drop-shadow-xs"
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
              onClick={() => scrollToSection('work-everywhere')}
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              Overview
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

                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#111827] via-[#374151] to-[#6B7280] pb-1 sm:pb-2">
                  Track Your Work Hours.

                  {/* Artistic Upward-Arched Brush Underline (Sequential 2-Pass: Left→Right, then visible pause, then Right→Left return brush) */}
                  <svg
                    className="absolute -bottom-2.5 sm:-bottom-4 md:-bottom-5 left-0 w-full h-6 sm:h-8 md:h-10 pointer-events-none overflow-visible select-none"
                    viewBox="0 0 400 30"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    {/* Left Bristle Entry Flare (Bold) */}
                    <motion.path
                      d="M 2 23 C 8 26, 18 25, 30 23"
                      stroke="#EF4444"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.95 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
                    />

                    {/* PASS 1 (LEFT → RIGHT): Bold primary brush stroke sweeping across */}
                    <motion.path
                      d="M 4 22 C 75 10, 140 7.5, 200 7.5 C 260 7.5, 325 10, 396 22"
                      stroke="#EF4444"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
                    />

                    {/* Upper Fine Bristle Trail (Left → Right) */}
                    <motion.path
                      d="M 12 19.5 C 80 8.5, 140 5.5, 200 5.5 C 260 5.5, 320 8.5, 388 19.5"
                      stroke="#F87171"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.9 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
                    />

                    {/* Dry-Brush Texture Bristle Accent (Left → Right) */}
                    <motion.path
                      d="M 28 20.5 C 95 9.5, 150 7, 200 7 C 250 7, 305 9.5, 370 20.5"
                      stroke="#EF4444"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeDasharray="18 4 10 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.85 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
                    />

                    {/* Right Brush Exit Flare (Lands when Pass 1 completes) */}
                    <motion.path
                      d="M 370 22 C 382 25, 392 25.5, 399 22.5"
                      stroke="#EF4444"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.95 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: 0.8, ease: "easeOut" }}
                    />

                    {/* PASS 2 (RIGHT → LEFT): Distinct return brush stroke sweeping back across AFTER a noticeable delay */}
                    <motion.path
                      d="M 396 24 C 325 12, 260 9.5, 200 9.5 C 140 9.5, 75 12, 4 24"
                      stroke="#DC2626"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 1.2, ease: [0.33, 1, 0.68, 1] }}
                    />

                    {/* Dense Ink Shadow Reservoir (Right → Left return pass) */}
                    <motion.path
                      d="M 384 26 C 315 14, 255 11.5, 200 11.5 C 145 11.5, 85 14, 16 26"
                      stroke="#991B1B"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.95 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: 1.28, ease: [0.33, 1, 0.68, 1] }}
                    />

                    {/* Left Finish Lock (Completes as Pass 2 lands) */}
                    <motion.path
                      d="M 22 23.5 C 14 24.5, 6 25, 2 24"
                      stroke="#DC2626"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.95 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.3, delay: 1.95, ease: "easeOut" }}
                    />
                  </svg>
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

      {/* SECTION 2: PROJECT & PRACTICUM MANAGEMENT (LIGHT SECTION WITH YELLOW ACCENT) */}
      <section id="project-management" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-white text-[#111827] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E5E7EB]">
        
        {/* Left-Side Subtle Topographic Contour Lines */}
        <div className="absolute left-0 top-0 bottom-0 w-[40%] max-w-[450px] pointer-events-none select-none opacity-25 overflow-hidden">
          <svg className="w-full h-full object-cover" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-150 300 C-150 120, 100 60, 280 60 C460 60, 560 180, 560 300 C560 420, 440 540, 280 540 C120 540, -150 480, -150 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M-100 300 C-100 150, 120 100, 260 100 C400 100, 490 200, 490 300 C490 400, 390 500, 260 500 C130 500, -100 450, -100 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M-50 300 C-50 180, 140 140, 240 140 C340 140, 420 220, 420 300 C420 380, 340 460, 240 460 C140 460, -50 420, -50 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M0 300 C0 210, 160 180, 220 180 C280 180, 350 240, 350 300 C350 360, 290 420, 220 420 C150 420, 0 390, 0 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M50 300 C50 240, 175 220, 210 220 C245 220, 285 260, 285 300 C285 340, 245 380, 210 380 C175 380, 50 360, 50 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M100 300 C100 270, 185 260, 200 260 C215 260, 230 280, 230 300 C230 320, 215 340, 200 340 C185 340, 100 330, 100 300 Z" stroke="#9CA3AF" strokeWidth="2"/>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Headline with RoughNotation Highlight on Clearance */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-[1.12]"
              >
                Requirement <br className="hidden sm:block" />
                <RoughHighlight color="#FEF08A">
                  Clearance
                </RoughHighlight>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-sm sm:text-base text-[#4B5563] max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal"
              >
                From pre-internship forms to final milestone reports, complete and submit all your official paperwork seamlessly. Fill out live templates, attach verified proof, and get approved by your advisers without the paper clutter.
              </motion.p>

              {/* Sky Blue CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="flex items-center justify-center lg:justify-start pt-1"
              >
                <button
                  type="button"
                  onClick={() => navigate(dashboardLink)}
                  className="px-8 py-3.5 bg-[#4F9CF9] hover:bg-[#3B8DEE] text-white text-sm sm:text-base font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>

            </div>

            {/* Right Collaborative System Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 flex items-center justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[460px] lg:max-w-[500px] flex items-center justify-center">
                <img
                  src="/images/Landing Page Icons/Project Management Collaboration.svg"
                  alt="Student Passing Documents and Practicum Requirement Clearance"
                  className="w-full h-auto max-h-[340px] sm:max-h-[380px] object-contain drop-shadow-lg"
                />
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* SECTION 3: WORK TOGETHER (COLLABORATIVE ORBIT & TEAMWORK) */}
      <section id="work-together" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-white text-[#111827] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Collaborative Circular Orbit Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 flex items-center justify-center"
            >
              <div className="relative w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[480px] aspect-square flex items-center justify-center select-none">
                
                {/* Concentric Dashed Orbit Rings */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
                  <ellipse cx="250" cy="250" rx="140" ry="140" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.65" />
                  <ellipse cx="250" cy="250" rx="220" ry="220" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.45" />
                </svg>

                {/* Center Main Logo (Tilted a bit to the right with floating cast shadow) */}
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  whileInView={{ scale: 1, rotate: 6 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="relative z-20 flex items-center justify-center filter drop-shadow-[0_20px_28px_rgba(0,0,0,0.2)] drop-shadow-[0_6px_10px_rgba(0,0,0,0.1)]"
                >
                  <img
                    src="/images/Landing Page Icons/Logo.svg"
                    alt="Practicum Main Logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain select-none pointer-events-none"
                  />
                </motion.div>

                {/* Orbit Circles with Images for Female, Male, Group, Reading, Coding */}
                {/* 1. Top-Left (Outer Orbit - Female Icon Image on yellow bg) */}
                <div className="absolute top-[8%] left-[18%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#FBBF24] flex items-center justify-center p-0.5">
                  <img
                    src="/images/Landing Page Icons/undraw_female-avatar_7t6k.svg"
                    alt="Female Trainee"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* 2. Top-Center (Inner Orbit - Reading Icon Image on green bg) */}
                <div className="absolute top-[16%] left-[45%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#10B981] flex items-center justify-center p-1.5">
                  <img
                    src="/images/Landing Page Icons/undraw_reading_c1xl.svg"
                    alt="Reading / Journal Writing"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 3. Top-Right (Outer Orbit - Male Icon Image on blue bg) */}
                <div className="absolute top-[10%] right-[18%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5">
                  <img
                    src="/images/Landing Page Icons/undraw_male-avatar_zkzx.svg"
                    alt="Male Trainee"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* 4. Middle-Left (Outer Orbit - Coding Icon Image on red bg) */}
                <div className="absolute top-[44%] left-[2%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#EF4444] flex items-center justify-center p-1.5">
                  <img
                    src="/images/Landing Page Icons/undraw_coding_joxb.svg"
                    alt="Coding & Development"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 5. Middle-Left (Inner Orbit - Female Icon Image on blue bg) */}
                <div className="absolute top-[42%] left-[19%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5">
                  <img
                    src="/images/Landing Page Icons/undraw_female-avatar_7t6k.svg"
                    alt="Female Student"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* 6. Middle-Right (Inner Orbit - Group Collaboration Icon Image on purple bg) */}
                <div className="absolute top-[42%] right-[19%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#6366F1] flex items-center justify-center p-1">
                  <img
                    src="/images/Landing Page Icons/undraw_real-time-collaboration_bchs.svg"
                    alt="Group Collaboration"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 7. Middle-Right (Outer Orbit - Reading / Journal Icon Image on green bg) */}
                <div className="absolute top-[56%] right-[3%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#10B981] flex items-center justify-center p-1.5">
                  <img
                    src="/images/Landing Page Icons/undraw_reading_c1xl.svg"
                    alt="Reading & Studies"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 8. Bottom-Center (Inner Orbit - Coding Icon Image on orange bg) */}
                <div className="absolute bottom-[16%] left-[45%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#F97316] flex items-center justify-center p-1.5">
                  <img
                    src="/images/Landing Page Icons/undraw_coding_joxb.svg"
                    alt="Coding Tasks"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 9. Bottom-Left (Outer Orbit - Male Icon Image on blue bg) */}
                <div className="absolute bottom-[8%] left-[20%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5">
                  <img
                    src="/images/Landing Page Icons/undraw_male-avatar_zkzx.svg"
                    alt="Male Student"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

              </div>
            </motion.div>

            {/* Right Content Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Headline with RoughNotation Highlight on Verification */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-[1.12]"
              >
                Document{' '}
                <RoughHighlight color="#FEF08A">
                  Verification
                </RoughHighlight>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-sm sm:text-base text-[#4B5563] max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal"
              >
                Empower practicum advisers and company coordinators to inspect student submissions in real time. Review uploaded templates, provide targeted feedback remarks, and verify internship records with complete confidence.
              </motion.p>

              {/* Sky Blue CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="flex items-center justify-center lg:justify-start pt-1"
              >
                <button
                  type="button"
                  onClick={() => navigate(dashboardLink)}
                  className="px-8 py-3.5 bg-[#4F9CF9] hover:bg-[#3B8DEE] text-white text-sm sm:text-base font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Try it now</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>

            </div>

          </div>
        </div>
      </section>

      {/* DEEP NAVY BLUE BANNER - "Your work, everywhere you are" */}
      <section id="work-everywhere" className="relative w-full bg-[#043873] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-12 overflow-hidden border-b border-[#032B5F]">
        
        {/* Left-Side Topographic Contour Lines SVG (Matching Reference Pattern) */}
        <div className="absolute left-0 top-0 bottom-0 w-[50%] max-w-[550px] pointer-events-none select-none opacity-20 overflow-hidden">
          <svg className="w-full h-full object-cover" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-150 300 C-150 120, 100 60, 280 60 C460 60, 560 180, 560 300 C560 420, 440 540, 280 540 C120 540, -150 480, -150 300 Z" stroke="white" strokeWidth="2.5"/>
            <path d="M-100 300 C-100 150, 120 100, 260 100 C400 100, 490 200, 490 300 C490 400, 390 500, 260 500 C130 500, -100 450, -100 300 Z" stroke="white" strokeWidth="2.5"/>
            <path d="M-50 300 C-50 180, 140 140, 240 140 C340 140, 420 220, 420 300 C420 380, 340 460, 240 460 C140 460, -50 420, -50 300 Z" stroke="white" strokeWidth="2.5"/>
            <path d="M0 300 C0 210, 160 180, 220 180 C280 180, 350 240, 350 300 C350 360, 290 420, 220 420 C150 420, 0 390, 0 300 Z" stroke="white" strokeWidth="2.5"/>
            <path d="M50 300 C50 240, 175 220, 210 220 C245 220, 285 260, 285 300 C285 340, 245 380, 210 380 C175 380, 50 360, 50 300 Z" stroke="white" strokeWidth="2.5"/>
            <path d="M100 300 C100 270, 185 260, 200 260 C215 260, 230 280, 230 300 C230 320, 215 340, 200 340 C185 340, 100 330, 100 300 Z" stroke="white" strokeWidth="2.5"/>
          </svg>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-blue-400/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6 text-center lg:text-left">
              
              {/* Main Headline with Cyan Underline Accent */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight"
              >
                Your work,{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10 text-[#38BDF8]">everywhere you are</span>
                  <span className="absolute bottom-1 left-0 w-full h-2.5 sm:h-3 bg-cyan-400/25 -rotate-1 rounded-sm z-0" />
                </span>
              </motion.h2>

              {/* Supporting Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal opacity-90"
              >
                Access your practicum documents, daily time records, and weekly journals from your computer, phone or tablet by synchronizing with STI College advisement, industry supervisors, and official DOCX/PDF templates.
              </motion.p>

              {/* Sky-Blue Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="flex items-center justify-center lg:justify-start pt-2"
              >
                <button
                  type="button"
                  onClick={() => navigate(dashboardLink)}
                  className="px-7 py-3 bg-[#4F9CF9] hover:bg-[#3B8DEE] text-white text-sm sm:text-base font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Try Practicum</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>

            </div>

            {/* Right Standing Character Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 xl:col-span-4 flex items-center justify-center lg:justify-end relative"
            >
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] flex items-center justify-center">
                
                {/* Standing Character with Tablet / Completion Vector Graphic */}
                <img 
                  src="/images/Landing Page Icons/Clearance Completed.svg" 
                  alt="Practicum Trainee Holding Tablet"
                  className="w-full h-auto max-h-[300px] sm:max-h-[340px] lg:max-h-[380px] object-contain drop-shadow-2xl select-none"
                />

                {/* Floating Loading Dots (Left side, below the curved broken arrow) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  whileInView={{ opacity: 1, scale: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="absolute -left-2 sm:-left-6 top-[46%] sm:top-[48%] z-20 bg-white/95 backdrop-blur-xs rounded-xl py-1.5 sm:py-2 px-3 sm:px-4 shadow-xl border border-white/40 flex items-center gap-1.5 sm:gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                </motion.div>

                {/* Floating Box with Checkmark (Below the loading dots) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  whileInView={{ opacity: 1, scale: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="absolute -left-1 sm:-left-4 top-[64%] sm:top-[66%] z-20 bg-white/95 backdrop-blur-xs rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3.5 shadow-xl border border-white/40 flex items-center gap-2"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="w-9 sm:w-12 h-1.5 bg-slate-300 rounded-full" />
                    <div className="w-5 sm:w-7 h-1 bg-slate-200 rounded-full" />
                  </div>
                </motion.div>

              </div>
            </motion.div>

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
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/images/Landing Page Icons/Logo.svg"
              alt="Practicum Logo"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 rotate-6 drop-shadow-xs"
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
