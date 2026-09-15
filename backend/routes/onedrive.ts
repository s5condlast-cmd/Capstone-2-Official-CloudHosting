import crypto from 'node:crypto';
import { getAppOrigin } from '../config/app';
import { requireIdentity, requirePortal, requireRole, asyncRoute } from '../middleware/auth';
import { supabaseAdmin, isServiceRoleAvailable } from '../config/supabase';
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
  syncFolderFilesToRoot,
} from '../services/onedriveService';

import os from 'os';
import path from 'path';

const upload = multer({ dest: path.join(os.tmpdir(), 'uploads'), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
const router = Router();

function getRedirectUri(): string {
  const origin = getAppOrigin();
  return origin + '/api/onedrive/auth/callback';
}
router.get('/onedrive/auth/login', requireIdentity, requirePortal, requireRole('admin'), asyncRoute(async (req,res) => {
  if (!isServiceRoleAvailable) return res.status(503).json({ error: 'OneDrive administration is not configured.' });
  const state = crypto.randomBytes(32).toString('hex');
  const claims = JSON.parse(Buffer.from(req.identity!.token.split('.')[1], 'base64url').toString());
  const saved = await supabaseAdmin.from('oauth_pending').insert({
    state_hash: crypto.createHash('sha256').update(state).digest('hex'), actor_id: req.identity!.id,
    session_id: claims.session_id, expires_at: new Date(Date.now()+300000).toISOString(),
  });
  if (saved.error) throw saved.error;
  res.cookie('practicum_onedrive_state',state,{httpOnly:true,sameSite:'lax',secure:getRedirectUri().startsWith('https:'),maxAge:300000,path:'/api/onedrive/auth/callback'});
  const url = new URL(getAuthorizationUrl(getRedirectUri())); url.searchParams.set('state',state);
  res.json({url:url.toString()});
}));
router.get('/onedrive/auth/callback', asyncRoute(async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  const state = req.query.state;
  const cookie = (req.headers.cookie || '').split(';').map(v=>v.trim()).find(v=>v.startsWith('practicum_onedrive_state='))?.split('=')[1];
  res.clearCookie('practicum_onedrive_state',{path:'/api/onedrive/auth/callback'});
  if (typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state) || state !== cookie || !isServiceRoleAvailable)
    return res.status(400).send('Invalid or expired OneDrive connection request. Start again from Settings.');
  const consumed = await supabaseAdmin.rpc('consume_onedrive_state',{state_digest:crypto.createHash('sha256').update(state).digest('hex')});
  if (consumed.error || !consumed.data) return res.status(400).send('This connection request is expired or no longer authorized.');
  if (req.query.error || typeof req.query.code !== 'string') return res.status(400).send('Microsoft authorization was not completed.');
  await exchangeCodeForTokens(req.query.code, getRedirectUri());
  res.redirect(`${getAppOrigin()}/admin/settings`);
}));
router.use('/onedrive',requireIdentity,requirePortal,requireRole('admin'));

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

/**
 * POST /api/onedrive/sync-root
 * Syncs all files from a nested subfolder directly to the root archive folder.
 */
router.post('/onedrive/sync-root', async (req: Request, res: Response) => {
  const folder = (req.query.folder as string) || (req.body?.folder as string) || '';
  if (!folder) {
    return res.status(400).json({ error: 'Folder path is required' });
  }

  try {
    const synced = await syncFolderFilesToRoot(folder);
    return res.json({ success: true, count: synced.length, synced });
  } catch (err: any) {
    console.error('[OneDrive] Sync to root error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
