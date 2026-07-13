// html2pdf removed natively using window.print() instead

import { TemplateHandler } from 'easy-template-x';
import JSZip from 'jszip';

import { templateStorage } from '@/src/lib/templateStorage';

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
  async generateDocx(
    templateUrl: string, 
    formData: Record<string, string>,
    blankEdits: string[] = [],
    angleData: Record<string, string> = {},
    squareData: Record<string, string> = {},
    dateEdits: string[] = [],
    templateId?: string
  ): Promise<Blob> {
    return withTimeout((async () => {
      // 1. Fetch the raw .docx buffer (append cache-buster to ensure we get the latest file)
      let arrayBuffer: ArrayBuffer | undefined;
      if (templateId) {
        arrayBuffer = await templateStorage.getTemplateFile(templateId);
      }
      
      if (!arrayBuffer) {
        const fetchUrl = templateUrl.includes('?') ? `${templateUrl}&t=${Date.now()}` : `${templateUrl}?t=${Date.now()}`;
        const response = await fetch(fetchUrl);
        arrayBuffer = await response.arrayBuffer();
      }

      // Merge formData and squareData for easy-template-x
      const mergedData = { ...formData, ...squareData };

      // 2. Perform regular {} replacement via easy-template-x (if any)
      const standardHandler = new TemplateHandler();
      let currentBuffer = await standardHandler.process(arrayBuffer, mergedData);

      // 3. Process literal blanks ____ using JSZip
      if (blankEdits.length > 0) {
        const zip = await JSZip.loadAsync(currentBuffer);
        const docXml = zip.file("word/document.xml");
        
        if (docXml) {
          let xmlString = await docXml.async("string");
          let blankIndex = 0;
          
          xmlString = xmlString.replace(/_{3,}/g, (match) => {
            const replacement = blankEdits[blankIndex] || match;
            blankIndex++;
            return replacement;
          });
          
          if (dateEdits.length > 0) {
            let dateIndex = 0;
            // Match >Date< or >Date:< with possible whitespace
            xmlString = xmlString.replace(/>(\s*Date\s*:?\s*)</g, (match, p1) => {
              const replacement = dateEdits[dateIndex] || p1;
              dateIndex++;
              return `>${replacement}<`;
            });
          }
          
          zip.file("word/document.xml", xmlString);
          currentBuffer = await zip.generateAsync({ type: "arraybuffer" });
        }
      }

      // 4. Process < TAGS > using easy-template-x with custom delimiters
      if (Object.keys(angleData).length > 0) {
        const angleHandler = new TemplateHandler({
          delimiters: {
            tagStart: "<",
            tagEnd: ">"
          }
        });
        currentBuffer = await angleHandler.process(currentBuffer, angleData);
      }

      // 5. Process [ TAGS ] using easy-template-x with custom delimiters
      if (Object.keys(squareData).length > 0) {
        const squareHandler = new TemplateHandler({
          delimiters: {
            tagStart: "[",
            tagEnd: "]"
          }
        });
        currentBuffer = await squareHandler.process(currentBuffer, squareData);
      }

      return new Blob([currentBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
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
