import { DocumentParser } from './DocumentParser';
import { ParserResult, ParserCapabilities, StructuredDocument } from '@/src/types/structuredDocument';

export class OpenDataLabParser implements DocumentParser {
  public readonly name = 'OpenDataLabParser';

  public readonly capabilities: ParserCapabilities = {
    supportsTables: true,
    supportsOCR: true,
    supportsImages: true,
    supportsForms: true,
    supportedFormats: ['pdf', 'png', 'jpg', 'jpeg']
  };

  public async parse(fileBuffer: ArrayBuffer, fileName: string): Promise<ParserResult> {
    const startTime = Date.now();

    // Stub layout extraction tree
    const docId = `doc_${Date.now()}`;
    const document: StructuredDocument = {
      id: docId,
      title: fileName.replace(/\.[^/.]+$/, ""),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sections: [
        {
          id: 'sec_001',
          title: 'Document Header & Basic Info',
          blocks: [
            {
              id: 'blk_title',
              kind: 'heading',
              content: fileName.replace(/\.[^/.]+$/, "").toUpperCase(),
              style: { align: 'center', bold: true }
            },
            {
              id: 'blk_student_name',
              kind: 'field',
              label: 'Student Full Name',
              editable: true,
              confidence: 0.95,
              validation: { required: true }
            },
            {
              id: 'blk_date',
              kind: 'date',
              label: 'Submission Date',
              editable: true,
              confidence: 0.90,
              validation: { required: true }
            }
          ]
        },
        {
          id: 'sec_002',
          title: 'Details & Activity Matrix',
          blocks: [
            {
              id: 'blk_dtr_table',
              kind: 'table',
              label: 'Daily Time Record Matrix',
              columns: ['Date', 'Hours', 'Task Description'],
              confidence: 0.88,
              editable: true
            },
            {
              id: 'blk_signature',
              kind: 'signature',
              label: 'Student Digital Signature',
              confidence: 0.92,
              editable: true,
              validation: { required: true }
            }
          ]
        }
      ]
    };

    return {
      document,
      warnings: [],
      overallConfidence: 0.91,
      metadata: {
        parserName: this.name,
        parserVersion: '1.2.0',
        parsedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime
      },
      statistics: {
        blocksDetected: 5,
        tablesDetected: 1,
        imagesDetected: 0,
        pagesProcessed: 1,
        unmappedFields: 2
      }
    };
  }
}
