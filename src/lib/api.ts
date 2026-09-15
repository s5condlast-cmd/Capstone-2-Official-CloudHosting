import { supabase } from './supabase';

// Only attach credentials to this application's API, never arbitrary document URLs.
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) throw new Error('Invalid API destination.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Your session has expired. Sign in again.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return fetch(url, { ...init, headers, cache: 'no-store', redirect: 'error' });
}

export async function apiJson<T = any>(input: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(input, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status}).`);
  if (!body) throw new Error('The server returned an invalid response.');
  return body;
}
