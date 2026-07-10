import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Briefcase
} from 'lucide-react';

interface LandingPageProps {
  userRole?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ userRole }) => {
  const dashboardLink = userRole ? `/${userRole}` : '/login?role=student';
  const ctaText = userRole ? 'Go to Dashboard' : 'Access Portal';

  const features = [
    {
      title: 'Automated Tracking',
      description: 'Real-time DTR validation and hour computation. Say goodbye to manual counting.',
      icon: Clock,
      color: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
    },
    {
      title: 'Document Pipeline',
      description: 'Paperless MOA, Consent, and Resume verification with structured workflows.',
      icon: FileText,
      color: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
    },
    {
      title: 'Analytics Engine',
      description: 'Live deployment funnels and compliance auditing for faculty and admins.',
      icon: TrendingUp,
      color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 font-sans overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-20 z-50 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center font-black tracking-tighter shadow-sm">
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Practicum Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {!userRole && (
              <Link to="/login?role=faculty" className="text-sm font-semibold hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors hidden sm:block">
                Faculty Access
              </Link>
            )}
            <Link
              to={dashboardLink}
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-xl"
            >
              <span>{ctaText}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200 via-zinc-50 to-zinc-50 dark:from-zinc-800/20 dark:via-zinc-950 dark:to-zinc-950" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-6">
              <ShieldCheck size={14} />
              Official Practicum Portal
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-zinc-900 dark:text-white">
              Practicum Management<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                System.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            The official, unified platform for tracking OJT hours, automating document verification, and managing deployment for practicum students.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to={dashboardLink}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {userRole ? 'Continue to Dashboard' : 'Student Portal Login'}
              <ChevronRight size={18} />
            </Link>
            {!userRole && (
              <Link
                to="/login?role=faculty"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-zinc-900 dark:text-white text-sm font-bold rounded-full border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all flex items-center justify-center"
              >
                Faculty & Admin Access
              </Link>
            )}
          </motion.div>
        </div>

        {/* Floating Mockup Abstract */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="max-w-5xl mx-auto mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent z-10" />
          <div className="rounded-2xl md:rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl overflow-hidden aspect-video flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-0 grid grid-cols-3 gap-4 w-full max-w-3xl opacity-50 dark:opacity-30">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-64 col-span-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
            {/* Overlay central logo */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-24 h-24 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500 cursor-default">
                <Briefcase size={48} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 px-6 bg-white dark:bg-zinc-950 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Engineered for Enterprise Scale.</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Everything you need to manage the practicum lifecycle, wrapped in a deterministic, audit-ready interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-24 px-6 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Trusted by Leading Departments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 dark:divide-zinc-200">
            <div className="pt-8 sm:pt-0 flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter mb-2">180+</span>
              <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Deployments</span>
            </div>
            <div className="pt-8 sm:pt-0 flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter mb-2">460</span>
              <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Hours Tracked / Student</span>
            </div>
            <div className="pt-8 sm:pt-0 flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter mb-2">0</span>
              <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Paper Waste</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-zinc-400" />
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white">Practicum Portal</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © 2026 Practicum Management System. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm font-medium text-zinc-400">
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};


