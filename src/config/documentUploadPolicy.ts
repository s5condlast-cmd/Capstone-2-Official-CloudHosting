/**
 * documentUploadPolicy.ts
 * Unified document upload configuration and validation policy.
 *
 * Eliminates contract disagreements across UI inputs, client-side validation,
 * service boundaries, and storage constraints.
 */

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENT_SIZE_MB = 10;

export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'] as const;
export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
] as const;

export const UPLOAD_ACCEPT_STRING = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png';

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  normalizedExtension?: AllowedExtension;
}

/**
 * Validates a file candidate against the institutional document upload policy.
 */
export function validateDocumentUpload(
  file: { name: string; size: number; type?: string }
): UploadValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'No file selected.' };
  }

  const parts = file.name.split('.');
  const ext = (parts.length > 1 ? parts.pop()?.toLowerCase() : '') as AllowedExtension;

  if (ext === 'doc' as string) {
    return {
      valid: false,
      error: 'Legacy Word (.doc) files are not supported. Please save your file as Word (.docx) or PDF (.pdf) and try again.',
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (.${ext || 'unknown'}). Allowed formats: PDF, DOCX, XLSX, JPG, PNG.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed size of ${MAX_DOCUMENT_SIZE_MB} MB.`,
    };
  }

  return { valid: true, normalizedExtension: ext };
}

/**
 * Format bytes to human readable string (e.g. "1.2 MB" or "450 KB")
 */
export function formatDocumentFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

