/**
 * student-dashboard.test.ts
 * Automated unit test suite for Student Dashboard selectors and priority business logic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveRequirements,
  deriveNextPriorityAction,
  deriveWeeklyAttendance,
  deriveFeedbackStream,
  OFFICIAL_TEMPLATES,
  matchesSubmission,
} from '../src/features/student-dashboard/studentDashboard.selectors';

test('Institutional Templates Architecture', async (t) => {
  await t.test('defines exactly 13 official templates across the 3 phases', () => {
    assert.equal(OFFICIAL_TEMPLATES.length, 13);
    const beforeCount = OFFICIAL_TEMPLATES.filter(t => t.phase === 'before_ojt').length;
    const inCount = OFFICIAL_TEMPLATES.filter(t => t.phase === 'in_ojt').length;
    const finalCount = OFFICIAL_TEMPLATES.filter(t => t.phase === 'final').length;

    assert.equal(beforeCount, 8, 'Before OJT must have 8 requirements');
    assert.equal(inCount, 3, 'In OJT must have 3 requirements');
    assert.equal(finalCount, 2, 'Final Phase must have 2 requirements');
  });

  await t.test('strictly separates consent forms with fee vs without fee', () => {
    const parentWithFee = OFFICIAL_TEMPLATES.find(t => t.id === 'parent-consent-with-fee')!;
    const parentWithoutFee = OFFICIAL_TEMPLATES.find(t => t.id === 'parent-consent-without-fee')!;

    assert.equal(matchesSubmission('Parent Consent Form (With Fee)', parentWithFee), true);
    assert.equal(matchesSubmission('Parent Consent Form (Without Fee)', parentWithFee), false);
    assert.equal(matchesSubmission('Parent Consent Form (Without Fee)', parentWithoutFee), true);
    assert.equal(matchesSubmission('Parent Consent Form (With Fee)', parentWithoutFee), false);
  });
});

test('Requirements Derivation & Phase Locking', async (t) => {
  await t.test('locks In OJT and Final templates when student is in Before OJT', () => {
    const requirements = deriveRequirements('before_ojt', [], []);
    
    const beforeItems = requirements.filter(r => r.phase === 'before_ojt');
    const inItems = requirements.filter(r => r.phase === 'in_ojt');
    const finalItems = requirements.filter(r => r.phase === 'final');

    assert.equal(beforeItems.every(r => r.status !== 'locked'), true);
    assert.equal(inItems.every(r => r.status === 'locked'), true);
    assert.equal(finalItems.every(r => r.status === 'locked'), true);
  });

  await t.test('marks approved submissions correctly', () => {
    const mockSubmissions = [
      { doc_type: 'Student Application Letter', status: 'Approved', created_at: '2026-09-01T00:00:00Z' },
      { doc_type: 'Parent Consent Form (With Fee)', status: 'Approved', created_at: '2026-09-02T00:00:00Z' },
    ];
    const requirements = deriveRequirements('before_ojt', mockSubmissions, []);
    
    const appLetter = requirements.find(r => r.id === 'student-application-letter')!;
    const parentConsent = requirements.find(r => r.id === 'parent-consent-with-fee')!;

    assert.equal(appLetter.status, 'done');
    assert.equal(parentConsent.status, 'done');
  });
});

test('Next Priority Action State Rules', async (t) => {
  await t.test('Priority 1: Revisions needed take absolute precedence over everything else', () => {
    const requirements = deriveRequirements('before_ojt', [
      { doc_type: 'Student Application Letter', status: 'Revision Required', adviser_feedback: 'Please sign page 2' }
    ], [
      { id: 'draft-1', title: 'MOA Template', template_id: 'moa-template' }
    ]);

    const nextAction = deriveNextPriorityAction(requirements, 'before_ojt', 50, 460, true);
    assert.equal(nextAction.urgent, true);
    assert.equal(nextAction.badgeTone, 'rose');
    assert.match(nextAction.title, /Revision Needed/i);
    assert.match(nextAction.description, /Please sign page 2/);
  });

  await t.test('Priority 2: Draft in progress takes precedence when no revisions are pending', () => {
    const requirements = deriveRequirements('before_ojt', [
      { doc_type: 'Student Application Letter', status: 'Approved' }
    ], [
      { id: 'draft-moa', title: 'Memorandum of Agreement', template_id: 'moa-template' }
    ]);

    const nextAction = deriveNextPriorityAction(requirements, 'before_ojt', 50, 460, true);
    assert.equal(nextAction.urgent, false);
    assert.equal(nextAction.badgeTone, 'sky');
    assert.match(nextAction.title, /Resume Draft/i);
  });

  await t.test('Priority 3: Unstarted current phase requirement is suggested next', () => {
    const requirements = deriveRequirements('before_ojt', [], []);
    const nextAction = deriveNextPriorityAction(requirements, 'before_ojt', 0, 460, true);

    assert.equal(nextAction.badgeTone, 'primary');
    assert.match(nextAction.title, /Next Required/i);
  });
});

test('Weekly Attendance & Feedback Selectors', async (t) => {
  await t.test('calculates 7 days with day numbers and current day flag', () => {
    const { days, totalWeeklyHours } = deriveWeeklyAttendance([]);
    assert.equal(days.length, 7);
    assert.equal(days.some(d => d.isToday), true);
    assert.equal(totalWeeklyHours >= 0, true);
  });

  await t.test('formats feedback stream from submissions with remarks', () => {
    const mockSubmissions = [
      { id: 'sub-1', doc_type: 'Application Letter', status: 'Approved', adviser_feedback: 'Good work', created_at: '2026-09-10' },
      { id: 'sub-2', doc_type: 'MOA Template', status: 'Revision Required', adviser_feedback: 'Missing signature', created_at: '2026-09-12' },
    ];
    const stream = deriveFeedbackStream(mockSubmissions);
    assert.equal(stream.length, 2);
    assert.equal(stream[0].documentTitle, 'Application Letter');
    assert.equal(stream[1].feedback, 'Missing signature');
  });
});
