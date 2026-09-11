import { AiFindings } from '@/src/types';
export type { AiFindings };

export const aiService = {
  async analyzeDocument(
    docId: string,
    pdfUrl: string,
    metadata: { name: string; course: string; docType: string; company: string }
  ): Promise<AiFindings> {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          docId,
          pdfUrl,
          studentName: metadata.name,
          course: metadata.course,
          docType: metadata.docType,
          company: metadata.company
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      return await response.json() as AiFindings;
    } catch (error) {
      console.error('Error calling AI Review Assistant backend:', error);
      throw error;
    }
  },

  async generateProposalContent(params: {
    action: 'draft' | 'improve' | 'objectives' | 'custom';
    studentName?: string;
    programName?: string;
    companyName?: string;
    hoursRequired?: string;
    currentDraft?: string;
    customPrompt?: string;
  }): Promise<{ text: string; action: string }> {
    try {
      const response = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling AI Proposal generation backend:', error);
      throw error;
    }
  }
};
