import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

// Component render smoke tests, not a substitute for browser/provider end-to-end tests.
const server = await createServer({
  configFile: false, server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, entries: [] },
  resolve: { alias: { '@': process.cwd() } },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://render-test.invalid'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon'),
  },
});
after(() => server.close());
const { render, Login, ForgotPassword, ResetPassword } = await server.ssrLoadModule('/scripts/auth-render-fixture.tsx');
test('login renders the imported two-step Microsoft-style sign-in without demo choices', () => {
  const html = render(Login);
  assert.match(html, /Microsoft/); assert.match(html, /Email address/);
  assert.match(html, /Sign-in options/); assert.match(html, />Next</);
  assert.doesNotMatch(html, /type="password"/);
  assert.doesNotMatch(html, /123456|Quick Switch|Quick Role|SMS|phone call/);
});
test('recovery renders a real email-link request', () => {
  const html = render(ForgotPassword);
  assert.match(html, /Send recovery link/); assert.match(html, /type="email"/);
  assert.doesNotMatch(html, /previewCode|Verification code:/);
});
test('password setup waits for provider session verification', () => {
  const html = render(ResetPassword);
  assert.match(html, /Verifying your link/);
  assert.doesNotMatch(html, /type="password"/);
});
