import { apiJson } from './api';

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

export async function proofreadDocument(
  content: string,
  title?: string,
  requirementId?: string
): Promise<AiSuggestion[]> {
  try {
    const data = await apiJson<{ suggestions: AiSuggestion[] }>('/api/editor/ai-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        mode: 'proofread',
        title,
        requirement_id: requirementId,
      }),
    });
    return data.suggestions || [];
  } catch (err: any) {
    console.error('[editorAiService] Proofread failed:', err);
    throw new Error(err.message || 'Unable to check document for suggestions.');
  }
}

export async function auditDocumentBeforeSubmit(
  content: string,
  title?: string,
  requirementId?: string
): Promise<PreSubmitAuditResult> {
  try {
    const data = await apiJson<PreSubmitAuditResult>('/api/editor/ai-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        mode: 'pre_submit_audit',
        title,
        requirement_id: requirementId,
      }),
    });
    return data;
  } catch (err: any) {
    console.error('[editorAiService] Pre-submit audit failed:', err);
    throw new Error(err.message || 'Unable to complete pre-submission compliance audit.');
  }
}

