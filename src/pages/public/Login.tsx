import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Copy, KeyRound, Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/lib/api';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';

type Step = 'username' | 'password' | 'change_initial_password' | 'totp_challenge' | 'totp_enroll';

const inputClass = 'w-full text-[15px] px-0 pt-1 pb-1.5 bg-transparent text-[#1b1b1b] dark:text-white placeholder:text-[#666666] dark:placeholder:text-[#8a8a8a] outline-none transition-all rounded-none';
const primaryButtonClass = 'bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-[15px] font-normal px-8 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shadow-2xs';
const secondaryButtonClass = 'bg-[#cccccc] dark:bg-[#3b3b3b] hover:bg-[#b8b8b8] dark:hover:bg-[#4a4a4a] text-[#1b1b1b] dark:text-white text-[15px] font-normal px-6 py-1.5 min-w-[108px] rounded-[2px] transition-colors cursor-pointer';

export function Login() {
  const { login, refreshProfile, user, authError } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('username');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [enrollmentStage, setEnrollmentStage] = useState<'scan' | 'verify'>('scan');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showSignInOptions, setShowSignInOptions] = useState(false);

  useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);

  const resetToSignIn = async () => {
    if (step === 'totp_enroll' && factorId) {
      await supabase.auth.mfa.unenroll({ factorId }).catch(() => undefined);
    }
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    setStep('username'); setPassword(''); setNewPassword(''); setConfirmPassword('');
    setTotpCode(''); setFactorId(''); setQrCode(''); setSecret(''); setError('');
  };

  const continueToMfa = async () => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel === 'aal2') { await refreshProfile(); return; }

    const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified');
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id); setTotpCode(''); setStep('totp_challenge'); return;
    }

    // An interrupted enrollment leaves an unverified factor whose QR secret
    // cannot be retrieved again. Remove it before issuing a fresh QR code.
    for (const incompleteFactor of factors.totp.filter((factor) => factor.status !== 'verified')) {
      const removed = await supabase.auth.mfa.unenroll({ factorId: incompleteFactor.id });
      if (removed.error) throw new Error('Unable to replace the incomplete authenticator setup. Return to sign-in and try again.');
    }

    const enrolled = await supabase.auth.mfa.enroll({
      factorType: 'totp', issuer: 'STI Practicum', friendlyName: 'Practicum Portal Authenticator',
    });
    if (enrolled.error) throw enrolled.error;
    setFactorId(enrolled.data.id); setQrCode(enrolled.data.totp.qr_code);
    setSecret(enrolled.data.totp.secret); setEnrollmentStage('scan'); setTotpCode(''); setStep('totp_enroll');
  };

  const handleUsernameNext = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Enter a valid account email address.'); return;
    }
    setEmail(normalized); setStep('password');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await login(email, password);
      if (result.user.requiresPasswordChange) { setStep('change_initial_password'); return; }
      setPassword(''); await continueToMfa();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The password you entered is incorrect.');
    } finally { setBusy(false); }
  };

  const handleInitialPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      await apiJson('/api/auth/update-initial-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      const signedIn = await supabase.auth.signInWithPassword({ email, password: newPassword });
      if (signedIn.error) {
        setStep('password'); setPassword(''); setNewPassword(''); setConfirmPassword('');
        throw new Error('Your password was changed. Sign in again with your new password.');
      }
      setPassword(''); setNewPassword(''); setConfirmPassword('');
      await refreshProfile(); await continueToMfa();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to change your password.');
    } finally { setBusy(false); }
  };

  const handleVerifyTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !factorId || totpCode.length !== 6) return;
    setBusy(true); setError('');
    try {
      const verified = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode });
      if (verified.error) throw verified.error;
      await refreshProfile();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Incorrect authenticator code. Please try again.');
    } finally { setBusy(false); }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret); setCopiedKey(true); toast.success('Setup key copied.');
      window.setTimeout(() => setCopiedKey(false), 2000);
    } catch { toast.error('Clipboard access failed. Select and copy the key manually.'); }
  };

  const displayedError = error || authError;

  return (
    <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#121212] flex flex-col justify-between items-center font-sans selection:bg-[#0067b8] selection:text-white relative">
      <div style={{ fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
        className="w-full flex-1 flex flex-col items-center justify-center max-w-[470px] px-4 py-8 my-auto">
        <div className="w-full bg-white dark:bg-[#1f1f1f] shadow-[0_2px_6px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] border border-neutral-200/90 dark:border-neutral-800/80 px-[44px] py-[42px] rounded-none relative">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid grid-cols-2 gap-[2.5px] w-[24px] h-[24px] shrink-0" aria-hidden="true">
              <div className="bg-[#f25022] w-full h-full" /><div className="bg-[#7fba00] w-full h-full" />
              <div className="bg-[#00a4ef] w-full h-full" /><div className="bg-[#ffb900] w-full h-full" />
            </div>
            <span className="text-[#737373] dark:text-[#a6a6a6] text-[19px] font-semibold tracking-tight">Microsoft</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 'username' && <motion.div key="signin-username" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-4">Sign in</h1>
              <form onSubmit={handleUsernameNext} noValidate>
                {displayedError && <div role="alert" className="text-[#e81123] text-[13.5px] sm:text-[14px] leading-relaxed tracking-[0.015em] font-normal pt-0.5 pb-0.5 mb-1.5">{displayedError}</div>}
                <input type="email" placeholder="Email address" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }}
                  className={cn(inputClass, displayedError ? 'border-b border-[#e81123]' : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8]')} autoFocus />
                <div className="mt-4"><Link to="/forgot-password" style={{ fontWeight: 400 }} className="text-[13px] font-normal text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer block tracking-normal">Can't access your account?</Link></div>
                <div className="flex justify-end mt-[60px]"><button type="submit" className={primaryButtonClass}>Next</button></div>
              </form>
            </motion.div>}

            {step === 'password' && <motion.div key="signin-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <AccountBack email={email} onClick={() => { setStep('username'); setError(''); setPassword(''); }} />
              <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-4">Enter password</h1>
              <form onSubmit={handlePasswordSubmit}>
                {displayedError && <div role="alert" className="text-[#e81123] text-[13.5px] sm:text-[14px] leading-relaxed tracking-[0.015em] font-normal pt-0.5 pb-0.5 mb-1.5">{displayedError}</div>}
                <input type="password" placeholder="Password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }}
                  className={cn(inputClass, displayedError ? 'border-b border-[#e81123]' : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8]')} required autoFocus autoComplete="current-password" />
                <div className="mt-4"><Link to="/forgot-password" style={{ fontWeight: 400 }} className="text-[13px] font-normal text-[#0067b8] dark:text-[#4da3ff] hover:underline cursor-pointer block tracking-normal">Forgot my password</Link></div>
                <div className="flex justify-end mt-[60px]"><button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Checking…' : 'Next'}</button></div>
              </form>
            </motion.div>}

            {step === 'change_initial_password' && <motion.div key="signin-update-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <AccountBack email={email} onClick={resetToSignIn} />
              <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-2">Update your password</h1>
              <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5 leading-relaxed">You need to update your password because your administrator set a temporary password for your account. Next, you will add your authenticator verification.</p>
              <form onSubmit={handleInitialPasswordChange} className="space-y-5">
                <PasswordField label="Current password" value={password} onChange={(value) => { setPassword(value); setError(''); }} autoFocus />
                <PasswordField label="New password" value={newPassword} onChange={(value) => { setNewPassword(value); setError(''); }} placeholder="New password (6–12 characters)" />
                <PasswordField label="Confirm new password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); setError(''); }} />
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">Use uppercase, lowercase, a number, and a symbol.</p>
                {displayedError && <ErrorMessage message={displayedError} />}
                <div className="flex justify-end items-center gap-3 pt-8 mt-2">
                  <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Updating…' : 'Next'}</button></div>
              </form>
            </motion.div>}

            {step === 'totp_challenge' && <motion.div key="signin-totp-challenge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <AccountBack email={email} onClick={resetToSignIn} />
              <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-2">Enter code</h1>
              <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5 leading-relaxed">Enter the 6-digit code displayed in your authenticator app.</p>
              <form onSubmit={handleVerifyTotp} className="space-y-5">
                <CodeInput value={totpCode} onChange={(value) => { setTotpCode(value); setError(''); }} hasError={!!displayedError} />
                {displayedError && <ErrorMessage message={displayedError} />}
                <div className="flex justify-end gap-2.5 pt-4">
                  <button type="submit" disabled={busy || totpCode.length !== 6} className={primaryButtonClass}>{busy ? 'Verifying…' : 'Verify'}</button></div>
              </form>
            </motion.div>}

            {step === 'totp_enroll' && <motion.div key="signin-mfa-setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              {enrollmentStage === 'scan' ? <>
                <div className="flex items-center gap-3 mb-2"><Smartphone size={22} className="shrink-0 text-neutral-900 dark:text-white" />
                  <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight">Authenticator setup</h1></div>
                <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[3px] p-3 text-[12.5px] mb-3 text-left flex items-start gap-2.5"><Smartphone size={16} className="text-[#0067b8] dark:text-[#4da3ff] shrink-0 mt-0.5" />
                  <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed"><strong>On your phone:</strong> Open Google Authenticator or Microsoft Authenticator, then scan this QR code.</div></div>
                <div className="flex flex-col items-center justify-center p-3.5 bg-neutral-50 dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-[3px] mb-4 text-center">
                  {qrCode && <img src={qrCode} alt="Authenticator QR code" className="w-[160px] h-[160px] rounded border border-neutral-300 dark:border-neutral-600 bg-white p-1 mb-2 mx-auto shadow-xs" />}
                  {secret && <div><span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">Can't scan? Enter this setup key:</span>
                    <div className="inline-flex items-center gap-2 font-mono text-[11.5px] bg-white dark:bg-[#1b1b1b] px-3 py-1 border border-neutral-200 dark:border-neutral-700 rounded"><span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-wider select-all">{secret}</span>
                      <button type="button" onClick={copySecret} className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer ml-1" title="Copy setup key">{copiedKey ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}</button></div></div>}
                </div>
                <div className="flex justify-end pt-4"><button type="button" onClick={() => { setEnrollmentStage('verify'); setError(''); }} className={primaryButtonClass}>Next</button></div>
              </> : <form onSubmit={handleVerifyTotp} className="pt-1">
                <h1 className="text-2xl font-semibold text-[#1b1b1b] dark:text-[#f3f3f3] tracking-tight mb-3">Enter code</h1>
                <p className="text-[13px] text-[#505050] dark:text-[#b3b3b3] mb-5 leading-relaxed">Enter the code displayed in your authenticator app to finish setup.</p>
                <CodeInput value={totpCode} onChange={(value) => { setTotpCode(value); setError(''); }} hasError={!!displayedError} />
                {displayedError && <ErrorMessage message={displayedError} />}
                <div className="flex justify-end gap-2.5 pt-8"><button type="button" onClick={() => { setEnrollmentStage('scan'); setError(''); setTotpCode(''); }} className={secondaryButtonClass}>Back</button>
                  <button type="submit" disabled={busy || totpCode.length !== 6} className={primaryButtonClass}>{busy ? 'Verifying…' : 'Verify'}</button></div>
              </form>}
            </motion.div>}
          </AnimatePresence>
        </div>

        <div className="w-full mt-5"><div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200/90 dark:border-neutral-800/80 shadow-[0_2px_6px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] rounded-none overflow-hidden">
          <button type="button" onClick={() => setShowSignInOptions((current) => !current)} className="w-full h-[48px] px-[44px] flex items-center gap-3.5 text-[15px] text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-neutral-50 dark:hover:bg-[#282828] transition-colors cursor-pointer text-left"><KeyRound size={20} className="shrink-0 stroke-[1.5]" /><span className="font-normal text-[15px]">Sign-in options</span></button>
          <AnimatePresence>{showSignInOptions && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-[44px] pb-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[13px] text-neutral-600 dark:text-neutral-400">Use your account email and password. Authenticator verification follows after sign-in.</motion.div>}</AnimatePresence>
        </div></div>
      </div>

      <footer className="w-full flex flex-wrap items-center justify-end gap-4 sm:gap-5 text-[12px] font-normal text-neutral-500 dark:text-neutral-400 pr-3 sm:pr-5 pl-4 pb-1.5 pt-1">
        <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Terms of use</a>
        <a href="https://privacy.microsoft.com/en-US/privacystatement" target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Privacy & cookies</a>
        <span className="cursor-default font-bold text-[16px] tracking-widest leading-none px-1">...</span>
      </footer>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const isCurrentPassword = label === 'Current password';
  return <div><label className="block text-[12px] text-neutral-600 dark:text-neutral-400 mb-1 font-normal">{label}</label>
    <input type="password" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || label} required autoFocus={autoFocus}
      minLength={isCurrentPassword ? undefined : 6} maxLength={isCurrentPassword ? 128 : 12} autoComplete={isCurrentPassword ? 'current-password' : 'new-password'}
      className="w-full text-[15px] border-b border-neutral-400 dark:border-neutral-600 focus:border-[#0067b8] dark:focus:border-[#4da3ff] outline-none px-0 pt-1 pb-1 bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] placeholder-neutral-500 rounded-none transition-colors" /></div>;
}

function CodeInput({ value, onChange, hasError }: { value: string; onChange: (value: string) => void; hasError: boolean }) {
  return <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="Code" value={value}
    onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
    className={cn(inputClass, hasError ? 'border-b border-[#e81123]' : 'border-b border-[#606060] dark:border-[#8a8a8a] focus:border-[#0067b8]')} autoFocus required />;
}

function AccountBack({ email, onClick }: { email: string; onClick: () => void }) {
  return <button type="button" aria-label={`Back to sign-in for ${email}`} onClick={onClick} style={{ fontWeight: 400 }} className="flex items-center gap-2 text-[13.5px] font-normal text-neutral-600 dark:text-neutral-300 hover:text-[#0067b8] dark:hover:text-[#4da3ff] mb-4 cursor-pointer group transition-colors active:scale-[0.98]">
    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0 text-neutral-500 dark:text-neutral-400 stroke-[1.75]" />
    <span className="truncate max-w-[270px] font-normal tracking-normal">{email}</span></button>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div role="alert" className="text-[#e81123] text-[13px] flex items-start gap-1.5 pt-1"><AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{message}</span></div>;
}

export default Login;
