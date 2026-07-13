import { PDFParse } from 'pdf-parse';

export async function extractTextFromPdfBuffer(fileBuffer: Buffer): Promise<string> {
  const pdfParser = new PDFParse({ data: fileBuffer });
  try {
    const textResult = await pdfParser.getText();
    return textResult.text || '';
  } finally {
    await pdfParser.destroy();
  }
}
