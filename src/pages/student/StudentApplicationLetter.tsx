import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const StudentApplicationLetter = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Returned');

  const templates: DocumentTemplate[] = [
    {
      title: "Student Application Letter",
      docUrl: "/templates/FT-CRD-137-01 Student Application Letter Template.docx",
      pdfUrl: "/templates/FT-CRD-137-01 Student Application Letter Template.pdf",
      id: "h11"
    }
  ];

  const submissionInfo = [
    { label: 'Required pages', value: '1' },
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Attempts', value: '2 of 3' },
  ];

  const adviserFeedback = status === 'Approved' ? "Application Letter successfully verified." :
    status === 'Pending' ? "Waiting for adviser to verify signature." :
      "The signatory must initial the page. Please re-scan.";

  return (
    <StudentDocumentPage
      uploadTitle="Upload Application Letter"
      uploadDescription="Upload Signed Application Letter"
      templates={templates}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback={adviserFeedback}
      lastUpdated="April 28, 2026"
    />
  );
};
