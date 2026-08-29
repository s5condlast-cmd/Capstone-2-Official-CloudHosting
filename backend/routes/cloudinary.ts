import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import cloudinary from '../config/cloudinaryConfig';

const upload = multer({ dest: 'tmp/' });
const router = Router();

// POST /api/cloudinary/upload?folder=practicum/submissions
router.post('/cloudinary/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const folder = (req.query.folder as string) || 'practicum/submissions';
  const customId = (req.query.customId as string) || (req.body?.customId as string);

  try {
    const publicId = customId
      ? customId
      : `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: 'raw',
      public_id: publicId,
      overwrite: true,
      invalidate: true,
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  } finally {
    // Clean up temporary file from disk
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
});

// DELETE /api/cloudinary/delete
router.delete('/cloudinary/delete', async (req: Request, res: Response) => {
  const publicId = (req.body?.publicId as string) || (req.query?.publicId as string);
  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true,
    });
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('Cloudinary delete error:', err);
    return res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

// GET /api/cloudinary/url?publicId=... or /api/cloudinary/url/:publicId(*)
router.get('/cloudinary/url', async (req: Request, res: Response) => {
  const publicId = (req.query.publicId as string);
  if (!publicId) {
    return res.status(400).json({ error: 'publicId query parameter required' });
  }

  try {
    const url = cloudinary.url(publicId, { resource_type: 'raw', secure: true });
    return res.json({ url, publicId });
  } catch (err: any) {
    console.error('Cloudinary get URL error:', err);
    return res.status(500).json({ error: 'Failed to generate URL' });
  }
});

export default router;

