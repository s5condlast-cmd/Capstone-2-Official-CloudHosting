import { TemplateHandler } from 'easy-template-x';
import JSZip from 'jszip';
import { Document, Paragraph, TextRun, AlignmentType, Packer, VerticalAlign, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

import { templateStorage } from '@/src/lib/templateStorage';

const withTimeout = <T>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms))
  ]);
};

export const documentGenerator = {
  /**
   * Generates a perfectly accurate DOCX file matching the official STI layout (Image 1 reference)
   */
  async generateDocx(
    templateUrl: string, 
    formData: Record<string, string>,
    blankEdits: string[] = [],
    angleData: Record<string, string> = {},
    squareData: Record<string, string> = {},
    dateEdits: string[] = [],
    templateId?: string,
    title?: string
  ): Promise<Blob> {
    return withTimeout((async () => {
      // Merge all key-value mappings
      const allData: Record<string, string> = {
        ...formData,
        ...squareData,
        ...angleData,
      };

      const docTitle = title || '';
      const isApplicationLetter = docTitle.toLowerCase().includes('application') || !docTitle.toLowerCase().includes('endorsement');

      // Helper to fetch typed non-empty values from allData
      const getVal = (key: string, synonyms: string[] = []): string => {
        const candidates = [key, ...synonyms];
        for (const k of candidates) {
          const val = allData[k];
          if (val && typeof val === 'string' && val.trim() !== '' && !val.startsWith('<')) {
            return val.trim();
          }
        }
        return '';
      };

      // Format date formally (e.g. July 26, 2026)
      const rawDate = getVal('date');
      let dateText = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (rawDate) {
        const parsedDate = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`);
        if (!isNaN(parsedDate.getTime())) {
          dateText = parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } else {
          dateText = rawDate;
        }
      }

      const recipientName = getVal('contactPerson', ['Name of Host Training Establishment Representative', 'Industry Representative Name']);
      const designationText = getVal('contactTitle', ['Designation', 'Position / Title']);
      const companyNameText = getVal('companyName', ['Name of Host Company', 'Company Name']);
      const salutationNameText = getVal('salutationName', ['Name of Host Training Establishment']);
      const addressText = getVal('companyAddress', ['Address', 'Company Address']);
      const campusNameText = getVal('campusName', ['name of campus', 'Campus Name']) || 'Marikina';
      const hoursText = getVal('hoursRequired', ['no. of training hours', 'Required OJT Hours']) || '486';
      const programText = getVal('programName', ['Name of Program', 'Degree / Program Name']) || 'Bachelor of Science in Information Technology';
      const signatureText = getVal('signature', ['Signature']);
      const studentNameText = getVal('studentName', ['Name of Student Trainee']) || 'John Dwayne B. Guaniso';
      const phoneText = getVal('phoneNumber', ['contact number', 'contactNumber']) || '0917-123-4567';
      const emailText = getVal('email', ['email address', 'emailAddress']) || 'student@sti.edu.ph';
      const programHeadText = getVal('programHead', ['Name of Program Head']) || 'Prof. Maria Santos, MIT';
      const academicHeadText = getVal('academicHead', ['Name of Academic Head']) || 'Dr. Antonio Reyes, PhD';

      // 1. Fetch the raw .docx buffer if available
      let arrayBuffer: ArrayBuffer | undefined;
      if (templateId) {
        arrayBuffer = await templateStorage.getTemplateFile(templateId);
      }
      
      if (!arrayBuffer && templateUrl) {
        try {
          const fetchUrl = templateUrl.includes('?') ? `${templateUrl}&t=${Date.now()}` : `${templateUrl}?t=${Date.now()}`;
          const response = await fetch(fetchUrl);
          if (response.ok) {
            const buf = await response.arrayBuffer();
            const view = new Uint8Array(buf);
            if (view.length > 4 && view[0] === 0x50 && view[1] === 0x4B) {
              arrayBuffer = buf;
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch DOCX template buffer", fetchErr);
        }
      }

      // 2. Perform direct JSZip XML text manipulation if valid docx zip buffer exists
      if (arrayBuffer) {
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const docXmlFile = zip.file("word/document.xml");

          if (docXmlFile) {
            let xmlString = await docXmlFile.async("string");

            // 1. Inject Blanks (_{3,}) via JSZip regex
            // Preserve the visual line by injecting Word underline XML around the replaced text,
            // while carefully copying the original run properties (w:rPr) so font/color isn't lost.
            let blankIndex = 0;
            xmlString = xmlString.replace(/(<w:r(?: [^>]+)?>)(.*?)(<\/w:r>)/g, (fullRun, rStart, rContent, rEnd) => {
              if (/_{3,}/.test(rContent)) {
                const rPrMatch = rContent.match(/<w:rPr.*?>.*?<\/w:rPr>/);
                const rPr = rPrMatch ? rPrMatch[0] : '';
                
                const newContent = rContent.replace(/_{3,}/g, (match) => {
                  const rep = blankEdits[blankIndex++];
                  if (rep && rep.trim() !== '') {
                     let newRPr = rPr;
                     if (!newRPr) {
                       newRPr = '<w:rPr><w:u w:val="single"/></w:rPr>';
                     } else if (!newRPr.includes('<w:u ')) {
                       newRPr = newRPr.replace('</w:rPr>', '<w:u w:val="single"/></w:rPr>');
                     }
                     // Break current text run, insert new underlined run with identical properties, and resume
                     return `</w:t>${rEnd}${rStart}${newRPr}<w:t>${rep}</w:t>${rEnd}${rStart}${rPr}<w:t>`;
                  }
                  return match;
                });
                return `${rStart}${newContent}${rEnd}`;
              }
              return fullRun;
            });
            
            // 2. Inject Dates via JSZip regex
            let dateIdx = 0;
            xmlString = xmlString.replace(/>(\s*Date\s*:?\s*)</g, (match, inner) => {
              const rep = dateEdits[dateIdx];
              dateIdx++;
              return rep && rep.trim() !== '' ? `>${rep}<` : match;
            });

            zip.file("word/document.xml", xmlString);

            // Generate intermediate buffer from JSZip
            const intermediateBuffer = await zip.generateAsync({ type: "nodebuffer" });

            // 3. Inject Angle Tags (<TAG>) via easy-template-x
            const handler = new TemplateHandler({
              delimiters: { tagStart: "<", tagEnd: ">" }
            });

            // Map standard placeholders into the data object to ensure fallback coverage
            const dataForTemplate: Record<string, string> = { ...allData };
            dataForTemplate['Date'] = dateText || 'Date';
            dataForTemplate['Name of Host Training Establishment Representative'] = recipientName || '';
            dataForTemplate['Industry Representative Name'] = recipientName || '';
            dataForTemplate['contactPerson'] = recipientName || '';
            dataForTemplate['Designation'] = designationText || '';
            dataForTemplate['Position / Title'] = designationText || '';
            dataForTemplate['Name of Host Company'] = companyNameText || '';
            dataForTemplate['Company Name'] = companyNameText || '';
            dataForTemplate['Name of Host Training Establishment'] = salutationNameText || '';
            dataForTemplate['Address'] = addressText || '';
            dataForTemplate['Company Address'] = addressText || '';
            dataForTemplate['name of campus'] = campusNameText || 'Marikina';
            dataForTemplate['Campus Name'] = campusNameText || 'Marikina';
            dataForTemplate['no. of training hours'] = hoursText || '486';
            dataForTemplate['Required OJT Hours'] = hoursText || '486';
            dataForTemplate['Name of Program Head'] = programHeadText || '';
            dataForTemplate['Name of Academic Head'] = academicHeadText || '';
            dataForTemplate['Name of Program'] = programText || '';
            dataForTemplate['Degree / Program Name'] = programText || '';
            dataForTemplate['Name of Student Trainee'] = studentNameText || '';
            dataForTemplate['Student Name (Full)'] = studentNameText || '';
            dataForTemplate['contact number'] = phoneText || '';
            dataForTemplate['Contact Number'] = phoneText || '';
            dataForTemplate['email address'] = emailText || '';
            dataForTemplate['School Email'] = emailText || '';
            dataForTemplate['Signature'] = signatureText || '';

            // Process with easy-template-x
            let finalBuffer = await handler.process(intermediateBuffer, dataForTemplate);

            // Post-process: fix gap between signature text and the underline in downloaded DOCX
            // Strip paragraph spacing around the signature so it sits directly on the line
            if (signatureText) {
              try {
                const postZip = await JSZip.loadAsync(finalBuffer);
                const postXmlFile = postZip.file("word/document.xml");
                if (postXmlFile) {
                  let postXml = await postXmlFile.async("string");

                  // Helper: set paragraph spacing to 0 in a paragraph XML fragment
                  const fixParaSpacing = (para: string): string => {
                    if (para.includes('<w:spacing')) {
                      return para.replace(/<w:spacing[^/>]*\/>/g, '<w:spacing w:before="0" w:after="0" w:line="240"/>')
                                 .replace(/<w:spacing[^>]*>[^<]*<\/w:spacing>/g, '<w:spacing w:before="0" w:after="0" w:line="240"/>');
                    } else if (para.includes('</w:pPr>')) {
                      return para.replace('</w:pPr>', '<w:spacing w:before="0" w:after="0" w:line="240"/></w:pPr>');
                    }
                    return para;
                  };

                  // Escape signature text for regex
                  const sigEscaped = signatureText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                  // Find the paragraph containing the signature text
                  const sigParaRegex = new RegExp(
                    `(<w:p\\b[^>]*>(?:(?!</w:p>)[\\s\\S])*?${sigEscaped}(?:(?!</w:p>)[\\s\\S])*?</w:p>)`
                  );
                  const sigMatch = postXml.match(sigParaRegex);

                  if (sigMatch && sigMatch.index !== undefined) {
                    // Fix the signature paragraph
                    const fixedSigPara = fixParaSpacing(sigMatch[0]);
                    postXml = postXml.substring(0, sigMatch.index) + fixedSigPara + postXml.substring(sigMatch.index + sigMatch[0].length);

                    // Find and fix the next paragraph (the underline) immediately after
                    const afterSigIdx = sigMatch.index + fixedSigPara.length;
                    const nextParaRegex = /(<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?<\/w:p>)/;
                    const nextMatch = postXml.substring(afterSigIdx).match(nextParaRegex);
                    if (nextMatch && nextMatch.index !== undefined) {
                      const nextStart = afterSigIdx + nextMatch.index;
                      const nextEnd = nextStart + nextMatch[0].length;
                      postXml = postXml.substring(0, nextStart) + fixParaSpacing(nextMatch[0]) + postXml.substring(nextEnd);
                    }
                  }

                  postZip.file("word/document.xml", postXml);
                  finalBuffer = await postZip.generateAsync({ type: "nodebuffer" });
                }
              } catch (postErr) {
                console.warn("Post-process signature spacing fix failed", postErr);
              }
            }

            return new Blob([finalBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
          }
        } catch (zipErr) {
          console.warn("JSZip replacement failed, falling back to programmatic docx generation", zipErr);
        }
      }

      // 3. Programmatic docx generation fallback
      let children: (Paragraph | Table)[] = [];

      if (docTitle.toLowerCase().includes('endorsement')) {
        children = [
          new Paragraph({
            children: [
              new TextRun({ text: "Note: Use the STI Campus Letterhead", italics: true, font: 'Calibri', size: 20 }),
            ],
            spacing: { after: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: dateText, font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 360 },
          }),
          ...(recipientName ? [new Paragraph({ children: [new TextRun({ text: `Mr./Ms. ${recipientName}`, font: 'Calibri', size: 24 })] })] : []),
          ...(designationText ? [new Paragraph({ children: [new TextRun({ text: designationText, font: 'Calibri', size: 24 })] })] : []),
          ...(companyNameText ? [new Paragraph({ children: [new TextRun({ text: companyNameText, font: 'Calibri', size: 24 })] })] : []),
          ...(addressText ? [new Paragraph({ children: [new TextRun({ text: addressText, font: 'Calibri', size: 24 })], spacing: { after: 360 } })] : []),
          new Paragraph({
            children: [new TextRun({ text: `Dear Mr./Ms. ${recipientName || 'Sir/Madam'},`, font: 'Calibri', size: 24 })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "In its dedication to enhancing the development of our students, STI requires them to undergo the On-the-Job Training (OJT) Program. This program aims to help our students develop competency in their chosen field by arming them with the primary experience, knowledge, and attitude essential to aid their transition from being a student to being part of the workforce.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "With this, we request your good office to be our partner in achieving this goal by agreeing to be the Host Training Establishment for ", font: 'Calibri', size: 24 }),
              new TextRun({ text: studentNameText, font: 'Calibri', size: 24 }),
              new TextRun({ text: ", a ", font: 'Calibri', size: 24 }),
              new TextRun({ text: programText, font: 'Calibri', size: 24 }),
              new TextRun({ text: " student, for a total of ", font: 'Calibri', size: 24 }),
              new TextRun({ text: hoursText, font: 'Calibri', size: 24 }),
              new TextRun({ text: " hours.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Should you have any questions, kindly contact me at ", font: 'Calibri', size: 24 }),
              new TextRun({ text: phoneText, font: 'Calibri', size: 24 }),
              new TextRun({ text: " and/or ", font: 'Calibri', size: 24 }),
              new TextRun({ text: emailText, font: 'Calibri', size: 24 }),
              new TextRun({ text: ".", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ children: [new TextRun({ text: "Thank you.", font: 'Calibri', size: 24 })], spacing: { after: 240 } }),
          new Paragraph({ children: [new TextRun({ text: "Respectfully yours,", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Paragraph({ children: [new TextRun({ text: programHeadText, font: 'Calibri', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "Program Head", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Paragraph({ children: [new TextRun({ text: "Noted by:", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Paragraph({ children: [new TextRun({ text: academicHeadText, font: 'Calibri', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "Academic Head", font: 'Calibri', size: 24 })] }),
        ];
      } else {
        // Application Letter Layout (Clean 12pt Calibri, matching Image 2 placeholder layout)
        children = [
          new Paragraph({ children: [new TextRun({ text: dateText, font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Paragraph({ children: [new TextRun({ text: recipientName || "<Name of Host Training Establishment Representative>", font: 'Calibri', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: designationText || "<Designation>", font: 'Calibri', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: companyNameText || "<Name of Host Company>", font: 'Calibri', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: addressText || "<Address>", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Dear Mr./Ms. ${salutationNameText || companyNameText || "<Name of Host Training Establishment>"}:`, font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "I, a student of STI ", font: 'Calibri', size: 24 }),
              new TextRun({ text: campusNameText ? campusNameText : "<name of campus>", font: 'Calibri', size: 24 }),
              new TextRun({ text: ", am required to undergo ", font: 'Calibri', size: 24 }),
              new TextRun({ text: hoursText ? hoursText : "<no. of training hours>", font: 'Calibri', size: 24 }),
              new TextRun({ text: " hours of On-the-Job Training (OJT) in partial fulfillment of the requirements for my ", font: 'Calibri', size: 24 }),
              new TextRun({ text: programText ? programText : "<Name of Program>", font: 'Calibri', size: 24 }),
              new TextRun({ text: " program.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "I can acquire valuable knowledge and skills to complement those I have learned from school with your company. In return, I offer my services and determination to be an asset to your company throughout my training period.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Enclosed is an endorsement letter from my Program Head and my resume.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "I am hoping for your kind consideration.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ children: [new TextRun({ text: "Thank you.", font: 'Calibri', size: 24 })], spacing: { after: 240 } }),
          new Paragraph({ children: [new TextRun({ text: "Respectfully yours,", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      // Signature text sits ON the line — single paragraph with bottom border
                      new Paragraph({
                        children: [new TextRun({ text: signatureText || '\u00A0', font: 'Calibri', size: 24 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 0 },
                        border: {
                          bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' },
                        },
                      }),
                      new Paragraph({ children: [new TextRun({ text: studentNameText || "<Name of Student Trainee>", font: 'Calibri', size: 24 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0 } }),
                      new Paragraph({ children: [new TextRun({ text: "OJT Applicant", font: 'Calibri', size: 24 })], alignment: AlignmentType.CENTER }),
                    ],
                    width: { size: 2800, type: WidthType.DXA },
                    margins: { left: 0, right: 0 },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0 },
                      bottom: { style: BorderStyle.NONE, size: 0 },
                      left: { style: BorderStyle.NONE, size: 0 },
                      right: { style: BorderStyle.NONE, size: 0 },
                    },
                  }),
                ],
              }),
            ],
            width: { size: 2800, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 },
              insideHorizontal: { style: BorderStyle.NONE, size: 0 },
              insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
          }),
        ];
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              verticalAlign: VerticalAlign.CENTER,
              page: {
                margin: {
                  top: 1440,
                  bottom: 1440,
                  left: 1440,
                  right: 1440,
                },
              },
            },
            children,
          },
        ],
      });

      return Packer.toBlob(doc);
    })(), 30000, 'DOCX Generation Timeout');
  },

  /**
   * Triggers a download of a Blob
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
