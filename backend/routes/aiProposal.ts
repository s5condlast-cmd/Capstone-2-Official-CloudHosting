import { Router } from 'express';
import { generateProposalContent } from '../services/aiProposalService';

const router = Router();

router.post('/ai/proposal', async (req, res) => {
  try {
    const { action, studentName, programName, companyName, hoursRequired, currentDraft, customPrompt } = req.body || {};
    
    console.log(`[Backend Route] AI Proposal generation requested: action=${action || 'draft'}`);

    const result = await generateProposalContent({
      action: action || 'draft',
      studentName,
      programName,
      companyName,
      hoursRequired,
      currentDraft,
      customPrompt
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[Backend Route] AI Proposal generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate proposal letter content.'
    });
  }
});

export default router;
