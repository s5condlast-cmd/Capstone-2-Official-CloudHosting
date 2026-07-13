import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const LetterOfConsent = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const templates: DocumentTemplate[] = [
    {
      title: "Letter of Consent",
      pdfUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf",
      docUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.docx",
      id: "h2",
      instructionsModal: {
        title: "Letter of Consent Requirements",
        description: "Please fill out the unified Letter of Consent. If you are a minor or have training fees, ensure the appropriate sections are completed and notarized as required by the APO."
      }
    }
  ];

  const submissionInfo = [
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Attempts', value: '0 of 3' },
    { label: 'Deadline', value: 'May 10, 2026' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload Consent Form"
      uploadDescription="Upload Signed Letter of Consent"
      templates={templates}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback="Awaiting your submission."
    />
  );
};
