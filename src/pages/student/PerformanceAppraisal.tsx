import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

const PERFORMANCE_APPRAISAL_TEMPLATES: DocumentTemplate[] = [
  {
    title: "Performance Appraisal",
    pdfUrl: "/templates/FT-CRD-133-02 Performance Appraisal Template.pdf",
    docUrl: "/templates/FT-CRD-133-02 Performance Appraisal Template.docx",
    id: "h10"
  }
];

export const PerformanceAppraisal = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const submissionInfo = [
    { label: 'File type', value: 'PDF' },
    { label: 'Max size', value: '10 MB' },
    { label: 'Status', value: 'Locked' },
    { label: 'Prerequisite', value: '460 hours' },
  ];

  return (
    <StudentDocumentPage
      uploadTitle="Upload Performance Appraisal"
      uploadDescription="Upload Signed Performance Appraisal"
      templates={PERFORMANCE_APPRAISAL_TEMPLATES}
      status={status}
      submissionInfo={submissionInfo}
      adviserFeedback="Complete 460 training hours before submitting your performance appraisal."
      lastUpdated="May 11, 2026"
      isLocked={true}
      lockedMessage="Unlocks at 460 hours"
    />
  );
};
