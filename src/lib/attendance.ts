export type AttendanceStatus = 'open' | 'pending' | 'verified' | 'rejected';

export interface AttendanceStudent {
  id: string;
  full_name: string;
  student_id?: string | null;
  program?: string | null;
  section?: string | null;
  company_name?: string | null;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  work_date: string;
  time_in: string;
  time_out: string | null;
  break_minutes: number;
  rendered_minutes: number;
  activity_note: string | null;
  evidence_path: string | null;
  evidence_mime: string | null;
  evidence_bytes: number | null;
  evidence_uploaded_at: string | null;
  evidence_url: string | null;
  status: AttendanceStatus;
  reviewer_remarks: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  student: AttendanceStudent | null;
}

export interface AttendanceResponse {
  records: AttendanceRecord[];
  viewerRole: 'student' | 'supervisor' | 'adviser' | 'admin';
  targetMinutes: number;
  dailyTargetMinutes: number;
  timezone: string;
}

export function formatAttendanceMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function getAttendanceProgress(verifiedMinutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((verifiedMinutes / targetMinutes) * 100)));
}

export function getOpenSessionMinutes(timeIn: string, now = Date.now()): number {
  const startedAt = new Date(timeIn).getTime();
  if (!Number.isFinite(startedAt)) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 60000));
}

export function isSameManilaDate(isoDate: string, workDate: string): boolean {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(isoDate));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}` === workDate;
}

export function getManilaDateKey(date: string | number | Date = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
