/**
 * signatureStorage.ts
 * User-scoped supervisor signature storage.
 *
 * Eliminates cross-account signature leakage by strictly namespacing
 * stored signatures by the authenticated user's ID and clearing on logout.
 */

const KEY_PREFIX = 'supervisor_signature_user_';

export function getSupervisorSignature(userId: string | undefined): string | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    // 1. Check user-scoped key
    const scopedKey = `${KEY_PREFIX}${userId}`;
    const sig = localStorage.getItem(scopedKey);
    if (sig) return sig;

    // 2. One-time safe migration from legacy global key if it exists
    const legacy = localStorage.getItem('supervisor_saved_signature');
    if (legacy) {
      localStorage.setItem(scopedKey, legacy);
      localStorage.removeItem('supervisor_saved_signature');
      return legacy;
    }

    return null;
  } catch (err) {
    console.warn('Could not read supervisor signature from storage:', err);
    return null;
  }
}

export function saveSupervisorSignature(userId: string | undefined, signatureDataUrl: string): void {
  if (!userId || !signatureDataUrl || typeof window === 'undefined') return;
  try {
    const scopedKey = `${KEY_PREFIX}${userId}`;
    localStorage.setItem(scopedKey, signatureDataUrl);
    // Remove legacy un-scoped key
    localStorage.removeItem('supervisor_saved_signature');
  } catch (err) {
    console.warn('Could not save supervisor signature to storage:', err);
  }
}

export function clearSupervisorSignature(userId: string | undefined): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const scopedKey = `${KEY_PREFIX}${userId}`;
    localStorage.removeItem(scopedKey);
    localStorage.removeItem('supervisor_saved_signature');
  } catch (err) {
    console.warn('Could not clear supervisor signature:', err);
  }
}

export function clearAllSupervisorSignatures(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('supervisor_saved_signature');
    const keysToRemove: string[] = [];
    const len = localStorage.length || 0;
    for (let i = 0; i < len; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(KEY_PREFIX) && !keysToRemove.includes(key)) {
          keysToRemove.push(key);
        }
      });
    } catch {}

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Non-fatal
  }
}
