import { useState, useEffect } from 'react';
import { submissionStorage, DocumentStatus } from '@/src/lib/submissionStorage';

export function useDocumentStatus(studentName: string, docType: string) {
  const [status, setStatus] = useState<DocumentStatus | 'Draft'>('Draft');
  const [isLoading, setIsLoading] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setIsLoading(true);
        const doc = await submissionStorage.getLatestDocumentByType(studentName, docType);
        
        if (doc) {
          setStatus(doc.status);
          setDocumentId(doc.id);
        } else {
          setStatus('Draft');
          setDocumentId(null);
        }
      } catch (error) {
        console.error('Failed to fetch document status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [studentName, docType]);

  // Helper function to force refresh the status (e.g., after upload)
  const refreshStatus = async () => {
    try {
      const doc = await submissionStorage.getLatestDocumentByType(studentName, docType);
      if (doc) {
        setStatus(doc.status);
        setDocumentId(doc.id);
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

  return { status, setStatus, isLoading, documentId, refreshStatus };
}
