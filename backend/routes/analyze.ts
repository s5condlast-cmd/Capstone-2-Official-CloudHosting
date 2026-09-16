import { Router } from 'express';
import { z } from 'zod';
import { requireIdentity, requirePortal, requireRole, asyncRoute } from '../middleware/auth.js';
import { analyzeDocumentText } from '../services/aiService.js';

const router = Router();
router.post('/analyze', requireIdentity, requirePortal, requireRole('admin','adviser','supervisor'), asyncRoute(async (req, res) => {
  if (!z.string().uuid().safeParse(req.body?.docId).success) return res.status(400).json({ error: 'A valid document ID is required.' });
  const client = req.identity!.client;
  const { data: doc, error } = await client.from('student_documents').select('*').eq('id', req.body.docId).single();
  if (error || !doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  // Resolve only authorized storage objects. Ignore arbitrary client-supplied URLs and metadata.
  const path = doc.file_path?.replace(/^submissions\//, '');
  if (!path || path.includes('://') || !path.toLowerCase().endsWith('.pdf')) return res.status(400).json({ error: 'Upload a PDF to practicum storage before analysis.' });
  const file = await client.storage.from('student_submissions').download(path);
  if (file.error || !file.data) return res.status(502).json({ error: 'Unable to retrieve this document.' });
  if (file.data.size > 10 * 1024 * 1024) return res.status(413).json({ error: 'PDF must be smaller than 10 MB.' });
  try {
    const processing = await client.from('student_documents').update({ ai_status: 'Processing' }).eq('id', doc.id).select('id').single();
    if (processing.error) throw processing.error;
    const { extractTextFromPdfBuffer } = await import('../utils/pdfParser.js');
    const text = await extractTextFromPdfBuffer(Buffer.from(await file.data.arrayBuffer()));
    const findings = await analyzeDocumentText(text, { name: doc.student_name, course: doc.course, docType: doc.doc_type, company: '' });
    const updated = await client.from('student_documents').update({ ai_status: 'Completed', ai_findings: findings }).eq('id', doc.id).select('id').single();
    if (updated.error) throw updated.error;
    res.json(findings);
  } catch {
    await client.from('student_documents').update({ ai_status: 'Failed' }).eq('id', doc.id);
    res.status(502).json({ error: 'Document analysis failed. Please retry.' });
  }
}));
export default router;
