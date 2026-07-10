// html2pdf removed natively using window.print() instead

import { TemplateHandler } from 'easy-template-x';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const withTimeout = <T>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms))
  ]);
};

export const documentGenerator = {
  /**
   * Generates a perfectly accurate DOCX file using easy-template-x or docx for specific templates
   */
  async generateDocx(templateUrl: string, formData: Record<string, string>): Promise<Blob> {
    return withTimeout((async () => {
      // Intercept the Student Application Letter template and generate it programmatically for complete wording accuracy
      if (templateUrl.includes('FT-CRD-137-01') || templateUrl.includes('Application_Letter')) {
        const doc = new Document({
          styles: {
            default: {
              document: {
                run: {
                  font: "Times New Roman",
                  size: 22, // 11pt
                },
                paragraph: {
                  spacing: {
                    line: 360, // 1.5 line spacing (360 twips)
                    after: 240, // 12pt space after (240 twips)
                  }
                }
              }
            }
          },
          sections: [{
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: [
              // Date
              new Paragraph({
                children: [
                  new TextRun({ text: formData.date || '[Date]' })
                ],
                spacing: { after: 480 } // Double space
              }),

              // Recipient Block
              new Paragraph({
                children: [
                  new TextRun({ text: formData.contactPerson || '[Industry Representative Name]', bold: true, break: 1 }),
                  new TextRun({ text: formData.contactTitle || '[Position / Title]', break: 1 }),
                  new TextRun({ text: formData.companyName || '[Company Name]', break: 1 }),
                  new TextRun({ text: formData.companyAddress || '[Company Address]', break: 1 }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 480 }
              }),

              // Salutation
              new Paragraph({
                children: [
                  new TextRun({ text: "Dear Mr./Ms. " }),
                  new TextRun({ text: formData.contactPerson || '[Industry Representative Name]', bold: true }),
                  new TextRun({ text: ":" })
                ],
                spacing: { after: 240 }
              }),

              // Body Paragraph 1
              new Paragraph({
                children: [
                  new TextRun({ text: "I, a student of STI " }),
                  new TextRun({ text: formData.campusName || '[Campus Name]', bold: true }),
                  new TextRun({ text: ", am required to undergo " }),
                  new TextRun({ text: formData.hoursRequired || '[Required OJT Hours]', bold: true }),
                  new TextRun({ text: " hours of On-the-Job Training (OJT) in partial fulfillment of the requirements for my " }),
                  new TextRun({ text: formData.programName || '[Degree / Program Name]', bold: true }),
                  new TextRun({ text: " program." }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240 }
              }),

              // Body Paragraph 2
              new Paragraph({
                children: [
                  new TextRun({ text: "I can acquire valuable knowledge and skills to complement those I have learned from school with your company. In return, I offer my services and determination to be an asset to your company throughout my training period." })
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240 }
              }),

              // Body Paragraph 3
              new Paragraph({
                children: [
                  new TextRun({ text: "Enclosed is an endorsement letter from my Program Head and my resume." }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240 }
              }),

              // Body Paragraph 4
              new Paragraph({
                children: [
                  new TextRun({ text: "I am hoping for your kind consideration." })
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240 }
              }),

              // Body Paragraph 5
              new Paragraph({
                children: [
                  new TextRun({ text: "Thank you." })
                ],
                spacing: { after: 480 }
              }),

              // Sign-off
              new Paragraph({
                children: [
                  new TextRun({ text: "Respectfully yours," })
                ],
                spacing: { after: 720 }
              }),

              // Signature Block
              new Paragraph({
                children: [
                  new TextRun({ text: formData.studentName || '[Name of Student Trainee]', bold: true }),
                  new TextRun({ text: "OJT Applicant", break: 1 })
                ]
              })
            ]
          }]
        });

        return await Packer.toBlob(doc);
      }

      // INTEGRATION PAPER GENERATOR
      if (templateUrl.includes('FT-CRD-127-01') || templateUrl.includes('Integration_Paper')) {
        const doc = new Document({
          styles: {
            default: {
              document: {
                run: { font: "Times New Roman", size: 24 }, // 12pt
                paragraph: { spacing: { line: 360 } }
              }
            }
          },
          sections: [{
            properties: {},
            children: [
              // TITLE PAGE (Page 1)
              new Paragraph({
                children: [new TextRun({ text: "ON-THE-JOB TRAINING", bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 2880, after: 240 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "at", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [new TextRun({ text: formData.companyName || '[Host Training Establishment]', bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2880 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "In Partial Fulfillment of", size: 24 })],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [new TextRun({ text: "the Requirements for", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [new TextRun({ text: formData.programName || '[Name of Program]', bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2880 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "Submitted by:", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [new TextRun({ text: formData.studentName || '[Student Trainee]', bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2880 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "Submitted to:", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [new TextRun({ text: formData.coordinatorName || '[OJT Coordinator]', bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 1440 }
              }),
              new Paragraph({
                children: [new TextRun({ text: formData.date || '[Date Submitted]', size: 24 })],
                alignment: AlignmentType.CENTER,
              }),

              // PAGE 2: Table of Contents
              new Paragraph({
                children: [new TextRun({ text: "Table of Contents", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                pageBreakBefore: true,
                spacing: { before: 720, after: 720 }
              }),
              new Paragraph({ text: "Company Profile ................................................................ 1" }),
              new Paragraph({ text: "Summary of the OJT Experience .............................................. 2" }),
              new Paragraph({ text: "Assessment of the OJT/Practicum Program .................................. 3" }),
              new Paragraph({ text: "    A. New knowledge, attitudes, and skills acquired" }),
              new Paragraph({ text: "    B. Theories seen in practice" }),
              new Paragraph({ text: "    C. Feedback that can be given to the company or institution" }),
              new Paragraph({ text: "    D. Benefits gained" }),
              new Paragraph({ text: "    E. Problems encountered" }),
              new Paragraph({ text: "Appendices ..................................................................... 4" }),
              new Paragraph({ text: "    A. Company brochure and/or pamphlet" }),
              new Paragraph({ text: "    B. Copy of the Endorsement Letter" }),
              new Paragraph({ text: "    C. Copy of the Training Plan" }),
              new Paragraph({ text: "    D. Daily Time Record" }),
              new Paragraph({ text: "    E. Weekly Journal" }),
              new Paragraph({ text: "    F. Quarterly Performance Appraisal Forms" }),
              new Paragraph({ text: "    G. Certificate of Completion" }),

              // PAGE 3: Company Profile
              new Paragraph({
                children: [new TextRun({ text: "1", size: 24 })],
                alignment: AlignmentType.RIGHT,
                pageBreakBefore: true,
              }),
              new Paragraph({
                children: [new TextRun({ text: "Company Profile", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 720, after: 720 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "Student trainees must provide a brief history of the company. The description should be 1-2 pages." })],
                alignment: AlignmentType.JUSTIFIED,
              }),

              // PAGE 4: Summary of OJT Experience
              new Paragraph({
                children: [new TextRun({ text: "2", size: 24 })],
                alignment: AlignmentType.RIGHT,
                pageBreakBefore: true,
              }),
              new Paragraph({
                children: [new TextRun({ text: "Summary of the OJT Experience", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 720, after: 720 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "Student trainees must summarize their OJT experience. The narrative must be a maximum of three (3) pages." })],
                alignment: AlignmentType.JUSTIFIED,
              }),

              // PAGE 5: Assessment
              new Paragraph({
                children: [new TextRun({ text: "3", size: 24 })],
                alignment: AlignmentType.RIGHT,
                pageBreakBefore: true,
              }),
              new Paragraph({
                children: [new TextRun({ text: "Assessment of the OJT/Practicum Program", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 720, after: 720 }
              }),
              new Paragraph({ text: "A. New knowledge, attitudes, and skills acquired" }),
              new Paragraph({ text: "B. Theories seen in practice" }),
              new Paragraph({ text: "C. Feedback that can be given to the company or institution" }),
              new Paragraph({ text: "D. Benefits gained" }),
              new Paragraph({ text: "E. Problems encountered" }),

              // PAGE 6: Appendices
              new Paragraph({
                children: [new TextRun({ text: "4", size: 24 })],
                alignment: AlignmentType.RIGHT,
                pageBreakBefore: true,
              }),
              new Paragraph({
                children: [new TextRun({ text: "Appendices", bold: true, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 720, after: 720 }
              }),
              new Paragraph({ text: "A. Company brochure and/or pamphlet" }),
              new Paragraph({ text: "B. Copy of the Endorsement Letter" }),
              new Paragraph({ text: "C. Copy of the Training Plan" }),
              new Paragraph({ text: "D. Daily Time Record" }),
              new Paragraph({ text: "E. Weekly Journal" }),
              new Paragraph({ text: "F. Quarterly Performance Appraisal Forms" }),
              new Paragraph({ text: "G. Certificate of Completion" }),
            ]
          }]
        });

        return await Packer.toBlob(doc);
      }

      // Default: Use easy-template-x for all other templates
      const response = await fetch(templateUrl);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const templateBuffer = await response.arrayBuffer();
      const handler = new TemplateHandler();
      
      const outputBuffer = await handler.process(templateBuffer, formData);
      return new Blob([outputBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    })(), 10000, 'Document generation timed out');
  },

  /**
   * Helper to trigger a download of a Blob
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
