import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// In-memory multer storage: works in all environments without file locking
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

interface StoredTemplate {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
  updatedAt: string;
}

// In-memory cache for ultra-fast serving across all users/sessions
const templatesCache = new Map<string, StoredTemplate>();

// Determine a persistent storage directory on disk
const getStorageDir = (): string => {
  const isDev = !process.env.VERCEL;
  const devDir = path.resolve(process.cwd(), 'public/templates');
  const tmpDir = path.resolve('/tmp', 'templates');

  const targetDir = isDev ? devDir : tmpDir;
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  } catch (e) {
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return '';
    }
  }
};

// Initial preload from disk if files exist
try {
  const dir = getStorageDir();
  if (dir && fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      try {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          const id = path.parse(f).name;
          const ext = path.extname(f).toLowerCase();
          const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream';
          const buf = fs.readFileSync(fullPath);
          templatesCache.set(id, {
            id,
            name: f,
            filename: f,
            mimeType,
            buffer: buf,
            size: stats.size,
            updatedAt: stats.mtime.toISOString(),
          });
        }
      } catch {}
    }
  }
} catch (e) {
  console.warn('[Templates] Preload notice:', e);
}

/**
 * POST /api/templates/upload
 * Upload or replace a template file (e.g. PDF or DOCX) from Admin
 */
router.post('/templates/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in form-data (key: file)' });
    }

    const rawId = (req.body?.id as string) || (req.query?.id as string) || Date.now().toString();
    const id = rawId.trim();
    const originalName = req.file.originalname || `${id}.pdf`;
    const mimeType = req.file.mimetype || (originalName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    const buffer = req.file.buffer;

    const stored: StoredTemplate = {
      id,
      name: (req.body?.name as string) || originalName,
      filename: originalName,
      mimeType,
      buffer,
      size: req.file.size,
      updatedAt: new Date().toISOString(),
    };

    // 1. Store in memory cache
    templatesCache.set(id, stored);

    const baseId = id.endsWith('_pdf_backup') ? id.replace('_pdf_backup', '') : id;
    templatesCache.set(baseId, stored);
    templatesCache.set(`${baseId}_pdf_backup`, stored);

    // 2. Persist to disk
    const dir = getStorageDir();
    if (dir) {
      try {
        const ext = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.bin');
        const diskFilename = `${id}${ext}`;
        fs.writeFileSync(path.join(dir, diskFilename), buffer);
        fs.writeFileSync(path.join(dir, id), buffer); // Raw ID without extension for exact match

        if (id !== baseId) {
          fs.writeFileSync(path.join(dir, `${baseId}${ext}`), buffer);
          fs.writeFileSync(path.join(dir, baseId), buffer);
        } else {
          fs.writeFileSync(path.join(dir, `${baseId}_pdf_backup${ext}`), buffer);
          fs.writeFileSync(path.join(dir, `${baseId}_pdf_backup`), buffer);
        }
      } catch (writeErr) {
        console.warn('[Templates] Disk save notice (in-memory cache preserved):', writeErr);
      }
    }

    return res.json({
      success: true,
      id,
      name: stored.name,
      filename: stored.filename,
      size: stored.size,
      mimeType: stored.mimeType,
      url: `/api/templates/${encodeURIComponent(id)}`,
    });
  } catch (err: any) {
    console.error('[Templates] Upload error:', err);
    return res.status(500).json({ error: err.message || 'Template upload failed' });
  }
});

/**
 * GET /api/templates/:id
 * Retrieve raw template file (PDF/DOCX) for student preview or download
 */
router.get('/templates/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Template ID required' });

  // 1. Check memory cache first
  const cached = templatesCache.get(id) || templatesCache.get(`${id}_pdf_backup`);
  if (cached) {
    res.setHeader('Content-Type', cached.mimeType);
    res.setHeader('Content-Length', cached.buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${cached.filename}"`);
    return res.send(cached.buffer);
  }

  // 2. Check disk
  const dir = getStorageDir();
  if (dir) {
    const candidateFiles = [
      path.join(dir, id),
      path.join(dir, `${id}.pdf`),
      path.join(dir, `${id}_pdf_backup.pdf`),
      path.join(dir, `${id}.docx`),
    ];

    for (const file of candidateFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          if (stats.isFile()) {
            const buf = fs.readFileSync(file);
            const ext = path.extname(file).toLowerCase();
            const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream';
            
            // Cache for future requests
            templatesCache.set(id, {
              id,
              name: path.basename(file),
              filename: path.basename(file),
              mimeType,
              buffer: buf,
              size: stats.size,
              updatedAt: stats.mtime.toISOString(),
            });

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', buf.length);
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(file)}"`);
            return res.send(buf);
          }
        } catch {}
      }
    }
  }

  return res.status(404).json({ error: `Template "${id}" not found` });
});

/**
 * GET /api/templates
 * List all uploaded templates
 */
router.get('/templates', (_req: Request, res: Response) => {
  const list = Array.from(templatesCache.values()).map(t => ({
    id: t.id,
    name: t.name,
    filename: t.filename,
    size: t.size,
    mimeType: t.mimeType,
    updatedAt: t.updatedAt,
    url: `/api/templates/${encodeURIComponent(t.id)}`,
  }));
  return res.json({ templates: list });
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/templates/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  templatesCache.delete(id);
  templatesCache.delete(`${id}_pdf_backup`);

  const baseId = id.endsWith('_pdf_backup') ? id.replace('_pdf_backup', '') : id;
  templatesCache.delete(baseId);
  templatesCache.delete(`${baseId}_pdf_backup`);

  const dir = getStorageDir();
  if (dir) {
    [
      path.join(dir, id),
      path.join(dir, `${id}.pdf`),
      path.join(dir, `${id}_pdf_backup`),
      path.join(dir, `${id}_pdf_backup.pdf`),
      path.join(dir, `${id}.docx`),
      path.join(dir, baseId),
      path.join(dir, `${baseId}.pdf`),
      path.join(dir, `${baseId}_pdf_backup`),
      path.join(dir, `${baseId}_pdf_backup.pdf`),
      path.join(dir, `${baseId}.docx`),
    ].forEach(f => {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch {}
      }
    });
  }

  return res.json({ success: true, message: `Template ${id} deleted` });
});

export default router;
