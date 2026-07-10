import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GraduationCap, User, Lock, LogIn, ShieldCheck, ArrowLeft, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Role } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: Role, username: string) => void;
}

type LoginStep = 'credentials' | 'otp';

// Simulated OTP for the demo
const DEMO_OTP = '123456';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  
  let authTitle = 'Authentication';
  if (roleParam === 'student') authTitle = 'Student Authentication';
  else if (roleParam === 'faculty') authTitle = 'Faculty & Admin Authentication';

  // ── Credentials state ──
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [credError, setCredError] = useState('');

  // ── OTP state ──
  const [step, setStep] = useState<LoginStep>('credentials');
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [pendingUsername, setPendingUsername] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Resend cooldown timer ──
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Focus first OTP input when entering OTP step ──
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 350);
    }
  }, [step]);

  // ── Derive masked email for display ──
  const maskedEmail = pendingUsername
    ? `${pendingUsername.slice(0, 2)}${'•'.repeat(Math.max(pendingUsername.length - 2, 3))}@practicum.edu`
    : '';

  // ── Credentials submission ──
  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    const lowerUsername = username.toLowerCase().trim();

    if (isSignUp) {
      setPendingRole('student');
      setPendingUsername('student');
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN);
      return;
    }

    let matchedRole: Role | null = null;
    if (lowerUsername === 'admin' && password === '123') matchedRole = 'admin';
    else if (lowerUsername === 'adviser' && password === '123') matchedRole = 'adviser';
    else if (lowerUsername === 'student' && password === '123') matchedRole = 'student';

    if (matchedRole) {
      setPendingRole(matchedRole);
      setPendingUsername(lowerUsername);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN);
    } else {
      setCredError('Invalid credentials. Use: admin/123, adviser/123, or student/123');
    }
  };

  // ── OTP input handling ──
  const handleOtpChange = useCallback((index: number, value: string) => {
    // Allow only digits
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized && !value) {
      // backspace on empty: clear current and move back
      const newVals = [...otpValues];
      newVals[index] = '';
      setOtpValues(newVals);
      if (index > 0) otpRefs.current[index - 1]?.focus();
      return;
    }

    const chars = sanitized.split('');
    const newVals = [...otpValues];

    // Support paste: fill from current index forward
    chars.forEach((char, i) => {
      if (index + i < OTP_LENGTH) {
        newVals[index + i] = char;
      }
    });
    setOtpValues(newVals);
    setOtpError('');

    // Auto-advance to next empty input
    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  }, [otpValues]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const newVals = [...otpValues];
      newVals[index - 1] = '';
      setOtpValues(newVals);
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newVals = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => { newVals[i] = char; });
    setOtpValues(newVals);
    setOtpError('');
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── OTP verification ──
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpValues.join('');

    if (enteredOtp.length < OTP_LENGTH) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    if (enteredOtp !== DEMO_OTP) {
      setOtpError('Invalid verification code. Try: 123456');
      setOtpValues(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      return;
    }

    // Success
    setOtpSuccess(true);
    toast.success('Successfully authenticated');
    setTimeout(() => {
      if (pendingRole && pendingUsername) {
        onLogin(pendingRole, pendingUsername);
      }
    }, 1200);
  };

  // ── Resend OTP ──
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setOtpValues(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setResendCooldown(RESEND_COOLDOWN);
    otpRefs.current[0]?.focus();
  };

  // ── Back to credentials ──
  const handleBackToLogin = () => {
    setStep('credentials');
    setOtpValues(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setOtpSuccess(false);
    setPendingRole(null);
    setPendingUsername('');
  };

  // ── Shared animation variants ──
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  const direction = step === 'otp' ? 1 : -1;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">



      {/* ── Card Container ── */}
      <Card
        className="w-full max-w-[420px] border border-zinc-200/80 dark:border-zinc-800/80 p-0 bg-white dark:bg-zinc-950 rounded-xl shadow-sm relative overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ════════════════════════════════════════════════
                 STEP 1 — Credentials
                ════════════════════════════════════════════════ */}
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex mb-5 text-zinc-900 dark:text-zinc-100">
                    <GraduationCap size={44} strokeWidth={1.5} />
                  </div>
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-2">
                    {authTitle}
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    {isSignUp ? 'Create your account to continue' : 'Sign in to access your portal'}
                  </p>
                </div>

                <form onSubmit={handleCredentialSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide block px-1">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                        <User size={18} strokeWidth={1.5} />
                      </div>
                      <Input
                        placeholder="Enter your email"
                        className="pl-12 py-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus:ring-4 focus:ring-zinc-950/10 focus:border-zinc-950 dark:focus:border-zinc-200 transition-all text-sm h-12 shadow-xs"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setCredError(''); }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <label className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide block">
                        Password
                      </label>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
                        <Lock size={18} strokeWidth={1.5} />
                      </div>
                      <Input
                        type="password"
                        placeholder={isSignUp ? "Create a password" : "Enter your password"}
                        className="pl-12 py-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus:ring-4 focus:ring-zinc-950/10 focus:border-zinc-950 dark:focus:border-zinc-200 transition-all text-sm h-12 shadow-xs"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setCredError(''); }}
                        required
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {credError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700"
                      >
                        <AlertCircle size={14} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{credError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.4)] transition-all flex items-center justify-center gap-2 group"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'} <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-center">
                  <Link
                    to="/forgot-password"
                    className="group flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors uppercase tracking-widest"
                  >
                    <Lock size={12} className="group-hover:-rotate-12 transition-transform" />
                    <span>Forgot Password?</span>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                 STEP 2 — OTP Verification
                ════════════════════════════════════════════════ */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Back button */}
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back to login
                </button>

                <div className="text-center mb-8">
                  <div className={`inline-flex mb-5 transition-colors duration-500 ${
                    otpSuccess ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    <motion.div
                      animate={otpSuccess ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <ShieldCheck size={44} strokeWidth={1.5} />
                    </motion.div>
                  </div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-2">
                    {otpSuccess ? 'Verified!' : 'Verify Your Identity'}
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                    {otpSuccess
                      ? 'Redirecting to your dashboard…'
                      : <>We sent a 6-digit code to<br /><span className="text-zinc-700 dark:text-zinc-300 font-semibold">{maskedEmail}</span></>
                    }
                  </p>
                </div>

                {!otpSuccess && (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                      {otpValues.map((val, idx) => (
                        <motion.input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onFocus={(e) => e.target.select()}
                          className={`
                            w-11 h-13 text-center text-lg font-bold rounded-lg border-2 
                            bg-white dark:bg-zinc-950
                            outline-none transition-all duration-200
                            ${val
                              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                            }
                            focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-4 focus:ring-zinc-950/10 dark:focus:ring-zinc-100/10
                            ${otpError ? 'border-zinc-400 dark:border-zinc-500 animate-shake' : ''}
                          `}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.2 }}
                        />
                      ))}
                    </div>

                    {/* OTP Error */}
                    <AnimatePresence>
                      {otpError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700"
                        >
                          <AlertCircle size={14} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{otpError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.4)] transition-all flex items-center justify-center gap-2 group"
                    >
                      Verify Code <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
                    </Button>

                    {/* Resend */}
                    <div className="text-center pt-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Didn't receive the code?{' '}
                        {resendCooldown > 0 ? (
                          <span className="text-zinc-400 dark:text-zinc-500 font-semibold tabular-nums">
                            Resend in {resendCooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <RotateCcw size={10} /> Resend
                          </button>
                        )}
                      </p>
                    </div>
                  </form>
                )}

                {/* Success state */}
                {otpSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full"
                    />
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Authenticating…
                    </p>
                  </motion.div>
                )}

                {/* Demo hint */}
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
                    Demo OTP: <span className="font-bold text-zinc-600 dark:text-zinc-400 tracking-[0.2em]">1 2 3 4 5 6</span>
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </Card>

      <div className="mt-8 text-center space-y-2">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
          © 2026 Web-Based Practicum System. All Rights Reserved.
        </p>
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Secure Academic Portal
        </p>
      </div>
    </div>
  );
};
