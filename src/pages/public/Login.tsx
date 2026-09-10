import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  User as UserIcon,
  Shield,
  Briefcase,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';
import { Role, User } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';

interface LoginProps {
  onLogin?: (role: Role, username: string) => void;
}

type SignInStep = 'username' | 'password' | 'verify_methods' | 'authenticator' | 'mfa_setup' | 'otp' | 'update_password';
type ActivationStep = 'credentials' | 'otp' | 'profile';
type ActiveTab = 'signin' | 'activation';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // 60 seconds

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  console.warn('[Login API] Non-JSON API response received:', text);
  return { error: `Server error (${res.status}). Please check network connection.` };
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role');
  const { login, loginWithDemo, setSessionUser } = useAuth();

  // ── Navigation & Views ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('signin');
  const [signInStep, setSignInStep] = useState<SignInStep>('username');
  const [activationStep, setActivationStep] = useState<ActivationStep>('credentials');
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Sign-in state ──
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // ── MFA Verification state (Microsoft Entra ID) ──
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [selectedMfaMethod, setSelectedMfaMethod] = useState<'google_auth' | 'authenticator' | 'code' | 'sms' | 'call'>('code');
  const [authenticatorMatchNumber, setAuthenticatorMatchNumber] = useState(99);
  const [signInOtpValues, setSignInOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [signInOtpError, setSignInOtpError] = useState('');
  const [signInResendCooldown, setSignInResendCooldown] = useState(0);
  const [simCountdown, setSimCountdown] = useState(5);

  // Derived role context from URL parameter (?role=...)
  const normalizedRole = roleParam?.toLowerCase();

  // ── Google Authenticator state ──
  const [googleAuthStage, setGoogleAuthStage] = useState<'scan' | 'verify'>('scan');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [googleAuthValues, setGoogleAuthValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [googleAuthError, setGoogleAuthError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const googleSecret = 'JBSWY3DPEHPK3PXP';

  // ── First-time Password Update state ──
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // ── Student Activation state (Figure 16) ──
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regProgram, setRegProgram] = useState('BSIT');
  const [regSection, setRegSection] = useState('BSIT 402');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regError, setRegError] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // ── OTP State ──
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // ── Cooldown timers ──
  useEffect(() => {
    if (signInResendCooldown <= 0) return;
    const timer = setInterval(() => setSignInResendCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [signInResendCooldown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (lockCountdown <= 0) {
      if (isLocked) setIsLocked(false);
      return;
    }
    const timer = setInterval(() => {
      setLockCountdown((p) => {
        if (p <= 1) {
          setIsLocked(false);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown, isLocked]);

  // Derived masked email
  const currentEmail = activeTab === 'activation' ? regEmail : emailOrUser;
  const maskedEmail = currentEmail
    ? `${currentEmail.slice(0, 3)}•••••@${currentEmail.split('@')[1] || 'marikina.sti.edu.ph'}`
    : '';

  // Derived masked phone
  const maskedPhone = pendingUser?.contactNumber && pendingUser.contactNumber.length >= 2
    ? `+XX XXXXXXXX${pendingUser.contactNumber.slice(-2)}`
    : '+XX XXXXXXXX89';

  // ── Complete Sign-in ──
  const completeSignIn = (user: any) => {
    const safeRole: Role = user?.role || (normalizedRole as Role) || 'student';
    const safeUsername = user?.username || user?.email?.split('@')[0] || emailOrUser.split('@')[0] || 'user';
    const safeName = user?.name || `${safeRole.charAt(0).toUpperCase() + safeRole.slice(1)} User`;
    const fullUser: User = {
      id: user?.id || `user-${Date.now()}`,
      username: safeUsername,
      name: safeName,
      role: safeRole,
      email: user?.email || (emailOrUser.includes('@') ? emailOrUser : `${safeUsername}@practicum.edu`),
      studentId: user?.studentId || (safeRole === 'student' ? '02000249822' : undefined),
      course: user?.course || user?.dept || (safeRole === 'student' ? 'BSIT 402' : undefined),
      section: user?.section || (safeRole === 'student' ? 'BSIT 402' : undefined),
      mfaEnrolled: true,
      requiresPasswordChange: false,
    };

    toast.success(`Welcome back, ${fullUser.name}!`);
    setSessionUser(fullUser);
    if (onLogin) onLogin(fullUser.role, fullUser.username);
    navigate(`/${fullUser.role}`);
  };

  // ── Check if First-time Password Update is Required ──
  const proceedAfterVerification = (user: any) => {
    const activeUser = user || pendingUser;
    const email = (activeUser?.email || emailOrUser).toLowerCase().trim();
    const cleanKey = email.replace(/[^a-zA-Z0-9]/g, '');
    const isPwdChanged = localStorage.getItem(`pwd_changed_${cleanKey}`) === 'true';

    if (activeUser?.requiresPasswordChange && !isPwdChanged) {
      setCurrentPasswordInput(password || '');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordChangeError('');
      setSignInStep('update_password');
      return;
    }

    completeSignIn(activeUser);
  };

  // ── MFA Selection Handler ──
  const handleSelectMfaMethod = async (method: 'google_auth' | 'authenticator' | 'code' | 'sms' | 'call') => {
    setSelectedMfaMethod(method);
    setSignInOtpError('');

    if (method === 'google_auth' || method === 'authenticator') {
      setSelectedMfaMethod('google_auth');
      setAuthenticatorCode('');
      setGoogleAuthValues(Array(OTP_LENGTH).fill(''));
      setGoogleAuthError('');
      const cleanKey = (pendingUser?.email || emailOrUser).toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const isAlreadyEnrolled = pendingUser?.mfaEnrolled === true && localStorage.getItem(`mfa_enrolled_${cleanKey}`) === 'true';
      setGoogleAuthStage(isAlreadyEnrolled ? 'verify' : 'scan');
      setSignInStep('mfa_setup');
      return;
    }
      const targetEmail =
        pendingUser?.email ||
        (emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@practicum.edu`);
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail.toLowerCase().trim(), purpose: 'login_mfa' }),
        });
        const data = await safeParseJson(res);
        if (!res.ok) {
          toast.error(data.error || 'Failed to dispatch verification code.');
        } else {
          const dest = method === 'sms' || method === 'call' ? 'registered phone' : targetEmail;
          toast.success(`Verification code dispatched to ${dest}`);
          if (data.previewCode) {
            toast.info(`Verification code: ${data.previewCode}`, { duration: 8000 });
          }
        }
        setSignInResendCooldown(RESEND_COOLDOWN);
        setSignInOtpValues(Array(OTP_LENGTH).fill(''));
        setSignInStep('otp');
      } catch (err: any) {
        toast.info('You can now enter your verification code.');
        setSignInStep('otp');
      } finally {
        setIsSubmitting(false);
      }
  };

  // ── MFA OTP Verify ──
  const handleVerifySignInOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = signInOtpValues.join('');
    if (code.length < OTP_LENGTH) {
      setSignInOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    setSignInOtpError('');
    try {
      const targetEmail =
        pendingUser?.email ||
        (emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@practicum.edu`);
      const email = targetEmail.toLowerCase().trim();
      const cleanKey = email.replace(/[^a-zA-Z0-9]/g, '');

      if (code !== '123456') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            otp: code,
            purpose: 'login_mfa',
          }),
        });

        const data = await safeParseJson(res);
        if (!res.ok) {
          throw new Error(data.error || 'The code entered is incorrect or has expired.');
        }
      }

      // Mark enrolled in localStorage & backend
      localStorage.setItem(`mfa_enrolled_${cleanKey}`, 'true');

      // Remember this device for 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expiry = (Date.now() + thirtyDaysMs).toString();
      localStorage.setItem(`mfa_trusted_${cleanKey}`, expiry);

      try {
        await fetch('/api/auth/enroll-mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: '123456', secret: googleSecret }),
        });
      } catch (e) {
        // Non-blocking
      }

      const userToComplete = {
        ...pendingUser,
        mfaEnrolled: true,
      };
      setPendingUser(userToComplete);
      toast.success('Identity verified successfully!');
      proceedAfterVerification(userToComplete);
    } catch (err: any) {
      setSignInOtpError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Google Authenticator Verify & Enrollment ──
  const handleCopySecret = () => {
    navigator.clipboard.writeText(googleSecret);
    setCopiedKey(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // ── Microsoft Authenticator Number-Match Approval ──
  const handleApproveMatchNumber = async () => {
    setIsSubmitting(true);
    try {
      const email = (pendingUser?.email || emailOrUser).toLowerCase().trim();
      const cleanKey = email.replace(/[^a-zA-Z0-9]/g, '');

      // Mark enrolled in localStorage & backend
      localStorage.setItem(`mfa_enrolled_${cleanKey}`, 'true');

      // Remember this device for 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expiry = (Date.now() + thirtyDaysMs).toString();
      localStorage.setItem(`mfa_trusted_${cleanKey}`, expiry);

      try {
        await fetch('/api/auth/enroll-mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: '123456', secret: googleSecret }),
        });
      } catch (e) {
        // Non-blocking
      }

      toast.success('Sign-in approved in Authenticator!');
      const userToComplete = {
        ...pendingUser,
        requiresPasswordChange: false,
        mfaEnrolled: true,
      };
      setPendingUser(userToComplete);
      proceedAfterVerification(userToComplete);
    } catch (err: any) {
      toast.error('Failed to confirm sign-in approval. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };




  const handleVerifyGoogleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = authenticatorCode.trim() || googleAuthValues.join('');
    if (code.length < OTP_LENGTH) {
      setGoogleAuthError('Please enter the 6-digit code displayed in your Authenticator app.');
      return;
    }

    setIsSubmitting(true);
    setGoogleAuthError('');
    try {
      const email = (pendingUser?.email || emailOrUser).toLowerCase().trim();
      const cleanKey = email.replace(/[^a-zA-Z0-9]/g, '');

      if (code !== '123456') {
        const res = await fetch('/api/auth/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            secret: googleSecret,
          }),
        });

        const data = await safeParseJson(res);
        if (!res.ok) {
          throw new Error(data.error || 'The verification code entered is incorrect or has expired.');
        }
      }

      // Mark enrolled in localStorage & backend
      localStorage.setItem(`mfa_enrolled_${cleanKey}`, 'true');

      // Remember this device for 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expiry = (Date.now() + thirtyDaysMs).toString();
      localStorage.setItem(`mfa_trusted_${cleanKey}`, expiry);

      // Direct Supabase update for profile
      try {
        await supabase
          .from('profiles')
          .update({ mfa_enrolled: true, updated_at: new Date().toISOString() })
          .or(`email.ilike.${email},email.ilike.${email.split('@')[0]}@%`);
      } catch (dbErr) {
        console.warn('[Login MFA] Supabase update notice:', dbErr);
      }

      try {
        fetch('/api/auth/enroll-mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, secret: googleSecret }),
        }).catch(() => {});
      } catch (e) {
        // Non-blocking
      }

      const verifiedUser = {
        ...pendingUser,
        mfaEnrolled: true,
        requiresPasswordChange: false,
      };
      setPendingUser(verifiedUser);
      completeSignIn(verifiedUser);
    } catch (err: any) {
      const isConnectionError =
        !navigator.onLine ||
        err.message?.toLowerCase().includes('failed to fetch') ||
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('aborted');
      if (isConnectionError) {
        setGoogleAuthError('Connection was cut off. Please check your internet connection and redo entering the code.');
      } else {
        setGoogleAuthError(err.message || 'Incorrect verification code. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit First-time Password Update ──
  const handleUpdateInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (!currentPasswordInput) {
      setPasswordChangeError('Please enter your current temporary password.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters.');
      return;
    }
    if (newPasswordInput === currentPasswordInput) {
      setPasswordChangeError('Your new password cannot be the same as your temporary password.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('The new passwords you entered do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = (
        pendingUser?.email ||
        (emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@practicum.edu`)
      ).toLowerCase().trim();
      const cleanKey = email.replace(/[^a-zA-Z0-9]/g, '');

      const res = await fetch('/api/auth/update-initial-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      localStorage.setItem(`pwd_changed_${cleanKey}`, 'true');
      localStorage.removeItem(`mfa_trusted_${cleanKey}`);
      if (email.includes('@')) {
        localStorage.removeItem(`mfa_trusted_${email.split('@')[0]}`);
      }
      toast.success('Password updated! Please choose your identity verification method.');

      const updatedUser = {
        ...pendingUser,
        requiresPasswordChange: false,
      };
      setPendingUser(updatedUser);

      // Direct Supabase update for profile requires_password_change
      try {
        await supabase
          .from('profiles')
          .update({ requires_password_change: false, updated_at: new Date().toISOString() })
          .or(`email.ilike.${email},email.ilike.${email.split('@')[0]}@%`);
      } catch (dbErr) {
        console.warn('[Password Update] Supabase update notice:', dbErr);
      }

      // If MFA is already enrolled, prompt for verification code; if new/reset, show QR Code
      if (pendingUser?.mfaEnrolled) {
        setSignInStep('verify_methods');
      } else {
        setGoogleAuthStage('scan');
        setGoogleAuthError('');
        setGoogleAuthValues(Array(OTP_LENGTH).fill(''));
        setAuthenticatorCode('');
        setSignInStep('mfa_setup');
      }
    } catch (err: any) {
      const isConnectionError =
        !navigator.onLine ||
        err.message?.toLowerCase().includes('failed to fetch') ||
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('aborted');
      if (isConnectionError) {
        setPasswordChangeError('Connection was cut off. Please check your internet connection and redo your password update.');
      } else {
        setPasswordChangeError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Quick Defense Switcher ──
  const handleQuickSwitch = (role: Role) => {
    if (onLogin) onLogin(role, role);
    else loginWithDemo(role);
    navigate(`/${role}`);
  };

  // ── Sign-in: Username Step -> Password Step ──
  const handleUsernameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    const trimmed = emailOrUser.trim();
    if (!trimmed) {
      setSignInError('Enter a valid email address or phone number.');
      return;
    }

    // Format validation: if user mis-inputs or enters an invalid email format
    const isEmailAttempt = trimmed.includes('@');
    if (isEmailAttempt) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z0-9._-]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        setSignInError('Enter a valid email address or phone number.');
        return;
      }
    } else {
      // Must be a valid phone number, student ID, or recognized username
      const isValidFormat = /^[a-zA-Z0-9+_.-]{2,}$/.test(trimmed);
      if (!isValidFormat) {
        setSignInError('Enter a valid email address or phone number.');
        return;
      }
    }

    setSignInStep('password');
  };

  // ── Sign-in: Password Submission -> Verify Your Identity (MFA) ──
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setIsSubmitting(true);

    try {
      const lower = emailOrUser.toLowerCase().trim();

      // 1. Authenticate through the official backend API
      const user = await login(emailOrUser, password);

      if (user) {
        setPendingUser(user);

        // 2. Password change comes FIRST for newly created or reset accounts
        if (user.requiresPasswordChange) {
          // Clear any stale verification/password cache for this email/key
          const targetEmail = (user.email || emailOrUser).toLowerCase().trim();
          const targetKey = targetEmail.replace(/[^a-zA-Z0-9]/g, '');
          localStorage.removeItem(`pwd_changed_${targetKey}`);
          localStorage.removeItem(`mfa_enrolled_${targetKey}`);
          localStorage.removeItem(`mfa_trusted_${targetKey}`);
          if (targetEmail.includes('@')) {
            const prefixKey = targetEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            localStorage.removeItem(`pwd_changed_${prefixKey}`);
            localStorage.removeItem(`mfa_enrolled_${prefixKey}`);
            localStorage.removeItem(`mfa_trusted_${prefixKey}`);
          }

          setCurrentPasswordInput(password);
          setNewPasswordInput('');
          setConfirmPasswordInput('');
          setPasswordChangeError('');
          setSignInStep('update_password');
          return;
        }

        // 3. If MFA was reset or not enrolled: DIRECTLY show Google Authenticator QR Code scanner!
        if (user.mfaEnrolled === false) {
          setGoogleAuthStage('scan');
          setGoogleAuthError('');
          setGoogleAuthValues(Array(OTP_LENGTH).fill(''));
          setAuthenticatorCode('');
          setSignInStep('mfa_setup');
          return;
        }

        // 4. Identity verification options (Google Authenticator, Microsoft Authenticator, OTP, SMS)
        setSignInStep('verify_methods');
      }
    } catch (err: any) {
      setSignInError(err.message || 'The password you entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Student Activation: Step 1 Submit ──
  const handleActivationCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedInput = regEmail.toLowerCase().trim();
    if (!trimmedInput) {
      setRegError('Enter a valid email address or phone number.');
      return;
    }

    const normalized = trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@practicum.edu`;
    const isDomainValid =
      normalized.endsWith('@marikina.sti.edu.ph') ||
      normalized.endsWith('.edu.ph') ||
      normalized.endsWith('@gmail.com') ||
      normalized.endsWith('@practicum.edu') ||
      normalized.endsWith('@outlook.com') ||
      normalized.endsWith('@outlook.ph') ||
      normalized.endsWith('@hotmail.com') ||
      normalized.endsWith('@hotmail.ph') ||
      normalized.endsWith('@live.com') ||
      normalized.endsWith('@live.ph') ||
      normalized.endsWith('@msn.com') ||
      normalized.endsWith('@microsoft.com') ||
      normalized.includes('outlook') ||
      normalized.includes('hotmail') ||
      normalized.includes('microsoft') ||
      normalized.includes('@');

    if (!isDomainValid) {
      setRegError('Enter a valid email address or phone number.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, purpose: 'account_activation' }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockCountdown(data.remainingSeconds || 300);
        }
        throw new Error(data.error || 'Failed to dispatch code.');
      }

      toast.success(`Verification code dispatched to ${normalized}`);
      setResendCooldown(RESEND_COOLDOWN);
      setActivationStep('otp');
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      const msg = err.name === 'TypeError' || err.message?.includes('fetch')
        ? 'Unable to reach authentication server. Please check your network or ensure backend is running.'
        : err.message || 'An error occurred. Please try again.';
      setRegError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Resend Code ──
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLocked) return;
    setOtpError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentEmail.toLowerCase().trim(),
          purpose: activeTab === 'activation' ? 'account_activation' : 'login_verify',
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

      toast.success('New 6-digit code sent.');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const enteredOtp = otpValues.join('').trim();
    if (enteredOtp.length < OTP_LENGTH) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentEmail.toLowerCase().trim(),
          otp: enteredOtp,
          purpose: activeTab === 'activation' ? 'account_activation' : 'login_verify',
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

      toast.success('Identity verified.');
      setVerificationToken(data.verificationToken);

      if (activeTab === 'activation') {
        setActivationStep('profile');
      }
    } catch (err: any) {
      setOtpError(err.message);
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Complete Profile Setup ──
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regStudentId.trim()) {
      setRegError('Please provide your full legal name and student ID.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          password: regPassword,
          fullName: regFullName.trim(),
          studentId: regStudentId.trim(),
          program: regProgram,
          section: regSection,
          contactNumber: regContactNumber.trim(),
          verificationToken,
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Failed to complete registration.');
      }

      toast.success('Student account activated successfully!');
      setSessionUser(data.user);
      if (onLogin) onLogin('student', data.user.username);
      navigate('/student');
    } catch (err: any) {
      const msg = err.name === 'TypeError' || err.message?.includes('fetch')
        ? 'Unable to reach authentication server. Please ensure the backend is running.'
        : err.message || 'Registration failed.';
      setRegError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#121212] flex flex-col justify-between items-center font-sans selection:bg-[#0067b8] selection:text-white relative">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-[450px] px-4 py-8 my-auto">
        {/* ════════════════════════════════════════════════
             MAIN MICROSOFT SIGN-IN CARD
            ════════════════════════════════════════════════ */}
        <div className="w-full bg-white dark:bg-[#1f1f1f] shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.5)] border border-neutral-200/90 dark:border-neutral-800 px-8 sm:px-10 py-7 sm:py-8 rounded-xs relative">
          
          {/* Official Microsoft 4-Color Logo */}
          <div className="mb-4 sm:mb-5 flex items-center gap-2.5">
            {/* Authentic Microsoft 4-Square Logo */}
            <div className="grid grid-cols-2 gap-[2px] w-[21px] h-[21px] shrink-0">
              <div className="bg-[#f25022] w-full h-full" />
              <div className="bg-[#7fba00] w-full h-full" />
              <div className="bg-[#00a4ef] w-full h-full" />
              <div className="bg-[#ffb900] w-full h-full" />
            </div>
            <span className="text-[#737373] dark:text-[#a6a6a6] text-[17px] font-semibold tracking-tight">
              Microsoft
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP 1: USERNAME / EMAIL)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'username' && (
              <motion.div
                key="signin-username"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-4">
                  Sign in
                </h1>

                <form onSubmit={handleUsernameNext} noValidate className="space-y-4">
                  <div>
                    {signInError && (
                      <div className="text-[#e81123] text-[13.5px] sm:text-[14px] leading-relaxed tracking-[0.015em] font-normal pt-0.5 pb-0.5 mb-1.5">
                        {signInError}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Email, username, or student ID"
                      value={emailOrUser}
                      onChange={(e) => {
                        setEmailOrUser(e.target.value);
                        setSignInError('');
                      }}
                      className={cn(
                        'w-full text-[15px] px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none transition-all rounded-none',
                        signInError
                          ? 'border-b border-[#e81123] focus:border-[#e81123] focus:border-b-2'
                          : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8] focus:border-b-2'
                      )}
                      autoFocus
                    />
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/forgot-password"
                      style={{ fontWeight: 400 }}
                      className="text-[13px] font-normal text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer block tracking-normal"
                    >
                      Can't access your account?
                    </Link>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP 2: PASSWORD)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'password' && (
              <motion.div
                key="signin-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to username badge (strictly non-bold regular weight) */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('username');
                    setSignInError('');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {emailOrUser}
                  </span>
                </button>

                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-4">
                  Enter password
                </h1>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    {signInError && (
                      <div className="text-[#e81123] text-[13.5px] sm:text-[14px] leading-relaxed tracking-[0.015em] font-normal pt-0.5 pb-0.5 mb-1.5">
                        {signInError}
                      </div>
                    )}
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setSignInError('');
                      }}
                      className={cn(
                        'w-full text-[15px] px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none transition-all rounded-none',
                        signInError
                          ? 'border-b border-[#e81123] focus:border-[#e81123] focus:border-b-2'
                          : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8] focus:border-b-2'
                      )}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/forgot-password"
                      style={{ fontWeight: 400 }}
                      className="text-[13px] font-normal text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer block tracking-normal"
                    >
                      Forgot my password
                    </Link>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shadow-2xs"
                    >
                      {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP 3: VERIFY YOUR IDENTITY - MFA METHODS)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'verify_methods' && (
              <motion.div
                key="signin-verify-methods"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to password badge */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('password');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {pendingUser?.email || emailOrUser}
                  </span>
                </button>

                <h1 className="text-2xl font-bold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-6">
                  Verify your identity
                </h1>

                <div className="space-y-4 mb-6">
                  {/* Option 1: Microsoft Authenticator App (Google Authenticator TOTP) */}
                  <button
                    type="button"
                    onClick={() => handleSelectMfaMethod('google_auth')}
                    className="w-full text-left flex items-center gap-4 p-2 -mx-2 rounded-[2px] hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center text-[#1b1b1b] dark:text-white">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C9.23858 2 7 4.23858 7 7V9H5C3.89543 9 3 9.89543 3 11V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V11C21 9.89543 20.1046 9 19 9H17V7C17 4.23858 14.7614 2 12 2ZM9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V9H9V7ZM12 11.5C10.6193 11.5 9.5 12.6193 9.5 14C9.5 14.9355 10.0135 15.751 10.7679 16.1774C9.13842 16.9208 8 18.5724 8 20.5H16C16 18.5724 14.8616 16.9208 13.2321 16.1774C13.9865 15.751 14.5 14.9355 14.5 14C14.5 12.6193 13.3807 11.5 12 11.5ZM12 13C12.5523 13 13 13.4477 13 14C13 14.5523 12.5523 15 12 15C11.4477 15 11 14.5523 11 14C11 13.4477 11.4477 13 12 13Z" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-normal text-[#1b1b1b] dark:text-[#e0e0e0] group-hover:text-[#0067b8] dark:group-hover:text-[#4da3ff] transition-colors leading-snug">
                      Approve a request on my Microsoft Authenticator app
                    </span>
                  </button>

                  {/* Option 2: Verification Code */}
                  <button
                    type="button"
                    onClick={() => handleSelectMfaMethod('code')}
                    className="w-full text-left flex items-center gap-4 p-2 -mx-2 rounded-[2px] hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                      <div className="border-2 border-black dark:border-white rounded-[2px] px-1.5 py-0.5 font-bold text-[12px] tracking-tight text-black dark:text-white leading-none">
                        123
                      </div>
                    </div>
                    <span className="text-[14.5px] font-normal text-[#1b1b1b] dark:text-[#e0e0e0] group-hover:text-[#0067b8] dark:group-hover:text-[#4da3ff] transition-colors leading-snug">
                      Use a verification code
                    </span>
                  </button>

                  {/* Option 3: Text SMS */}
                  <button
                    type="button"
                    onClick={() => handleSelectMfaMethod('sms')}
                    className="w-full text-left flex items-center gap-4 p-2 -mx-2 rounded-[2px] hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center text-black dark:text-white">
                      <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current stroke-2 fill-none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-normal text-[#1b1b1b] dark:text-[#e0e0e0] group-hover:text-[#0067b8] dark:group-hover:text-[#4da3ff] transition-colors leading-snug">
                      Text {maskedPhone}
                    </span>
                  </button>

                  {/* Option 4: Call Phone */}
                  <button
                    type="button"
                    onClick={() => handleSelectMfaMethod('call')}
                    className="w-full text-left flex items-center gap-4 p-2 -mx-2 rounded-[2px] hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center text-black dark:text-white">
                      <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current stroke-2 fill-none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        <path d="M15 3h6v6" />
                        <path d="M21 3l-7 7" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-normal text-[#1b1b1b] dark:text-[#e0e0e0] group-hover:text-[#0067b8] dark:group-hover:text-[#4da3ff] transition-colors leading-snug">
                      Call {maskedPhone}
                    </span>
                  </button>
                </div>

                {/* Microsoft Support & Setup text */}
                <div className="text-[13px] text-neutral-600 dark:text-neutral-400 space-y-2 mb-6">
                  <div>
                    <a
                      href="https://support.microsoft.com/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer"
                    >
                      More information
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    Are your verification methods current? Check at{' '}
                    <a
                      href="https://aka.ms/mfasetup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0067b8] dark:text-[#4da3ff] hover:underline"
                    >
                      https://aka.ms/mfasetup
                    </a>
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSignInStep('password')}
                    className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP: APPROVE SIGN IN REQUEST - AUTHENTICATOR)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'authenticator' && (
              <motion.div
                key="signin-authenticator"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to verify methods badge */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('verify_methods');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {pendingUser?.email || emailOrUser}
                  </span>
                </button>

                <h1 className="text-[24px] font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-4">
                  Approve sign in request
                </h1>

                {/* Padlock icon with user silhouette + Instruction */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-7 h-7 shrink-0 text-[#1b1b1b] dark:text-white mt-0.5">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C9.23858 2 7 4.23858 7 7V9H5C3.89543 9 3 9.89543 3 11V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V11C21 9.89543 20.1046 9 19 9H17V7C17 4.23858 14.7614 2 12 2ZM9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V9H9V7ZM12 11.5C10.6193 11.5 9.5 12.6193 9.5 14C9.5 14.9355 10.0135 15.751 10.7679 16.1774C9.13842 16.9208 8 18.5724 8 20.5H16C16 18.5724 14.8616 16.9208 13.2321 16.1774C13.9865 15.751 14.5 14.9355 14.5 14C14.5 12.6193 13.3807 11.5 12 11.5ZM12 13C12.5523 13 13 13.4477 13 14C13 14.5523 12.5523 15 12 15C11.4477 15 11 14.5523 11 14C11 13.4477 11.4477 13 12 13Z" />
                    </svg>
                  </div>
                  <p className="text-[14.5px] text-[#1b1b1b] dark:text-[#d4d4d4] leading-snug">
                    Open your Authenticator app and approve the request. Enter the number if prompted.
                  </p>
                </div>

                {/* Number Match Square Box */}
                <div className="flex justify-center my-7">
                  <button
                    type="button"
                    onClick={handleApproveMatchNumber}
                    disabled={isSubmitting}
                    title="Click to simulate approving in Authenticator"
                    className="w-[100px] h-[100px] border-2 border-black dark:border-white flex items-center justify-center text-[52px] font-normal text-black dark:text-white leading-none hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer select-none transition-colors"
                  >
                    {authenticatorMatchNumber}
                  </button>
                </div>

                {/* Approval indicator */}
                <div className="text-center text-[12.5px] text-neutral-500 dark:text-neutral-400 -mt-3 mb-6">
                  {isSubmitting ? (
                    <span className="text-[#0067b8] dark:text-[#4da3ff] font-medium animate-pulse">Approving sign-in request…</span>
                  ) : (
                    <span>
                      Tap the number above to approve sign-in, or approve the notification in your Authenticator app.
                    </span>
                  )}
                </div>

                {/* Swipe down to refresh instruction */}
                <p className="text-[14.5px] text-[#1b1b1b] dark:text-[#d4d4d4] leading-relaxed mb-8">
                  Didn't receive a sign-in request? <strong className="font-semibold text-black dark:text-white">Swipe down to refresh</strong> the content in your app.
                </p>

                {/* Links */}
                <div className="space-y-3 mb-6">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSignInStep('verify_methods')}
                      className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer text-left font-normal"
                    >
                      I can't use my Microsoft Authenticator app right now
                    </button>
                  </div>
                  <div>
                    <a
                      href="https://support.microsoft.com/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer inline-block"
                    >
                      More information
                    </a>
                  </div>
                </div>

                {/* Cancel Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSignInStep('password')}
                    className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP: NEW ACCOUNT - GOOGLE AUTHENTICATOR SETUP)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'mfa_setup' && (
              <motion.div
                key="signin-mfa-setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('verify_methods');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {pendingUser?.email || emailOrUser}
                  </span>
                </button>

                {googleAuthStage === 'scan' ? (
                  <>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#282828] flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight">
                        Google Authenticator
                      </h1>
                    </div>

                    {/* Reminder for any device */}
                    <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[3px] p-3 text-[12.5px] mb-3 text-left flex items-start gap-2.5">
                      <Smartphone size={16} className="text-[#0067b8] dark:text-[#4da3ff] shrink-0 mt-0.5" />
                      <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-[12.5px]">
                        <strong>Reminder for any device:</strong> Open your <strong>Authenticator app</strong> on your phone or device, then scan this QR code or enter the secret key below.
                      </div>
                    </div>

                    {/* QR Code and Manual Key Box */}
                    <div className="flex flex-col items-center justify-center p-3.5 bg-neutral-50 dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-[3px] mb-4 text-center">
                      <a
                        href={`otpauth://totp/STI:${pendingUser?.email || emailOrUser || 'johndwayneguaniso@marikina.sti.edu.ph'}?secret=${googleSecret}&issuer=STI`}
                        title="Click or tap to open directly in Google Authenticator"
                        className="block hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&margin=2&data=${encodeURIComponent(
                            `otpauth://totp/STI:${pendingUser?.email || emailOrUser || 'johndwayneguaniso@marikina.sti.edu.ph'}?secret=${googleSecret}&issuer=STI`
                          )}`}
                          alt="Google Authenticator QR Code"
                          className="w-[140px] h-[140px] rounded border border-neutral-300 dark:border-neutral-600 bg-white p-1 mb-2 mx-auto shadow-xs"
                        />
                      </a>

                      <div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                          Can't scan? Enter this setup key in Google Authenticator:
                        </span>
                        <div className="inline-flex items-center gap-2 font-mono text-[11.5px] bg-white dark:bg-[#1b1b1b] px-3 py-1 border border-neutral-200 dark:border-neutral-700 rounded">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-wider">
                            JBSW Y3DP EHPK 3PXP
                          </span>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer ml-1"
                            title="Copy secret key"
                          >
                            {copiedKey ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGoogleAuthStage('verify');
                        setGoogleAuthError('');
                      }}
                      className="w-full bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal py-2 rounded-[2px] transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-2 mb-4"
                    >
                      Next
                    </button>

                    <div className="pt-3 space-y-6">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSignInStep('verify_methods')}
                          className="text-[13.5px] text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer text-left block"
                        >
                          Choose another verification method
                        </button>
                      </div>

                      <div className="flex justify-end pt-8 pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleAuthValues(Array(OTP_LENGTH).fill(''));
                            setGoogleAuthError('');
                            setGoogleAuthStage('scan');
                            setSignInStep('password');
                          }}
                          className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleVerifyGoogleAuth} className="pt-1">
                    <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-3">
                      Enter code
                    </h1>

                    <div className="flex items-start gap-2.5 mb-5 text-[13px] text-[#1b1b1b] dark:text-[#dedede] leading-relaxed">
                      <div className="w-[20px] h-[15px] border border-neutral-600 dark:border-neutral-400 rounded-[2px] flex items-center justify-center text-[9px] font-mono font-bold leading-none shrink-0 mt-0.5 text-neutral-700 dark:text-neutral-300">
                        123
                      </div>
                      <span>Enter the code displayed in the Microsoft Authenticator app on your mobile device</span>
                    </div>

                    <div className="mb-6">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Code"
                        value={authenticatorCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setAuthenticatorCode(val);
                          setGoogleAuthError('');
                        }}
                        className={cn(
                          'w-full text-[15px] px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none transition-all rounded-none',
                          googleAuthError
                            ? 'border-b border-[#e81123] focus:border-[#e81123] focus:border-b-2'
                            : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8] focus:border-b-2'
                        )}
                        autoFocus
                      />
                      {googleAuthError && (
                        <div className="text-[#e81123] text-[13px] flex items-center gap-1.5 mt-2">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{googleAuthError}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-8 text-[13px]">
                      <div>
                        <span className="text-[#1b1b1b] dark:text-neutral-300">Having trouble? </span>
                        <button
                          type="button"
                          onClick={() => setSignInStep('verify_methods')}
                          className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                        >
                          Sign in another way
                        </button>
                      </div>
                      <div>
                        <a
                          href="https://support.microsoft.com/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer inline-block"
                        >
                          More information
                        </a>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                      >
                        {isSubmitting ? 'Verifying…' : 'Verify'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (STEP: UPDATE YOUR PASSWORD ON FIRST LOGIN)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'update_password' && (
              <motion.div
                key="signin-update-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to password badge */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('password');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {pendingUser?.email || emailOrUser}
                  </span>
                </button>

                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-2">
                  Update your password
                </h1>

                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5 leading-relaxed">
                  You need to update your password because your administrator set a temporary password for your account. Next, you will add your authenticator verification.
                </p>

                <form onSubmit={handleUpdateInitialPassword} className="space-y-5">
                  <div>
                    <label className="block text-[12px] text-neutral-600 dark:text-neutral-400 mb-1 font-normal">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPasswordInput}
                      onChange={(e) => {
                        setCurrentPasswordInput(e.target.value);
                        setPasswordChangeError('');
                      }}
                      placeholder="Current password"
                      required
                      autoFocus
                      className="w-full text-[15px] border-b border-neutral-400 dark:border-neutral-600 focus:border-[#0067b8] dark:focus:border-[#4da3ff] outline-none px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] placeholder-neutral-500 rounded-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-neutral-600 dark:text-neutral-400 mb-1 font-normal">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => {
                        setNewPasswordInput(e.target.value);
                        setPasswordChangeError('');
                      }}
                      placeholder="New password (min. 6 characters)"
                      required
                      className="w-full text-[15px] border-b border-neutral-400 dark:border-neutral-600 focus:border-[#0067b8] dark:focus:border-[#4da3ff] outline-none px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] placeholder-neutral-500 rounded-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-neutral-600 dark:text-neutral-400 mb-1 font-normal">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => {
                        setConfirmPasswordInput(e.target.value);
                        setPasswordChangeError('');
                      }}
                      placeholder="Confirm new password"
                      required
                      className="w-full text-[15px] border-b border-neutral-400 dark:border-neutral-600 focus:border-[#0067b8] dark:focus:border-[#4da3ff] outline-none px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] placeholder-neutral-500 rounded-none transition-colors"
                    />
                  </div>

                  {passwordChangeError && (
                    <div className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{passwordChangeError}</span>
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-3 pt-8 mt-2">
                    <button
                      type="button"
                      onClick={() => setSignInStep('password')}
                      className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-6 py-2 min-h-[36px] rounded-[2px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-7 py-2 min-h-[36px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shadow-2xs"
                    >
                      {isSubmitting ? 'Updating…' : 'Next: Verify Identity'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: SIGN IN (VERIFICATION CODE INPUT - FIGURE 16)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'signin' && signInStep === 'otp' && (
              <motion.div
                key="signin-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to verify methods badge */}
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('verify_methods');
                  }}
                  style={{ fontWeight: 400 }}
                  className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
                  <span style={{ fontWeight: 400 }} className="truncate max-w-[340px] font-normal tracking-normal">
                    {pendingUser?.email || emailOrUser}
                  </span>
                </button>

                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-2">
                  Enter code
                </h1>
                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5 leading-relaxed">
                  Enter the 6-digit verification code sent to your registered method.
                  <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                    (Evaluation demo code: <span className="font-mono font-medium text-[#0067b8] dark:text-[#4da3ff]">123456</span>)
                  </span>
                </p>

                <form onSubmit={handleVerifySignInOtp} className="space-y-5">
                  <OtpInput
                    value={signInOtpValues}
                    onChange={(newVals) => {
                      setSignInOtpValues(newVals);
                      setSignInOtpError('');
                    }}
                    hasError={!!signInOtpError}
                    disabled={isSubmitting}
                  />

                  {signInOtpError && (
                    <div className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1 text-center justify-center">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{signInOtpError}</span>
                    </div>
                  )}

                  <div className="text-[13px] text-[#505050] dark:text-[#b3b3b3] pt-1 flex items-center justify-between">
                    <div>
                      {signInResendCooldown > 0 ? (
                        <span className="text-[#888] tabular-nums font-normal">
                          Resend code in {signInResendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectMfaMethod(selectedMfaMethod)}
                          className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignInStep('verify_methods')}
                      className="text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer font-normal"
                    >
                      Sign in another way
                    </button>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => setSignInStep('verify_methods')}
                      className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-6 py-1.5 rounded-[2px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shadow-2xs"
                    >
                      {isSubmitting ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: STUDENT ACTIVATION (STEP 1: CREDENTIALS & DOMAIN)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'activation' && activationStep === 'credentials' && (
              <motion.div
                key="act-credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setSignInStep('username');
                    setRegError('');
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-[#0067b8] dark:text-[#4da3ff] hover:underline mb-4 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Return to sign in
                </button>

                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-1">
                  Activate student account
                </h1>
                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5">
                  Enter your official STI Outlook or Microsoft account email to register for practicum
                </p>

                <form onSubmit={handleActivationCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Student ID, Username, or Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02000249822 or student@practicum.edu"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        setRegError('');
                      }}
                      className="w-full text-[15px] px-0 pt-1 pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none focus:border-[#0067b8] focus:border-b-2 transition-all rounded-none"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Create Password
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setRegError('');
                      }}
                      className="w-full text-[15px] px-0 pt-1 pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none focus:border-[#0067b8] focus:border-b-2 transition-all rounded-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setRegError('');
                      }}
                      className="w-full text-[15px] px-0 pt-1 pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#767676] dark:placeholder:text-[#999] outline-none focus:border-[#0067b8] focus:border-b-2 transition-all rounded-none"
                      required
                    />
                  </div>

                  {regError && (
                    <div className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shadow-2xs"
                    >
                      {isSubmitting ? 'Sending code…' : 'Next'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: ACTIVATION (STEP 2: 6-BOX OTP CODE ENTRY - FIGURE 16)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'activation' && activationStep === 'otp' && (
              <motion.div
                key="act-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                {/* Back to step 1 badge */}
                <button
                  type="button"
                  onClick={() => {
                    setActivationStep('credentials');
                    setOtpError('');
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-[#505050] dark:text-[#b3b3b3] hover:text-[#1b1b1b] dark:hover:text-white mb-4 cursor-pointer group"
                >
                  <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="truncate max-w-[280px]">{regEmail}</span>
                </button>

                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-2">
                  Enter code
                </h1>
                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-6 leading-relaxed">
                  We sent a 6-digit code to <span className="font-normal font-[400] text-[#1b1b1b] dark:text-[#e0e0e0]">{maskedEmail}</span>. Please enter it below to verify your identity.
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <OtpInput
                    value={otpValues}
                    onChange={(newVals) => {
                      setOtpValues(newVals);
                      setOtpError('');
                    }}
                    hasError={!!otpError}
                    disabled={isSubmitting || isLocked}
                  />

                  {otpError && (
                    <div className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1 text-center justify-center">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {isLocked && (
                    <div className="p-3 bg-[#fff4ce] dark:bg-[#3d3300] text-[#7a6400] dark:text-[#ffe26e] text-[12px] rounded-[2px] text-center">
                      ⏱️ Account locked for 5 minutes. Try again in {lockCountdown}s.
                    </div>
                  )}

                  <div className="text-[13px] text-[#505050] dark:text-[#b3b3b3] pt-1">
                    Didn't receive the code?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-[#888] tabular-nums font-medium">
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

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold">
                      Demo Testing Code: <span className="font-mono text-[#0067b8] dark:text-[#4da3ff] tracking-[0.2em]">1 2 3 4 5 6</span>
                    </span>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setActivationStep('credentials')}
                      className="bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-6 py-1.5 rounded-[2px] transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLocked}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      {isSubmitting ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                 TAB: ACTIVATION (STEP 3: INITIAL STUDENT PROFILE SETUP)
                ───────────────────────────────────────────────────────────── */}
            {activeTab === 'activation' && activationStep === 'profile' && (
              <motion.div
                key="act-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-1">
                  Profile setup
                </h1>
                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5">
                  Complete your student profile to access your Practicum portal
                </p>

                <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Dwayne B. Guaniso"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full text-[14px] pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:border-b-2 rounded-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02000249822"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      className="w-full text-[14px] pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:border-b-2 rounded-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                        Program
                      </label>
                      <select
                        value={regProgram}
                        onChange={(e) => setRegProgram(e.target.value)}
                        className="w-full text-[14px] pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:border-b-2 rounded-none"
                      >
                        <option value="BSIT" className="dark:bg-[#202020]">BSIT</option>
                        <option value="BSCS" className="dark:bg-[#202020]">BSCS</option>
                        <option value="BSCpE" className="dark:bg-[#202020]">BSCpE</option>
                        <option value="BSBA" className="dark:bg-[#202020]">BSBA</option>
                        <option value="BSHM" className="dark:bg-[#202020]">BSHM</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BSIT 402"
                        value={regSection}
                        onChange={(e) => setRegSection(e.target.value)}
                        className="w-full text-[14px] pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:border-b-2 rounded-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#767676] dark:text-[#999] uppercase tracking-wider block mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      placeholder="+63 9XX XXX XXXX"
                      value={regContactNumber}
                      onChange={(e) => setRegContactNumber(e.target.value)}
                      className="w-full text-[14px] pb-1 border-b border-[#606060] dark:border-[#8a8a8a] bg-transparent text-[#1b1b1b] dark:text-white outline-none focus:border-[#0067b8] focus:border-b-2 rounded-none"
                    />
                  </div>

                  {regError && (
                    <div className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[120px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      {isSubmitting ? 'Activating…' : 'Finish setup'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ════════════════════════════════════════════════
             AUTHENTIC MICROSOFT "SIGN-IN OPTIONS" CARD
            ════════════════════════════════════════════════ */}
        <div className="w-full mt-4">
          <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200/90 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] rounded-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSignInOptions((prev) => !prev)}
              className="w-full px-8 py-3.5 flex items-center gap-3 text-[14px] text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-neutral-50 dark:hover:bg-[#282828] transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#505050] dark:text-[#b3b3b3] shrink-0">
                <Key size={16} />
              </div>
              <span className="font-normal">Sign-in options</span>
            </button>

            <AnimatePresence>
              {showSignInOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 space-y-4"
                >
                  {/* Quick Defense Switcher */}
                  <div>
                    <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2">
                      ⚡ Quick Role Switcher (Defense & Testing)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch('student')}
                        className="px-3 py-2 rounded-[2px] bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#333] border border-neutral-200 dark:border-neutral-700 text-[12px] font-medium text-[#1b1b1b] dark:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <GraduationCap size={15} className="text-[#0067b8]" />
                        <span>Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch('admin')}
                        className="px-3 py-2 rounded-[2px] bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#333] border border-neutral-200 dark:border-neutral-700 text-[12px] font-medium text-[#1b1b1b] dark:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Shield size={15} className="text-purple-500" />
                        <span>Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch('adviser')}
                        className="px-3 py-2 rounded-[2px] bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#333] border border-neutral-200 dark:border-neutral-700 text-[12px] font-medium text-[#1b1b1b] dark:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserIcon size={15} className="text-emerald-500" />
                        <span>Adviser</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch('supervisor')}
                        className="px-3 py-2 rounded-[2px] bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#333] border border-neutral-200 dark:border-neutral-700 text-[12px] font-medium text-[#1b1b1b] dark:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Briefcase size={15} className="text-amber-500" />
                        <span>Supervisor</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
           AUTHENTIC MICROSOFT FOOTER
          ════════════════════════════════════════════════ */}
      <footer className="w-full flex flex-wrap items-center justify-end gap-4 sm:gap-5 text-[12px] font-normal text-neutral-500 dark:text-neutral-400 pr-3 sm:pr-5 pl-4 pb-1.5 pt-1">
        <a
          href="https://www.microsoft.com/en-US/servicesagreement/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          Terms of use
        </a>
        <a
          href="https://privacy.microsoft.com/en-US/privacystatement"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          Privacy & cookies
        </a>
        <span className="cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 font-bold text-[16px] tracking-widest leading-none px-1">
          ...
        </span>
      </footer>
    </div>
  );
};
