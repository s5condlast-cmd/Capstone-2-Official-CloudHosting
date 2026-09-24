import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  formatAttendanceMinutes,
  getAttendanceProgress,
  getManilaDateKey,
  getOpenSessionMinutes,
} from '../src/lib/attendance.ts';

test('attendance duration formatting is stable at hour boundaries', () => {
  assert.equal(formatAttendanceMinutes(0), '0m');
  assert.equal(formatAttendanceMinutes(59), '59m');
  assert.equal(formatAttendanceMinutes(60), '1h');
  assert.equal(formatAttendanceMinutes(495), '8h 15m');
});

test('verified target progress is clamped to zero through one hundred percent', () => {
  assert.equal(getAttendanceProgress(0, 460 * 60), 0);
  assert.equal(getAttendanceProgress(230 * 60, 460 * 60), 50);
  assert.equal(getAttendanceProgress(500 * 60, 460 * 60), 100);
  assert.equal(getAttendanceProgress(100, 0), 0);
});

test('open shift duration uses elapsed whole minutes', () => {
  const start = '2026-09-23T00:00:00.000Z';
  const now = new Date('2026-09-23T01:30:59.000Z').getTime();
  assert.equal(getOpenSessionMinutes(start, now), 90);
  assert.equal(getOpenSessionMinutes('invalid', now), 0);
});

test('attendance dates follow Asia Manila across the UTC date boundary', () => {
  assert.equal(getManilaDateKey('2026-09-22T16:30:00.000Z'), '2026-09-23');
});

test('attendance migration keeps punches server-owned and verification assignment-scoped', async () => {
  const sql = await readFile(new URL('../supabase/migrations/08_attendance_time_tracking.sql', import.meta.url), 'utf8');
  assert.match(sql, /UNIQUE \(student_id, work_date\)/);
  assert.match(sql, /REVOKE ALL ON public\.attendance_records FROM anon, authenticated/);
  assert.match(sql, /VALUES \(\(SELECT auth\.uid\(\)\), today, now\(\), 'open'\)/);
  assert.match(sql, /public\.can_access_student\(target_student\)/);
  assert.match(sql, /reviewer_role NOT IN \('supervisor', 'admin'\)/);
});

test('attendance API requires identity and a portal-ready session', async () => {
  const source = await readFile(new URL('../backend/routes/attendance.ts', import.meta.url), 'utf8');
  assert.match(source, /router\.use\('\/attendance', requireIdentity, requirePortal\)/);
  assert.match(source, /requireRole\('student'\)/);
  assert.match(source, /requireRole\('supervisor', 'admin'\)/);
});
