import { Router } from 'express';
import multer from 'multer';
import { requireIdentity, requirePortal, requireRole, asyncRoute } from '../middleware/auth.js';

export const isValidTemplateId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
router.use('/templates', requireIdentity, requirePortal);
router.post('/templates/upload', requireRole('admin'), upload.single('file'), asyncRoute(async (req, res) => {
  const id = req.body?.id;
  if (!isValidTemplateId(id)) return res.status(400).json({ error: 'Invalid template ID.' });
  if (!req.file) return res.status(400).json({ error: 'Select a template file.' });
  const type = req.file.mimetype;
  if (!['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(type))
    return res.status(400).json({ error: 'Use a PDF, DOCX, or XLSX template.' });
  const { error } = await req.identity!.client.storage.from('templates').upload(id, req.file.buffer, { upsert: true, contentType: type });
  if (error) return res.status(502).json({ error: 'Template could not be saved to durable storage.' });
  // PDF and DOCX are separate objects. Never overwrite the editable template with its PDF backup.
  res.json({ success: true, id, url: `/api/templates/${encodeURIComponent(id)}` });
}));
router.get('/templates/:id', asyncRoute(async (req, res) => {
  if (!isValidTemplateId(req.params.id)) return res.status(400).json({ error: 'Invalid template ID.' });
  const { data, error } = await req.identity!.client.storage.from('templates').download(req.params.id);
  if (error || !data) return res.status(404).json({ error: 'Template not found or unavailable.' });
  res.setHeader('Content-Type', data.type || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(Buffer.from(await data.arrayBuffer()));
}));
router.get('/templates', asyncRoute(async (req, res) => {
  const { data, error } = await req.identity!.client.storage.from('templates').list();
  if (error) return res.status(502).json({ error: 'Unable to list templates.' });
  res.json({ templates: data });
}));
router.delete('/templates/:id', requireRole('admin'), asyncRoute(async (req, res) => {
  if (!isValidTemplateId(req.params.id)) return res.status(400).json({ error: 'Invalid template ID.' });
  const { error } = await req.identity!.client.storage.from('templates').remove([req.params.id]);
  if (error) return res.status(502).json({ error: 'Unable to delete template.' });
  res.json({ success: true });
}));
export default router;
