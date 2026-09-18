/**
 * documentHistoryStorage.ts
 * Hybrid storage engine for the Plate.js document editor.
 *
 * Architecture (from Plan.md Phase 3):
 *   Layer 1 — React state updates immediately (handled by caller)
 *   Layer 2 — Queued, coalesced async IndexedDB writes via idb-keyval
 *   Layer 3 — 2.5-second debounced cloud save via save_editor_draft RPC
 *   Layer 4 — Version snapshots: 10-min + 50-word delta, manual, pre-restore, conflict
 *
 * IndexedDB keys: `${userId}:${draftId}` — user-scoped for isolation.
 * On logout/account change, queues are closed and cache is cleared.
 *
 * Multi-tab presence: BroadcastChannel('ojt-doc-editor')
 *   Messages: DOC_QUERY, DOC_PRESENT, DOC_HEARTBEAT, DOC_CLOSE
 */

import { get, set, del } from 'idb-keyval';
import { supabase } from '@/src/lib/supabase';
import type { DocumentHeaderFooterOptions } from '@/src/components/editor/serializers/docxSerializer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentEnvelope {
  schemaVersion: 1;
  type: 'document_envelope';
  body: object[];
  headerFooter?: DocumentHeaderFooterOptions | null;
  wordCount?: number;
  updatedAt?: string;
}

/**
 * Wrap rich content and header/footer settings into a versioned envelope for persistence.
 */
export function wrapContentEnvelope(
  content: object[],
  headerFooter?: DocumentHeaderFooterOptions | null,
  wordCount?: number
): object {
  return {
    schemaVersion: 1,
    type: 'document_envelope',
    body: content,
    headerFooter: headerFooter ?? null,
    wordCount: wordCount ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Unwrap content that may be a versioned envelope or a legacy raw array of Slate nodes.
 */
export function unwrapContentEnvelope(raw: unknown): {
  content: object[];
  headerFooter?: DocumentHeaderFooterOptions;
} {
  if (Array.isArray(raw)) {
    return { content: raw };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.type === 'document_envelope' && Array.isArray(obj.body)) {
      return {
        content: obj.body as object[],
        headerFooter: (obj.headerFooter as DocumentHeaderFooterOptions) || undefined,
      };
    }
  }
  return { content: [{ type: 'p', children: [{ text: '' }] }] };
}

export interface DraftState {
  id: string;
  userId: string;
  title: string;
  templateId?: string;
  templateName?: string;
  phase?: string;
  content: object[];
  headerFooter?: DocumentHeaderFooterOptions;
  wordCount: number;
  revision: number;
  status: 'draft' | 'submitted' | 'locked';
  submissionId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'conflict' | 'error';

export type ConflictResolution =
  | { type: 'keep_local' }
  | { type: 'accept_cloud'; cloudDraft: DraftState }
  | { type: 'fork_local'; newDraftId: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOUD_DEBOUNCE_MS = 2500;
const VERSION_MIN_ACTIVE_MS = 10 * 60 * 1000; // 10 minutes
const VERSION_MIN_WORD_DELTA = 50;
const BROADCAST_CHANNEL_NAME = 'ojt-doc-editor';
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_STALE_MS = 12000;

// ─── IDB helpers ─────────────────────────────────────────────────────────────

function idbKey(userId: string, draftId: string): string {
  return `${userId}:${draftId}`;
}

async function readCached(userId: string, draftId: string): Promise<DraftState | undefined> {
  return get<DraftState>(idbKey(userId, draftId));
}

async function writeCached(state: DraftState): Promise<void> {
  await set(idbKey(state.userId, state.id), state);
}

async function clearCached(userId: string, draftId: string): Promise<void> {
  await del(idbKey(userId, draftId));
}

// ─── Word count ───────────────────────────────────────────────────────────────

export function countWords(content: object[]): number {
  let count = 0;
  function traverse(nodes: object[]): void {
    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      if (typeof n.text === 'string') {
        const words = n.text.trim().split(/\s+/).filter(Boolean);
        count += words.length;
      }
      if (Array.isArray(n.children)) traverse(n.children as object[]);
    }
  }
  traverse(content);
  return count;
}

// ─── DocumentHistoryStorage class ─────────────────────────────────────────────

export class DocumentHistoryStorage {
  private userId: string;
  private draftId: string;

  /** Current acknowledged cloud revision */
  private cloudRevision: number = 1;
  /** Pending local state (most recent) */
  private pendingState: DraftState | null = null;

  /** Debounce timer for cloud save */
  private cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
  /** Whether a cloud save is in-flight */
  private cloudSavePromise: Promise<DraftState> | null = null;

  /** IDB write queue — latest state only */
  private idbPending: DraftState | null = null;
  private idbFlushPending = false;

  /** Version tracking */
  private sessionStartMs: number = Date.now();
  private wordCountAtVersionStart: number = 0;
  private lastVersionWordCount: number = 0;

  /** BroadcastChannel for multi-tab presence */
  private channel: BroadcastChannel | null = null;
  private tabId: string = Math.random().toString(36).slice(2);
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private onMultiTabConflict?: () => void;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

  /** Sync status change callback */
  private onStatusChange?: (status: SyncStatus) => void;
  /** Conflict detected callback */
  private onConflict?: (local: DraftState, remote: DraftState) => void;
  /** Cloud save acknowledgement callback */
  private onSaved?: (saved: DraftState) => void;

  constructor(
    userId: string,
    draftId: string,
    opts: {
      onStatusChange?: (status: SyncStatus) => void;
      onConflict?: (local: DraftState, remote: DraftState) => void;
      onMultiTabConflict?: () => void;
      onSaved?: (saved: DraftState) => void;
    } = {}
  ) {
    this.userId = userId;
    this.draftId = draftId;
    this.onStatusChange = opts.onStatusChange;
    this.onConflict = opts.onConflict;
    this.onMultiTabConflict = opts.onMultiTabConflict;
    this.onSaved = opts.onSaved;
    this.initBroadcastChannel();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Load the initial draft state. Returns cached (IndexedDB) version first,
   * then reconciles with the authoritative cloud version.
   */
  async load(initialRevision: number): Promise<DraftState | undefined> {
    this.cloudRevision = initialRevision;
    const cached = await readCached(this.userId, this.draftId);
    return cached;
  }

  /** Current server-acknowledged revision used for OCC operations. */
  getCloudRevision(): number {
    return this.cloudRevision;
  }

  /** Synchronize the OCC revision after a trusted restore response. */
  setCloudRevision(revision: number): void {
    this.cloudRevision = revision;
  }

  /**
   * Called by the editor on every content change.
   * Queues IDB write and schedules debounced cloud save.
   */
  onChange(state: DraftState): void {
    this.pendingState = { ...state };
    this.scheduleIdbFlush(state);
    this.scheduleCloudSave();
    this.onStatusChange?.('saving');
  }

  /**
   * Force an immediate cloud save (e.g., before navigating away).
   * Returns the updated draft revision or throws on conflict.
   */
  async flushNow(): Promise<DraftState | null> {
    if (this.cloudSaveTimer) {
      clearTimeout(this.cloudSaveTimer);
      this.cloudSaveTimer = null;
    }

    if (this.pendingState) {
      try {
        await writeCached(this.pendingState);
      } catch {
        /* non-fatal */
      }
    }

    if (this.cloudSavePromise) await this.cloudSavePromise;
    if (!this.pendingState) return null;

    return this.doCloudSave();
  }

  /**
   * Create a named version snapshot manually.
   */
  async saveVersion(label: string): Promise<void> {
    await this.flushNow();
    const { error } = await supabase.rpc('create_editor_version', {
      p_draft_id: this.draftId,
      p_label: label,
    });
    if (error) throw new Error(`Could not save version: ${error.message}`);
    this.lastVersionWordCount = this.pendingState?.wordCount ?? 0;
  }

  /**
   * Check whether automatic version criteria are met and create one if so.
   * Called internally after cloud saves.
   */
  private async maybeAutoVersion(state: DraftState): Promise<void> {
    const activeMs = Date.now() - this.sessionStartMs;
    const wordDelta = Math.abs(state.wordCount - this.lastVersionWordCount);
    if (activeMs >= VERSION_MIN_ACTIVE_MS && wordDelta >= VERSION_MIN_WORD_DELTA) {
      try {
        const { error } = await supabase.rpc('create_editor_version', {
          p_draft_id: this.draftId,
          p_label: 'Auto-save',
        });
        if (!error) {
          this.lastVersionWordCount = state.wordCount;
          this.sessionStartMs = Date.now(); // reset timer
        }
      } catch {
        // Non-fatal — autosave version failure should not surface to user
      }
    }
  }

  /**
   * Soft-delete the draft (with OCC).
   */
  async softDelete(): Promise<void> {
    if (!this.pendingState) throw new Error('No draft loaded.');
    const { error } = await supabase.rpc('soft_delete_editor_draft', {
      p_draft_id: this.draftId,
      p_expected_revision: this.cloudRevision,
    });
    if (error) throw new Error(`Delete failed: ${error.message}`);
    await clearCached(this.userId, this.draftId);
  }

  /**
   * Undo soft-delete.
   */
  async restoreDraft(): Promise<void> {
    const { error } = await supabase.rpc('restore_editor_draft', {
      p_draft_id: this.draftId,
    });
    if (error) throw new Error(`Restore failed: ${error.message}`);
  }

  /**
   * Explicit conflict resolution.
   */
  async resolveConflict(
    resolution: ConflictResolution,
    localState: DraftState,
    remoteRevision: number
  ): Promise<void> {
    if (resolution.type === 'keep_local') {
      // Snapshot remote, apply local via force resolution
      const { error } = await supabase.rpc('resolve_editor_conflict', {
        p_draft_id: this.draftId,
        p_force_revision: remoteRevision,
        p_title: localState.title,
        p_content: localState.content,
        p_word_count: localState.wordCount,
        p_snapshot_discarded: true,
      });
      if (error) throw new Error(`Conflict resolution failed: ${error.message}`);
      this.cloudRevision = remoteRevision + 1;
    } else if (resolution.type === 'accept_cloud') {
      // Accept cloud: snapshot local first
      await supabase.rpc('create_editor_version', {
        p_draft_id: this.draftId,
        p_label: 'Conflict \u2013 discarded local',
      });
      this.cloudRevision = resolution.cloudDraft.revision;
      await writeCached(resolution.cloudDraft);
    } else if (resolution.type === 'fork_local') {
      // Fork: create new draft with local content
      const payloadContent = localState.headerFooter
        ? wrapContentEnvelope(localState.content, localState.headerFooter, localState.wordCount)
        : localState.content;

      await supabase.rpc('create_editor_draft', {
        p_id: resolution.newDraftId,
        p_title: `[Offline Copy] ${localState.title}`,
        p_template_id: localState.templateId ?? null,
        p_template_name: localState.templateName ?? null,
        p_phase: localState.phase ?? null,
        p_content: payloadContent,
        p_word_count: localState.wordCount,
      });
    }
  }

  /**
   * Clean up timers and BroadcastChannel. Call on unmount or logout.
   */
  destroy(): void {
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.cloudSaveTimer) {
      clearTimeout(this.cloudSaveTimer);
      this.cloudSaveTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pendingState) {
      void this.doCloudSave().catch(() => {});
    }
    this.channel?.postMessage({ type: 'DOC_CLOSE', tabId: this.tabId, draftId: this.draftId });
    this.channel?.close();
    this.channel = null;
  }

  // ─── IDB layer ───────────────────────────────────────────────────────────

  private scheduleIdbFlush(state: DraftState): void {
    this.idbPending = state;
    if (this.idbFlushPending) return;
    this.idbFlushPending = true;
    // Use a microtask to coalesce rapid writes
    Promise.resolve().then(async () => {
      this.idbFlushPending = false;
      if (this.idbPending) {
        try { await writeCached(this.idbPending); } catch { /* non-fatal */ }
        this.idbPending = null;
      }
    });
  }

  // ─── Cloud save layer ─────────────────────────────────────────────────────

  private scheduleCloudSave(): void {
    if (this.cloudSaveTimer) clearTimeout(this.cloudSaveTimer);
    this.cloudSaveTimer = setTimeout(() => {
      this.cloudSaveTimer = null;
      void this.doCloudSave().catch(() => {
        this.onStatusChange?.('offline');
      });
    }, CLOUD_DEBOUNCE_MS);
  }

  private async doCloudSave(): Promise<DraftState> {
    if (this.cloudSavePromise) return this.cloudSavePromise;

    const state = this.pendingState;
    if (!state) throw new Error('No pending state to save.');

    const save = async (): Promise<DraftState> => {
      this.onStatusChange?.('saving');
      const payloadContent = state.headerFooter
        ? wrapContentEnvelope(state.content, state.headerFooter, state.wordCount)
        : state.content;

      const { data, error } = await supabase.rpc('save_editor_draft', {
        p_draft_id: this.draftId,
        p_expected_revision: this.cloudRevision,
        p_title: state.title,
        p_content: payloadContent,
        p_word_count: state.wordCount,
      });
      if (error) throw new Error(error.message);

      const result = data as { conflict: boolean; draft?: any; current?: any };

      if (result.conflict) {
        const rawRemote = result.current!;
        const { content: remoteContent, headerFooter: remoteHF } = unwrapContentEnvelope(rawRemote.content);
        const remote: DraftState = {
          id: rawRemote.id,
          userId: rawRemote.user_id,
          title: rawRemote.title,
          templateId: rawRemote.template_id,
          templateName: rawRemote.template_name,
          phase: rawRemote.phase,
          content: remoteContent,
          headerFooter: remoteHF,
          wordCount: rawRemote.word_count,
          revision: rawRemote.revision,
          status: rawRemote.status,
          submissionId: rawRemote.submission_id,
          createdAt: rawRemote.created_at,
          updatedAt: rawRemote.updated_at,
        };
        this.onStatusChange?.('conflict');
        this.onConflict?.(state, remote);
        throw new Error('CONFLICT');
      }

      const saved = result.draft!;
      this.cloudRevision = saved.revision;
      if (this.pendingState === state) this.pendingState = null;
      this.onStatusChange?.('saved');
      const acknowledged: DraftState = {
        ...state,
        revision: saved.revision,
        updatedAt: saved.updated_at || saved.updatedAt || new Date().toISOString(),
      };
      await writeCached(acknowledged);
      this.onSaved?.(acknowledged);
      void this.maybeAutoVersion(state);
      return acknowledged;
    };

    this.cloudSavePromise = save().finally(() => {
      this.cloudSavePromise = null;
      if (this.pendingState && this.pendingState !== state && !this.cloudSaveTimer) {
        this.scheduleCloudSave();
      }
    });

    return this.cloudSavePromise;
  }

  // ─── BroadcastChannel (multi-tab presence) ────────────────────────────────

  private presenceMap: Map<string, number> = new Map(); // tabId -> lastHeartbeat

  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && !this.beforeUnloadHandler) {
      this.beforeUnloadHandler = () => {
        if (this.pendingState) {
          void writeCached(this.pendingState).catch(() => {});
          void this.doCloudSave().catch(() => {});
        }
      };
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    if (typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => this.handleChannelMessage(event.data);

      // Announce presence and query for other tabs
      this.channel.postMessage({ type: 'DOC_QUERY', tabId: this.tabId, draftId: this.draftId });

      // Heartbeat
      this.heartbeatTimer = setInterval(() => {
        this.channel?.postMessage({ type: 'DOC_HEARTBEAT', tabId: this.tabId, draftId: this.draftId });
        // Prune stale presence
        const now = Date.now();
        for (const [id, ts] of this.presenceMap.entries()) {
          if (now - ts > HEARTBEAT_STALE_MS) this.presenceMap.delete(id);
        }
      }, HEARTBEAT_INTERVAL_MS);
    } catch {
      // BroadcastChannel not supported — gracefully degrade
    }
  }

  private handleChannelMessage(msg: Record<string, unknown>): void {
    if (msg.draftId !== this.draftId) return;
    const remoteTabId = msg.tabId as string;
    if (remoteTabId === this.tabId) return; // ignore self

    switch (msg.type) {
      case 'DOC_QUERY':
        // Another tab is asking if we're here
        this.channel?.postMessage({ type: 'DOC_PRESENT', tabId: this.tabId, draftId: this.draftId });
        break;
      case 'DOC_PRESENT':
        if (!this.presenceMap.has(remoteTabId)) {
          // First time we see this tab — warn about multi-tab editing
          this.onMultiTabConflict?.();
        }
        this.presenceMap.set(remoteTabId, Date.now());
        break;
      case 'DOC_HEARTBEAT':
        this.presenceMap.set(remoteTabId, Date.now());
        break;
      case 'DOC_CLOSE':
        this.presenceMap.delete(remoteTabId);
        break;
    }
  }
}

// ─── Static helpers for account-switch cache isolation ────────────────────────

/**
 * Clear all cached drafts for a specific user.
 * Call on logout to prevent another user from reading the previous user's data.
 */
export async function clearAllDraftCacheForUser(userId: string): Promise<void> {
  // idb-keyval doesn't support prefix scan; we iterate known keys by listing.
  // For simplicity, we track open draft IDs in a user-scoped index key.
  const indexKey = `user-draft-index:${userId}`;
  const draftIds = await get<string[]>(indexKey) ?? [];
  for (const id of draftIds) {
    await del(idbKey(userId, id));
  }
  await del(indexKey);
}

/**
 * Register a draft ID in the user's local draft index (for cache cleanup on logout).
 */
export async function registerDraftInIndex(userId: string, draftId: string): Promise<void> {
  const indexKey = `user-draft-index:${userId}`;
  const existing = await get<string[]>(indexKey) ?? [];
  if (!existing.includes(draftId)) {
    await set(indexKey, [...existing, draftId]);
  }
}
