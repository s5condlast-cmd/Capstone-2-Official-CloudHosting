/**
 * docxSerializer.ts
 * Serializes Plate.js JSON content to a Word DOCX file using the `docx` npm package.
 *
 * Spec from Plan.md Phase 1:
 * - Letter-size pages, 1-inch margins
 * - Date values serialize as plain Word text
 * - Fill-in fields (underlined text) serialize as single-underlined runs
 * - Signature blocks use borderless Word tables with fixed widths
 * - Filenames are sanitized via sanitizeDocumentFilename
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  TableLayoutType,
  VerticalAlignTable,
  LevelFormat,
  UnderlineType,
  Header,
  Footer,
  PageNumber,
  ExternalHyperlink,
} from 'docx';
import { titleToFilename } from '@/src/lib/sanitizeDocumentFilename';
import { unwrapContentEnvelope } from '@/src/lib/documentHistoryStorage';

// ─── Header & Footer Types ────────────────────────────────────────────────────

export interface HeaderFooterItem {
  image?: {
    url: string;
    originalUrl?: string;
    name?: string;
    align?: 'left' | 'center' | 'right';
    width?: number;
    height?: number;
    offsetPercent?: number;
    cropZoom?: number;
  } | null;
  text?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  pageNumber?: boolean;
  scope?: 'every_page' | 'first_page_only';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface DocumentHeaderFooterOptions {
  header?: HeaderFooterItem | null;
  footer?: HeaderFooterItem | null;
  lineSpacing?: number;
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  [key: string]: unknown;
}

interface PlateElement {
  type: string;
  align?: string;
  children: (PlateText | PlateElement)[];
  [key: string]: unknown;
}

type PlateNode = PlateText | PlateElement;

const DEFAULT_LINE_HEIGHT = 1.15;
const DEFAULT_PARAGRAPH_AFTER_TWIPS = 0;
const HEADER_CONTENT_WIDTH_PX = 624;
const HEADER_IMAGE_MAX_HEIGHT_PX = 200;
const HEADER_IMAGE_MAX_WIDTH_WITH_TEXT_PX = 360;
const CSS_PX_TO_TWIPS = 15;

const HEADING_LAYOUT: Record<string, { before: number; after: number; lineHeight: number }> = {
  // Keep these values in step with heading-element.tsx. Tailwind spacing uses
  // 4px units; at 96dpi each CSS pixel is 15 Word twips.
  h1: { before: 420, after: 150, lineHeight: 1.25 },
  h2: { before: 360, after: 120, lineHeight: 1.375 },
  h3: { before: 270, after: 90, lineHeight: DEFAULT_LINE_HEIGHT },
  h4: { before: 210, after: 60, lineHeight: DEFAULT_LINE_HEIGHT },
  h5: { before: 150, after: 30, lineHeight: DEFAULT_LINE_HEIGHT },
  h6: { before: 120, after: 30, lineHeight: DEFAULT_LINE_HEIGHT },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isText(node: PlateNode): node is PlateText {
  return 'text' in node;
}

function toAlignmentType(align?: string): typeof AlignmentType[keyof typeof AlignmentType] {
  switch (align) {
    case 'center': return AlignmentType.CENTER;
    case 'right':  return AlignmentType.RIGHT;
    case 'justify': return AlignmentType.BOTH;
    default: return AlignmentType.LEFT;
  }
}

function toHeadingLevel(type: string): typeof HeadingLevel[keyof typeof HeadingLevel] | undefined {
  switch (type) {
    case 'h1': return HeadingLevel.HEADING_1;
    case 'h2': return HeadingLevel.HEADING_2;
    case 'h3': return HeadingLevel.HEADING_3;
    case 'h4': return HeadingLevel.HEADING_4;
    case 'h5': return HeadingLevel.HEADING_5;
    case 'h6': return HeadingLevel.HEADING_6;
    default: return undefined;
  }
}

/** Clean CSS font-family string to standard Word font name */
function cleanFontFamily(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes('times new roman')) return 'Times New Roman';
  if (lower.includes('arial')) return 'Arial';
  if (lower.includes('calibri')) return 'Calibri';
  if (lower.includes('georgia')) return 'Georgia';
  if (lower.includes('courier')) return 'Courier New';
  if (lower.includes('inter')) return 'Inter';
  if (lower.includes('geist')) return 'Geist';
  if (lower.includes('verdana')) return 'Verdana';
  if (lower.includes('trebuchet')) return 'Trebuchet MS';
  if (lower.includes('tahoma')) return 'Tahoma';
  if (lower.includes('segoe')) return 'Segoe UI';
  if (lower.includes('palatino')) return 'Palatino Linotype';
  if (lower.includes('book antiqua')) return 'Book Antiqua';
  if (lower.includes('garamond')) return 'Garamond';
  if (lower.includes('century gothic')) return 'Century Gothic';
  if (lower.includes('cambria')) return 'Cambria';
  if (lower.includes('candara')) return 'Candara';
  const first = raw.split(',')[0].replace(/['\"]/g, '').trim();
  return first || undefined;
}

/** Parse base64 data URL to Uint8Array and format type */
function parseBase64Image(dataUrl: string): { data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp' } | null {
  const match = dataUrl.match(/^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const type = (mime === 'jpeg' || mime === 'jpg') ? 'jpg' : (mime as 'png' | 'gif' | 'bmp');
  const base64Str = match[2];
  try {
    if (typeof atob === 'function') {
      const binStr = atob(base64Str);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return { data: bytes, type };
    } else if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64Str, 'base64');
      return { data: new Uint8Array(buf), type };
    }
  } catch {
    return null;
  }
  return null;
}

/** Resolve image bytes from base64 data URL or external URL */
export async function resolveImageBytes(url: string): Promise<{ data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp' } | null> {
  if (!url) return null;
  const base64 = parseBase64Image(url);
  if (base64) return base64;

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const contentType = res.headers.get('content-type') || '';
      let type: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
      if (contentType.includes('jpeg') || contentType.includes('jpg') || url.match(/\.jpe?g($|\?)/i)) {
        type = 'jpg';
      } else if (contentType.includes('gif') || url.match(/\.gif($|\?)/i)) {
        type = 'gif';
      } else if (contentType.includes('bmp') || url.match(/\.bmp($|\?)/i)) {
        type = 'bmp';
      }
      return { data: bytes, type };
    } catch {
      return null;
    }
  }
  return null;
}

/** Extract natural image dimensions from PNG or JPEG headers, scaling to fit page */
function getImageDimensions(bytes: Uint8Array, type: string, defaultMaxW = 460): { width: number; height: number } {
  let w = 0;
  let h = 0;
  if (type === 'png' && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    w = view.getUint32(16, false);
    h = view.getUint32(20, false);
  } else if (type === 'jpg' && bytes.length >= 4) {
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] === 0xFF && (bytes[i + 1] >= 0xC0 && bytes[i + 1] <= 0xC3)) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        h = view.getUint16(i + 5, false);
        w = view.getUint16(i + 7, false);
        break;
      }
      i++;
    }
  }

  if (w > 0 && h > 0) {
    if (w > defaultMaxW) {
      const scale = defaultMaxW / w;
      return { width: Math.round(defaultMaxW), height: Math.round(h * scale) };
    }
    return { width: w, height: h };
  }

  return { width: 320, height: 160 };
}

function fitImageToBox(
  dimensions: { width: number; height: number },
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const naturalWidth = Math.max(1, dimensions.width);
  const naturalHeight = Math.max(1, dimensions.height);
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

/** Convert Plate leaf nodes to docx TextRun(s) */
export function leafToRuns(node: PlateText): TextRun[] {
  const text = node.text ?? '';
  if (!text && !node.bold && !node.italic && !node.underline && !node.strikethrough && !node.strike) {
    // Empty run — preserve spacing
    return [new TextRun({ text: '' })];
  }

  // Parse font size if specified (e.g. '16px' or '12pt' or 16)
  // Word uses half-points (1pt = 2 half-points). 96px = 72pt => 1px = 0.75pt.
  let halfPoints: number | undefined;
  if (typeof node.fontSize === 'string') {
    const raw = node.fontSize.trim().toLowerCase();
    const isPx = raw.endsWith('px');
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      const pt = isPx ? num * 0.75 : num;
      halfPoints = Math.round(pt * 2);
    }
  } else if (typeof node.fontSize === 'number' && node.fontSize > 0) {
    halfPoints = Math.round(node.fontSize * 2);
  }

  // Parse hex color if specified (strip #)
  let textColor: string | undefined;
  if (typeof node.color === 'string') {
    textColor = node.color.replace(/^#/, '');
  }

  // Parse background color / highlight
  let shadingFill: string | undefined;
  if (typeof node.backgroundColor === 'string') {
    shadingFill = node.backgroundColor.replace(/^#/, '');
  } else if (node.highlight) {
    shadingFill = 'FFF2A8';
  }

  // Font family — default to Calibri to match Word's standard and our editor canvas
  const font = (node.code || node.kbd)
    ? 'Courier New'
    : (cleanFontFamily(node.fontFamily as string | undefined) || 'Calibri');

  return [
    new TextRun({
      text,
      bold: !!node.bold,
      italics: !!node.italic,
      underline: node.underline ? { type: UnderlineType.SINGLE } : undefined,
      strike: !!(node.strikethrough || node.strike),
      size: halfPoints,
      color: textColor,
      shading: shadingFill ? { fill: shadingFill } : undefined,
      subScript: !!(node.subscript || node.sub),
      superScript: !!(node.superscript || node.sup),
      font,
    }),
  ];
}

/** Recursively collect TextRun and ExternalHyperlink objects from an element's children */
export function collectParagraphChildren(children: PlateNode[]): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  for (const child of children) {
    if (isText(child)) {
      runs.push(...leafToRuns(child));
    } else {
      const element = child as PlateElement;
      if (element.type === 'a' && typeof element.url === 'string' && element.url.trim()) {
        const linkRuns = collectRuns(element.children);
        runs.push(
          new ExternalHyperlink({
            children: linkRuns.length
              ? linkRuns
              : [new TextRun({ text: element.url, style: 'Hyperlink', underline: { type: UnderlineType.SINGLE }, color: '0563C1' })],
            link: element.url,
          })
        );
      } else if (element.type === 'date' && typeof element.date === 'string') {
        const parsed = new Date(`${element.date}T00:00:00`);
        const label = Number.isNaN(parsed.getTime())
          ? element.date
          : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        runs.push(new TextRun({ text: label }));
      } else {
        runs.push(...collectParagraphChildren(element.children));
      }
    }
  }
  return runs;
}

/** Recursively collect plain TextRun objects (e.g. for inside hyperlinks or signatures) */
export function collectRuns(children: PlateNode[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const child of children) {
    if (isText(child)) {
      runs.push(...leafToRuns(child));
    } else {
      const element = child as PlateElement;
      if (element.type === 'date' && typeof element.date === 'string') {
        const parsed = new Date(`${element.date}T00:00:00`);
        const label = Number.isNaN(parsed.getTime())
          ? element.date
          : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        runs.push(new TextRun({ text: label }));
      } else {
        runs.push(...collectRuns(element.children));
      }
    }
  }
  return runs;
}

/** Build a docx Paragraph from a block element */
export function elementToParagraph(
  el: PlateElement,
  defaultLineHeight: number = DEFAULT_LINE_HEIGHT,
  defaultSpaceAfter: number = DEFAULT_PARAGRAPH_AFTER_TWIPS,
  defaultSpaceBefore: number = 0
): Paragraph {
  const heading = toHeadingLevel(el.type);
  const alignment = toAlignmentType(el.align as string | undefined);
  const runs = collectParagraphChildren(el.children);
  const indent = Math.max(0, Number(el.indent) || 0);
  const headingLayout = HEADING_LAYOUT[el.type];
  const lineHeight = Number(el.lineHeight) || headingLayout?.lineHeight || defaultLineHeight;
  const spaceBefore = el.spaceBefore !== undefined ? Number(el.spaceBefore) : undefined;
  const customBeforeTwips = spaceBefore !== undefined ? Math.round(spaceBefore * 20) : undefined;
  const spaceAfter = el.spaceAfter !== undefined ? Number(el.spaceAfter) : undefined;
  const customAfterTwips = spaceAfter !== undefined ? Math.round(spaceAfter * 20) : undefined;

  return new Paragraph({
    heading,
    alignment,
    children: runs as any,
    indent: indent ? { left: indent * 720 } : undefined,
    spacing: {
      before: customBeforeTwips ?? (headingLayout?.before ?? defaultSpaceBefore),
      after: customAfterTwips ?? (headingLayout?.after ?? defaultSpaceAfter),
      line: Math.round(lineHeight * 240),
    },
  });
}

/** Build a docx Table row */
export function elementToTableRow(
  el: PlateElement,
  isHeader = false,
  defaultLineHeight?: number,
  defaultSpaceAfter?: number,
  defaultSpaceBefore?: number
): TableRow {
  const cells = (el.children as PlateElement[]).map((cell) => {
    const paras = (cell.children as PlateElement[]).map((child) => {
      return elementToParagraph(child as PlateElement, defaultLineHeight, defaultSpaceAfter, defaultSpaceBefore);
    });
    const colSpan = Number((cell as any).colSpan || (cell as any).colspan || 1);
    const rowSpan = Number((cell as any).rowSpan || (cell as any).rowspan || 1);
    const width = Number((cell as any).width || 0);

    return new TableCell({
      children: paras.length ? paras : [new Paragraph('')],
      columnSpan: colSpan > 1 ? colSpan : undefined,
      rowSpan: rowSpan > 1 ? rowSpan : undefined,
      width: width > 0 ? { size: Math.round(width * 15), type: WidthType.DXA } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    });
  });
  return new TableRow({ children: cells, tableHeader: isHeader });
}

/** Build a docx Table from a Plate table element */
export function elementToTable(
  el: PlateElement,
  defaultLineHeight?: number,
  defaultSpaceAfter?: number,
  defaultSpaceBefore?: number
): Table {
  const rows = (el.children as PlateElement[]).map((row, idx) => {
    const isHeaderRow = idx === 0 && (row as any).header === true;
    return elementToTableRow(row, isHeaderRow, defaultLineHeight, defaultSpaceAfter, defaultSpaceBefore);
  });
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:             { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom:          { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left:            { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right:           { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal:{ style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideVertical:  { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
  });
}

/** Build a borderless signature table (fixed width, centered content) */
export function buildSignatureBlock(lines: string[], widthDxa = 2800): Table {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const rows = lines.map((line) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: widthDxa, type: WidthType.DXA },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { left: 0, right: 0, top: 0, bottom: 0 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: line })],
            }),
          ],
        }),
      ],
    })
  );
  return new Table({
    rows,
    width: { size: widthDxa, type: WidthType.DXA },
    borders: {
      top:             noBorder,
      bottom:          noBorder,
      left:            noBorder,
      right:           noBorder,
      insideHorizontal: noBorder,
      insideVertical:  noBorder,
    },
  });
}

// ─── Main serializer ──────────────────────────────────────────────────────────

/**
 * Recursively convert list elements (ul, ol, li) into Word Paragraphs with nested numbering or bullets.
 */
async function serializeListNode(
  listEl: PlateElement,
  level = 0
): Promise<Paragraph[]> {
  const paras: Paragraph[] = [];
  const safeLevel = Math.min(Math.max(0, level), 4);
  const isOl = listEl.type === 'ol';

  for (const child of listEl.children) {
    if (isText(child)) continue;
    const item = child as PlateElement;

    if (item.type === 'li') {
      // An li might contain a 'lic' (list content) and sub-lists (ul / ol)
      for (const liChild of item.children) {
        if (isText(liChild)) {
          paras.push(
            new Paragraph({
              bullet: !isOl ? { level: safeLevel } : undefined,
              numbering: isOl ? { reference: 'default-numbering', level: safeLevel } : undefined,
              children: leafToRuns(liChild),
            })
          );
        } else {
          const el = liChild as PlateElement;
          if (el.type === 'lic') {
            const runs = collectParagraphChildren(el.children);
            paras.push(
              new Paragraph({
                bullet: !isOl ? { level: safeLevel } : undefined,
                numbering: isOl ? { reference: 'default-numbering', level: safeLevel } : undefined,
                children: runs as any,
              })
            );
          } else if (el.type === 'ul' || el.type === 'ol') {
            const subParas = await serializeListNode(el, safeLevel + 1);
            paras.push(...subParas);
          } else {
            const runs = collectParagraphChildren(el.children);
            paras.push(
              new Paragraph({
                bullet: !isOl ? { level: safeLevel } : undefined,
                numbering: isOl ? { reference: 'default-numbering', level: safeLevel } : undefined,
                children: runs as any,
              })
            );
          }
        }
      }
    } else if (item.type === 'ul' || item.type === 'ol') {
      const subParas = await serializeListNode(item, safeLevel + 1);
      paras.push(...subParas);
    }
  }

  return paras;
}

/** Convert an array of Plate nodes to an array of docx block children */
async function nodesToDocxChildren(
  nodes: PlateNode[],
  defaultLineHeight: number = DEFAULT_LINE_HEIGHT,
  defaultSpaceAfter: number = DEFAULT_PARAGRAPH_AFTER_TWIPS,
  defaultSpaceBefore: number = 0
): Promise<(Paragraph | Table)[]> {
  const result: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    if (isText(node)) continue; // top-level text nodes shouldn't exist, skip

    const el = node as PlateElement;

    if (el.type === 'table') {
      result.push(elementToTable(el, defaultLineHeight, defaultSpaceAfter, defaultSpaceBefore));
      continue;
    }

    if (el.type === 'ul' || el.type === 'ol') {
      const listParas = await serializeListNode(el, 0);
      result.push(...listParas);
      continue;
    }

    // Check if element is an indent list item (Plate list with indent)
    const listStyleType = (el as any).listStyleType;
    if (listStyleType) {
      const level = Math.min(Math.max(0, Number(el.indent) || 0), 4);
      const isNumbered = listStyleType === 'decimal' || listStyleType === 'lower-alpha' || listStyleType === 'lower-roman';
      const runs = collectParagraphChildren(el.children);
      result.push(
        new Paragraph({
          bullet: !isNumbered ? { level } : undefined,
          numbering: isNumbered ? { reference: 'default-numbering', level } : undefined,
          children: runs as any,
        })
      );
      continue;
    }

    if (el.type === 'hr') {
      result.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
          children: [],
        })
      );
      continue;
    }

    if (el.type === 'blockquote') {
      const runs = collectRuns(el.children);
      result.push(
        new Paragraph({
          indent: { left: 720 },
          children: runs,
          border: { left: { style: BorderStyle.SINGLE, size: 8, color: '808080', space: 8 } },
        })
      );
      continue;
    }

    if (el.type === 'img' || el.type === 'image') {
      const url = typeof el.url === 'string' ? el.url : '';
      if (url) {
        try {
          const resolved = await resolveImageBytes(url);
          if (resolved) {
            const dims = getImageDimensions(resolved.data, resolved.type);
            let width = Number(el.width) || dims.width || 300;
            let height = Number(el.height) || dims.height || 200;
            if (width > 600) {
              const ratio = 600 / width;
              width = 600;
              height = Math.round(height * ratio);
            }
            const imgRun = new ImageRun({
              data: resolved.data,
              transformation: {
                width: Math.round(width),
                height: Math.round(height),
              },
              type: resolved.type,
            });
            const alignment = toAlignmentType(el.align as string | undefined);
            result.push(
              new Paragraph({
                alignment,
                children: [imgRun],
                spacing: { after: 120, before: 120 },
              })
            );
          }
        } catch (imgErr) {
          console.warn('[docxSerializer] Failed to embed image in DOCX:', imgErr);
        }
      }
      continue;
    }

    // Default: paragraph / heading
    result.push(elementToParagraph(el, defaultLineHeight, defaultSpaceAfter, defaultSpaceBefore));
  }

  return result;
}

/**
 * Serialize Plate.js JSON content to a DOCX Blob.
 * @param content       Plate JSON node array
 * @param title         Document title (used in document properties)
 * @param headerFooter  Optional header and footer options (logos, text, page numbers)
 */
export async function serializeToDocx(
  content: PlateNode[],
  title: string,
  headerFooter?: DocumentHeaderFooterOptions
): Promise<Blob> {
  if (!Array.isArray(content)) {
    const unwrapped = unwrapContentEnvelope(content);
    content = unwrapped.content as PlateNode[];
    if (!headerFooter && unwrapped.headerFooter) {
      headerFooter = unwrapped.headerFooter;
    }
  }

  const docLineHeight = headerFooter?.lineSpacing ?? DEFAULT_LINE_HEIGHT;
  const docParagraphAfterTwips = headerFooter?.paragraphSpacingAfter !== undefined
    ? Math.round(headerFooter.paragraphSpacingAfter * 20)
    : DEFAULT_PARAGRAPH_AFTER_TWIPS;
  const docParagraphBeforeTwips = headerFooter?.paragraphSpacingBefore !== undefined
    ? Math.round(headerFooter.paragraphSpacingBefore * 20)
    : 0;

  const children = await nodesToDocxChildren(content, docLineHeight, docParagraphAfterTwips, docParagraphBeforeTwips);

  // ── Build Native Word Header ───────────────────────────────────────────────
  const headerChildren: (Paragraph | Table)[] = [];
  const header = headerFooter?.header;
  let resolvedHeaderImage: Awaited<ReturnType<typeof resolveImageBytes>> = null;

  if (header?.image?.url) {
    try {
      resolvedHeaderImage = await resolveImageBytes(header.image.url);
    } catch (err) {
      console.warn('[docxSerializer] Failed to resolve header image:', err);
    }
  }

  const headerText = header?.text?.trim() || '';
  const headerTextParagraph = headerText
    ? new Paragraph({
        alignment: toAlignmentType(header?.textAlign || 'left'),
        children: [
          new TextRun({
            text: headerText,
            bold: header?.bold,
            italics: header?.italic,
            underline: header?.underline ? { type: UnderlineType.SINGLE } : undefined,
            color: header?.color ? header.color.replace('#', '') : '666666',
            size: header?.fontSize ? Math.round(header.fontSize * 1.5) : 21,
            font: cleanFontFamily(header?.fontFamily) || 'Calibri',
          }),
        ],
        spacing: { before: 0, after: 0, line: Math.round(DEFAULT_LINE_HEIGHT * 240) },
      })
    : null;

  if (resolvedHeaderImage && header?.image) {
    const dimensions = getImageDimensions(resolvedHeaderImage.data, resolvedHeaderImage.type);
    const hasInlineText = Boolean(headerTextParagraph);
    const imageSlotWidth = Math.min(
      header.image.width || 180,
      hasInlineText ? HEADER_IMAGE_MAX_WIDTH_WITH_TEXT_PX : HEADER_CONTENT_WIDTH_PX
    );
    const targetHeight = header.image.height || HEADER_IMAGE_MAX_HEIGHT_PX;
    const fittedImage = fitImageToBox(
      dimensions,
      imageSlotWidth,
      targetHeight
    );
    const createHeaderImageRun = () => new ImageRun({
      data: resolvedHeaderImage.data,
      transformation: fittedImage,
      type: resolvedHeaderImage.type,
    });
    const imageParagraph = new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [createHeaderImageRun()],
      spacing: { before: 0, after: 0 },
    });

    if (headerTextParagraph) {
      const totalWidth = HEADER_CONTENT_WIDTH_PX * CSS_PX_TO_TWIPS;
      const imageColumnWidth = Math.round(imageSlotWidth * CSS_PX_TO_TWIPS);
      const textColumnWidth = totalWidth - imageColumnWidth;
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

      headerChildren.push(
        new Table({
          width: { size: totalWidth, type: WidthType.DXA },
          columnWidths: [imageColumnWidth, textColumnWidth],
          layout: TableLayoutType.FIXED,
          borders: {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: imageColumnWidth, type: WidthType.DXA },
                  verticalAlign: VerticalAlignTable.CENTER,
                  margins: { top: 0, bottom: 0, left: 0, right: 180 },
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [imageParagraph],
                }),
                new TableCell({
                  width: { size: textColumnWidth, type: WidthType.DXA },
                  verticalAlign: VerticalAlignTable.CENTER,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [headerTextParagraph],
                }),
              ],
            }),
          ],
        })
      );
    } else {
      const headerImgAlign = header.image.align ||
        (header.image.offsetPercent !== undefined
          ? (header.image.offsetPercent <= 33 ? 'left' : header.image.offsetPercent >= 67 ? 'right' : 'center')
          : 'center');
      headerChildren.push(
        new Paragraph({
          alignment: toAlignmentType(headerImgAlign),
          children: [createHeaderImageRun()],
          spacing: { before: 0, after: 0 },
        })
      );
    }
  } else if (headerTextParagraph) {
    headerChildren.push(
      headerTextParagraph
    );
  }

  // ── Build Native Word Footer ───────────────────────────────────────────────
  const footerChildren: Paragraph[] = [];
  if (headerFooter?.footer?.image?.url) {
    try {
      const resolved = await resolveImageBytes(headerFooter.footer.image.url);
      if (resolved) {
        const dims = getImageDimensions(resolved.data, resolved.type);
        const width = headerFooter.footer.image.width || 140;
        const height = headerFooter.footer.image.height || Math.round(width * (dims.height / dims.width));
        const footerImgAlign = headerFooter.footer.image.align ||
          (headerFooter.footer.image.offsetPercent !== undefined
            ? (headerFooter.footer.image.offsetPercent <= 33 ? 'left' : headerFooter.footer.image.offsetPercent >= 67 ? 'right' : 'center')
            : 'center');
        footerChildren.push(
          new Paragraph({
            alignment: toAlignmentType(footerImgAlign),
            children: [
              new ImageRun({
                data: resolved.data,
                transformation: { width, height },
                type: resolved.type,
              }),
            ],
            spacing: { before: 80 },
          })
        );
      }
    } catch (err) {
      console.warn('[docxSerializer] Failed to resolve footer image:', err);
    }
  }

  const footerRuns: (TextRun | typeof PageNumber[keyof typeof PageNumber])[] = [];
  if (headerFooter?.footer?.text?.trim()) {
    footerRuns.push(
      new TextRun({
        text: headerFooter.footer.text.trim() + (headerFooter.footer.pageNumber ? '   ' : ''),
        bold: headerFooter.footer.bold,
        italics: headerFooter.footer.italic,
        underline: headerFooter.footer.underline ? { type: UnderlineType.SINGLE } : undefined,
        color: headerFooter.footer.color ? headerFooter.footer.color.replace('#', '') : '666666',
        size: headerFooter.footer.fontSize ? headerFooter.footer.fontSize * 2 : 18,
        font: headerFooter.footer.fontFamily,
      })
    );
  }
  if (headerFooter?.footer?.pageNumber) {
    footerRuns.push(
      new TextRun({ text: 'Page ', size: 18, color: '666666' }),
      PageNumber.CURRENT,
      new TextRun({ text: ' of ', size: 18, color: '666666' }),
      PageNumber.TOTAL_PAGES
    );
  }
  if (footerRuns.length > 0) {
    footerChildren.push(
      new Paragraph({
        alignment: toAlignmentType(headerFooter?.footer?.textAlign || 'center'),
        children: footerRuns as any,
        spacing: { before: 80 },
      })
    );
  }

  // Determine section header/footer scope (first page only vs every page)
  const headerScope = headerFooter?.header?.scope || 'every_page';
  const footerScope = headerFooter?.footer?.scope || 'every_page';
  const hasFirstPageOnly =
    (headerScope === 'first_page_only' && headerChildren.length > 0) ||
    (footerScope === 'first_page_only' && footerChildren.length > 0);

  let sectionHeaders: { default?: Header; first?: Header } | undefined;
  if (headerChildren.length > 0) {
    if (hasFirstPageOnly) {
      sectionHeaders = {
        first: new Header({ children: headerChildren }),
        default: headerScope === 'first_page_only' ? new Header({ children: [] }) : new Header({ children: headerChildren }),
      };
    } else {
      sectionHeaders = {
        default: new Header({ children: headerChildren }),
      };
    }
  }

  let sectionFooters: { default?: Footer; first?: Footer } | undefined;
  if (footerChildren.length > 0) {
    if (hasFirstPageOnly) {
      sectionFooters = {
        first: new Footer({ children: footerChildren }),
        default: footerScope === 'first_page_only' ? new Footer({ children: [] }) : new Footer({ children: footerChildren }),
      };
    } else {
      sectionFooters = {
        default: new Footer({ children: footerChildren }),
      };
    }
  }

  const doc = new Document({
    title,
    creator: 'STI Marikina Practicum Portal',
    description: 'Generated by Web Practicum',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: {
            spacing: {
              before: docParagraphBeforeTwips,
              after: docParagraphAfterTwips,
              line: Math.round(docLineHeight * 240),
            },
          },
        },
        heading1: { run: { font: 'Calibri', size: 32, bold: true } },
        heading2: { run: { font: 'Calibri', size: 26, bold: true } },
        heading3: { run: { font: 'Calibri', size: 24, bold: true } },
        heading4: { run: { font: 'Calibri', size: 22, bold: true } },
        heading5: { run: { font: 'Calibri', size: 22, bold: true } },
        heading6: { run: { font: 'Calibri', size: 22, bold: true } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: '%2.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 1440, hanging: 360 },
                },
              },
            },
            {
              level: 2,
              format: LevelFormat.LOWER_ROMAN,
              text: '%3.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 2160, hanging: 360 },
                },
              },
            },
            {
              level: 3,
              format: LevelFormat.DECIMAL,
              text: '%4.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 2880, hanging: 360 },
                },
              },
            },
            {
              level: 4,
              format: LevelFormat.LOWER_LETTER,
              text: '%5.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 3600, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: hasFirstPageOnly,
          page: {
            size: {
              // Letter: 8.5" × 11" in twentieths of a point (twips)
              width:  12240, // 8.5 × 1440
              height: 15840, // 11  × 1440
            },
            margin: {
              top:    1440, // 1 inch
              bottom: 1440,
              left:   1440,
              right:  1440,
              header: 720,  // 0.5 inch
              footer: 720,  // 0.5 inch
            },
          },
        },
        headers: sectionHeaders,
        footers: sectionFooters,
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

/**
 * Trigger a browser download of the serialized DOCX file.
 * @param content       Plate JSON node array
 * @param title         Document title (used for the filename)
 * @param headerFooter  Optional header and footer options (logos, text, page numbers)
 */
export async function downloadDocx(
  content: PlateNode[],
  title: string,
  headerFooter?: DocumentHeaderFooterOptions
): Promise<void> {
  const blob = await serializeToDocx(content, title, headerFooter);
  const filename = titleToFilename(title, 'docx');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a browser print dialog for PDF export.
 * Applies the print-document.css stylesheet before printing.
 */
export function printToPdf(): void {
  window.print();
}
