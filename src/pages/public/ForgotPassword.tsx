import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { AuthShell, authInputClass, authButtonClass } from '@/src/components/auth/AuthShell';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(n => n - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  return <AuthShell title="Reset your password">
    <p className="mb-5 text-sm text-zinc-500">Enter the email address your administrator used for your account.</p>
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    {sent && <p role="status" className="mb-4 text-sm">If this address has an account, check its inbox for a password recovery link.</p>}
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); if (cooldown || busy) return;
      setBusy(true); setError('');
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent(true); setCooldown(60);
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to request a recovery email.'); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm">Email address<input className={`${authInputClass} mt-1`} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <button className={authButtonClass} disabled={busy || cooldown > 0}>{busy ? 'Requesting…' : cooldown ? `Resend in ${cooldown}s` : 'Send recovery link'}</button>
    </form>
    <Link to="/login" className="mt-5 block text-sm text-blue-700 dark:text-blue-400">Back to sign in</Link>
  </AuthShell>;
}
