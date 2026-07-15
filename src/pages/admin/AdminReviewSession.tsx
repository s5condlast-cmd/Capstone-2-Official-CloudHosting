import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UnifiedReviewSession, StudentInfo, DocumentVersion, ReviewAuditLog } from '@/src/components/review/UnifiedReviewSession';
import { submissionStorage, StudentDocument } from '@/src/lib/submissionStorage';
import { motion } from 'motion/react';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export const AdminReviewSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = React.useState<StudentDocument | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string>("");
  const [queueStatus, setQueueStatus] = useState<'Pending' | 'Assigned' | 'In Review' | 'Completed'>('In Review');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const fetchedDoc = await submissionStorage.getDocumentById(id);
        setDoc(fetchedDoc);
        if (fetchedDoc) {
          setPdfUrl(submissionStorage.getFileUrl(fetchedDoc.file_path));
        }
      } catch (err) {
        console.error("Failed to load document", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  // If no document is found, student is null but we handle that below
  const student: StudentInfo | null = doc ? {
    name: doc.student_name,
    course: doc.course,
    docType: doc.doc_type,
    submissionId: `DOC-${doc.id.substring(0, 4).toUpperCase()}`,
    company: 'Host Company' // In real app, fetch company name based on doc.student_id
  } : null;

  const versions: DocumentVersion[] = [
    {
      id: 'v2',
      version: 2,
      status: 'Submitted',
      date: 'May 4, 2026',
      isActive: true
    },
    {
      id: 'v1',
      version: 1,
      status: 'Revision Required',
      date: 'April 20, 2026',
      isActive: false
    }
  ];

  const auditLogs: ReviewAuditLog[] = [
    { time: '2:30 PM', action: 'Status changed to In Review', actor: 'Admin' },
    { time: '2:25 PM', action: 'Admin opened session', actor: 'Admin' },
    { time: '10:35 AM', action: 'Student uploaded document', actor: 'Alice Brown' }
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent dark:border-white rounded-full animate-spin" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider animate-pulse">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!doc || !student) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <EmptyState 
          icon={<FileQuestion size={32} />}
          title="Document Not Found"
          description="The requested document could not be found or has been removed."
          action={
            <Button onClick={() => navigate('/admin/documents')}>
              Back to Documents
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950"
    >
      <UnifiedReviewSession 
        student={student}
        pdfUrl={pdfUrl}
        queueStatus={queueStatus}
        versions={versions}
        auditLogs={auditLogs}
        docId={doc?.id}
        initialAiStatus={doc?.ai_status}
        initialAiFindings={doc?.ai_findings}
        onBack={() => navigate('/admin/documents')}
        onApprove={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Approved');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/admin/documents'), 1500);
        }}
        onRequestRevision={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Revision Required');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/admin/documents'), 1500);
        }}
        onReject={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Revision Required'); // Or another status if Reject exists
          setQueueStatus('Completed');
          setTimeout(() => navigate('/admin/documents'), 1500);
        }}
      />
    </motion.div>
  );
};
