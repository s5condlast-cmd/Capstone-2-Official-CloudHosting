import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!rawUrl) {
  console.warn('[Backend Config] Supabase URL missing in environment. Using safe mock placeholder to prevent serverless crash.');
}

// Serverless-safe client initialization: createClient throws if URL is empty string
const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawAnonKey || rawServiceKey || 'placeholder-anon-key';
const supabaseServiceKey = rawServiceKey || rawAnonKey || 'placeholder-service-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isServiceRoleAvailable = !!rawServiceKey;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

