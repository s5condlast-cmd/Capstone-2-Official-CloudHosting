import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY || '';
export const isSupabaseConfigured = Boolean(url && anonKey);
export const isServiceRoleAvailable = Boolean(url && serviceKey);
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

// Fail requests explicitly when unconfigured; never fall back to privileged credentials.
export const createUserClient = (token?: string) => createClient(
  url || 'https://unconfigured.invalid', anonKey || 'unconfigured',
  { auth: authOptions, ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}) },
);
export const supabase = createUserClient();
export const supabaseAdmin = createClient(url || 'https://unconfigured.invalid', serviceKey || 'unconfigured', { auth: authOptions });
