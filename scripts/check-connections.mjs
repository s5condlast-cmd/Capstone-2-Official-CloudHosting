import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
dotenv.config({ quiet: true });

// Read-only probes. Never print credentials, tokens, or database rows.
const names = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'GROQ_API_KEY', 'VITE_GROQ_API_KEY', 'GEMINI_API_KEY', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'];
for (const name of names) console.log(`${name}: ${process.env[name] ? 'configured' : 'missing'}`);
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Supabase probes skipped: URL or anonymous key missing.');
  process.exitCode = 1;
} else {
  const paths = ['/auth/v1/settings', ...['profiles', 'auth_otps', 'student_documents', 'template_metadata', 'document_templates', 'document_template_versions', 'document_instances'].map(table => `/rest/v1/${table}?select=id&limit=0`)];
  await Promise.all(paths.map(async path => {
    try {
      const response = await fetch(new URL(path, url), {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(15000),
      });
      console.log(`${path}: HTTP ${response.status}`);
      if (!response.ok) process.exitCode = 1;
      await response.body?.cancel();
    } catch (error) {
      console.error(`${path}: ${error.cause?.code || error.name}`);
      process.exitCode = 1;
    }
  }));
}

const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
if (groqKey) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${groqKey}` },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`Groq models (read-only): HTTP ${response.status}`);
    if (!response.ok) process.exitCode = 1;
    await response.body?.cancel();
  } catch (error) {
    console.error(`Groq models: ${error.cause?.code || error.name}`);
    process.exitCode = 1;
  }
}
try {
  const token = JSON.parse(await readFile(new URL('../backend/config/onedrive-token.json', import.meta.url), 'utf8'));
  console.log(`OneDrive local token: ${Date.now() < token.expiresAt ? 'unexpired' : 'expired'}`);
  if (token.accessToken && Date.now() < token.expiresAt) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive?$select=id', {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`OneDrive drive (read-only): HTTP ${response.status}`);
    if (!response.ok) process.exitCode = 1;
    await response.body?.cancel();
  }
} catch (error) {
  console.log(`OneDrive local token probe: ${error.code === 'ENOENT' ? 'no saved token; OAuth connection unverified' : error.cause?.code || error.name}`);
}
