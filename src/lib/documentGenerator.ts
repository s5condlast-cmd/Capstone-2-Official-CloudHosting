import { TemplateHandler } from 'easy-template-x';
import JSZip from 'jszip';
import { Document, Paragraph, TextRun, AlignmentType, Packer, VerticalAlign, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { jsPDF } from 'jspdf';

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
      const isApplicationLetter = docTitle.toLowerCase().includes('application letter');

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
      } else if (docTitle.toLowerCase().includes('proposal')) {
        // Proposal Letter to the Industry Layout
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
          ...(recipientName ? [new Paragraph({ children: [new TextRun({ text: recipientName, font: 'Calibri', size: 24 })] })] : []),
          ...(designationText ? [new Paragraph({ children: [new TextRun({ text: designationText, font: 'Calibri', size: 24 })] })] : []),
          ...(companyNameText ? [new Paragraph({ children: [new TextRun({ text: companyNameText, font: 'Calibri', size: 24 })] })] : []),
          ...(addressText ? [new Paragraph({ children: [new TextRun({ text: addressText, font: 'Calibri', size: 24 })], spacing: { after: 360 } })] : []),
          new Paragraph({
            children: [new TextRun({ text: `Dear ${recipientName ? `Mr./Ms. ${recipientName}` : 'Industry Partner'}:`, font: 'Calibri', size: 24 })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Greetings in the spirit of education and industry collaboration!", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "As part of the academic curriculum for the ", font: 'Calibri', size: 24 }),
              new TextRun({ text: programText, font: 'Calibri', size: 24 }),
              new TextRun({ text: " program at STI College, our bona fide student trainee, ", font: 'Calibri', size: 24 }),
              new TextRun({ text: studentNameText, font: 'Calibri', bold: true, size: 24 }),
              new TextRun({ text: ", is required to complete a total of ", font: 'Calibri', size: 24 }),
              new TextRun({ text: hoursText, font: 'Calibri', size: 24 }),
              new TextRun({ text: " hours of On-the-Job Training (OJT). The objective of this immersion is to enhance the professional development and competency of our students by arming them with hands-on industrial experience.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "With this, we respectfully submit this Proposal Letter to request your good office to accept the student trainee into your esteemed organization for their practicum. We are confident that their skills, foundational training, and dedication will make a positive contribution to your organization.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Attached are the training objectives and profile for your review and endorsement. We look forward to establishing a meaningful partnership with your organization.", font: 'Calibri', size: 24 }),
            ],
            spacing: { after: 240 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ children: [new TextRun({ text: "Thank you very much for your valued time and continued support.", font: 'Calibri', size: 24 })], spacing: { after: 240 } }),
          new Paragraph({ children: [new TextRun({ text: "Respectfully yours,", font: 'Calibri', size: 24 })], spacing: { after: 360 } }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: signatureText || '\u00A0', font: 'Calibri', size: 24 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 0 },
                        border: {
                          bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' },
                        },
                      }),
                      new Paragraph({ children: [new TextRun({ text: studentNameText, font: 'Calibri', bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0 } }),
                      new Paragraph({ children: [new TextRun({ text: "Student Trainee Applicant", font: 'Calibri', size: 24 })], alignment: AlignmentType.CENTER }),
                    ],
                    width: { size: 2800, type: WidthType.DXA },
                    margins: { left: 0, right: 0 },
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
          }),
          new Paragraph({ children: [new TextRun({ text: "Noted by:", font: 'Calibri', size: 24 })], spacing: { before: 360, after: 240 } }),
          new Paragraph({ children: [new TextRun({ text: programHeadText, font: 'Calibri', bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "Practicum Coordinator / Program Head", font: 'Calibri', size: 24 })] }),
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
   * Generates a clean, formal STI PDF directly in browser
   */
  async generatePdf(
    title: string,
    formData: Record<string, string>
  ): Promise<Blob> {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 54; // 0.75 in
    const contentWidth = pageWidth - margin * 2;
    let y = 60;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('STI COLLEGE - PRACTICUM / ON-THE-JOB TRAINING OFFICE', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Industry Placement & Experiential Education Program', margin, y);
    y += 10;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(margin, y, margin + contentWidth, y);
    y += 24;

    // Date
    const rawDate = formData.date;
    let dateText = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (rawDate) {
      const parsed = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`);
      if (!isNaN(parsed.getTime())) {
        dateText = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } else {
        dateText = rawDate;
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(dateText, margin, y);
    y += 24;

    // Recipient block
    const recipient = formData.contactPerson || formData['Industry Representative Name'] || formData['Name of Host Training Establishment Representative'] || 'The Human Resources Director';
    const titleText = formData.contactTitle || formData['Position / Title'] || formData['Designation'] || 'Industry Partner';
    const company = formData.companyName || formData['Company Name'] || formData['Name of Host Company'] || 'Host Training Establishment';
    const address = formData.companyAddress || formData['Company Address'] || formData['Address'] || 'City / Province';

    doc.setFont('helvetica', 'bold');
    doc.text(recipient, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(titleText, margin, y);
    y += 14;
    doc.text(company, margin, y);
    y += 14;
    doc.text(address, margin, y);
    y += 26;

    // Document Subject / Title line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const subjectTitle = title.toUpperCase().includes('LETTER') || title.toUpperCase().includes('FORM') || title.toUpperCase().includes('MOA')
      ? title.toUpperCase()
      : `${title.toUpperCase()} - PRACTICUM SUBMISSION`;
    doc.text(`SUBJECT: ${subjectTitle}`, margin, y);
    y += 20;

    // Salutation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Dear ${formData.contactPerson ? `Mr./Ms. ${formData.contactPerson}` : 'Industry Representative'}:`, margin, y);
    y += 20;

    // Common Student & Program details
    const studentName = formData.studentName || formData['Name of Student Trainee'] || 'John Dwayne B. Guaniso';
    const program = formData.programName || formData['Name of Program'] || 'Bachelor of Science in Information Technology';
    const hours = formData.hoursRequired || formData['no. of training hours'] || '486';
    const coordinator = formData.coordinatorName || formData['programHead'] || 'Prof. Maria Santos, MIT';

    const writePara = (text: string) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 10;
    };

    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('proposal')) {
      writePara(`Greetings in the spirit of education and industry collaboration!`);
      writePara(`As part of the academic curriculum for the ${program} program at STI College, our student trainee, ${studentName}, is required to undergo a total of ${hours} hours of On-the-Job Training (OJT). This program bridges classroom instruction with direct industrial immersion.`);
      writePara(`We respectfully submit this Proposal Letter to explore placement and internship opportunities for our trainee within your reputable organization. Enclosed are the student profile and initial training objectives for your consideration.`);
      writePara(`Thank you very much for your valued time, guidance, and continuous support of our student's professional growth.`);
    } else if (lowerTitle.includes('application')) {
      writePara(`I am writing to express my strong interest in rendering my required ${hours} hours of On-the-Job Training (OJT) with your esteemed company, ${company}.`);
      writePara(`I am currently a senior student taking up ${program} at STI College. Through our coursework and practical laboratories, I have acquired hands-on foundational skills and am eager to contribute effectively to your team's ongoing projects.`);
      writePara(`Attached to this application are my curriculum vitae, academic credentials, and official requirements for your review. I look forward to the opportunity to discuss how my passion and background align with your organization's goals.`);
      writePara(`Thank you very much for your consideration.`);
    } else if (lowerTitle.includes('endorsement')) {
      writePara(`Warm greetings from STI College!`);
      writePara(`This is to formally endorse our bonafide student, ${studentName}, enrolled in the ${program} program, to undergo their required ${hours} hours of practicum immersion with ${company}.`);
      writePara(`We vouch for the student's academic standing, discipline, and commitment to learning. We are confident that this industry placement will provide valuable practical experience while allowing the student to contribute meaningfully to your company.`);
      writePara(`We look forward to an enduring partnership with your institution.`);
    } else if (lowerTitle.includes('consent')) {
      const feeText = lowerTitle.includes('without fee') ? 'without fee requirements' : 'with applicable fee coverage';
      writePara(`This document certifies that voluntary consent and approval have been granted for ${studentName}, a student of ${program}, to participate in the prescribed ${hours}-hour On-the-Job Training program (${feeText}).`);
      writePara(`We acknowledge that the training is an integral part of the academic requirements and agree to comply with the safety protocols, rules, and guidelines mandated by STI College and ${company}.`);
      writePara(`In granting this consent, we understand that all parties will exercise necessary diligence to ensure a fruitful and safe immersion experience.`);
    } else if (lowerTitle.includes('moa') || lowerTitle.includes('memorandum')) {
      writePara(`This Memorandum of Agreement is entered into by and between STI College and ${company} to govern the industry placement and internship of ${studentName} for a duration of ${hours} hours.`);
      writePara(`Both parties agree to collaborate in providing experiential learning, technical mentorship, and regular performance evaluations to advance the academic and professional competencies of the student trainee.`);
      writePara(`This agreement reflects our mutual commitment to cultivating industry-ready professionals through quality practicum training.`);
    } else {
      writePara(`Greetings in the spirit of academic excellence and industry collaboration!`);
      writePara(`This document pertains to the official practicum requirements of ${studentName}, currently pursuing the ${program} curriculum at STI College.`);
      writePara(`All terms, requirements, and information presented herein have been prepared in accordance with the official On-the-Job Training guidelines prescribed for the completion of ${hours} training hours.`);
      writePara(`Thank you for your continuous cooperation in advancing quality experiential education.`);
    }

    y += 10;
    doc.text('Respectfully yours,', margin, y);
    y += 40;

    // Student Signature line
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, y, margin + 180, y);
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, margin, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.text(lowerTitle.includes('endorsement') ? 'Student Trainee' : 'Student Trainee Applicant', margin, y);

    // Coordinator block on right
    const coordX = margin + 260;
    const coordY = y - 26;
    doc.setDrawColor(15, 23, 42);
    doc.line(coordX, coordY, coordX + 180, coordY);
    doc.setFont('helvetica', 'bold');
    doc.text(coordinator, coordX, coordY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text('Practicum Coordinator', coordX, coordY + 26);

    const pdfBlob = doc.output('blob');
    return pdfBlob;
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
