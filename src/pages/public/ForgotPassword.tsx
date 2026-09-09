import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/src/components/auth/OtpInput';

type ResetStep = 'email' | 'otp' | 'new_password' | 'success';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // 60 seconds

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  console.warn('[Password Reset API] Non-JSON API response received:', text);
  return { error: `Server error (${res.status}). Please check your connection.` };
}

export const ForgotPassword = () => {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── OTP State ──
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // ── New Password State ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  // ── Resend cooldown timer ──
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Lockout countdown ──
  useEffect(() => {
    if (lockCountdown <= 0) {
      if (isLocked) setIsLocked(false);
      return;
    }
    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown, isLocked]);

  // ── Step 1: Submit Email for OTP ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = email.toLowerCase().trim();
    if (!normalized) {
      setError('Please enter your email or username.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          purpose: 'password_reset',
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockCountdown(data.remainingSeconds || 300);
        }
        throw new Error(data.error || 'Failed to send verification code.');
      }

      toast.success(`Verification code sent to ${normalized}`);
      setResendCooldown(RESEND_COOLDOWN);
      setStep('otp');
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLocked) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          purpose: 'password_reset',
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockCountdown(data.remainingSeconds || 300);
        }
        throw new Error(data.error || 'Failed to resend code.');
      }

      toast.success('New 6-digit verification code sent.');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const enteredOtp = otpValues.join('').trim();
    if (enteredOtp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: enteredOtp,
          purpose: 'password_reset',
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockCountdown(data.remainingSeconds || 300);
        }
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data.error || 'Invalid verification code.');
      }

      toast.success('Code verified successfully.');
      setVerificationToken(data.verificationToken);
      setStep('new_password');
    } catch (err: any) {
      setError(err.message);
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Set New Password ──
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          newPassword,
          verificationToken,
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      toast.success('Password reset successfully!');
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedEmail = email
    ? `${email.slice(0, 3)}•••••@${email.split('@')[1] || 'marikina.sti.edu.ph'}`
    : '';

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] flex flex-col justify-between font-sans selection:bg-[#0067b8] selection:text-white">
      {/* ════════════════════════════════════════════════
           TOP BRANDING & HEADER
          ════════════════════════════════════════════════ */}
      <div className="w-full px-6 sm:px-12 md:px-20 lg:px-28 pt-8 md:pt-10">
        <Link to="/login" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <div className="grid grid-cols-2 gap-[2.5px] w-[22px] h-[22px] shrink-0">
            <div className="bg-[#f25022] w-full h-full" />
            <div className="bg-[#7fba00] w-full h-full" />
            <div className="bg-[#00a4ef] w-full h-full" />
            <div className="bg-[#ffb900] w-full h-full" />
          </div>
          <span className="text-[#262626] dark:text-[#e6e6e6] text-[18px] md:text-[20px] font-semibold tracking-tight">
            Microsoft
          </span>
        </Link>
      </div>

      {/* ════════════════════════════════════════════════
           MAIN MICROSOFT SSPR CONTENT AREA
          ════════════════════════════════════════════════ */}
      <main className="w-full flex-1 px-6 sm:px-12 md:px-20 lg:px-28 pt-8 md:pt-12 pb-16">
        <div className="max-w-3xl">
          {/* Main Title: Segoe UI Light */}
          <h1 className="text-[30px] sm:text-[34px] md:text-[38px] font-light text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight leading-tight mb-2">
            Get back into your account
          </h1>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Who are you? (Enter Email/Username) ── */}
            {step === 'email' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="pt-1"
              >
                <h2 className="text-[19px] sm:text-[21px] font-normal text-[#262626] dark:text-[#dedede] mb-2.5">
                  Who are you?
                </h2>
                <p className="text-[13.5px] text-[#404040] dark:text-[#b5b5b5] mb-5 font-normal leading-relaxed">
                  To recover your account, begin by entering your email or username.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="emailOrUser"
                      className="block text-[13px] text-[#262626] dark:text-[#d1d1d1] font-normal mb-1.5"
                    >
                      Email or Username: <span className="text-[#e81123] font-medium">*</span>
                    </label>
                    <input
                      id="emailOrUser"
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full max-w-[380px] text-[14px] px-2.5 py-1.5 border border-[#606060] dark:border-[#767676] bg-white dark:bg-[#202020] text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] rounded-none transition-colors"
                      disabled={isSubmitting}
                      required
                      autoFocus
                    />
                    <p className="text-[11.5px] text-[#555555] dark:text-[#999999] mt-1.5 font-normal">
                      Example: user@contoso.onmicrosoft.com or user@contoso.com
                    </p>
                  </div>

                  {error && (
                    <div className="text-[#e81123] text-[13px] flex items-center gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions: Next button + Inline Cancel link */}
                  <div className="flex items-center gap-4 pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[14px] font-normal px-6 py-1.5 min-w-[88px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      {isSubmitting ? 'Checking…' : 'Next'}
                    </button>
                    <Link
                      to="/login"
                      className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 2: Verification step 1 of 2 (Enter OTP) ── */}
            {step === 'otp' && (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="pt-1"
              >
                <h2 className="text-[19px] sm:text-[21px] font-normal text-[#262626] dark:text-[#dedede] mb-2.5">
                  Verification step 1 of 2
                </h2>
                <p className="text-[13.5px] text-[#404040] dark:text-[#b5b5b5] mb-5 font-normal leading-relaxed">
                  We've sent a 6-digit verification code to <strong className="font-semibold text-[#1b1b1b] dark:text-white">{maskedEmail}</strong>. Enter the code below to verify your identity.
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-[380px]">
                  <div>
                    <label className="block text-[13px] text-[#262626] dark:text-[#d1d1d1] font-normal mb-2">
                      Verification code: <span className="text-[#e81123] font-medium">*</span>
                    </label>
                    <OtpInput
                      value={otpValues}
                      onChange={(newVals) => {
                        setOtpValues(newVals);
                        setError('');
                      }}
                      hasError={!!error}
                      disabled={isSubmitting || isLocked}
                    />
                  </div>

                  {error && (
                    <div className="text-[#e81123] text-[13px] flex items-center gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {isLocked && (
                    <div className="p-3 bg-[#fff4ce] dark:bg-[#3d3300] text-[#7a6400] dark:text-[#ffe26e] text-[12px] rounded-[2px]">
                      ⏱️ Account locked for 5 minutes. Try again in {lockCountdown}s.
                    </div>
                  )}

                  <div className="text-[12.5px] text-[#555555] dark:text-[#aaaaaa] pt-1">
                    Didn't receive the code?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-[#777777] dark:text-[#999999] tabular-nums font-medium">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLocked}
                        className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer"
                      >
                        Resend code
                      </button>
                    )}
                  </div>

                  {/* Actions: Next button + Inline Cancel link */}
                  <div className="flex items-center gap-4 pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || isLocked}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[14px] font-normal px-6 py-1.5 min-w-[88px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      {isSubmitting ? 'Verifying…' : 'Next'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError('');
                      }}
                      className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: Choose a new password ── */}
            {step === 'new_password' && (
              <motion.div
                key="step-new-password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="pt-1"
              >
                <h2 className="text-[19px] sm:text-[21px] font-normal text-[#262626] dark:text-[#dedede] mb-2.5">
                  Choose a new password
                </h2>
                <p className="text-[13.5px] text-[#404040] dark:text-[#b5b5b5] mb-5 font-normal leading-relaxed">
                  Enter and confirm your new password for <strong className="font-semibold text-[#1b1b1b] dark:text-white">{email}</strong>.
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-[380px]">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-[13px] text-[#262626] dark:text-[#d1d1d1] font-normal mb-1.5"
                    >
                      Enter new password: <span className="text-[#e81123] font-medium">*</span>
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full text-[14px] px-2.5 py-1.5 border border-[#606060] dark:border-[#767676] bg-white dark:bg-[#202020] text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] rounded-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[13px] text-[#262626] dark:text-[#d1d1d1] font-normal mb-1.5"
                    >
                      Confirm new password: <span className="text-[#e81123] font-medium">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full text-[14px] px-2.5 py-1.5 border border-[#606060] dark:border-[#767676] bg-white dark:bg-[#202020] text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] rounded-none transition-colors"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-[#e81123] text-[13px] flex items-center gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions: Finish button + Inline Cancel link */}
                  <div className="flex items-center gap-4 pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[14px] font-normal px-6 py-1.5 min-w-[88px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      {isSubmitting ? 'Updating…' : 'Finish'}
                    </button>
                    <Link
                      to="/login"
                      className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 4: Success Screen ── */}
            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="pt-1 max-w-lg"
              >
                <div className="flex items-center gap-2.5 text-[#107c41] dark:text-[#28a745] mb-2.5">
                  <CheckCircle2 size={26} className="shrink-0" />
                  <h2 className="text-[20px] font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight">
                    Your password has been reset
                  </h2>
                </div>
                <p className="text-[13.5px] text-[#404040] dark:text-[#b5b5b5] mb-6 leading-relaxed">
                  Your password has been updated successfully. To sign in with your new password, click the link below.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="bg-[#0067b8] hover:bg-[#005da6] text-white text-[14px] font-normal px-6 py-1.5 min-w-[100px] rounded-[2px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Click here to sign in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ════════════════════════════════════════════════
           AUTHENTIC MICROSOFT ENTERPRISE SSPR FOOTER
          ════════════════════════════════════════════════ */}
      <footer className="w-full bg-[#f2f2f2] dark:bg-[#1f1f1f] border-t border-[#e5e5e5] dark:border-[#2d2d2d] px-6 sm:px-12 md:px-20 lg:px-28 py-2.5 flex items-center justify-between text-[11.5px] text-[#555555] dark:text-[#aaaaaa]">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-[1.5px] w-[13px] h-[13px] shrink-0">
            <div className="bg-[#f25022] w-full h-full" />
            <div className="bg-[#7fba00] w-full h-full" />
            <div className="bg-[#00a4ef] w-full h-full" />
            <div className="bg-[#ffb900] w-full h-full" />
          </div>
          <span>©2026 Microsoft Corporation</span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              toast.info('Support code: SSPR-STI-2026-OK', { duration: 4000 });
            }}
            className="hover:underline cursor-pointer text-[#555555] dark:text-[#aaaaaa] hover:text-[#1b1b1b] dark:hover:text-white transition-colors"
          >
            Support code
          </button>
        </div>
      </footer>
    </div>
  );
};
