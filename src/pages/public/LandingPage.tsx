import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Building2,
  Award,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  GraduationCap,
  BookOpen,
  Sparkles,
  PenTool,
  Users,
  Menu,
  X,
  BadgeCheck,
  RotateCcw,
  Plus,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { documentGenerator } from '../../lib/documentGenerator';
import Carousel, { SlideData } from '../../components/ui/carousel';

// Clean Two-Stroke Hand-Painted Inward Brush Highlighter Component
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
  const ctaText = userRole ? 'Go to Dashboard' : 'Student Portal';

  // FAQ Accordion State (all closed by default until user clicks)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll detection for floating rounded navbar UI & active section indicator
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unified ref & viewport observer for repeating brush underline animation on scroll
  const underlineRef = useRef<HTMLSpanElement>(null);
  const isUnderlineInView = useInView(underlineRef, { amount: 0.2, once: false });

  const navLinks = [
    { id: 'project-management', label: 'Clearance' },
    { id: 'work-together', label: 'Verification' },
    { id: 'features', label: 'Documents' },
    { id: 'journey', label: 'OJT Journey' },
    { id: 'faq', label: 'FAQ' }
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sectionIds = ['project-management', 'work-together', 'features', 'journey', 'faq'];
      const scrollPosition = window.scrollY + 140; // offset for floating navbar height

      let current: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top / header
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection(null);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -72; // floating island navbar offset
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'downloaded'>('idle');

  const handleSimulatedDownload = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('downloading');
    setTimeout(() => {
      setDownloadState('downloaded');
      setTimeout(() => {
        setDownloadState('idle');
      }, 2500);
    }, 1200);
  };

  // ─── Data Arrays ───────────────────────────────────────────────────────
  const ICON = (name: string) => `/images/Landing Page Icons/${name}`;

  const marqueeItems = [
    { title: 'Student Application Letter', icon: ICON('Application Letter Signed.svg'), badge: 'Pre-OJT', color: 'blue' },
    { title: 'Memorandum of Agreement', icon: ICON('MOA Contract Signed.svg'), badge: 'Required', color: 'blue' },
    { title: 'Daily Time Record (DTR)', icon: ICON('undraw_work-time_1ogn.svg'), badge: 'Live Sync', color: 'emerald' },
    { title: 'Weekly Reflection Journal', icon: ICON('Weekly Journal Writing.svg'), badge: 'Weekly', color: 'emerald' },
    { title: 'Student Consent Form', icon: ICON('undraw_signed-document_y8vk.svg'), badge: 'Approved', color: 'blue' },
    { title: 'Digital Signatures', icon: ICON('Digital Signature.svg'), badge: 'Verified', color: 'amber' },
    { title: 'Training Plan Form', icon: ICON('Landing Page Post.svg'), badge: 'In-OJT', color: 'emerald' },
    { title: 'Performance Appraisal', icon: ICON('Clearance Completed.svg'), badge: 'Finals', color: 'amber' },
    { title: 'Integration Paper', icon: ICON('undraw_essay-writing_nlru.svg'), badge: 'Milestone', color: 'amber' },
    { title: 'Host Company Matching', icon: ICON('Industry Partner Exploration.svg'), badge: 'Partnership', color: 'blue' },
  ];

  const slideData: SlideData[] = [
    {
      title: "Internship Launch",
      description: "Kickstart your training journey with guided onboarding and immediate faculty guidance.",
      src: ICON('Application Letter Signed.svg'),
      onClick: () => scrollToSection('project-management')
    },
    {
      title: "Attendance & Shifts",
      description: "Log daily workplace hours, monitor lunch intervals, and track completion progress in real time.",
      src: ICON('undraw_work-time_1ogn.svg'),
      onClick: () => scrollToSection('work-together')
    },
    {
      title: "Supervisor Feedback",
      description: "Receive transparent milestone evaluations and performance ratings from industry mentors.",
      src: ICON('Clearance Completed.svg'),
      onClick: () => scrollToSection('features')
    },
    {
      title: "Partner Directory",
      description: "Explore accredited host training establishments aligned directly with your field of study.",
      src: ICON('Industry Partner Exploration.svg'),
      onClick: () => navigate(dashboardLink)
    },
    {
      title: "Weekly Insights",
      description: "Document technical skills learned on the job and showcase your weekly hands-on experience.",
      src: ICON('Weekly Journal Writing.svg'),
      onClick: () => scrollToSection('features')
    },
    {
      title: "Instant Verification",
      description: "Seamlessly authorize milestone sign-offs across any device with zero friction.",
      src: ICON('Digital Signature.svg'),
      onClick: () => scrollToSection('features')
    },
  ];

  const faqItems = [
    { q: 'How do students log into the Practicum Portal?', a: 'Students sign in using their official STI credentials or assigned student ID account. Pre-filled profile data syncs automatically with active section assignments.' },
    { q: 'How does the automated DTR hour computation work?', a: 'Students log daily check-in and check-out times. The system automatically computes total hours worked, subtracts lunch breaks, flags weekend overtime caps, and sends daily summaries to supervisors for 1-click verification.' },
    { q: 'What happens if a document requires revision?', a: 'The adviser marks specific fields or adds inline comments using the built-in document editor. The student receives an instant notification, updates the document, and resubmits without starting over.' },
    { q: 'Are templates compliant with STI academic standards?', a: 'Yes. All templates (MOA, Consent Forms, Application Letters, Appraisal Forms) strictly adhere to official STI academic guidelines and tag structures for seamless DOCX/PDF generation.' },
    { q: 'Can supervisors access the portal on mobile?', a: 'Absolutely. Supervisors receive mobile-friendly approval links via email to approve DTR sheets and complete intern performance appraisals with zero software installation.' },
    { q: 'Is the platform secure and data protected?', a: 'All data is protected by Row-Level Security (RLS) policies on Supabase. Students can only access their own submissions, while advisers and admins have scoped access controls enforced at the database level.' }
  ];

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#F8F9FA] text-[#111827] selection:bg-zinc-900 selection:text-white">

      {/* Floating Island Navigation Bar */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-none",
          isScrolled ? "pt-2 sm:pt-2.5 px-3 sm:px-6 lg:px-8" : "pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8"
        )}
      >
        <div
          className={cn(
            "max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-7 py-2 sm:py-2.5 transition-all duration-300 rounded-full border pointer-events-auto",
            isScrolled
              ? "bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-[#E5E7EB]"
              : "bg-transparent border-transparent shadow-none"
          )}
        >
          {/* Brand Logo & Name (Clicks return to header / top) */}
          <div
            onClick={scrollToTop}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center justify-center">
              <img
                src="/images/Landing Page Icons/Logo.svg"
                alt="Practicum Logo"
                className="h-7.5 sm:h-8 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:rotate-12 rotate-6 drop-shadow-xs"
              />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-[#111827]">
              Practicum
            </span>
          </div>

          {/* Desktop Navigation Anchors with Active Indicator */}
          <nav className="hidden md:flex items-center gap-1 text-[13.5px] sm:text-sm font-semibold text-[#4B5563]">
            {navLinks.map((navItem) => {
              const isActive = activeSection === navItem.id;
              return (
                <button
                  key={navItem.id}
                  type="button"
                  onClick={() => scrollToSection(navItem.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full transition-all cursor-pointer relative",
                    isActive
                      ? "text-zinc-900 font-bold bg-zinc-100 shadow-2xs"
                      : "hover:text-[#111827] hover:bg-zinc-900/5 text-[#4B5563]"
                  )}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {!userRole && (
              <button
                type="button"
                onClick={() => navigate('/login?role=faculty')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-[#4B5563] hover:text-[#111827] hover:bg-zinc-900/5 transition-all cursor-pointer"
              >
                <UserCheck size={15} className="text-[#6B7280]" />
                <span>Faculty Login</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(dashboardLink)}
              className="group relative inline-flex items-center gap-1.5 px-4.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs bg-[#111827] text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{ctaText}</span>
              <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-[#4B5563] hover:text-[#111827] hover:bg-zinc-900/5 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="md:hidden max-w-sm mx-auto mt-2 p-4 rounded-2xl bg-white/98 backdrop-blur-xl border border-[#D1D5DB] shadow-2xl pointer-events-auto space-y-3"
            >
              <div className="flex flex-col space-y-1">
                {navLinks.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        scrollToSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "text-left px-3.5 py-2.5 rounded-xl text-sm font-extrabold transition-colors cursor-pointer",
                        isActive
                          ? "bg-zinc-100 text-[#111827]"
                          : "text-[#4B5563] hover:text-[#111827] hover:bg-zinc-50"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                {!userRole && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/login?role=faculty');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#D1D5DB] text-xs sm:text-sm font-extrabold text-[#111827] flex items-center justify-center gap-2 hover:bg-zinc-50"
                  >
                    <UserCheck size={15} />
                    <span>Faculty & Adviser Login</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigate(dashboardLink);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#111827] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Student Portal Login</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between items-center pt-28 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E5E7EB] bg-gradient-to-b from-slate-100/90 via-sky-50/30 to-[#F8FAFC]">

        {/* Full-Width Edge-to-Edge Cosmic Slate & Ice Cyan Mesh Aurora Glows */}
        <div className="absolute top-0 inset-x-0 h-[700px] bg-[radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(14,165,233,0.28),rgba(59,130,246,0.15)_50%,transparent_80%)] pointer-events-none -z-0" />
        <div className="absolute top-0 left-0 w-3/5 h-[650px] bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(100,116,139,0.20),transparent_70%)] blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-0 right-0 w-3/5 h-[650px] bg-[radial-gradient(ellipse_80%_60%_at_80%_25%,rgba(56,189,248,0.20),transparent_70%)] blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/4 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_90%_50%_at_50%_40%,rgba(14,165,233,0.14),rgba(71,85,105,0.10)_60%,transparent_80%)] blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#F8FAFC] to-transparent pointer-events-none -z-0" />

        {/* Subtle Decorative Background Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-30 select-none overflow-hidden -z-0">
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 200 C300 100, 700 300, 1300 150" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 6" />
            <path d="M-100 500 C400 400, 800 600, 1300 450" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 6" />
          </svg>
        </div>

        {/* Center Hero Content Container */}
        <div className="max-w-5xl mx-auto w-full text-center relative z-20 my-auto flex-1 flex flex-col items-center justify-center py-6 sm:py-10">

          <div className="space-y-6 lg:space-y-8 flex flex-col items-center justify-center text-center w-full mx-auto">

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.18] text-[#111827] flex flex-col items-center justify-center text-center gap-2.5 sm:gap-4 w-full mx-auto"
            >
              {/* Line 1: Upload Your Documents. [Messedup Drawable Icon] */}
              <div className="relative inline-flex items-center justify-center text-center">
                <span className="relative z-10">Upload Your Documents.</span>
                <motion.img
                  animate={{
                    y: [0, -6, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
                  src="/images/Landing Page Icons/Messedup.svg"
                  alt="Drawable Messedup"
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-1 sm:ml-2 md:ml-3 h-8 sm:h-12 md:h-16 lg:h-20 w-auto object-contain pointer-events-none select-none drop-shadow-sm transition-transform duration-300 hover:scale-110"
                />
              </div>

              {/* Line 2: [Isthisdoc Drawable Document Icon] Track Your Work Hours. */}
              <div className="relative inline-flex items-center justify-center text-center">
                {/* Drawable Document Sketch Icon beside first word 'Track' */}
                <motion.img
                  animate={{
                    y: [0, 6, 0],
                    rotate: [-12, -7, -12]
                  }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.3 }}
                  src="/images/Landing Page Icons/Isthisdoc.svg"
                  alt="Drawable Document"
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-1 sm:mr-2 md:mr-3 h-8 sm:h-12 md:h-16 lg:h-20 w-auto object-contain -rotate-12 pointer-events-none select-none drop-shadow-sm transition-transform duration-300 hover:-rotate-18 hover:scale-110"
                />

                <span ref={underlineRef} className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#111827] via-[#374151] to-[#6B7280] pb-1.5 sm:pb-2.5 z-10">
                  Track Your Work Hours.

                  {/* Artistic Upward-Arched Brush Underline (Sequential 2-Pass Organic Wavy Calligraphy Brush - Repeating on Scroll) */}
                  <svg
                    className="absolute -bottom-3 sm:-bottom-4 md:-bottom-5 left-1/2 -translate-x-1/2 w-[102%] sm:w-[104%] h-7 sm:h-9 md:h-11 pointer-events-none overflow-visible select-none"
                    viewBox="0 0 400 32"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    {/* PASS 1 (LEFT → RIGHT): Organic wavy painterly brush stroke */}
                    <motion.path
                      d="M 5 20 C 48 23, 98 18.5, 148 12.5 C 198 6.5, 258 7.5, 318 12.5 C 348 15, 375 18, 396 16"
                      stroke="#EF4444"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isUnderlineInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{
                        pathLength: { duration: 0.8, delay: isUnderlineInView ? 0.1 : 0, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.01, delay: isUnderlineInView ? 0.09 : 0 }
                      }}
                    />

                    {/* Pass 1 Upper Wave Sheen (Left → Right) */}
                    <motion.path
                      d="M 12 17 C 52 20, 102 15.5, 152 9.5 C 202 3.5, 262 4.5, 322 9.5 C 350 12, 375 14.5, 390 13"
                      stroke="#FCA5A5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isUnderlineInView ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
                      transition={{
                        pathLength: { duration: 0.8, delay: isUnderlineInView ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.01, delay: isUnderlineInView ? 0.14 : 0 }
                      }}
                    />

                    {/* PASS 2 (RIGHT → LEFT): Organic wavy return brush stroke sweeping back across */}
                    <motion.path
                      d="M 396 19 C 355 23.5, 295 18, 235 12.5 C 175 7, 115 9.5, 65 16 C 38 19.5, 18 21, 5 21"
                      stroke="#DC2626"
                      strokeWidth="9.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isUnderlineInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{
                        pathLength: { duration: 0.8, delay: isUnderlineInView ? 1.05 : 0, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.01, delay: isUnderlineInView ? 1.04 : 0 }
                      }}
                    />

                    {/* Pass 2 Lower Wave Accent (Right → Left) */}
                    <motion.path
                      d="M 380 22 C 340 26, 285 19.5, 225 14.5 C 165 9.5, 105 11.5, 55 18 C 30 21, 15 22, 8 22"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isUnderlineInView ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
                      transition={{
                        pathLength: { duration: 0.8, delay: isUnderlineInView ? 1.1 : 0, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.01, delay: isUnderlineInView ? 1.09 : 0 }
                      }}
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
              className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed font-medium text-center"
            >
              Submit practicum requirements online, log daily time in and out, and clear your OJT milestones with instant adviser and supervisor approvals.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto mx-auto"
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

        {/* Moving Infinite Requirement & Feature Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-5xl mx-auto pt-6 sm:pt-8 pb-2 relative overflow-hidden shrink-0 z-20"
        >
          {/* Left and Right Fade Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-20 pointer-events-none" />

          {/* Moving Track */}
          <div className="flex overflow-hidden select-none group/marquee">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ ease: 'linear', duration: 95, repeat: Infinity }}
              className="flex gap-3.5 flex-nowrap shrink-0 py-2 group-hover/marquee:[animation-play-state:paused]"
            >
              {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-zinc-300 transition-all cursor-default shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center p-0.5">
                    <img src={item.icon} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#111827] whitespace-nowrap">{item.title}</span>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                      item.color === 'emerald'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.color === 'amber'
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════ SECTION: REQUIREMENT CLEARANCE ═══════════════════ */}
      <section id="project-management" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-white text-[#111827] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E5E7EB] scroll-mt-24">
        
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
              
              {/* Headline with RoughHighlight on Clearance */}
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-[1.12] transform-gpu will-change-transform"
              >
                Requirement <br className="hidden sm:block" />
                <RoughHighlight color="#FEF08A">
                  Clearance
                </RoughHighlight>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm sm:text-base text-[#4B5563] max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal transform-gpu will-change-transform"
              >
                From pre-internship forms to final milestone reports, complete and submit all your official paperwork seamlessly. Fill out live templates, attach verified proof, and get approved by your advisers without the paper clutter.
              </motion.p>

              {/* Sky Blue CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center lg:justify-start pt-1 transform-gpu will-change-transform"
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
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex items-center justify-center lg:justify-end transform-gpu will-change-transform"
            >
              <div className="relative w-full max-w-[460px] lg:max-w-[500px] flex items-center justify-center">
                <motion.img
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  src="/images/Landing Page Icons/Project Management Collaboration.svg"
                  alt="Student Passing Documents and Practicum Requirement Clearance"
                  className="w-full h-auto max-h-[340px] sm:max-h-[400px] object-contain drop-shadow-lg transform-gpu"
                />
              </div>
            </motion.div>

          </div>
        </div>

      </section>

      {/* ═══════════════════ SECTION: DOCUMENT VERIFICATION ═══════════════════ */}
      <section id="work-together" className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-white text-[#111827] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#E5E7EB] scroll-mt-24">
        <div className="max-w-6xl mx-auto w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Collaborative Circular Orbit Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 flex items-center justify-center"
            >
              <div className="relative w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[480px] aspect-square flex items-center justify-center select-none">
                
                {/* Concentric Dashed Orbit Rings */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
                  <ellipse cx="250" cy="250" rx="140" ry="140" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.65" />
                  <ellipse cx="250" cy="250" rx="220" ry="220" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.45" />
                </svg>

                {/* Center Document Card with Plus Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="relative z-20 flex items-center justify-center filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white border border-zinc-200/90 shadow-xl p-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="w-8 h-2 bg-blue-500/80 rounded-full" />
                      <div className="w-14 h-1.5 bg-zinc-200 rounded-full" />
                      <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
                      <div className="w-10 h-1.5 bg-zinc-200 rounded-full" />
                    </div>
                    <div className="flex justify-end">
                      <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-md -mr-1.5 -mb-1.5">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Orbit Avatar Nodes with Dynamic Floating and Hover physics */}
                {/* 1. Top-Left (Outer Orbit - Female Avatar on yellow bg) */}
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="absolute top-[8%] left-[18%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#FBBF24] flex items-center justify-center p-0.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_female-avatar_7t6k.svg"
                    alt="Female Trainee"
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </motion.div>

                {/* 2. Top-Center (Inner Orbit - Reading on green bg) */}
                <motion.div
                  animate={{ y: [0, 5, 0], scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.2 }}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  className="absolute top-[16%] left-[45%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#10B981] flex items-center justify-center p-1.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_reading_c1xl.svg"
                    alt="Reading / Journal Writing"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </motion.div>

                {/* 3. Top-Right (Outer Orbit - Male Avatar on blue bg) */}
                <motion.div
                  animate={{ y: [0, -7, 0], scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.4 }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="absolute top-[10%] right-[18%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_male-avatar_zkzx.svg"
                    alt="Male Trainee"
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </motion.div>

                {/* 4. Middle-Left (Outer Orbit - Coding on red bg) */}
                <motion.div
                  animate={{ y: [0, 6, 0], scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 4.0, ease: "easeInOut", delay: 0.1 }}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  className="absolute top-[44%] left-[2%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#EF4444] flex items-center justify-center p-1.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_coding_joxb.svg"
                    alt="Coding & Development"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </motion.div>

                {/* 5. Middle-Left (Inner Orbit - Female Avatar on blue bg) */}
                <motion.div
                  animate={{ y: [0, -5, 0], scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut", delay: 0.5 }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="absolute top-[42%] left-[19%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_female-avatar_7t6k.svg"
                    alt="Female Student"
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </motion.div>

                {/* 6. Middle-Right (Inner Orbit - Group Collaboration on purple bg) */}
                <motion.div
                  animate={{ y: [0, 5, 0], scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 3.9, ease: "easeInOut", delay: 0.3 }}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  className="absolute top-[42%] right-[19%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#6366F1] flex items-center justify-center p-1 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_real-time-collaboration_bchs.svg"
                    alt="Group Collaboration"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </motion.div>

                {/* 7. Middle-Right (Outer Orbit - Reading on green bg) */}
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.6 }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="absolute top-[56%] right-[3%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#10B981] flex items-center justify-center p-1.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_reading_c1xl.svg"
                    alt="Reading & Studies"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </motion.div>

                {/* 8. Bottom-Center (Inner Orbit - Coding on orange bg) */}
                <motion.div
                  animate={{ y: [0, 5, 0], scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 3.7, ease: "easeInOut", delay: 0.25 }}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  className="absolute bottom-[16%] left-[45%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#F97316] flex items-center justify-center p-1.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_coding_joxb.svg"
                    alt="Coding Tasks"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </motion.div>

                {/* 9. Bottom-Left (Outer Orbit - Male Avatar on blue bg) */}
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 4.3, ease: "easeInOut", delay: 0.45 }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="absolute bottom-[8%] left-[20%] z-10 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg bg-[#3B82F6] flex items-center justify-center p-0.5 cursor-pointer"
                >
                  <img
                    src="/images/Landing Page Icons/undraw_male-avatar_zkzx.svg"
                    alt="Male Student"
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </motion.div>

              </div>
            </motion.div>

            {/* Right Content Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Headline with RoughHighlight on Verification */}
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-[1.12] transform-gpu will-change-transform"
              >
                Document{' '}
                <RoughHighlight color="#FEF08A">
                  Verification
                </RoughHighlight>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm sm:text-base text-[#4B5563] max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal transform-gpu will-change-transform"
              >
                Empower practicum advisers and company coordinators to inspect student submissions in real time. Review uploaded templates, provide targeted feedback remarks, and verify internship records with complete confidence.
              </motion.p>

              {/* Sky Blue CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center lg:justify-start pt-1 transform-gpu will-change-transform"
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

      {/* ═══════════════════ SECTION: OFFICIAL PRACTICUM TEMPLATES & DOWNLOAD ═══════════════════ */}
      <section id="features" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E5E7EB] overflow-hidden scroll-mt-24">
        {/* Background Brand Logo Watermark */}
        <div className="absolute -right-12 -bottom-16 w-80 h-80 sm:w-96 sm:h-96 lg:w-[440px] lg:h-[440px] opacity-[0.05] pointer-events-none select-none z-0">
          <img
            src="/images/Landing Page Icons/Logo.svg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -left-12 -top-12 w-64 h-64 sm:w-80 sm:h-80 opacity-[0.035] pointer-events-none select-none z-0">
          <img
            src="/images/Landing Page Icons/Logo.svg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* 2-Column Grid: Text & Download on Left, Blueprint Sample on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Descriptive Text & Features & Download Actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left transform-gpu will-change-transform"
            >
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight mb-3">
                  Sample Document Templates
                </h3>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed font-normal max-w-lg mx-auto lg:mx-0">
                  Explore standardized practicum document templates formatted for STI College interns. Built for seamless field deployment, adviser endorsement, and instant institutional compliance.
                </p>
              </div>

              {/* Download and Portal CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSimulatedDownload}
                  disabled={downloadState !== 'idle'}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer",
                    downloadState === 'downloaded'
                      ? "bg-emerald-600 scale-[1.02]"
                      : "bg-[#4F9CF9] hover:bg-[#3B8DEE] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {downloadState === 'downloading' && (
                    <>
                      <RotateCcw size={16} className="animate-spin" />
                      <span>Downloading Sample...</span>
                    </>
                  )}
                  {downloadState === 'downloaded' && (
                    <>
                      <CheckCircle2 size={16} className="text-white" />
                      <span>Sample Downloaded!</span>
                    </>
                  )}
                  {downloadState === 'idle' && (
                    <>
                      <Download size={16} />
                      <span>Download Sample</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login?role=student')}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-bold transition-all shadow-2xs hover:border-zinc-400 cursor-pointer"
                >
                  <span>Access Portal</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>

            {/* Right Column: Stylized Blueprint Template Sample with Hover Animation */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex justify-center transform-gpu will-change-transform"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md bg-white border border-zinc-200/90 rounded-2xl shadow-xl shadow-zinc-300/30 p-6 sm:p-7 relative overflow-hidden font-sans text-left transition-shadow hover:shadow-2xl"
              >
                {/* Top Document Header Bar (without preview badge) */}
                <div className="flex items-center pb-3.5 mb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-mono text-zinc-400 ml-1.5 font-medium">Application_Letter_Template.docx</span>
                  </div>
                </div>

                {/* Blueprint Template Schematic Content */}
                <div className="space-y-4 text-xs text-zinc-700 select-none">
                  {/* Date Tag */}
                  <div className="inline-block px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10.5px] border border-zinc-200">
                    &lt;DATE: CURRENT_DATE&gt;
                  </div>
                  
                  {/* Recipient Details Blueprint */}
                  <div className="space-y-1.5">
                    <div className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[11px] font-semibold border border-blue-200/80">
                      &lt;HOST_REPRESENTATIVE_NAME&gt;
                    </div>
                    <div className="h-2 bg-zinc-200/80 rounded-full w-2/3" />
                    <div className="h-2 bg-zinc-200/80 rounded-full w-1/2" />
                  </div>

                  {/* Salutation */}
                  <p className="font-semibold text-zinc-900 text-xs">
                    Dear Mr./Ms. <span className="text-blue-700 font-mono">&lt;REPRESENTATIVE&gt;</span>:
                  </p>

                  {/* Body Placeholder Blueprint */}
                  <div className="space-y-2.5 bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-100">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
                      <span>I, a student of STI</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">&lt;CAMPUS_NAME&gt;</span>
                      <span>undergo</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">&lt;300 HOURS&gt;</span>
                      <span>for</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[10px] font-bold border border-blue-200">&lt;PROGRAM_NAME&gt;</span>
                    </div>

                    {/* Placeholder Skeleton Bars with Subtle Shimmer */}
                    <div className="space-y-1.5 pt-1">
                      <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                        className="h-2 bg-zinc-200/80 rounded-full w-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.3 }}
                        className="h-2 bg-zinc-200/70 rounded-full w-4/5"
                      />
                      <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.6 }}
                        className="h-2 bg-zinc-200/60 rounded-full w-3/5"
                      />
                    </div>
                  </div>

                  {/* Signature Sign-Off Block */}
                  <div className="pt-1 text-zinc-800">
                    <p className="text-[11px] font-medium text-zinc-500">Respectfully yours,</p>
                    <div className="mt-3 pt-1.5 w-48 border-t-2 border-zinc-900">
                      <span className="inline-block px-2 py-0.5 rounded bg-zinc-900 text-white font-mono text-[10px] font-bold">
                        &lt;STUDENT_SIGNATURE_INK&gt;
                      </span>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">OJT Candidate Applicant</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════ THREE-PHASE OJT JOURNEY 3D CAROUSEL ═══════════════════ */}
      <section id="journey" className="relative py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] via-[#EFF6FF]/40 to-[#F8FAFC] border-b border-zinc-200 overflow-hidden flex flex-col justify-center scroll-mt-24">
        {/* Centered Horizon Stage Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[260px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.20),rgba(59,130,246,0.08)_50%,transparent_75%)] blur-2xl pointer-events-none -z-0" />

        <div className="max-w-4xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-2.5 sm:mb-3 transform-gpu will-change-transform"
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mb-0.5">
              Your Practicum Journey
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-600 max-w-lg mx-auto font-medium">
              Explore each milestone of your internship—from onboarding and shift tracking to final evaluation.
            </p>
          </motion.div>

          {/* 3-Box Carousel Viewport */}
          <div className="relative overflow-hidden w-full">
            <Carousel slides={slideData} />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ACCORDION SECTION ═══════════════════ */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E5E7EB] scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 text-center lg:text-left">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Questions?</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827] mb-3">
                Frequently Asked
              </h2>
              <p className="text-sm text-[#4B5563] font-medium mb-6">
                Everything you need to know about system access, DTR calculation, and document clearance.
              </p>
              <div className="hidden lg:block">
                <img
                  src={ICON('undraw_questions_52ic.svg')}
                  alt="FAQ Illustration"
                  className="w-full max-w-[240px] h-auto object-contain opacity-80"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden bg-[#F8F9FA] border-[#E5E7EB] hover:border-zinc-300 shadow-xs",
                      isOpen ? "border-zinc-400 bg-white shadow-sm" : ""
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
                          className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#E5E7EB] pt-3 font-medium bg-white"
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
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIAL / QUOTE SECTION ═══════════════════ */}
      <section className="text-gray-600 body-font bg-white border-b border-[#E5E7EB]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl px-4 py-8 sm:py-10 mx-auto transform-gpu will-change-transform"
        >
          <div className="w-full mx-auto text-center">
            <motion.svg
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className="inline-block w-6 h-6 text-gray-400 mb-3 cursor-pointer"
              viewBox="0 0 975.036 975.036"
            >
              <path d="M925.036 57.197h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.399 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l36 76c11.6 24.399 40.3 35.1 65.1 24.399 66.2-28.6 122.101-64.8 167.7-108.8 55.601-53.7 93.7-114.3 114.3-181.9 20.601-67.6 30.9-159.8 30.9-276.8v-239c0-27.599-22.401-50-50-50zM106.036 913.497c65.4-28.5 121-64.699 166.9-108.6 56.1-53.7 94.4-114.1 115-181.2 20.6-67.1 30.899-159.6 30.899-277.5v-239c0-27.6-22.399-50-50-50h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.4 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l35.9 75.8c11.601 24.399 40.501 35.2 65.301 24.399z" />
            </motion.svg>
            <p className="leading-relaxed text-sm sm:text-base text-zinc-700 font-medium max-w-2xl mx-auto">
              &ldquo;Our digital practicum platform streamlines every internship milestone—from orientation to final clearance. We empower students to develop real-world industry skills while ensuring effortless coordination between faculty advisers and partner companies.&rdquo;
            </p>
            <span className="inline-block h-0.5 w-8 rounded bg-[#4F9CF9] mt-4 mb-3"></span>
            <h2 className="text-gray-900 font-bold title-font tracking-wider text-xs sm:text-sm">PRACTICUM ADVISER</h2>
            <p className="text-gray-500 text-[11px] sm:text-xs font-medium">Practicum &amp; Industry Placement Coordinator</p>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════ FINAL CALL TO ACTION BANNER ═══════════════════ */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl p-8 sm:p-12 lg:p-14 text-center space-y-6 relative overflow-hidden bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 transform-gpu will-change-transform"
          >
            {/* Subtle Brand Logo Watermark */}
            <div className="absolute -bottom-16 -right-16 w-64 h-64 opacity-[0.04] pointer-events-none select-none -z-0">
              <img src={ICON('Logo.svg')} alt="" className="w-full h-full object-contain" />
            </div>

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 leading-tight">
                Ready to Integrate Your Practicum Online?
              </h2>

              <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-medium">
                Access your institutional portal to manage requirements, track daily time records, and complete your OJT clearance with zero paperwork friction.
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/login?role=student')}
                  className="px-8 py-3.5 bg-[#4F9CF9] hover:bg-[#3B8DEE] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Access Portal</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="py-10 sm:py-14 px-6 sm:px-10 lg:px-16 w-full border-t border-[#E5E7EB] bg-white text-[#111827]">
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 mb-12">
            {/* Brand Column (5 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-5 pr-0 lg:pr-8">
              <div
                onClick={scrollToTop}
                className="flex items-center gap-2.5 mb-4 cursor-pointer group"
              >
                <img
                  src={ICON('Logo.svg')}
                  alt="Practicum Logo"
                  className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 rotate-6"
                />
                <span className="font-extrabold text-base sm:text-lg text-[#111827]">
                  Practicum<span className="text-[#6B7280] ml-1">Portal</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed max-w-md font-medium">
                A comprehensive digital platform for managing practicum requirements, daily time records, and OJT milestones.
              </p>
            </div>

            {/* Platform Links (3 cols on lg) */}
            <div className="lg:col-span-3">
              <p className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4">Platform</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Student Portal', role: 'student' },
                  { label: 'Adviser Dashboard', role: 'adviser' },
                  { label: 'Supervisor View', role: 'supervisor' },
                  { label: 'Admin Panel', role: 'admin' }
                ].map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate(`/login?role=${item.role}`)}
                    className="block text-xs sm:text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents (2 cols on lg) */}
            <div className="lg:col-span-2">
              <p className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4">Documents</p>
              <div className="space-y-2.5">
                {['Application Letter', 'MOA Template', 'DTR Form', 'Integration Paper'].map((link, i) => (
                  <span key={i} className="block text-xs sm:text-[13px] text-[#6B7280] font-medium">{link}</span>
                ))}
              </div>
            </div>

            {/* Support (2 cols on lg) */}
            <div className="lg:col-span-2">
              <p className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4">Support</p>
              <div className="space-y-2.5">
                {['FAQ', 'Contact Admin', 'Report Issue'].map((link, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => link === 'FAQ' ? scrollToSection('faq') : navigate('/login')}
                    className="block text-xs sm:text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer font-medium"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-[13px] text-[#6B7280] font-medium">
              &copy; {new Date().getFullYear()} Practicum Portal. STI College — Academic Technology.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <ArrowUp size={14} />
              <span>Back to top</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
