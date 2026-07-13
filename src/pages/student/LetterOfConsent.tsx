import React, { useState } from 'react';
import { StudentDocumentPage, DocumentTemplate } from '@/src/components/compose/StudentDocumentPage';

export const LetterOfConsent = () => {
  const [status] = useState<'Pending' | 'Approved' | 'Returned'>('Pending');

  const templates: DocumentTemplate[] = [
    {
      title: "Parent Consent (Without Fee)",
      pdfUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf",
      docUrl: "/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.docx",
      id: "parent-no-fee",
      instructionsModal: {
        title: "Parent Consent Form Requirements",
        description: "Please fill out this form if you do not have any training fees required for your OJT. Ensure all sections are completed and signed by your parent or guardian."
      }
    },
    {
      title: "Parent Consent (With Fee)",
      pdfUrl: "/templates/FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.pdf",
      docUrl: "/templates/FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.docx",
      id: "parent-with-fee",
      instructionsModal: {
        title: "Parent Consent Form Requirements",
        description: "Please fill out this form if your OJT involves a training fee. Ensure all sections are completed and signed by your parent or guardian."
      }
    },
    {
      title: "Student Consent (Without Fee)",
      pdfUrl: "/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.pdf",
      docUrl: "/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.docx",
      id: "student-no-fee",
      instructionsModal: {
        title: "Student Consent Form Requirements",
        description: "Please fill out this form if you do not have any training fees required for your OJT and are of legal age to sign for yourself."
      }
    },
    {
      title: "Student Consent (With Fee)",
      pdfUrl: "/templates/FT-CRD-138-01 Student Consent Form with Training Fee Template.pdf",
      docUrl: "/templates/FT-CRD-138-01 Student Consent Form with Training Fee Template.docx",
      id: "student-with-fee",
      instructionsModal: {
        title: "Student Consent Form Requirements",
        description: "Please fill out this form if your OJT involves a training fee and you are of legal age to sign for yourself."
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
