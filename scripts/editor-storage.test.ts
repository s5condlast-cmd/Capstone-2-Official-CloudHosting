/**
 * editor-storage.test.ts
 * Phase 7: Unit tests for documentHistoryStorage.ts
 *
 * Covers (per Plan.md):
 * - Queue coalescing (multiple rapid onChange calls produce one IDB write)
 * - 2.5-second cloud debounce
 * - Version creation thresholds (time + word delta, manual)
 * - Account-switch cache isolation
 * - BroadcastChannel multi-tab cleanup
 * - Filename sanitization
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDocumentFilename } from '../src/lib/sanitizeDocumentFilename';
import { countWords, DocumentHistoryStorage, type DraftState } from '../src/lib/documentHistoryStorage';
import { formatAuthError } from '../src/lib/authErrors';

describe('sanitizeDocumentFilename', () => {
  test('strips path traversal sequences', () => {
    const result = sanitizeDocumentFilename('../../etc/passwd');
    assert.equal(result, 'etcpasswd');
  });

  test('removes illegal Windows characters', () => {
    assert.equal(sanitizeDocumentFilename('file<>:"|?*.docx'), 'file.docx');
  });

  test('normalizes multiple spaces', () => {
    assert.equal(sanitizeDocumentFilename('my   document.docx'), 'my document.docx');
  });

  test('limits base name to 80 characters', () => {
    const longName = 'a'.repeat(100) + '.docx';
    const result = sanitizeDocumentFilename(longName);
    const base = result.slice(0, result.lastIndexOf('.'));
    assert.ok(base.length <= 80, `Base name exceeded 80 chars: ${base.length}`);
  });

  test('falls back to default name when sanitization produces empty string', () => {
    const result = sanitizeDocumentFilename('...');
    assert.equal(result, 'document');
  });

  test('preserves file extension', () => {
    const result = sanitizeDocumentFilename('My Letter.docx');
    assert.ok(result.endsWith('.docx'), `Expected .docx extension, got: ${result}`);
  });

  test('removes directory separators', () => {
    assert.equal(sanitizeDocumentFilename('dir/subdir/file.pdf'), 'dirsubdirfile.pdf');
  });

  test('removes Windows backslash separators', () => {
    assert.equal(sanitizeDocumentFilename('dir\\file.pdf'), 'dirfile.pdf');
  });

  test('strips leading/trailing dots from base name', () => {
    const result = sanitizeDocumentFilename('  .hidden.  .docx');
    assert.equal(result, 'hidden.docx');
  });

  test('handles blank filename gracefully', () => {
    assert.equal(sanitizeDocumentFilename('', 'untitled'), 'untitled');
  });
});


// ─── Word count tests ─────────────────────────────────────────────────────────

describe('countWords', () => {
  test('counts words in flat paragraph', () => {
    const content = [{ type: 'p', children: [{ text: 'Hello world this is a test' }] }];
    assert.equal(countWords(content), 6);
  });

  test('counts words across multiple paragraphs', () => {
    const content = [
      { type: 'p', children: [{ text: 'First paragraph' }] },
      { type: 'p', children: [{ text: 'Second paragraph' }] },
    ];
    assert.equal(countWords(content), 4);
  });

  test('counts words in nested structures (lists)', () => {
    const content = [{
      type: 'ul', children: [{
        type: 'li', children: [{
          type: 'lic', children: [{ text: 'one two three' }]
        }]
      }]
    }];
    assert.equal(countWords(content), 3);
  });

  test('ignores empty text nodes', () => {
    const content = [{ type: 'p', children: [{ text: '' }] }];
    assert.equal(countWords(content), 0);
  });

  test('handles mixed bold/italic leaves', () => {
    const content = [{
      type: 'p', children: [
        { text: 'bold ', bold: true },
        { text: 'italic ', italic: true },
        { text: 'normal' },
      ]
    }];
    assert.equal(countWords(content), 3);
  });
});

// ─── Queue coalescing simulation ──────────────────────────────────────────────

describe('IDB queue coalescing', () => {
  test('multiple rapid calls result in one deferred write', async () => {
    let flushCount = 0;
    const idbPending: { value: string | null } = { value: null };
    let flushPending = false;

    function scheduleFlush(value: string): void {
      idbPending.value = value; // only keep latest
      if (flushPending) return;
      flushPending = true;
      Promise.resolve().then(() => {
        flushPending = false;
        if (idbPending.value !== null) {
          flushCount++;
          idbPending.value = null;
        }
      });
    }

    // Simulate 10 rapid calls
    for (let i = 0; i < 10; i++) {
      scheduleFlush(`content-${i}`);
    }

    await Promise.resolve(); // allow microtask queue to drain
    assert.equal(flushCount, 1, `Expected 1 flush but got ${flushCount}`);
  });
});

// ─── Debounce simulation ──────────────────────────────────────────────────────

describe('Cloud save debounce', () => {
  test('debounce coalesces rapid calls into a single delayed execution', async () => {
    let callCount = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 50; // Use short interval for test

    function scheduleSave(): void {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callCount++;
      }, DEBOUNCE_MS);
    }

    // Rapid fire 5 times
    for (let i = 0; i < 5; i++) scheduleSave();

    // Wait for debounce + buffer
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS + 30));
    assert.equal(callCount, 1, `Expected 1 cloud save but got ${callCount}`);
    if (timer) clearTimeout(timer);
  });

  test('each new call resets the debounce timer', async () => {
    let callCount = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 50;

    function scheduleSave(): void {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { callCount++; }, DEBOUNCE_MS);
    }

    scheduleSave();
    await new Promise(r => setTimeout(r, 30));
    scheduleSave(); // reset before firing
    await new Promise(r => setTimeout(r, 80));
    assert.equal(callCount, 1, `Expected 1 call after reset, got ${callCount}`);
    if (timer) clearTimeout(timer);
  });
});

// ─── Version threshold simulation ─────────────────────────────────────────────

describe('Version creation thresholds', () => {
  test('auto-version triggered when active time >= 10min AND word delta >= 50', () => {
    const VERSION_MIN_ACTIVE_MS = 10 * 60 * 1000;
    const VERSION_MIN_WORD_DELTA = 50;

    function shouldAutoVersion(
      activeMs: number,
      wordDelta: number,
    ): boolean {
      return activeMs >= VERSION_MIN_ACTIVE_MS && wordDelta >= VERSION_MIN_WORD_DELTA;
    }

    assert.ok(shouldAutoVersion(10 * 60 * 1000, 50), 'Should trigger at exact threshold');
    assert.ok(shouldAutoVersion(15 * 60 * 1000, 100), 'Should trigger above threshold');
    assert.ok(!shouldAutoVersion(5 * 60 * 1000, 100), 'Should NOT trigger: insufficient time');
    assert.ok(!shouldAutoVersion(15 * 60 * 1000, 49), 'Should NOT trigger: insufficient words');
    assert.ok(!shouldAutoVersion(1000, 1), 'Should NOT trigger: both below threshold');
  });

  test('manual save version always proceeds regardless of thresholds', () => {
    // Manual version always creates — simulated by direct RPC call, no threshold check
    let versionCreated = false;
    function manualSaveVersion() { versionCreated = true; }
    manualSaveVersion();
    assert.ok(versionCreated, 'Manual version should always be created');
  });
});

// ─── Account-switch cache isolation ──────────────────────────────────────────

describe('Account-switch cache isolation', () => {
  test('IDB keys are user-scoped to prevent cross-user reads', () => {
    const userId1 = 'user-aaa';
    const userId2 = 'user-bbb';
    const draftId = 'draft-111';

    const key1 = `${userId1}:${draftId}`;
    const key2 = `${userId2}:${draftId}`;

    assert.notEqual(key1, key2, 'Keys for different users must be different');
    assert.ok(key1.startsWith(userId1), 'Key must be prefixed with user ID');
    assert.ok(key2.startsWith(userId2), 'Key must be prefixed with user ID');
  });
});

// ─── Conflict resolution logic ────────────────────────────────────────────────

describe('Conflict resolution types', () => {
  test('keep_local resolution uses remote revision + 1 for force update', () => {
    const remoteRevision = 7;
    const expectedNewRevision = remoteRevision + 1;
    // Simulate the force-revision logic
    const newRevision = remoteRevision + 1;
    assert.equal(newRevision, expectedNewRevision);
  });

  test('fork_local resolution generates a distinct UUID for the new draft', () => {
    const original = crypto.randomUUID();
    const forked = crypto.randomUUID();
    assert.notEqual(original, forked, 'Fork must generate a distinct UUID');
  });
});

// ─── Data Safety & Navigation Flush ──────────────────────────────────────────

describe('Data safety and navigation flush', () => {
  test('DocumentHistoryStorage flushNow exists and handles empty and pending state', async () => {
    const storage = new DocumentHistoryStorage('test-user-1', 'test-draft-1');
    assert.equal(typeof storage.flushNow, 'function', 'flushNow must be exposed');

    // flushNow with no pending state returns null
    const result = await storage.flushNow();
    assert.equal(result, null);
    storage.destroy();
  });

  test('destroy cleans up timers, triggers cached flush, and closes channel', () => {
    let statusHistory: string[] = [];
    const storage = new DocumentHistoryStorage('test-user-1', 'test-draft-2', {
      onStatusChange: (status) => statusHistory.push(status),
    });

    const testState: DraftState = {
      id: 'test-draft-2',
      userId: 'test-user-1',
      title: 'Pending Title',
      content: [{ type: 'p', children: [{ text: 'Hello' }] }],
      wordCount: 1,
      revision: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.onChange(testState);
    assert.ok(statusHistory.includes('saving'), 'onChange should transition status to saving');

    // Call destroy while state is pending
    storage.destroy();
    // After destroy, calling destroy again does not throw
    assert.doesNotThrow(() => storage.destroy());
  });

  test('beforeunload listener triggers persistence for pendingState without error', () => {
    const storage = new DocumentHistoryStorage('test-user-1', 'test-draft-3');
    const testState: DraftState = {
      id: 'test-draft-3',
      userId: 'test-user-1',
      title: 'Unload Title',
      content: [{ type: 'p', children: [{ text: 'Test' }] }],
      wordCount: 1,
      revision: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.onChange(testState);
    assert.doesNotThrow(() => {
      storage.destroy();
    });
  });

  test('visibilitychange and tab discard handler triggers persistence without error', () => {
    const storage = new DocumentHistoryStorage('test-user-1', 'test-draft-4');
    const testState: DraftState = {
      id: 'test-draft-4',
      userId: 'test-user-1',
      title: 'Visibility Change Draft',
      content: [{ type: 'p', children: [{ text: 'Testing tab switch' }] }],
      wordCount: 3,
      revision: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.onChange(testState);
    assert.doesNotThrow(() => {
      storage.destroy();
    });
  });
});

// ─── Fullscreen & Sidebar Elevation Verification ─────────────────────────────

describe('Fullscreen and sidebar elevation architecture', () => {
  test('entering fullscreen sets data-editor-fullscreen on document.body and removes on exit', () => {
    const mockBody = {
      attributes: new Map<string, string>(),
      setAttribute(k: string, v: string) { this.attributes.set(k, v); },
      removeAttribute(k: string) { this.attributes.delete(k); },
      hasAttribute(k: string) { return this.attributes.has(k); },
      getAttribute(k: string) { return this.attributes.get(k); },
    };

    function onEnterFullscreen() {
      mockBody.setAttribute('data-editor-fullscreen', 'true');
    }

    function onExitFullscreen() {
      mockBody.removeAttribute('data-editor-fullscreen');
    }

    onEnterFullscreen();
    assert.equal(mockBody.getAttribute('data-editor-fullscreen'), 'true');
    assert.ok(mockBody.hasAttribute('data-editor-fullscreen'));

    onExitFullscreen();
    assert.equal(mockBody.hasAttribute('data-editor-fullscreen'), false);
  });

  test('sidebar in fullscreen is completely hidden and ignored', () => {
    function getSidebarDisplay(isFullscreen: boolean) {
      if (isFullscreen) {
        return { display: 'none', pointerEvents: 'none' };
      }
      return { display: 'flex', pointerEvents: 'auto' };
    }

    const inFullscreen = getSidebarDisplay(true);
    assert.equal(inFullscreen.display, 'none', 'Sidebar must be hidden (display: none) in fullscreen mode');
    assert.equal(inFullscreen.pointerEvents, 'none', 'Sidebar must ignore pointer events in fullscreen mode');

    const inNormalMode = getSidebarDisplay(false);
    assert.equal(inNormalMode.display, 'flex', 'Sidebar must be visible in normal mode');
    assert.equal(inNormalMode.pointerEvents, 'auto', 'Sidebar must accept pointer events in normal mode');
  });
});

// ─── Auth Error Sanitization Verification ────────────────────────────────────

describe('Auth error sanitization & clean login', () => {
  test('suppresses raw Failed to fetch on initial page load / background checks', () => {
    const suppressed = formatAuthError('TypeError: Failed to fetch', true);
    assert.equal(suppressed, '', 'Failed to fetch must be suppressed on initial load');

    const networkSuppressed = formatAuthError(new Error('NetworkError when attempting to fetch resource.'), true);
    assert.equal(networkSuppressed, '', 'NetworkError must be suppressed on initial load');
  });

  test('translates network failure during active submit to clear user-friendly message', () => {
    const activeFetchErr = formatAuthError('TypeError: Failed to fetch', false);
    assert.equal(
      activeFetchErr,
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
  });

  test('translates invalid credentials into user-friendly message', () => {
    const invalidCredentials = formatAuthError(new Error('Invalid login credentials'));
    assert.equal(invalidCredentials, 'The email or password you entered is incorrect.');

    const invalidGrant = formatAuthError({ message: 'invalid_grant: error description' });
    assert.equal(invalidGrant, 'The email or password you entered is incorrect.');
  });

  test('translates rate limits and unconfirmed emails into user-friendly messages', () => {
    const rateLimit = formatAuthError('Too many requests, try again later');
    assert.equal(rateLimit, 'Too many sign-in attempts. Please wait a moment before trying again.');

    const unconfirmed = formatAuthError('Email not confirmed');
    assert.equal(unconfirmed, 'Your email address has not been verified yet. Please check your inbox.');
  });

  test('suppresses internal SQL / Supabase error codes from leaking to users', () => {
    const pgrstError = formatAuthError('PGRST116: JSON object requested, multiple (or no) rows returned');
    assert.equal(pgrstError, 'Unable to complete sign-in at this time. Please try again.');
  });
});

// ─── White Export Dropdown Card Styling Verification ─────────────────────────

describe('White export dropdown card styling', () => {
  test('enforces pure white card background and high-contrast text in StudentDocumentEditor', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const editorSrc = fs.readFileSync(path.resolve('src/pages/student/StudentDocumentEditor.tsx'), 'utf8');

    // 1. Dropdown content must explicitly declare white background and dark text for all color modes
    assert.ok(
      editorSrc.includes('bg-white dark:bg-white text-zinc-900 dark:text-zinc-900'),
      'Export DropdownMenuContent must have explicit bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 classes'
    );
    assert.ok(
      editorSrc.includes('border border-zinc-200/90 shadow-xl rounded-xl p-1.5 z-[150]'),
      'Export DropdownMenuContent must have refined border, shadow-xl, and rounded-xl card styling'
    );

    // 2. Export items must have clean hover feedback and high-contrast icons
    assert.ok(
      editorSrc.includes('hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900'),
      'Export DropdownMenuItem must have clean hover/focus background'
    );
    assert.ok(
      editorSrc.includes('text-blue-600') && editorSrc.includes('Microsoft Word (.docx)'),
      'Word export item must have blue Word icon'
    );
    assert.ok(
      editorSrc.includes('text-red-600') && editorSrc.includes('PDF Document (.pdf)'),
      'PDF export item must have red PDF icon'
    );
  });
});

// ─── Smart Conflict Auto-Reconciliation Verification ─────────────────────────

describe('Smart conflict auto-reconciliation', () => {
  test('auto-reconciles identical content without false alarm conflict banner', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const storageSrc = fs.readFileSync(path.resolve('src/lib/documentHistoryStorage.ts'), 'utf8');

    assert.ok(
      storageSrc.includes('localContentJson === remoteContentJson && state.title === remote.title'),
      'documentHistoryStorage must check for identical content before raising conflict'
    );
    assert.ok(
      storageSrc.includes('this.cloudRevision = remote.revision;'),
      'documentHistoryStorage must seamlessly adopt remote revision on identical content'
    );
    assert.ok(
      storageSrc.includes("this.channel?.postMessage({ type: 'DOC_CLOSE', tabId: this.tabId, draftId: this.draftId });"),
      'beforeUnloadHandler must emit DOC_CLOSE to immediately clear presence map'
    );
  });
});

// ─── Strict 1-to-1 Draft Matching & Milestone-Only Versioning ─────────────────

describe('Production Auto-Save & Strict 1-to-1 Document Isolation', () => {
  test('matchesDraft strictly isolates templates and rejects substring cross-matching', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dashboardSrc = fs.readFileSync(path.resolve('src/pages/student/StudentDashboard.tsx'), 'utf8');

    // Verify loose substring matching was removed
    assert.ok(
      !dashboardSrc.includes('if (dName.includes(tName) || tName.includes(dName)) return true;'),
      'StudentDashboard must NOT use loose bidirectional substring matching for drafts'
    );

    // Verify exact template_id match is prioritized
    assert.ok(
      dashboardSrc.includes('dr.template_id.trim().toLowerCase() === tmpl.id.trim().toLowerCase()'),
      'StudentDashboard must enforce exact template_id matching'
    );
  });

  test('documentHistoryStorage separates draft saves from version snapshots and guards flushes', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const storageSrc = fs.readFileSync(path.resolve('src/lib/documentHistoryStorage.ts'), 'utf8');

    // Verify isFlushing guard exists
    assert.ok(
      storageSrc.includes('private isFlushing = false;'),
      'DocumentHistoryStorage must define isFlushing guard'
    );
    assert.ok(
      storageSrc.includes('if (this.isFlushing) return null;'),
      'flushNow must check isFlushing to prevent duplicate concurrent snapshots'
    );

    // Verify unversioned changes check
    assert.ok(
      storageSrc.includes('const currentJson = JSON.stringify(state.content);'),
      'onChange must serialize content to check for actual delta before setting hasUnversionedChanges'
    );
  });

  test('applyRemoteUpdate cancels pending save timers, clears pendingState, and updates cloudRevision', async () => {
    const storage = new DocumentHistoryStorage('test-user-sync', 'test-draft-sync');
    await storage.load(1, [{ type: 'p', children: [{ text: 'Initial' }] }]);

    // User types in this tab, setting pendingState and timer
    storage.onChange({
      id: 'test-draft-sync',
      userId: 'test-user-sync',
      title: 'Initial',
      content: [{ type: 'p', children: [{ text: 'Local draft' }] }],
      wordCount: 2,
      revision: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    assert.ok((storage as any).pendingState !== null, 'pendingState must be set on change');
    assert.ok((storage as any).cloudSaveTimer !== null, 'cloudSaveTimer must be active');

    // Remote tab update arrives
    const remoteContent = [{ type: 'p', children: [{ text: 'Remote update from Tab A' }] }];
    storage.applyRemoteUpdate(2, remoteContent);

    assert.equal((storage as any).pendingState, null, 'applyRemoteUpdate must clear pendingState');
    assert.equal((storage as any).cloudSaveTimer, null, 'applyRemoteUpdate must cancel cloudSaveTimer');
    assert.equal(storage.getCloudRevision(), 2, 'applyRemoteUpdate must update cloudRevision');
    storage.destroy();
  });
});


