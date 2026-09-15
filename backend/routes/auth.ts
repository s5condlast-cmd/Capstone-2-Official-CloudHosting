import { Router, type Response } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { getAppOrigin } from '../config/app';
import { createUserClient, supabaseAdmin, isServiceRoleAvailable } from '../config/supabase';
import { requireIdentity, requirePortal, requireRole, asyncRoute, portalDenied } from '../middleware/auth';

const router = Router();
const passwordSchema = z.string().min(6).max(12)
  .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
const passwordCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=';

export function generateTemporaryPassword(length = 20) {
  const password = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%^&*_-+=',
  ].map(characters => characters[randomInt(characters.length)]);
  while (password.length < length) password.push(passwordCharacters[randomInt(passwordCharacters.length)]);
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [password[index], password[swap]] = [password[swap], password[index]];
  }
  return password.join('');
}

function preventCredentialCaching(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
}

async function recordSecurityEvent(eventType: string, actorId: string, targetUserId: string | null, outcome: 'success' | 'failure') {
  const { error } = await supabaseAdmin.from('security_audit_log').insert({
    event_type: eventType, actor_id: actorId, target_user_id: targetUserId, outcome,
  });
  if (error) console.error('[Security Audit Error]', error.code || 'write_failed');
}
async function validateReviewer(id: string | null | undefined, role: 'adviser' | 'supervisor') {
  if (!id) return;
  const { data, error } = await supabaseAdmin.from('profiles').select('id').eq('id', id).eq('role', role).eq('status','Active').single();
  if (error || !data) throw Object.assign(new Error(`Select an active ${role}.`), { status: 400 });
}
const serialize = (p: Record<string, any>) => ({
  id: p.id, email: p.email, username: p.email.split('@')[0], name: p.full_name,
  role: p.role, studentId: p.student_id, course: p.section || p.program,
  section: p.section, department: p.department, companyName: p.company_name,
  companyId: p.company_id, adviserId: p.adviser_id, supervisorId: p.supervisor_id,
  contactNumber: p.contact_number, requiresPasswordChange: p.requires_password_change,
});
// Supabase Auth owns passwords, recovery and MFA. Retire prototype endpoints explicitly.
for (const path of ['login', 'send-otp', 'verify-otp', 'verify-totp', 'enroll-mfa', 'register-student', 'reset-password']) {
  router.post(`/auth/${path}`, (_req, res) => res.status(410).json({ error: 'This sign-in method has been replaced. Reload the application.' }));
}
router.get('/auth/me', requireIdentity, asyncRoute(async (req, res) => {
  res.json({ user: serialize(req.identity!.profile), portalReady: !portalDenied(req.identity!) });
}));
router.post('/auth/update-initial-password', requireIdentity, asyncRoute(async (req, res) => {
  preventCredentialCaching(res);
  const parsed = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Use 6–12 characters with uppercase, lowercase, a number, and a symbol.' });
  if (!isServiceRoleAvailable) return res.status(503).json({ error: 'Password administration is not configured.' });
  const identity = req.identity!;
  if (!identity.profile.requires_password_change) return res.status(403).json({ error: 'This account does not require an initial password change.' });
  if (parsed.data.currentPassword === parsed.data.newPassword) return res.status(400).json({ error: 'Choose a different new password.' });
  const reauth = createUserClient();
  const { data, error } = await reauth.auth.signInWithPassword({ email: identity.email, password: parsed.data.currentPassword });
  if (error || data.user?.id !== identity.id) return res.status(400).json({ error: 'Your current password is incorrect.' });
  await reauth.auth.signOut({ scope: 'local' });
  const updated = await supabaseAdmin.auth.admin.updateUserById(identity.id, { password: parsed.data.newPassword });
  if (updated.error) return res.status(400).json({ error: updated.error.message });
  const changedAt = new Date().toISOString();
  const profile = await supabaseAdmin.from('profiles').update({ requires_password_change: false,
    temporary_password_issued_at: null, password_changed_at: changedAt, sessions_revoked_before: changedAt })
    .eq('id', identity.id).select('id').single();
  if (profile.error) {
    await recordSecurityEvent('account.initial_password_changed', identity.id, identity.id, 'failure');
    return res.status(503).json({ error: 'The password changed, but account setup remains incomplete. Sign in with the new password and retry.' });
  }
  await recordSecurityEvent('account.initial_password_changed', identity.id, identity.id, 'success');
  res.json({ success: true, nextStep: 'mfa' });
}));
router.use('/users', requireIdentity, requirePortal, requireRole('admin'), (_req, res, next) => {
  if (!isServiceRoleAvailable) { res.status(503).json({ error: 'User administration requires the server Supabase service role key.' }); return; }
  next();
});
router.get('/users', asyncRoute(async (_req, res) => {
  const { data, error } = await supabaseAdmin.rpc('admin_user_directory');
  if (error) throw error;
  res.json({ users: data.map(p => ({ ...serialize(p), role: p.role[0].toUpperCase() + p.role.slice(1), status: p.status,
    dept: p.section || p.department || p.company_name || '', resetRequested: p.requires_password_change, mfaEnrolled: p.has_verified_factor })) });
}));
router.post('/users', asyncRoute(async (req, res) => {
  preventCredentialCaching(res);
  const parsed = z.object({ email: z.string().trim().email(), name: z.string().trim().min(1).max(150),
    role: z.enum(['Student', 'Adviser', 'Supervisor', 'Admin']), studentId: z.string().trim().max(50).optional(),
    dept: z.string().trim().max(150).optional(), companyName: z.string().trim().max(150).optional(),
    adviserId: z.string().uuid().optional(), supervisorId: z.string().uuid().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a real email address, full name, and valid role.' });
  const { email: rawEmail, name, role, studentId, dept, companyName } = parsed.data;
  const email = rawEmail.toLowerCase();
  if (role === 'Student') { await validateReviewer(parsed.data.adviserId,'adviser'); await validateReviewer(parsed.data.supervisorId,'supervisor'); }
  const existing = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return res.status(409).json({ error: 'This email already has a profile. Use account recovery or reconcile the legacy account.' });
  const temporaryPassword = generateTemporaryPassword();
  const created = await supabaseAdmin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true,
    user_metadata: { full_name: name } });
  if (created.error || !created.data.user) {
    await recordSecurityEvent('account.created', req.identity!.id, null, 'failure');
    return res.status(400).json({ error: created.error?.message || 'Account creation failed.' });
  }
  const issuedAt = new Date().toISOString();
  const profile = { id: created.data.user.id, email, full_name: name, role: role.toLowerCase(), status: 'Active', is_activated: true,
    requires_password_change: true, temporary_password_issued_at: issuedAt, password_changed_at: null,
    student_id: studentId || null, section: role === 'Student' ? dept : null,
    adviser_id: role === 'Student' ? parsed.data.adviserId || null : null,
    supervisor_id: role === 'Student' ? parsed.data.supervisorId || null : null,
    department: role === 'Adviser' || role === 'Admin' ? dept : null, company_name: role === 'Supervisor' ? companyName || dept : null };
  const saved = await supabaseAdmin.from('profiles').upsert(profile, { onConflict: 'id' });
  if (saved.error) {
    const cleanup = await supabaseAdmin.auth.admin.deleteUser(profile.id);
    await recordSecurityEvent('account.created', req.identity!.id, profile.id, 'failure');
    return res.status(503).json({
      error: cleanup.error
        ? 'Profile provisioning failed and the authentication account requires administrator reconciliation.'
        : 'Profile provisioning failed. The incomplete authentication account was removed; retry account creation.',
      ...(cleanup.error ? { accountId: profile.id } : {}),
    });
  }
  await recordSecurityEvent('account.created', req.identity!.id, profile.id, 'success');
  res.status(201).json({ success: true, user: { ...serialize(profile), role }, temporaryPassword,
    portalLink: `${getAppOrigin()}/login`, message: 'Account created. Share these credentials privately; the password is shown only once.' });
}));
router.param('id', (_req, res, next, value) => {
  if (!z.string().uuid().safeParse(value).success) { res.status(400).json({ error: 'A valid account ID is required.' }); return; }
  next();
});
router.post('/users/:id/reset-password', asyncRoute(async (req, res) => {
  preventCredentialCaching(res);
  if (req.params.id === req.identity!.id) return res.status(400).json({ error: 'Ask another administrator to reset your password.' });
  const target = await supabaseAdmin.auth.admin.getUserById(req.params.id);
  if (target.error || !target.data.user?.email) return res.status(404).json({ error: 'Authentication account not found.' });
  const temporaryPassword = generateTemporaryPassword();
  const issuedAt = new Date().toISOString();
  const blocked = await supabaseAdmin.from('profiles').update({ requires_password_change: true,
    temporary_password_issued_at: issuedAt, sessions_revoked_before: issuedAt })
    .eq('id', req.params.id).eq('status', 'Active').select('id').single();
  if (blocked.error) return res.status(409).json({ error: 'The active profile could not be prepared for a secure password reset.' });
  const updated = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password: temporaryPassword });
  if (updated.error) {
    await recordSecurityEvent('account.password_reset', req.identity!.id, req.params.id, 'failure');
    return res.status(400).json({ error: 'Password reset failed. The account remains blocked until an administrator retries.' });
  }
  const verified = await supabaseAdmin.from('profiles').update({ requires_password_change: true,
    temporary_password_issued_at: issuedAt, sessions_revoked_before: issuedAt })
    .eq('id', req.params.id).select('id').single();
  if (verified.error) {
    await recordSecurityEvent('account.password_reset', req.identity!.id, req.params.id, 'failure');
    return res.status(503).json({ error: 'The password changed, but the account must be reconciled before credentials are issued.' });
  }
  await recordSecurityEvent('account.password_reset', req.identity!.id, req.params.id, 'success');
  res.json({ success: true, temporaryPassword, portalLink: `${getAppOrigin()}/login`,
    message: 'Password reset. Existing sessions were revoked and MFA remains enrolled.' });
}));
router.patch('/users/:id/assignment', asyncRoute(async (req, res) => {
  const parsed = z.object({ adviserId: z.string().uuid().nullable(), supervisorId: z.string().uuid().nullable() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Select valid reviewers.' });
  await validateReviewer(parsed.data.adviserId,'adviser'); await validateReviewer(parsed.data.supervisorId,'supervisor');
  const { error } = await supabaseAdmin.from('profiles').update({ adviser_id: parsed.data.adviserId, supervisor_id: parsed.data.supervisorId })
    .eq('id', req.params.id).eq('role','student').select('id').single();
  if (error) throw error;
  res.json({ success: true });
}));
router.post('/users/:id/reset-mfa', asyncRoute(async (req, res) => {
  const isSelfReset = req.params.id === req.identity!.id;
  const resetAt = new Date().toISOString();
  const revoked = await supabaseAdmin.from('profiles').update({ sessions_revoked_before: resetAt })
    .eq('id', req.params.id).eq('status', 'Active').select('id').single();
  if (revoked.error) throw revoked.error;
  const listed = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: req.params.id });
  if (listed.error) {
    await recordSecurityEvent('account.mfa_reset', req.identity!.id, req.params.id, 'failure');
    throw listed.error;
  }
  for (const factor of listed.data.factors) {
    const removed = await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: req.params.id, id: factor.id });
    if (removed.error) {
      await recordSecurityEvent('account.mfa_reset', req.identity!.id, req.params.id, 'failure');
      throw removed.error;
    }
  }
  const remaining = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: req.params.id });
  if (remaining.error || remaining.data.factors.length > 0) {
    await recordSecurityEvent('account.mfa_reset', req.identity!.id, req.params.id, 'failure');
    return res.status(503).json({ error: 'Authenticator reset could not be verified. The account remains signed out; retry or use trusted recovery.' });
  }
  await recordSecurityEvent('account.mfa_reset', req.identity!.id, req.params.id, 'success');
  res.json({ success: true, removedFactors: listed.data.factors.length, requiresReEnrollment: true, signedOut: isSelfReset,
    message: isSelfReset
      ? 'Your authenticator was reset and this session was revoked. Delete the old app entry, sign in again, and scan the new QR code.'
      : 'Authenticator reset. The user must delete the old entry from their authenticator app, then sign in and scan the new QR code.' });
}));
router.patch('/users/:id/status', asyncRoute(async (req, res) => {
  const parsed = z.enum(['Active', 'Suspended', 'Pending']).safeParse(req.body?.status);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid account status.' });
  if (req.params.id === req.identity!.id) return res.status(400).json({ error: 'You cannot change your own account status.' });
  const updated = await supabaseAdmin.from('profiles').update({ status: parsed.data, is_activated: parsed.data === 'Active',
    sessions_revoked_before: new Date().toISOString() }).eq('id', req.params.id).select('id').single();
  if (updated.error) throw updated.error;
  res.json({ success: true });
}));
router.delete('/users/:id', asyncRoute(async (req, res) => {
  if (req.params.id === req.identity!.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
  const suspended = await supabaseAdmin.from('profiles').update({ status: 'Suspended', is_activated: false,
    sessions_revoked_before: new Date().toISOString() }).eq('id', req.params.id).select('id').single();
  if (suspended.error) throw suspended.error;
  const deleted = await supabaseAdmin.auth.admin.deleteUser(req.params.id, true);
  if (deleted.error) throw deleted.error;
  res.json({ success: true, message: 'Account disabled and authentication user deleted. Historical records retained.' });
}));
export default router;
