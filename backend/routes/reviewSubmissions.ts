import { createHash, randomUUID } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncRoute, requireIdentity, requirePortal, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Storage bucket constant
const STORAGE_BUCKET = 'student_submissions';

// Multer memory storage with 20MB upper bound limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 2,
  },
});

const receiveSubmissionFiles: RequestHandler = (req, res, next) => {
  upload.fields([
    { name: 'pdf_file', maxCount: 1 },
    { name: 'source_file', maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum allowed limit (15 MB for PDF, 20 MB for source documents).' });
        }
        return res.status(400).json({ error: `Upload error: ${error.message}` });
      }
      return res.status(400).json({ error: 'Failed to process document upload.' });
    }
    next();
  });
};

const receiveRevisionFile: RequestHandler = (req, res, next) => {
  upload.single('pdf_file')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'PDF revision file must be 15 MB or smaller.' });
      }
      return res.status(400).json({ error: 'Failed to process revision upload.' });
    }
    next();
  });
};

/**
 * Validate that buffer starts with '%PDF-' magic bytes (0x25, 0x50, 0x44, 0x46, 0x2D)
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

/**
 * Validate DOCX ZIP magic bytes (PK\x03\x04: 0x50, 0x4B, 0x03, 0x04)
 */
export function validateDocxMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export function computeSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(0, 100);
}

// ============================================================
// 1. POST /api/review-submissions - Create review case from PDF submission
// ============================================================
router.post(
  '/review-submissions',
  requireIdentity,
  requirePortal,
  requireRole('student'),
  receiveSubmissionFiles,
  asyncRoute(async (req, res) => {
    const identity = req.identity!;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const pdfFile = files?.['pdf_file']?.[0];
    const sourceFile = files?.['source_file']?.[0];

    if (!pdfFile) {
      return res.status(400).json({ error: 'A review PDF file is required.' });
    }

    // 15 MB PDF Limit
    if (pdfFile.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'PDF file size exceeds 15 MB limit.' });
    }

    if (!validatePdfMagicBytes(pdfFile.buffer)) {
      return res.status(400).json({ error: 'The uploaded file is not a valid PDF document (magic byte signature mismatch).' });
    }

    if (sourceFile) {
      if (sourceFile.size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: 'Source document exceeds 20 MB limit.' });
      }
      if (!validateDocxMagicBytes(sourceFile.buffer)) {
        return res.status(400).json({ error: 'The source document is not a valid Word (.docx) file.' });
      }
    }

    const {
      client_submission_id,
      requirement_id,
      title,
      draft_id,
      expected_draft_revision,
      priority,
      remarks,
      source_kind,
    } = req.body;

    if (!requirement_id || typeof requirement_id !== 'string') {
      return res.status(400).json({ error: 'Requirement ID is required.' });
    }

    const submissionUuid = (client_submission_id && z.string().uuid().safeParse(client_submission_id).success)
      ? client_submission_id
      : randomUUID();

    const pdfHash = computeSha256(pdfFile.buffer);
    const sanitizedPdfName = sanitizeFileName(pdfFile.originalname || 'document.pdf');
    const pdfStoragePath = `cases/${identity.id}/${submissionUuid}/rev-1-${sanitizedPdfName}`;

    let sourceStoragePath: string | null = null;
    let sourceHash: string | null = null;
    let sanitizedSourceName: string | null = null;

    if (sourceFile) {
      sourceHash = computeSha256(sourceFile.buffer);
      sanitizedSourceName = sanitizeFileName(sourceFile.originalname || 'source.docx');
      sourceStoragePath = `cases/${identity.id}/${submissionUuid}/source-${sanitizedSourceName}`;
    }

    // Storage client: use identity.client, fallback to supabaseAdmin if needed
    const storageClient = identity.client.storage.from(STORAGE_BUCKET);
    const uploadedPaths: string[] = [];

    try {
      // Upload PDF
      const pdfUpload = await storageClient.upload(pdfStoragePath, pdfFile.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

      if (pdfUpload.error) {
        // Fallback to admin storage if user lacks direct bucket permission
        const adminUpload = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(pdfStoragePath, pdfFile.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
        if (adminUpload.error) throw new Error(`PDF storage upload failed: ${adminUpload.error.message}`);
      }
      uploadedPaths.push(pdfStoragePath);

      // Upload optional source document
      if (sourceFile && sourceStoragePath) {
        const sourceUpload = await storageClient.upload(sourceStoragePath, sourceFile.buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true,
        });
        if (sourceUpload.error) {
          const adminSourceUpload = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(sourceStoragePath, sourceFile.buffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true,
          });
          if (adminSourceUpload.error) throw new Error(`Source file upload failed: ${adminSourceUpload.error.message}`);
        }
        uploadedPaths.push(sourceStoragePath);
      }

      // Execute transactional RPC
      const rpcResult = await identity.client.rpc('create_review_case_from_submission', {
        p_client_submission_id: submissionUuid,
        p_requirement_id: requirement_id,
        p_title: title || sanitizedPdfName.replace(/\.pdf$/i, ''),
        p_file_path: pdfStoragePath,
        p_filename: sanitizedPdfName,
        p_mime_type: 'application/pdf',
        p_byte_size: pdfFile.size,
        p_checksum: pdfHash,
        p_source_kind: source_kind || (draft_id ? 'editor' : 'upload'),
        p_draft_id: draft_id && z.string().uuid().safeParse(draft_id).success ? draft_id : null,
        p_expected_draft_revision: expected_draft_revision ? parseInt(expected_draft_revision, 10) : null,
        p_source_file_path: sourceStoragePath,
        p_source_filename: sanitizedSourceName,
        p_source_mime_type: sourceFile ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : null,
        p_source_byte_size: sourceFile ? sourceFile.size : null,
        p_source_checksum: sourceHash,
        p_priority: priority || 'medium',
        p_remarks: remarks || null,
      });

      if (rpcResult.error) {
        throw new Error(rpcResult.error.message || 'Database rejected document submission.');
      }

      const caseData = rpcResult.data;
      return res.status(201).json({
        success: true,
        case_id: caseData.case_id,
        revision_id: caseData.revision_id,
        revision_number: caseData.revision_number,
        stage: caseData.stage,
        idempotent: Boolean(caseData.idempotent),
      });
    } catch (err: any) {
      // Transaction rollback cleanup: delete any uploaded files so we don't leave orphaned storage
      if (uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(uploadedPaths).catch(() => {});
      }
      return res.status(400).json({ error: err.message || 'Failed to submit document for review.' });
    }
  })
);

// ============================================================
// 2. POST /api/review-cases/:caseId/revisions - Submit iterative PDF revision
// ============================================================
router.post(
  '/review-cases/:caseId/revisions',
  requireIdentity,
  requirePortal,
  requireRole('student'),
  receiveRevisionFile,
  asyncRoute(async (req, res) => {
    const identity = req.identity!;
    const { caseId } = req.params;

    if (!caseId || !z.string().uuid().safeParse(caseId).success) {
      return res.status(400).json({ error: 'Valid review case ID is required.' });
    }

    const pdfFile = req.file;
    if (!pdfFile) {
      return res.status(400).json({ error: 'A review PDF file is required.' });
    }

    if (pdfFile.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'PDF file size exceeds 15 MB limit.' });
    }

    if (!validatePdfMagicBytes(pdfFile.buffer)) {
      return res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
    }

    const { expected_revision, remarks, source_kind } = req.body;
    const expectedRev = expected_revision ? parseInt(expected_revision, 10) : null;

    const pdfHash = computeSha256(pdfFile.buffer);
    const sanitizedPdfName = sanitizeFileName(pdfFile.originalname || 'revision.pdf');
    const timestamp = Date.now();
    const pdfStoragePath = `cases/${identity.id}/${caseId}/rev-${timestamp}-${sanitizedPdfName}`;

    let uploadedPath: string | null = null;
    try {
      const storageClient = identity.client.storage.from(STORAGE_BUCKET);
      const uploadRes = await storageClient.upload(pdfStoragePath, pdfFile.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

      if (uploadRes.error) {
        const adminUpload = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(pdfStoragePath, pdfFile.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
        if (adminUpload.error) throw new Error(`PDF upload failed: ${adminUpload.error.message}`);
      }
      uploadedPath = pdfStoragePath;

      const rpcResult = await identity.client.rpc('submit_case_revision', {
        p_case_id: caseId,
        p_expected_revision: expectedRev,
        p_file_path: pdfStoragePath,
        p_filename: sanitizedPdfName,
        p_mime_type: 'application/pdf',
        p_byte_size: pdfFile.size,
        p_checksum: pdfHash,
        p_source_kind: source_kind || 'upload',
        p_remarks: remarks || null,
      });

      if (rpcResult.error) {
        throw new Error(rpcResult.error.message || 'Database rejected revision submission.');
      }

      const revData = rpcResult.data;
      return res.status(201).json({
        success: true,
        case_id: revData.case_id,
        revision_id: revData.revision_id,
        revision_number: revData.revision_number,
        stage: revData.stage,
      });
    } catch (err: any) {
      if (uploadedPath) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([uploadedPath]).catch(() => {});
      }
      return res.status(400).json({ error: err.message || 'Failed to submit document revision.' });
    }
  })
);

// ============================================================
// 3. POST /api/editor/ai-check - In-editor Grammar, Clarity & Pre-submit Audit
// ============================================================

export interface AiSuggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'clarity' | 'tone';
  originalText: string;
  suggestion: string;
  explanation: string;
  offset?: number;
  length?: number;
}

export interface PreSubmitFinding {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}

export interface PreSubmitAuditResult {
  passed: boolean;
  score: number;
  findings: PreSubmitFinding[];
  summary: string;
}

/**
 * Deterministic rule-based text checker used when external LLM is offline or unconfigured.
 */
function performRuleBasedProofread(plainText: string): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  const rules = [
    { regex: /\b(teh)\b/gi, replacement: 'the', type: 'spelling' as const, reason: 'Common typo for "the".' },
    { regex: /\b(recieve)\b/gi, replacement: 'receive', type: 'spelling' as const, reason: 'Spelling rule: "i" before "e" except after "c".' },
    { regex: /\b(seperate)\b/gi, replacement: 'separate', type: 'spelling' as const, reason: 'Common spelling mistake.' },
    { regex: /\b(occured)\b/gi, replacement: 'occurred', type: 'spelling' as const, reason: 'Double "r" in occurred.' },
    { regex: /\b(in order to)\b/gi, replacement: 'to', type: 'clarity' as const, reason: 'Conciseness: "to" is more direct than "in order to".' },
    { regex: /\b(at this point in time)\b/gi, replacement: 'now', type: 'clarity' as const, reason: 'Wordiness: consider "now" or "currently".' },
    { regex: /\b(due to the fact that)\b/gi, replacement: 'because', type: 'clarity' as const, reason: 'Conciseness: "because" is clearer and more direct.' },
    { regex: /\b(i think that|i believe that)\b/gi, replacement: 'it is evident that', type: 'tone' as const, reason: 'Academic tone: avoid weak first-person qualifiers in formal reports.' },
    { regex: /\b(alot)\b/gi, replacement: 'a lot', type: 'spelling' as const, reason: '"a lot" is two words.' },
    { regex: /\b(definately)\b/gi, replacement: 'definitely', type: 'spelling' as const, reason: 'Correct spelling is "definitely".' },
    { regex: /\b(their is|there are a)\b/gi, replacement: 'there is', type: 'grammar' as const, reason: 'Check subject-verb agreement or homophone.' },
  ];

  for (const rule of rules) {
    let match: RegExpExecArray | null;
    const globalRegex = new RegExp(rule.regex.source, 'gi');
    while ((match = globalRegex.exec(plainText)) !== null) {
      suggestions.push({
        id: randomUUID(),
        type: rule.type,
        originalText: match[0],
        suggestion: rule.replacement,
        explanation: rule.reason,
        offset: match.index,
        length: match[0].length,
      });
      if (suggestions.length >= 35) break;
    }
  }

  // 1. Spacing: multiple consecutive spaces
  const multiSpaceRegex = /([^\s\n]) {2,}([^\s\n])/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = multiSpaceRegex.exec(plainText)) !== null) {
    suggestions.push({
      id: randomUUID(),
      type: 'clarity',
      originalText: sMatch[0],
      suggestion: `${sMatch[1]} ${sMatch[2]}`,
      explanation: 'Multiple spaces between words. Cleaned to single space.',
      offset: sMatch.index,
      length: sMatch[0].length,
    });
    if (suggestions.length >= 35) break;
  }

  // 2. Spacing: space before punctuation
  const spaceBeforePunctRegex = /([^\s\n])\s+([,.:;?!])/g;
  while ((sMatch = spaceBeforePunctRegex.exec(plainText)) !== null) {
    suggestions.push({
      id: randomUUID(),
      type: 'grammar',
      originalText: sMatch[0],
      suggestion: `${sMatch[1]}${sMatch[2]}`,
      explanation: 'Remove unnecessary space before punctuation.',
      offset: sMatch.index,
      length: sMatch[0].length,
    });
    if (suggestions.length >= 35) break;
  }

  // 3. Spacing: missing space after comma
  const commaSpaceRegex = /([A-Za-z0-9])(,)([A-Za-z])/g;
  while ((sMatch = commaSpaceRegex.exec(plainText)) !== null) {
    suggestions.push({
      id: randomUUID(),
      type: 'grammar',
      originalText: sMatch[0],
      suggestion: `${sMatch[1]}, ${sMatch[3]}`,
      explanation: 'Add space after comma.',
      offset: sMatch.index,
      length: sMatch[0].length,
    });
    if (suggestions.length >= 35) break;
  }

  // 4. Capitalization: first word of sentence lowercase
  const sentenceCapRegex = /(?:^|[.!?]\s+)([a-z][a-z0-9]*)/g;
  while ((sMatch = sentenceCapRegex.exec(plainText)) !== null) {
    const rawWord = sMatch[1];
    const capitalized = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
    suggestions.push({
      id: randomUUID(),
      type: 'grammar',
      originalText: rawWord,
      suggestion: capitalized,
      explanation: 'Capitalize the first word of a sentence.',
      offset: sMatch.index + (sMatch[0].length - rawWord.length),
      length: rawWord.length,
    });
    if (suggestions.length >= 35) break;
  }

  return suggestions;
}

/**
 * Perform rule-based pre-submission audit
 */
function performRuleBasedAudit(plainText: string, title?: string): PreSubmitAuditResult {
  const findings: PreSubmitFinding[] = [];
  const words = plainText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Length check
  if (wordCount < 20) {
    findings.push({
      severity: 'error',
      category: 'Completeness',
      message: `The document contains only ${wordCount} words. Practicum submissions require meaningful substantive content.`,
    });
  } else if (wordCount < 60) {
    findings.push({
      severity: 'warning',
      category: 'Length',
      message: `The document is relatively brief (${wordCount} words). Verify all required details are included.`,
    });
  }

  // 2. Unfilled placeholders
  const placeholderRegex = /\[(Insert|Date|Name|Company|Supervisor|Signature|Fill|TODO|TBD).*?\]|_{3,}|\b(TODO|TBD)\b/gi;
  const placeholderMatches = plainText.match(placeholderRegex);
  if (placeholderMatches && placeholderMatches.length > 0) {
    const uniquePlaceholders = Array.from(new Set(placeholderMatches)).slice(0, 3).join(', ');
    findings.push({
      severity: 'error',
      category: 'Unfilled Placeholders',
      message: `Found unfilled placeholders or template tokens (${uniquePlaceholders}). Complete all sections before submitting.`,
    });
  }

  // 3. Signature line or contact details
  const hasSignOff = /(sincerely|respectfully|regards|noted by|approved by|conforme|signature)/i.test(plainText);
  if (!hasSignOff && wordCount >= 30) {
    findings.push({
      severity: 'info',
      category: 'Sign-off & Attribution',
      message: 'Consider including a clear closing, sign-off line, or signature block if required by this document format.',
    });
  }

  // Calculate score
  let score = 100;
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  score = Math.max(0, score - (errorCount * 35) - (warningCount * 15));

  const passed = errorCount === 0;
  const summary = passed
    ? (warningCount === 0 ? 'Document is in good standing and ready for submission.' : 'Document meets basic standards with minor recommendations.')
    : 'Document requires attention before final submission.';

  return { passed, score, findings, summary };
}

router.post(
  '/editor/ai-check',
  requireIdentity,
  requirePortal,
  asyncRoute(async (req, res) => {
    const { content, mode = 'proofread', title, requirement_id } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Document text content is required for AI check.' });
    }

    // Clean HTML / tags if rich text was sent, preserving original spaces/lines
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();

    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (mode === 'pre_submit_audit') {
      // Pre-submission compliance check
      if (groqKey || (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY')) {
        try {
          const auditPrompt = `You are a strict practicum compliance auditor evaluating a student document before submission.
Document Title: ${title || 'Practicum Document'}
Requirement ID: ${requirement_id || 'general'}
Content:
${plainText.slice(0, 8000)}

Analyze for:
1. Completeness and length adequacy.
2. Unfilled placeholders like [Insert Name], TODO, etc.
3. Appropriate professional/academic tone.
4. Any critical missing sections.

You MUST return a JSON object matching this schema:
{
  "passed": boolean,
  "score": number (0-100),
  "summary": string,
  "findings": [
    {
      "severity": "error" | "warning" | "info",
      "category": string,
      "message": string
    }
  ]
}`;

          let responseText = '';
          if (groqKey) {
            const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: auditPrompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 1024,
              }),
            });
            if (resp.ok) {
              const d = await resp.json();
              responseText = d.choices?.[0]?.message?.content || '';
            }
          }

          if (!responseText && geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
            const resp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: auditPrompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
                }),
              }
            );
            if (resp.ok) {
              const d = await resp.json();
              responseText = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
          }

          if (responseText) {
            const parsed = JSON.parse(responseText);
            return res.json(parsed);
          }
        } catch (llmErr) {
          console.warn('[AI Check] LLM audit failed, falling back to rule-based audit:', llmErr);
        }
      }

      // Rule-based audit fallback
      const audit = performRuleBasedAudit(plainText, title);
      return res.json(audit);
    }

    // Default: 'proofread' mode
    if (groqKey || (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY')) {
      try {
        const proofreadPrompt = `You are an expert writing assistant for university practicum / OJT students.
Review the following text for spelling, grammar, clarity, sentence capitalization, spacing, and formatting.

SPECIFIC CRITERIA TO CHECK & FIX:
1. Sentence First-Word Capitalization: Flag any sentence, heading, or bullet item where the first word starts with a lowercase letter (e.g. "today we visited" -> "Today we visited"), or where words in the middle of a sentence are incorrectly capitalized.
2. Spacing Discrepancies: Flag excessive/multiple consecutive spaces between words, spaces before punctuation marks (like "word ,"), missing spaces after commas and periods (like "word,next" or "end.Next"), and irregular line indentation.
3. Spelling & Grammar: Flag typos, homophones, subject-verb agreement errors, and tense consistency.
4. Tone & Clarity: Professional, formal academic practicum tone.

Return a JSON object with this EXACT structure:
{
  "suggestions": [
    {
      "id": string (unique),
      "type": "spelling" | "grammar" | "clarity" | "tone",
      "originalText": string (exact text excerpt to replace - MUST match the text exactly so it can be replaced),
      "suggestion": string (suggested replacement text),
      "explanation": string (brief explanation of why, e.g. "Capitalize first word of sentence", "Remove extra space", "Missing space after comma")
    }
  ]
}

Content:
${plainText.slice(0, 8000)}`;

        let responseText = '';
        if (groqKey) {
          const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: proofreadPrompt }],
              response_format: { type: 'json_object' },
              temperature: 0.1,
              max_tokens: 1500,
            }),
          });
          if (resp.ok) {
            const d = await resp.json();
            responseText = d.choices?.[0]?.message?.content || '';
          }
        }

        if (!responseText && geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: proofreadPrompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
              }),
            }
          );
          if (resp.ok) {
            const d = await resp.json();
            responseText = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        }

        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json(parsed);
        }
      } catch (llmErr) {
        console.warn('[AI Check] LLM proofread failed, falling back to rule-based proofread:', llmErr);
      }
    }

    // Fallback: Rule-based proofread
    const suggestions = performRuleBasedProofread(plainText);
    return res.json({ suggestions });
  })
);

export default router;

