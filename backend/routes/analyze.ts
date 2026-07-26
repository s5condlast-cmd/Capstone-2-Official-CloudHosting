import { Router } from 'express';
import { supabase } from '../config/supabase';
import { extractTextFromPdfBuffer } from '../utils/pdfParser';
import { analyzeDocumentText } from '../services/aiService';

const router = Router();

router.post('/analyze', async (req, res) => {
  const { docId, pdfUrl, studentName, course, docType, company } = req.body;

  if (!docId || !pdfUrl) {
    return res.status(400).json({ error: 'Missing docId or pdfUrl in request body.' });
  }

  console.log(`[Backend Route] Starting analysis for Doc ID: ${docId}`);

  try {
    // 1. Set DB status to Processing
    await supabase
      .from('student_documents')
      .update({ ai_status: 'Processing', ai_findings: null })
      .eq('id', docId);

    // 2. Fetch the PDF buffer from the public URL
    const fileResponse = await fetch(pdfUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch PDF file from URL: ${pdfUrl}`);
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // 3. Extract text from the PDF buffer
    const docText = await extractTextFromPdfBuffer(fileBuffer);

    // 4. Run AI analysis
    const findings = await analyzeDocumentText(docText, {
      name: studentName,
      course,
      docType,
      company
    });

    // 5. Save findings back to Supabase
    const { error: updateError } = await supabase
      .from('student_documents')
      .update({ ai_status: 'Completed', ai_findings: findings })
      .eq('id', docId);

    if (updateError) {
      throw new Error(`Failed to save findings to Supabase: ${updateError.message}`);
    }

    console.log(`[Backend Route] Analysis successfully saved for Doc ID: ${docId}`);
    return res.json(findings);

  } catch (error: any) {
    console.error(`[Backend Route] Error analyzing Doc ID: ${docId}:`, error);

    // Update status to Failed in database
    await supabase
      .from('student_documents')
      .update({ ai_status: 'Failed' })
      .eq('id', docId);

    return res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
  }
});

export default router;
