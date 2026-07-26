import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const ProposalLetterToTheIndustry = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Approved');

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
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Attempts', value: '1 of 3' },
  ];

  const adviserFeedback = status === 'Approved' ? "Proposal letter successfully issued and verified." :
    status === 'Pending' ? "Proposal request received. Processing within 2-3 business days." :
      "Please revise your proposal details.";

  return (
    <StudentDocumentPage
      uploadTitle="Upload Proposal Letter"
      uploadDescription="Upload Signed Proposal Letter"
      templates={templates}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback={adviserFeedback}
      lastUpdated="April 25, 2026"
    />
  );
};
