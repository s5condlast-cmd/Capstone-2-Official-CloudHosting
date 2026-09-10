import React from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';
import { DocumentProgressTimeline } from '@/src/components/compose/DocumentProgressTimeline';
import { Card } from '@/src/components/ui/Card';
import { useDocumentStatus } from '@/src/hooks/useDocumentStatus';

const ENDORSEMENT_TEMPLATES: DocumentTemplate[] = [
  {
    title: "STI OJT Endorsement Letter",
    pdfUrl: "/templates/FT-CRD-135-01 STI OJT Endorsement Letter Template.pdf",
    docUrl: "/templates/FT-CRD-135-01 STI OJT Endorsement Letter Template.docx",
    id: "h4"
  }
];

export const STIOJTEndorsementLetter = () => {
  const { status } = useDocumentStatus('John Dwayne B. Guaniso', 'STI OJT Endorsement Letter');

  const submissionInfo = [
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Status', value: status },
    { label: 'Deadline', value: 'May 15, 2026' },
  ];

  const adviserComments = [
    { author: 'Adviser', msg: 'Please make sure your endorsement letter is signed by the company supervisor before submitting.', time: 'April 24, 2026' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload Endorsement Letter"
      uploadDescription="Upload Signed Endorsement Letter"
      templates={ENDORSEMENT_TEMPLATES}
      status={status === 'Approved' ? 'Approved' : status === 'Revision Required' ? 'Returned' : 'Pending'}
      submissionInfo={submissionInfo}
      adviserFeedback="Please make sure your endorsement letter is signed by the company supervisor before submitting."
      adviserComments={adviserComments}
      lastUpdated="April 24, 2026"
      extraSidebarContent={
        <Card title="Submission Progress">
          <div className="p-1">
            <DocumentProgressTimeline status={status} />
          </div>
        </Card>
      }
    />
  );
};
