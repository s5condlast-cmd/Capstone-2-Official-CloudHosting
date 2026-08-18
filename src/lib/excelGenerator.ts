import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';

export interface WeeklyJournalEntry {
  studentName: string;
  studentId?: string;
  courseSection: string;
  companyName: string;
  supervisor: string;
  weekNo: string;
  startDate: string;
  endDate: string;
  objectives: string;
  activities: string;
  challenges: string;
  learnings: string;
  planForNextWeek: string;
  hoursLogged?: number | string;
}

/**
 * Escapes a cell value for standard CSV format (RFC 4180)
 */
function escapeCSVField(val: string | number | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // If string contains quotes, commas, or newlines, enclose in quotes and double internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates a clean CSV string from a weekly journal entry
 */
export function generateCSV(entry: WeeklyJournalEntry): string {
  const headers = [
    "Student Name",
    "Student ID",
    "Course & Section",
    "Company Name",
    "Company Supervisor",
    "Week No",
    "Start Date",
    "End Date",
    "Hours Logged",
    "A. Objectives for the Week",
    "B. Activities & Tasks Performed",
    "C. Challenges & Problems Encountered",
    "D. Learnings & Reflections",
    "E. Plan for Next Week"
  ];

  const row = [
    escapeCSVField(entry.studentName),
    escapeCSVField(entry.studentId || 'N/A'),
    escapeCSVField(entry.courseSection),
    escapeCSVField(entry.companyName),
    escapeCSVField(entry.supervisor),
    escapeCSVField(entry.weekNo),
    escapeCSVField(entry.startDate),
    escapeCSVField(entry.endDate),
    escapeCSVField(entry.hoursLogged || 40),
    escapeCSVField(entry.objectives),
    escapeCSVField(entry.activities),
    escapeCSVField(entry.challenges),
    escapeCSVField(entry.learnings),
    escapeCSVField(entry.planForNextWeek)
  ];

  return `${headers.map(h => `"${h}"`).join(',')}\n${row.join(',')}`;
}

/**
 * Generates an Excel Blob (.xlsx) from a weekly journal entry using SheetJS
 */
export function generateXlsxBlob(entry: WeeklyJournalEntry): Blob {
  const data = [
    ["STI COLLEGE MARIKINA - WEEKLY JOURNAL & ACTIVITY REPORT"],
    [],
    ["Student Name:", entry.studentName || '', "Student ID:", entry.studentId || 'N/A'],
    ["Course & Section:", entry.courseSection || '', "Company Name:", entry.companyName || ''],
    ["Supervisor:", entry.supervisor || '', "Week No:", entry.weekNo || '1'],
    ["Date Range:", `${entry.startDate || ''} to ${entry.endDate || ''}`, "Hours Logged:", entry.hoursLogged || 40],
    [],
    ["SECTION", "CONTENT / DETAILS"],
    ["A. Objectives for the Week", entry.objectives || ''],
    ["B. Activities & Tasks Performed", entry.activities || ''],
    ["C. Challenges & Problems Encountered", entry.challenges || ''],
    ["D. Learnings & Reflections", entry.learnings || ''],
    ["E. Plan for Next Week", entry.planForNextWeek || '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for better Excel layout readability
  worksheet['!cols'] = [
    { wch: 32 },
    { wch: 65 },
    { wch: 20 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${entry.weekNo || '1'} Activity`);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates standard filename for weekly journal exports
 */
export function generateFileName(entry: WeeklyJournalEntry, ext: 'csv' | 'xlsx' = 'xlsx'): string {
  const cleanName = (entry.studentName || 'Student').replace(/\s+/g, '_');
  const week = entry.weekNo || '1';
  return `Week_${week}_${cleanName}_Activity_Spreadsheet.${ext}`;
}

export interface DTRDayLog {
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  activities?: string;
  isDayOff?: boolean;
  signatureUrl?: string;
}

export interface DTREntry {
  studentName: string;
  studentId?: string;
  courseSection: string;
  companyName: string;
  weekNumber?: number | string;
  monthYear: string;
  totalHours: string | number;
  cumulativeHours?: string | number;
  status?: string;
  supervisorName?: string;
  logs?: DTRDayLog[];
}

/**
 * Fast synchronous extractor for base64 PNG dimensions from IHDR chunk bytes
 */
function getPNGDimensions(base64Str: string): { width: number; height: number } | null {
  try {
    const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const binaryStr = atob(base64Data.slice(0, 64)); // decode first 64 bytes
    if (binaryStr.length < 24) return null;

    // Check PNG magic bytes: 0x89 0x50 ('%PNG')
    if (binaryStr.charCodeAt(0) !== 0x89 || binaryStr.charCodeAt(1) !== 0x50) {
      return null;
    }

    const w = (binaryStr.charCodeAt(16) << 24) |
              (binaryStr.charCodeAt(17) << 16) |
              (binaryStr.charCodeAt(18) << 8) |
              binaryStr.charCodeAt(19);

    const h = (binaryStr.charCodeAt(20) << 24) |
              (binaryStr.charCodeAt(21) << 16) |
              (binaryStr.charCodeAt(22) << 8) |
              binaryStr.charCodeAt(23);

    return (w > 0 && h > 0) ? { width: w, height: h } : null;
  } catch (err) {
    return null;
  }
}

/**
 * Synchronously crops and normalizes a live HTMLCanvasElement signature,
 * dynamically scaling it to match cell dimensions (colWidth=30, rowHeight=45).
 */
export function cropCanvasToDataUrl(
  canvas: HTMLCanvasElement, 
  colWidthUnits: number = 30, 
  rowHeightPoints: number = 45
): string {
  if (!canvas) return '';
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasAlpha = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];

        // Isolate dark ink strokes, filtering out solid white or light background pixels
        const isDarkStroke = alpha > 30 && (r < 200 || g < 200 || b < 200);

        if (isDarkStroke) {
          hasAlpha = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasAlpha || maxX <= minX || maxY <= minY) {
      return canvas.toDataURL('image/png');
    }

    const pad = 4;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(canvas.width - cropX, (maxX - minX) + pad * 2);
    const cropH = Math.min(canvas.height - cropY, (maxY - minY) + pad * 2);

    // Calculate dynamic 1:1 physical pixel cell dimensions (@2x Retina High DPI)
    // 1 colWidth unit ≈ 7.5px; 1 rowHeight pt ≈ 1.33px
    const targetW = Math.round(colWidthUnits * 7.5 * 2); // 30 * 7.5 * 2 = 450px
    const targetH = Math.round(rowHeightPoints * 1.33 * 2); // 45 * 1.33 * 2 = 120px

    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetW;
    outCanvas.height = targetH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return canvas.toDataURL('image/png');

    // Scale condition: Fill 90% of target canvas area while centered
    let scaleW = (targetW * 0.90) / cropW;
    let scaleH = (targetH * 0.90) / cropH;
    let scale = Math.min(scaleW, scaleH);

    // If signature stroke is narrow (e.g. initials or vertical scribbles), expand scale to fill 90% target height
    if (cropW < cropH * 1.5) {
      scale = (targetH * 0.90) / cropH;
    }

    const scaledW = Math.min(targetW * 0.92, cropW * scale);
    const scaledH = Math.min(targetH * 0.90, cropH * scale);

    const destX = (targetW - scaledW) / 2;
    const destY = (targetH - scaledH) / 2;

    outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, destX, destY, scaledW, scaledH);
    return outCanvas.toDataURL('image/png');
  } catch (e) {
    return canvas.toDataURL('image/png');
  }
}

/**
 * Trims transparent whitespace margins from base64 signature canvas PNGs,
 * centers the signature stroke, and scales it up to fill ~85% of a standardized box.
 */
export async function normalizeSignatureDataUrl(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64Str || !base64Str.startsWith('data:image')) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);

        ctx.drawImage(img, 0, 0);
        const result = cropCanvasToDataUrl(canvas);
        resolve(result || base64Str);
      } catch (e) {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

async function trimCanvasSignature(base64Str: string): Promise<string> {
  return normalizeSignatureDataUrl(base64Str);
}

/**
 * Generates an Excel Blob (.xlsx) for Daily Time Record (DTR) logs with native embedded signature images & clean alignment
 */
export async function generateDTRXlsxBlob(entry: DTREntry): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheetName = entry.weekNumber ? `Week ${entry.weekNumber} DTR` : 'Daily Time Record';
  const worksheet = workbook.addWorksheet(sheetName);

  // Column width specifications optimized for simple reading and zero text truncation
  worksheet.columns = [
    { header: 'Day', key: 'day', width: 16 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Time In', key: 'timeIn', width: 26 },
    { header: 'Time Out', key: 'timeOut', width: 28 },
    { header: 'Hours', key: 'hours', width: 14 },
    { header: 'Supervisor Signature', key: 'signatureStatus', width: 32 }
  ];

  // Header banner rows - Simple format with pure black default text
  worksheet.spliceRows(1, 0,
    ['STI COLLEGE MARIKINA - DAILY TIME RECORD (DTR)'],
    [],
    ['Student Name:', entry.studentName || '', 'Student ID:', entry.studentId || 'N/A'],
    ['Course & Section:', entry.courseSection || '', 'Company Name:', entry.companyName || 'InnoTech Solutions Inc.'],
    ['Week / Date Range:', entry.monthYear || '', 'Total Rendered Hours:', `${entry.totalHours || 0} hrs`],
    ['Overall Status:', entry.status || 'Pending', 'Supervisor:', entry.supervisorName || 'Company Supervisor'],
    [],
    ['Day', 'Date', 'Time In', 'Time Out', 'Hours', 'Supervisor Signature']
  );

  // Format Title Row (Row 1) - Default Black
  const titleRow = worksheet.getRow(1);
  titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: '000000' } };
  titleRow.height = 26;

  // Format Header Metadata Rows (Rows 3, 4, 5, 6) - Default Black
  [3, 4, 5, 6].forEach(rIdx => {
    const r = worksheet.getRow(rIdx);
    r.height = 20;
    r.font = { name: 'Calibri', size: 10, color: { argb: '000000' } };
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '000000' } };
    r.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '000000' } };
    r.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    r.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Format Table Header Row (Row 8) - Default Black Text
  const tableHeaderRow = worksheet.getRow(8);
  tableHeaderRow.height = 26;
  tableHeaderRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '000000' } };
  tableHeaderRow.eachCell((cell, colNum) => {
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: colNum >= 3 && colNum <= 6 ? 'center' : 'left' 
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '333333' } },
      right: { style: 'thin', color: { argb: '333333' } }
    };
  });

  const logs = (entry.logs && entry.logs.length > 0) ? entry.logs : [];

  for (let idx = 0; idx < logs.length; idx++) {
    const log = logs[idx];
    const rowIndex = 9 + idx; // 1-indexed row number in ExcelJS
    let sigStatus = 'Pending Signature';
    if (log.isDayOff) {
      sigStatus = 'OFF / No Work';
    } else if (log.signatureUrl) {
      sigStatus = '';
    }

    const row = worksheet.getRow(rowIndex);
    row.values = [
      log.day,
      log.date,
      log.isDayOff ? 'OFF' : log.timeIn,
      log.isDayOff ? 'OFF' : log.timeOut,
      log.hours,
      sigStatus
    ];
    row.height = 45; // Generous, clean row height allowing centered full-view signature

    // Apply solid borders, center alignment & default black text across all data cells
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: '000000' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum >= 3 && colNum <= 6 ? 'center' : 'left',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '333333' } },
        bottom: { style: 'thin', color: { argb: '333333' } },
        left: { style: 'thin', color: { argb: '333333' } },
        right: { style: 'thin', color: { argb: '333333' } }
      };
    });

    if (log.signatureUrl && log.signatureUrl.startsWith('data:image')) {
      try {
        // Autocrop & normalize canvas margins so actual signature stroke fills cell box centered
        const trimmedSig = await trimCanvasSignature(log.signatureUrl);

        const imageId = workbook.addImage({
          base64: trimmedSig,
          extension: 'png',
        });

        // Anchors signature image stretching 100% across cell box matching 450x120 aspect ratio (Col F)
        worksheet.addImage(imageId, {
          tl: { col: 5.0, row: (rowIndex - 1) } as any,
          br: { col: 6.0, row: rowIndex } as any,
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Failed to embed PNG signature drawing:', err);
      }
    }
  }

  // Summary Row (Bottom - attached directly below last log row)
  const summaryRowIndex = 9 + logs.length;
  const summaryRow = worksheet.getRow(summaryRowIndex);
  summaryRow.height = 28;
  summaryRow.values = [
    'SUMMARY', '', '', '', `Total: ${entry.totalHours || 0} hrs`, entry.status === 'Approved' ? 'APPROVED BY SUPERVISOR' : 'PENDING ADVISER VERIFICATION'
  ];
  summaryRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '000000' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNum === 5 ? 'center' : colNum === 6 ? 'center' : 'left'
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F8FAFC' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '333333' } },
      right: { style: 'thin', color: { argb: '333333' } }
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates dynamic filename for student DTR Excel spreadsheet downloads
 */
export function generateDTRFileName(entry: DTREntry, ext: 'xlsx' = 'xlsx'): string {
  const cleanName = (entry.studentName || 'Student').replace(/\s+/g, '_');
  const cleanCourse = (entry.courseSection || 'BSIT').replace(/\s+/g, '_');
  const week = entry.weekNumber ? `Week_${entry.weekNumber}` : 'DTR';
  return `DTR_${cleanName}_${cleanCourse}_${week}.${ext}`;
}

/**
 * Parses CSV text into a 2D array of strings for HTML table rendering
 */
export function parseCSVToMatrix(csvText: string): string[][] {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  });
}
