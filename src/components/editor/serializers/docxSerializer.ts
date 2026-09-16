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
  LevelFormat,
  UnderlineType,
} from 'docx';
import { titleToFilename } from '@/src/lib/sanitizeDocumentFilename';

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
  const first = raw.split(',')[0].replace(/['"]/g, '').trim();
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

/** Convert Plate leaf nodes to docx TextRun(s) */
function leafToRuns(node: PlateText): TextRun[] {
  const text = node.text ?? '';
  if (!text && !node.bold && !node.italic && !node.underline && !node.strikethrough && !node.strike) {
    // Empty run — preserve spacing
    return [new TextRun({ text: '' })];
  }

  // Parse font size if specified (e.g. '16px' or '12pt' or 16)
  let halfPoints: number | undefined;
  if (typeof node.fontSize === 'string') {
    const num = parseFloat(node.fontSize);
    if (!isNaN(num) && num > 0) {
      halfPoints = Math.round(num * 2);
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

  // Font family
  const font = (node.code || node.kbd)
    ? 'Courier New'
    : cleanFontFamily(node.fontFamily as string | undefined);

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

/** Recursively collect TextRun objects from an element's children */
function collectRuns(children: PlateNode[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const child of children) {
    if (isText(child)) {
      runs.push(...leafToRuns(child));
    } else {
      // Inline elements (link, date, etc.) — flatten their text
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
function elementToParagraph(el: PlateElement): Paragraph {
  const heading = toHeadingLevel(el.type);
  const alignment = toAlignmentType(el.align as string | undefined);
  const runs = collectRuns(el.children);
  const indent = Math.max(0, Number(el.indent) || 0);
  const lineHeight = Number(el.lineHeight) || 1.5;

  return new Paragraph({
    heading,
    alignment,
    children: runs,
    indent: indent ? { left: indent * 720 } : undefined,
    spacing: { after: 120, line: Math.round(lineHeight * 240) },
  });
}

/** Build a docx Table row */
function elementToTableRow(el: PlateElement): TableRow {
  const cells = (el.children as PlateElement[]).map((cell) => {
    const paras = (cell.children as PlateElement[]).map((child) => {
      if (child.type === 'p' || !child.type) {
        return elementToParagraph(child as PlateElement);
      }
      return elementToParagraph(child as PlateElement);
    });
    return new TableCell({
      children: paras.length ? paras : [new Paragraph('')],
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    });
  });
  return new TableRow({ children: cells });
}

/** Build a docx Table from a Plate table element */
function elementToTable(el: PlateElement): Table {
  const rows = (el.children as PlateElement[]).map(elementToTableRow);
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

/** Convert an array of Plate nodes to an array of docx block children */
function nodesToDocxChildren(nodes: PlateNode[]): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    if (isText(node)) continue; // top-level text nodes shouldn't exist, skip

    const el = node as PlateElement;

    if (el.type === 'table') {
      result.push(elementToTable(el));
      continue;
    }

    if (el.type === 'ul' || el.type === 'ol') {
      // Flatten list items into numbered/bulleted paragraphs
      for (const li of el.children as PlateElement[]) {
        if (li.type !== 'li') continue;
        const licEl = li.children.find(c => !isText(c) && (c as PlateElement).type === 'lic') as PlateElement | undefined;
        const content = licEl ?? (li.children[0] as PlateElement);
        if (!content) continue;
        const runs = isText(content) ? leafToRuns(content) : collectRuns((content as PlateElement).children);
        result.push(
          new Paragraph({
            bullet: el.type === 'ul' ? { level: 0 } : undefined,
            numbering: el.type === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
            children: runs,
          })
        );
      }
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
      const parsed = parseBase64Image(url);
      if (parsed) {
        const dims = getImageDimensions(parsed.data, parsed.type);
        const imgRun = new ImageRun({
          data: parsed.data,
          transformation: {
            width: Number(el.width) || dims.width,
            height: Number(el.height) || dims.height,
          },
          type: parsed.type,
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
      continue;
    }

    // Default: paragraph / heading
    result.push(elementToParagraph(el));
  }

  return result;
}

/**
 * Serialize Plate.js JSON content to a DOCX Blob.
 * @param content  Plate JSON node array
 * @param title    Document title (used in document properties)
 */
export async function serializeToDocx(content: PlateNode[], title: string): Promise<Blob> {
  const children = nodesToDocxChildren(content);

  const doc = new Document({
    title,
    creator: 'STI Marikina Practicum Portal',
    description: 'Generated by Web Practicum',
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
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
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
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

/**
 * Trigger a browser download of the serialized DOCX file.
 * @param content  Plate JSON node array
 * @param title    Document title (used for the filename)
 */
export async function downloadDocx(content: PlateNode[], title: string): Promise<void> {
  const blob = await serializeToDocx(content, title);
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
