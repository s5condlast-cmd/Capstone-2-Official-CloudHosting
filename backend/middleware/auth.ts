import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createUserClient, isSupabaseConfigured } from '../config/supabase';

export interface Identity {
  id: string;
  email: string;
  role: 'admin' | 'student' | 'adviser' | 'supervisor';
  profile: Record<string, any>;
  token: string;
  client: SupabaseClient;
  aal: string;
}
declare global { namespace Express { interface Request { identity?: Identity } } }

export function portalDenied(identity: Identity): string | null {
  if (identity.profile.requires_password_change) return 'Set your password before continuing.';
  if (identity.aal !== 'aal2') return 'Verify your authenticator code before continuing.';
  return null;
}
export const requireIdentity: RequestHandler = async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!isSupabaseConfigured) { res.status(503).json({ error: 'Authentication is not configured.' }); return; }
  const match = /^Bearer ([^\s]+)$/.exec(req.get('authorization') || '');
  if (!match) { res.status(401).json({ error: 'Sign in to continue.' }); return; }
  try {
    const token = match[1];
    const client = createUserClient(token);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) { res.status(401).json({ error: 'Your session has expired. Sign in again.' }); return; }
    // Decode only after Auth verifies this token. Roles come from the protected profile.
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (profileError) { res.status(503).json({ error: 'Unable to verify your account. Please retry.' }); return; }
    if (!profile || profile.status !== 'Active' || !profile.is_activated || !['admin', 'student', 'adviser', 'supervisor'].includes(profile.role)) {
      res.status(403).json({ error: 'Your account is not active. Contact your administrator.' }); return;
    }
    const { data: valid, error: sessionError } = await client.rpc('current_session_is_valid');
    if (sessionError) { res.status(503).json({ error: 'Authentication migration is required or session verification is unavailable.' }); return; }
    if (!valid) { res.status(401).json({ error: 'Your session was revoked. Sign in again.' }); return; }
    req.identity = { id: data.user.id, email: data.user.email || '', role: profile.role, profile, token, client, aal: claims.aal || 'aal1' };
    next();
  } catch { res.status(401).json({ error: 'Unable to verify this session. Sign in again.' }); }
};
export const requirePortal: RequestHandler = (req, res, next) => {
  if (!req.identity) { res.status(401).json({ error: 'Sign in to continue.' }); return; }
  const denied = portalDenied(req.identity);
  if (denied) { res.status(403).json({ error: denied }); return; }
  next();
};
export const requireRole = (...roles: Identity['role'][]): RequestHandler => (req, res, next) => {
  if (!req.identity || !roles.includes(req.identity.role)) { res.status(403).json({ error: 'You do not have permission for this action.' }); return; }
  next();
};
export const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next: NextFunction) => { Promise.resolve(handler(req, res)).catch(next); };
