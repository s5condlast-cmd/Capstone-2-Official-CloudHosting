import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

const INTEGRATION_PAPER_TEMPLATES: DocumentTemplate[] = [
  {
    title: "Integration Paper",
    pdfUrl: "/templates/FT-CRD-127-01 Integration Paper Template.pdf",
    docUrl: "/templates/FT-CRD-127-01 Integration Paper Template.docx",
    id: "h8"
  }
];

export const IntegrationPaper = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const submissionInfo = [
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Status', value: 'Locked' },
    { label: 'Prerequisite', value: '460 hours' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload Integration Paper"
      uploadDescription="Upload Signed Integration Paper"
      templates={INTEGRATION_PAPER_TEMPLATES}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback="Complete 460 training hours before submitting your integration paper."
      lastUpdated="May 11, 2026"
      isLocked={true}
      lockedMessage="Unlocks at 460 hours"
    />
  );
};
