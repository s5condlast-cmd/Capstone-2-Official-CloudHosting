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
  }
};
