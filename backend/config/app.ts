export function getAppOrigin(): string {
  try {
    const url = new URL(process.env.APP_URL || (process.env.VERCEL ? '' : 'http://localhost:3000'));
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password || (process.env.VERCEL && url.protocol !== 'https:')) throw new Error();
    return url.origin;
  } catch { throw Object.assign(new Error('Configure APP_URL with the application URL before sending invitations or connecting OneDrive.'), { status: 503, expose: true }); }
}
