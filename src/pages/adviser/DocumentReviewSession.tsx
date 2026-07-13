import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UnifiedReviewSession, StudentInfo, DocumentVersion, ReviewAuditLog } from '@/src/components/review/UnifiedReviewSession';
import { submissionStorage, StudentDocument } from '@/src/lib/submissionStorage';
import { motion } from 'motion/react';

export const DocumentReviewSession: React.FC = () => {
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
        // Only fetch from Supabase if it looks like a real UUID
        if (id.length > 10) {
          const fetchedDoc = await submissionStorage.getDocumentById(id);
          setDoc(fetchedDoc);
          setPdfUrl(submissionStorage.getFileUrl(fetchedDoc.file_path));
        } else {
          // Fallback for hardcoded mock docs in the table (id: '1', '2', etc)
          setDoc({
            id: id,
            student_name: 'Alice Brown',
            course: 'BSIT 402-401',
            doc_type: 'Prelim Journal',
            status: 'Pending Adviser Review',
            urgency: 'high',
            file_path: 'sample-journal.pdf',
            created_at: new Date().toISOString(),
            ai_status: 'Pending',
            ai_findings: null
          });
          setPdfUrl("/sample-journal.pdf");
        }
      } catch (err) {
        console.error("Failed to load document", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  // Map student data from fetched document or fallback to mock
  const student: StudentInfo = doc ? {
    name: doc.student_name,
    course: doc.course,
    docType: doc.doc_type,
    submissionId: `DOC-${doc.id.substring(0, 4).toUpperCase()}`,
    company: 'Host Company'
  } : {
    name: 'Alice Brown',
    course: 'BSIT 402-401',
    docType: 'Prelim Journal',
    submissionId: 'DOC-9021',
    company: 'Tech Solutions Inc.'
  };

  const versions: DocumentVersion[] = [
    {
      id: 'v2',
      version: 2,
      status: 'Submitted',
      date: 'April 30, 2026',
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
    { time: '10:44 AM', action: 'Status changed to In Review', actor: 'Dr. Smith' },
    { time: '10:42 AM', action: 'Reviewer opened session', actor: 'Dr. Smith' },
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
        onBack={() => navigate(-1)}
        onApprove={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Approved');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/adviser/review'), 1500);
        }}
        onSendToAdmin={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Pending Final Approval');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/adviser/review'), 1500);
        }}
        onRequestRevision={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Revision Required');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/adviser/review'), 1500);
        }}
        onReject={async () => {
          if (doc) await submissionStorage.updateDocumentStatus(doc.id, 'Revision Required');
          setQueueStatus('Completed');
          setTimeout(() => navigate('/adviser/review'), 1500);
        }}
      />
    </motion.div>
  );
};
