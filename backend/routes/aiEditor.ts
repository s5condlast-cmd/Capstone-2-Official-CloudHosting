import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { assistEditorText } from '../services/aiService';

export const aiEditorRouter = Router();

const assistSchema = z.object({
  action: z.enum(['improve', 'fix_grammar', 'make_formal', 'summarize', 'continue_writing', 'custom']),
  text: z.string().max(20000).optional().default(''),
  customPrompt: z.string().max(1000).optional().default(''),
  documentContext: z.string().max(25000).optional().default(''),
});

aiEditorRouter.post('/editor-assist', async (req: Request, res: Response): Promise<void> => {
  const parseResult = assistSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: parseResult.error.issues,
    });
    return;
  }

  const { action, text, customPrompt, documentContext } = parseResult.data;

  if (!text && !customPrompt && !documentContext) {
    res.status(400).json({
      success: false,
      error: 'No text or prompt provided for AI assistance.',
    });
    return;
  }

  try {
    const result = await assistEditorText({
      action,
      text,
      customPrompt,
      documentContext,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[AI Editor Route Error]', error);
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI assistant failed to generate content.',
    });
  }
});

