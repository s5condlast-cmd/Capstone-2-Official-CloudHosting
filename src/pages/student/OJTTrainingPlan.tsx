import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

const TRAINING_PLAN_TEMPLATES: DocumentTemplate[] = [
  {
    title: "OJT Training Plan (BSIT/BSCS/BSIS/ACT/ITP)",
    pdfUrl: "/templates/FT-CRD-176-00 OJT Training Plan_BSIT-BSCS-BSIS-ACT-ITP.pdf",
    docUrl: "/templates/FT-CRD-176-00 OJT Training Plan_BSIT-BSCS-BSIS-ACT-ITP.docx",
    id: "h7"
  },
  {
    title: "OJT Training Plan (BSCpE)",
    pdfUrl: "/templates/FT-CRD-175-00 OJT Training Plan_BSCpE (1).pdf",
    docUrl: "/templates/FT-CRD-175-00 OJT Training Plan_BSCpE (1).docx",
    id: "h7"
  }
];

export const OJTTrainingPlan = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const submissionInfo = [
    { label: 'File type', value: 'PDF / DOCX' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Attempts', value: '0 of 3' },
    { label: 'Deadline', value: 'May 20, 2026' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload OJT Training Plan"
      uploadDescription="Upload Signed OJT Training Plan"
      templates={TRAINING_PLAN_TEMPLATES}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback="Awaiting your submission."
      lastUpdated="May 11, 2026"
    />
  );
};
