import { randomUUID } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncRoute, requireIdentity, requirePortal, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();
const noteSchema = z.string().trim().min(3).max(500);
const evidenceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const receiveEvidence: RequestHandler = (req, res, next) => {
  evidenceUpload.single('photo')(req, res, error => {
    if (error) {
      res.status(400).json({ error: error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? 'The attendance photo must be 5 MB or smaller.'
        : 'The attendance photo could not be received.' });
      return;
    }
    next();
  });
};

export function detectAttendancePhoto(buffer: Buffer): { mime: string; extension: 'jpg' | 'png' | 'webp' } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', extension: 'png' };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', extension: 'webp' };
  }
  return null;
}

router.use('/attendance', requireIdentity, requirePortal);

router.get('/attendance', asyncRoute(async (req, res) => {
  const parsed = z.object({
    days: z.coerce.number().int().min(1).max(366).default(31),
    studentId: z.string().uuid().optional(),
  }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Use a valid date range and student ID.' });

  const identity = req.identity!;
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - parsed.data.days + 1);
  let query = identity.client
    .from('attendance_records')
    .select('id,student_id,work_date,time_in,time_out,break_minutes,rendered_minutes,activity_note,evidence_path,evidence_mime,evidence_bytes,evidence_uploaded_at,status,reviewer_remarks,verified_by,verified_at,created_at,updated_at')
    .gte('work_date', fromDate.toISOString().slice(0, 10))
    .order('work_date', { ascending: false })
    .order('time_in', { ascending: false });

  if (identity.role === 'student') query = query.eq('student_id', identity.id);
  else if (parsed.data.studentId) query = query.eq('student_id', parsed.data.studentId);

  const { data: records, error } = await query;
  if (error) throw error;

  const studentIds = [...new Set((records || []).map(record => record.student_id))];
  const profiles = studentIds.length
    ? await identity.client.from('profiles').select('id,full_name,student_id,program,section,company_name').in('id', studentIds)
    : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const profileById = new Map((profiles.data || []).map(profile => [profile.id, profile]));
  const evidencePaths = (records || []).map(record => record.evidence_path).filter((path): path is string => Boolean(path));
  const signedEvidence = evidencePaths.length
    ? await identity.client.storage.from('attendance-evidence').createSignedUrls(evidencePaths, 10 * 60)
    : { data: [], error: null };
  const evidenceUrlByPath = new Map((signedEvidence.data || [])
    .filter(item => item.signedUrl)
    .map(item => [item.path, item.signedUrl]));

  res.json({
    records: (records || []).map(record => ({
      ...record,
      evidence_url: record.evidence_path ? evidenceUrlByPath.get(record.evidence_path) || null : null,
      student: profileById.get(record.student_id) || null,
    })),
    viewerRole: identity.role,
    targetMinutes: 460 * 60,
    dailyTargetMinutes: 8 * 60,
    timezone: 'Asia/Manila',
  });
}));

router.post('/attendance/time-in', requireRole('student'), asyncRoute(async (req, res) => {
  const { data, error } = await req.identity!.client.rpc('attendance_time_in');
  if (error) return res.status(409).json({ error: error.message });
  res.status(201).json({ record: data });
}));

router.post('/attendance/:id/evidence', requireRole('student'), receiveEvidence, asyncRoute(async (req, res) => {
  const recordId = z.string().uuid().safeParse(req.params.id);
  if (!recordId.success) return res.status(400).json({ error: 'Select a valid attendance record.' });
  if (!req.file?.buffer.length) return res.status(400).json({ error: 'Capture or select an attendance photo.' });
  const detected = detectAttendancePhoto(req.file.buffer);
  if (!detected) return res.status(400).json({ error: 'Use a real JPEG, PNG, or WebP image.' });

  const identity = req.identity!;
  const existing = await identity.client.from('attendance_records').select('id,evidence_path,status')
    .eq('id', recordId.data).eq('student_id', identity.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (!existing.data || !['open', 'rejected'].includes(existing.data.status)) {
    return res.status(409).json({ error: 'Photos can only be added to your open or returned attendance record.' });
  }

  const objectPath = `${identity.id}/${recordId.data}/${randomUUID()}.${detected.extension}`;
  const uploaded = await identity.client.storage.from('attendance-evidence').upload(objectPath, req.file.buffer, {
    contentType: detected.mime, upsert: false, cacheControl: '3600',
  });
  if (uploaded.error) return res.status(502).json({ error: 'The attendance photo could not be saved.' });

  const attached = await identity.client.rpc('attendance_attach_evidence', {
    record_id: recordId.data, object_path: objectPath,
    mime_type: detected.mime, byte_size: req.file.buffer.length,
  });
  if (attached.error) {
    await supabaseAdmin.storage.from('attendance-evidence').remove([objectPath]);
    return res.status(409).json({ error: attached.error.message });
  }
  if (existing.data.evidence_path && existing.data.evidence_path !== objectPath) {
    await supabaseAdmin.storage.from('attendance-evidence').remove([existing.data.evidence_path]);
  }
  const signed = await identity.client.storage.from('attendance-evidence').createSignedUrl(objectPath, 10 * 60);
  res.status(201).json({ record: attached.data, evidenceUrl: signed.data?.signedUrl || null });
}));

router.post('/attendance/time-out', requireRole('student'), asyncRoute(async (req, res) => {
  const parsed = z.object({ activity: noteSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Describe today\'s work in 3 to 500 characters.' });
  const { data, error } = await req.identity!.client.rpc('attendance_time_out', { activity: parsed.data.activity });
  if (error) return res.status(409).json({ error: error.message });
  res.json({ record: data });
}));

router.post('/attendance/:id/resubmit', requireRole('student'), asyncRoute(async (req, res) => {
  const parsed = z.object({ id: z.string().uuid(), activity: noteSchema }).safeParse({ ...req.params, ...req.body });
  if (!parsed.success) return res.status(400).json({ error: 'Select a valid record and provide a work summary.' });
  const { data, error } = await req.identity!.client.rpc('attendance_resubmit', {
    record_id: parsed.data.id,
    activity: parsed.data.activity,
  });
  if (error) return res.status(409).json({ error: error.message });
  res.json({ record: data });
}));

router.patch('/attendance/:id/review', requireRole('supervisor', 'admin'), asyncRoute(async (req, res) => {
  const parsed = z.object({
    id: z.string().uuid(),
    decision: z.enum(['verified', 'rejected']),
    remarks: z.string().trim().max(500).optional().default(''),
  }).superRefine((value, context) => {
    if (value.decision === 'rejected' && value.remarks.length < 3) {
      context.addIssue({ code: 'custom', path: ['remarks'], message: 'Explain why the record is being returned.' });
    }
  }).safeParse({ ...req.params, ...req.body });
  if (!parsed.success) return res.status(400).json({ error: 'Provide a valid decision and rejection remarks when returning a record.' });
  const { data, error } = await req.identity!.client.rpc('review_attendance', {
    record_id: parsed.data.id,
    decision: parsed.data.decision,
    remarks: parsed.data.remarks || null,
  });
  if (error) return res.status(409).json({ error: error.message });
  res.json({ record: data });
}));

export default router;
