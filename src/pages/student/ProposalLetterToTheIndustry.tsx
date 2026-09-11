import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const ProposalLetterToTheIndustry = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const templates: DocumentTemplate[] = [
    {
      title: "Proposal Letter to the Industry",
      docUrl: "/templates/FT-CRD-134-01 Proposal Letter to the Industry Template.docx",
      pdfUrl: "/templates/FT-CRD-134-01 Proposal Letter to the Industry Template.pdf",
      id: "h12"
    }
  ];

  const submissionInfo = [
    { label: 'Required pages', value: '1' },
    { label: 'File type', value: 'PDF or DOCX' },
    { label: 'Max size', value: '15 MB' },
    { label: 'Attempts', value: '1 of 3' },
  ];

  const adviserFeedback = status === 'Approved' ? "Proposal letter successfully issued and verified." :
    status === 'Returned' ? "Please revise your proposal details and re-upload." :
      "Submit your Proposal Letter (PDF or DOCX) for your adviser to review and approve.";

  return (
    <StudentDocumentPage
      uploadTitle="Upload Proposal Letter"
      uploadDescription="Upload Signed Proposal Letter (PDF or DOCX)"
      templates={templates}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback={adviserFeedback}
      lastUpdated="May 12, 2026"
      showOneDriveCard={false}
    />
  );
};
