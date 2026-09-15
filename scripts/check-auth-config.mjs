import dotenv from 'dotenv';
dotenv.config({ quiet: true });
let failed = false;
function check(name, valid) { console.log(`${name}: ${valid ? 'OK' : 'NEEDS CONFIGURATION'}`); if (!valid) failed = true; }
const real = value => Boolean(value && !/^(your-|MY_|placeholder|unconfigured)/i.test(value));
check('Supabase URL', real(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
check('Supabase public key', real(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY));
check('Server secret key', real(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY));
let validUrl = false;
try { const url = new URL(process.env.APP_URL); validUrl = ['http:','https:'].includes(url.protocol) && !url.username && !url.password && (!process.env.VERCEL || url.protocol === 'https:'); } catch {}
check('APP_URL', validUrl);
console.log('SMTP delivery, redirect allowlist, TOTP settings, and deployed SQL require checks in the Supabase dashboard.');
process.exitCode = failed ? 1 : 0;
