import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { AuthShell, authInputClass, authButtonClass } from '@/src/components/auth/AuthShell';

const validPassword = (value: string) => value.length >= 6 && value.length <= 12
  && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);

export function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => {
    let active = true;
    // getSession waits for the provider client to process the invitation/recovery URL.
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data.session) setError('This link is invalid or expired. Request a new recovery link.');
      else {
        const factors = await supabase.auth.mfa.listFactors();
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!active) return;
        if (factors.error || assurance.error) { setError('Unable to verify your authenticator settings. Please retry.'); return; }
        const verified = factors.data.totp.find(f => f.status === 'verified');
        if (verified && assurance.data.currentLevel !== 'aal2') setFactorId(verified.id);
        setReady(true);
      }
    }).catch(() => { if (active) setError('Unable to verify this link. Please retry.'); });
    return () => { active = false; };
  }, []);
  return <AuthShell title={saved ? 'Password saved' : 'Set your password'}>
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    {saved ? <><p className="mb-4 text-sm">Your password has been updated. Sign in and complete authenticator verification.</p><Link className="text-blue-700" to="/login">Continue to sign in</Link></> : ready && factorId ?
      <form className="space-y-4" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError('');
        try {
          const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
          if (result.error) throw result.error;
          setFactorId(''); setCode('');
        } catch (err) { setError(err instanceof Error ? err.message : 'Verification failed.'); }
        finally { setBusy(false); }
      }}>
        <p className="text-sm">Verify your enrolled authenticator before changing your password. If you lost access, contact your administrator.</p>
        <label className="block text-sm">Authenticator code<input className={`${authInputClass} mt-1`} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))} /></label>
        <button disabled={busy} className={authButtonClass}>{busy ? 'Verifying…' : 'Verify code'}</button>
      </form> : ready ?
      <form className="space-y-4" onSubmit={async e => {
        e.preventDefault(); setError('');
        if (password !== confirmation) { setError('The passwords do not match.'); return; }
        if (!validPassword(password)) { setError('Use 6–12 characters with uppercase, lowercase, a number, and a symbol.'); return; }
        setBusy(true);
        try {
          const result = await supabase.auth.updateUser({ password });
          if (result.error) throw result.error;
          setPassword(''); setConfirmation('');
          const signout = await supabase.auth.signOut({ scope: 'global' });
          if (signout.error) { setReady(false); throw new Error('Password saved, but session revocation failed. Sign out before continuing.'); }
          setSaved(true);
        } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update your password.'); }
        finally { setBusy(false); }
      }}>
        <p className="text-sm text-zinc-500">Use 6–12 characters with uppercase, lowercase, a number, and a symbol. Your administrator will never need to know this password.</p>
        <label className="block text-sm">New password<input className={`${authInputClass} mt-1`} type="password" autoComplete="new-password" minLength={6} maxLength={12} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label className="block text-sm">Confirm password<input className={`${authInputClass} mt-1`} type="password" autoComplete="new-password" minLength={6} maxLength={12} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
        <button disabled={busy} className={authButtonClass}>{busy ? 'Saving…' : 'Save password'}</button>
      </form> : !error && <p role="status">Verifying your link…</p>}
    {!saved && <Link className="mt-5 block text-sm text-blue-700" to="/forgot-password">Request another recovery link</Link>}
  </AuthShell>;
}
