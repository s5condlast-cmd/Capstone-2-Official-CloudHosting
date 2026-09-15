/**
 * Sanitizes a document filename for safe use on Windows and other filesystems.
 * - Strips path traversal sequences
 * - Removes illegal Windows filename characters
 * - Normalizes whitespace to single spaces
 * - Limits base name to 80 characters
 * - Preserves the file extension
 */
export function sanitizeDocumentFilename(raw: string, defaultName = 'document'): string {
  // Strip path traversal and directory separators across the entire string first
  let cleaned = raw.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Split off extension from the cleaned filename
  const lastDot = cleaned.lastIndexOf('.');
  let base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
  const ext = lastDot > 0 ? cleaned.slice(lastDot) : '';

  // Remove illegal Windows filename characters: < > : " | ? * and control chars
  base = base.replace(/[<>:"|?*\x00-\x1f]/g, '');

  // Remove leading/trailing dots and spaces (illegal on Windows)
  base = base.replace(/^[. ]+|[. ]+$/g, '');

  // Normalize internal whitespace to single space
  base = base.replace(/\s+/g, ' ').trim();

  // Limit base name to 80 characters
  if (base.length > 80) {
    base = base.slice(0, 80).trim();
  }

  // Fall back to default if sanitization produced an empty string
  if (!base) {
    base = defaultName;
  }

  return base + ext;
}

/**
 * Derives a safe download filename from a document title and optional extension.
 */
export function titleToFilename(title: string, ext: 'docx' | 'pdf'): string {
  return sanitizeDocumentFilename(`${title}.${ext}`);
}

