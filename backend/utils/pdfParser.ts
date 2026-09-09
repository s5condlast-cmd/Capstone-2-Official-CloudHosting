export async function extractTextFromPdfBuffer(fileBuffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const pdfParser = new PDFParse({ data: fileBuffer });
  try {
    const textResult = await pdfParser.getText();
    return textResult.text || '';
  } finally {
    await pdfParser.destroy();
  }
}
