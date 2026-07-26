import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const MemorandumOfAgreement = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Returned');

  const templates: DocumentTemplate[] = [
    {
      title: "Memorandum of Agreement",
      docUrl: "/templates/FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.docx",
      pdfUrl: "/templates/FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.pdf",
      id: "h3"
    }
  ];

  const submissionInfo = [
    { label: 'Required pages', value: '6' },
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Attempts', value: '2 of 3' },
  ];

  const adviserFeedback = status === 'Approved' ? "Legal partnership successfully registered." :
    status === 'Pending' ? "Waiting for legal team to verify signatures." :
      "The signatory must initial every page. Please re-scan with all 6 pages.";

  const adviserComments = [
    { author: 'Adviser', msg: 'Please make sure all parties have signed the MOA before submitting.', time: 'April 27, 2026' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload Memorandum of Agreement"
      uploadDescription="Upload Signed Memorandum of Agreement"
      templates={templates}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback={adviserFeedback}
      lastUpdated="April 28, 2026"
      adviserComments={adviserComments}
    />
  );
};
