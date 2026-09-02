import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  testOneDriveConnection,
  uploadToOneDrive,
  getOneDriveFileMetadata,
  listOneDriveFolder,
} from '../services/onedriveService';

const upload = multer({ dest: 'tmp/' });
const router = Router();

/**
 * Returns the effective redirect URI for OAuth callback.
 */
function getRedirectUri(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  return `${protocol}://${host}/api/onedrive/auth/callback`;
}

/**
 * GET /api/onedrive/auth/login
 * Initiates Microsoft 365 / OneDrive OAuth2 login.
 */
router.get('/onedrive/auth/login', (req: Request, res: Response) => {
  try {
    const redirectUri = getRedirectUri(req);
    const authUrl = getAuthorizationUrl(redirectUri);
    return res.redirect(authUrl);
  } catch (err: any) {
    console.error('[OneDrive] Failed to generate auth URL:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/onedrive/auth/callback
 * Handles OAuth callback from Microsoft identity platform.
 */
router.get('/onedrive/auth/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #ef4444;">OneDrive Connection Failed</h2>
        <p>${error_description || error}</p>
        <a href="/api/onedrive/auth/login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Try Again</a>
      </div>
    `);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Authorization code missing from callback.');
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokenData = await exchangeCodeForTokens(code, redirectUri);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OneDrive Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 480px; border: 1px solid #e2e8f0; }
            .icon { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
            h2 { margin: 0 0 10px; color: #0f172a; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            .badge { display: inline-block; background: #f1f5f9; padding: 6px 12px; border-radius: 9999px; font-weight: 600; color: #334155; font-size: 13px; margin-bottom: 24px; }
            .btn { display: inline-block; padding: 10px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>OneDrive Connected Successfully!</h2>
            <p>Your system is now linked to Microsoft OneDrive. Approved practicum documents will automatically archive to your cloud storage.</p>
            <div class="badge">Account: ${tokenData.accountName || tokenData.accountEmail || 'Connected'}</div>
            <div>
              <a href="http://localhost:3000" class="btn">Return to System Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[OneDrive] Code exchange error:', err);
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #ef4444;">Error Exchanging Token</h2>
        <p>${err.message}</p>
        <a href="/api/onedrive/auth/login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Try Again</a>
      </div>
    `);
  }
});

/**
 * GET /api/onedrive/status
 * Health check to verify Microsoft Graph and OneDrive connection.
 */
router.get('/onedrive/status', async (req: Request, res: Response) => {
  try {
    const status = await testOneDriveConnection();
    return res.json(status);
  } catch (err: any) {
    console.error('[OneDrive] Connection check failed:', err);
    return res.status(500).json({
      connected: false,
      error: err.message || 'Failed to connect to Microsoft Graph',
    });
  }
});

/**
 * POST /api/onedrive/upload
 * Uploads a document directly to OneDrive with structured folder hierarchy.
 * Query / Body params:
 * - folder: e.g. "AY_2025_2026/BSIT_4A/2021-00123/Before_OJT"
 */
router.post('/onedrive/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided for upload' });
  }

  const folder = (req.query.folder as string) || (req.body?.folder as string) || '';
  const originalName = req.file.originalname || `doc_${Date.now()}`;

  try {
    const fileBuffer = await fs.readFile(req.file.path);
    const result = await uploadToOneDrive(fileBuffer, originalName, folder);

    return res.json({
      success: true,
      file: result,
    });
  } catch (err: any) {
    console.error('[OneDrive] Upload error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to upload document to OneDrive',
    });
  } finally {
    // Always clean up temp file
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
});

/**
 * GET /api/onedrive/files
 * Lists files in a given OneDrive folder path.
 */
router.get('/onedrive/files', async (req: Request, res: Response) => {
  const folder = (req.query.folder as string) || '';

  try {
    const items = await listOneDriveFolder(folder);
    return res.json({ success: true, items });
  } catch (err: any) {
    console.error('[OneDrive] List files error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list OneDrive files',
    });
  }
});

/**
 * GET /api/onedrive/file/:id
 * Retrieves file metadata and direct download URL.
 */
router.get('/onedrive/file/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const metadata = await getOneDriveFileMetadata(id);
    return res.json({ success: true, file: metadata });
  } catch (err: any) {
    console.error('[OneDrive] Get file metadata error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch OneDrive file metadata',
    });
  }
});

export default router;
