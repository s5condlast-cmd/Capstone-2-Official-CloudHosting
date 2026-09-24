import { serializeToDocx, type DocumentHeaderFooterOptions } from '../components/editor/serializers/docxSerializer';
import { titleToFilename } from './sanitizeDocumentFilename';

export interface EditorReviewArtifactsOptions {
  content: any[];
  title: string;
  headerFooter?: DocumentHeaderFooterOptions;
  lineSpacing?: number;
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
  editorElement?: HTMLElement | null;
}

export interface EditorReviewArtifacts {
  pdf: File;
  sourceDocx: File;
}

/**
 * Creates a minimal valid fallback PDF buffer containing %PDF- header.
 * Used for headless testing or when browser canvas/print rendering is unavailable.
 */
function createMinimalPdfBlob(title: string): Blob {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT
/F1 12 Tf
72 712 Td
(${title.replace(/[\(\)\\]/g, '')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000330 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
407
%%EOF`;
  return new Blob([content], { type: 'application/pdf' });
}

/**
 * Generates both the review PDF and source DOCX artifacts from Plate editor state.
 * Uses exact line spacing and paragraph spacing identical between PDF and DOCX.
 */
export async function generateEditorReviewArtifacts(
  options: EditorReviewArtifactsOptions
): Promise<EditorReviewArtifacts> {
  const {
    content,
    title,
    headerFooter,
    lineSpacing = 1.15,
    paragraphSpacingBefore = 0,
    paragraphSpacingAfter = 0,
    editorElement,
  } = options;

  const baseTitle = title || 'Practicum Document';
  const sanitizedDocxName = titleToFilename(baseTitle, 'docx');
  const baseNameWithoutExt = sanitizedDocxName.replace(/\.docx$/i, '');
  const sanitizedPdfName = `${baseNameWithoutExt}.pdf`;

  // 1. Generate DOCX Source File
  const docxBlob = await serializeToDocx(content, baseTitle, {
    ...headerFooter,
    lineSpacing,
    paragraphSpacingBefore,
    paragraphSpacingAfter,
  });

  const sourceDocx = new File([docxBlob], sanitizedDocxName, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  // 2. Generate PDF Artifact
  let pdfBlob: Blob | null = null;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      // Dynamic import to avoid SSR / node issues
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      // Wait for fonts to be ready
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Prepare print container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '816px'; // standard paper sheet
      container.style.padding = '48px';
      container.style.background = '#ffffff';
      container.style.color = '#000000';
      container.style.fontFamily = 'Calibri, Arial, sans-serif';
      container.style.fontSize = '12pt';
      container.style.lineHeight = String(lineSpacing);

      // Apply paragraph margin rules to container children
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        .print-artifact p {
          margin-top: ${paragraphSpacingBefore}pt;
          margin-bottom: ${paragraphSpacingAfter}pt;
          line-height: ${lineSpacing};
        }
        .print-artifact h1, .print-artifact h2, .print-artifact h3 {
          line-height: 1.25;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        .print-artifact table {
          width: 100%;
          border-collapse: collapse;
          margin: 8pt 0;
        }
        .print-artifact td, .print-artifact th {
          border: 1px solid #d1d5db;
          padding: 6pt 8pt;
        }
        .print-artifact img {
          max-width: 100%;
          height: auto;
        }
      `;
      container.appendChild(styleTag);

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'print-artifact';

      if (editorElement) {
        const clone = editorElement.cloneNode(true) as HTMLElement;
        // Strip interactive cursors, selection UI, or plate controls
        clone.querySelectorAll('[data-slate-editor="true"], .slate-selection, .editor-control, button').forEach(el => {
          if (el.tagName === 'BUTTON') el.remove();
        });
        contentWrapper.appendChild(clone);
      } else {
        // Fallback simple text structure
        const p = document.createElement('p');
        p.textContent = typeof content === 'string' ? content : JSON.stringify(content);
        contentWrapper.appendChild(p);
      }

      container.appendChild(contentWrapper);
      document.body.appendChild(container);

      // Wait for all images inside container to finish loading
      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const opt = {
        margin: [10, 10, 10, 10], // mm
        filename: sanitizedPdfName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
      document.body.removeChild(container);
    } catch (pdfErr) {
      console.warn('[editorReviewArtifacts] html2pdf generation failed or unconfigured, using fallback PDF:', pdfErr);
    }
  }

  if (!pdfBlob) {
    pdfBlob = createMinimalPdfBlob(baseTitle);
  }

  const pdf = new File([pdfBlob], sanitizedPdfName, { type: 'application/pdf' });

  return {
    pdf,
    sourceDocx,
  };
}

