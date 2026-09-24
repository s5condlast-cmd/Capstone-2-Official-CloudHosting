/**
 * Policy and validation rules for review PDF submissions.
 * Hardened to prevent non-PDF files and oversized payloads.
 */

export const REVIEW_PDF_POLICY = {
  maxSizeBytes: 15 * 1024 * 1024, // 15 MB
  maxSizeLabel: '15 MB',
  allowedMimeTypes: ['application/pdf'] as const,
  magicBytesHeader: '%PDF-',
  maxSourceSizeBytes: 20 * 1024 * 1024, // 20 MB for source .docx
  maxSourceSizeLabel: '20 MB',
  allowedSourceMimeTypes: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ] as const,
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Checks file header bytes asynchronously for '%PDF-' signature.
 */
export async function validatePdfFileBytes(file: File | Blob): Promise<FileValidationResult> {
  if (file.size > REVIEW_PDF_POLICY.maxSizeBytes) {
    return {
      valid: false,
      error: `PDF file size exceeds maximum limit of ${REVIEW_PDF_POLICY.maxSizeLabel}. (Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
    };
  }

  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const header = String.fromCharCode(...bytes);

    if (header !== REVIEW_PDF_POLICY.magicBytesHeader) {
      return {
        valid: false,
        error: 'The selected file is not a valid PDF document. Please choose a genuine PDF.',
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not verify PDF file signature: ${err.message || 'Read error'}`,
    };
  }

  return { valid: true };
}

/**
 * Validates optional source Word DOCX document.
 */
export async function validateSourceDocxBytes(file: File | Blob): Promise<FileValidationResult> {
  if (file.size > REVIEW_PDF_POLICY.maxSourceSizeBytes) {
    return {
      valid: false,
      error: `Source document exceeds maximum limit of ${REVIEW_PDF_POLICY.maxSourceSizeLabel}.`,
    };
  }

  try {
    const slice = file.slice(0, 4);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // ZIP magic bytes: PK\x03\x04
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
      return {
        valid: false,
        error: 'The source file does not appear to be a valid Word (.docx) document.',
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not verify source file signature: ${err.message || 'Read error'}`,
    };
  }

  return { valid: true };
}

