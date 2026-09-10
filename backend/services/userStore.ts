import crypto from 'crypto';
import { supabase } from '../config/supabase';

export interface ProvisionedUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'adviser' | 'supervisor' | 'admin';
  studentId?: string;
  dept?: string;
  status: 'Active' | 'Suspended' | 'Pending';
  passwordHash: string;
  requiresPasswordChange: boolean;
  mfaEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pure in-memory cache for process lifecycle (100% serverless-safe, zero local disk files)
let memoryUsersCache: ProvisionedUser[] | null = null;
let memoryDeletedUsersCache: Set<string> | null = null;

/**
 * Persists a salted password hash to Supabase cloud storage (auth_otps table).
 */
export async function saveCloudPasswordHash(email: string, hash: string): Promise<void> {
  try {
    const normalized = email.toLowerCase().trim();
    const { data: existing } = await supabase
      .from('auth_otps')
      .select('id')
      .ilike('email', normalized)
      .eq('purpose', 'password_reset')
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('auth_otps')
        .update({
          verification_token: hash,
          verified: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('auth_otps')
        .insert({
          email: normalized,
          otp_code: '000000',
          purpose: 'password_reset',
          verification_token: hash,
          verified: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }
  } catch (err) {
    console.warn('[Cloud Password Hash] Save notice:', err);
  }
}

/**
 * Fetches the authoritative salted password hash from Supabase cloud storage.
 */
export async function fetchCloudPasswordHash(email: string): Promise<string | null> {
  try {
    const normalized = email.toLowerCase().trim();
    const { data } = await supabase
      .from('auth_otps')
      .select('verification_token')
      .ilike('email', normalized)
      .eq('purpose', 'password_reset')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.verification_token || null;
  } catch {
    return null;
  }
}

/**
 * Hashes a password with a random salt using SHA-256.
 * Format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies an entered password against a stored hash (or legacy plaintext).
 */
export function verifyPassword(enteredPassword: string, storedHashOrPlain: string): boolean {
  if (!enteredPassword || !storedHashOrPlain) return false;

  // Salted format: salt:hash
  if (storedHashOrPlain.includes(':')) {
    const [salt, hash] = storedHashOrPlain.split(':');
    const computed = crypto.createHash('sha256').update(salt + enteredPassword).digest('hex');
    return computed === hash;
  }

  // Legacy plaintext fallback
  return enteredPassword === storedHashOrPlain;
}

export const DEFAULT_SYSTEM_SEEDS: ProvisionedUser[] = [
  {
    id: '44e3adc7-7b59-423e-a746-a8a055882458',
    email: 'johndwayneguaniso.05242004@gmail.com',
    name: 'John Dwayne Guaniso',
    role: 'admin',
    dept: 'System Administration',
    status: 'Active',
    passwordHash: hashPassword('123'),
    requiresPasswordChange: false,
    mfaEnrolled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    email: 'adviser@practicum.edu',
    name: 'Jiro',
    role: 'adviser',
    dept: 'College of Computer Studies',
    status: 'Active',
    passwordHash: hashPassword('123'),
    requiresPasswordChange: false,
    mfaEnrolled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'b4444444-4444-4444-8444-444444444444',
    email: 'supervisor@practicum.edu',
    name: 'Kerin',
    role: 'supervisor',
    dept: 'InnoTech Labs',
    status: 'Active',
    passwordHash: hashPassword('123'),
    requiresPasswordChange: false,
    mfaEnrolled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'e5555555-5555-4555-8555-555555555555',
    email: 'student@practicum.edu',
    name: 'John Dwayne B. Guaniso',
    role: 'student',
    studentId: '02000249822',
    dept: 'BSIT 402',
    status: 'Active',
    passwordHash: hashPassword('123'),
    requiresPasswordChange: false,
    mfaEnrolled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Loads the in-memory set of deleted user identifiers.
 */
export function loadDeletedUsers(): Set<string> {
  if (!memoryDeletedUsersCache) {
    memoryDeletedUsersCache = new Set<string>();
  }
  return memoryDeletedUsersCache;
}

/**
 * Persists a deleted user ID and email to prevent re-seeding or unauthorized logins.
 */
export function recordDeletedUser(id: string, email: string): void {
  const set = loadDeletedUsers();
  if (id) set.add(id.toLowerCase().trim());
  if (email) {
    const normEmail = email.toLowerCase().trim();
    set.add(normEmail);
    if (normEmail.includes('@')) {
      set.add(normEmail.split('@')[0]);
    }
  }
}

/**
 * Removes a user from the deleted list when they are re-created.
 */
export function unmarkDeletedUser(identifier: string): void {
  const set = loadDeletedUsers();
  const lower = identifier.toLowerCase().trim();
  set.delete(lower);
  if (lower.includes('@')) {
    set.delete(lower.split('@')[0]);
  }
}

/**
 * Checks if a user identifier has been deleted by an administrator.
 */
export function isUserDeleted(identifier: string): boolean {
  if (!identifier) return false;
  const set = loadDeletedUsers();
  const lower = identifier.toLowerCase().trim();
  return set.has(lower) || (lower.includes('@') && set.has(lower.split('@')[0]));
}

/**
 * Loads all provisioned users from the in-memory cache, seeded from institutional defaults.
 */
export function loadAllUsers(): ProvisionedUser[] {
  if (memoryUsersCache && memoryUsersCache.length > 0) {
    return memoryUsersCache;
  }

  const users: ProvisionedUser[] = DEFAULT_SYSTEM_SEEDS.map((seed) => ({ ...seed }));
  memoryUsersCache = users;
  return users;
}

/**
 * Updates the in-memory provisioned users cache.
 */
export function saveAllUsers(users: ProvisionedUser[]): void {
  memoryUsersCache = [...users];
}

/**
 * Finds a user by email, username prefix, id, or studentId.
 */
export function findUser(identifier: string): ProvisionedUser | undefined {
  if (!identifier) return undefined;
  const normalized = identifier.toLowerCase().trim();
  const usernameKey = normalized.includes('@') ? normalized.split('@')[0] : normalized;
  const users = loadAllUsers();

  return users.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uUsername = uEmail.split('@')[0];
    const uId = u.id.toLowerCase();
    const uStudentId = u.studentId ? u.studentId.toLowerCase() : '';

    return (
      uEmail === normalized ||
      uEmail === `${normalized}@practicum.edu` ||
      uEmail === `${normalized}@marikina.sti.edu.ph` ||
      uUsername === usernameKey ||
      uId === normalized ||
      (uStudentId && uStudentId === normalized)
    );
  });
}

/**
 * Upserts a provisioned user in the persistent store.
 */
export function upsertUser(user: Partial<ProvisionedUser> & { email: string }): ProvisionedUser {
  const users = loadAllUsers();
  const normalizedEmail = user.email.toLowerCase().trim();
  unmarkDeletedUser(normalizedEmail);
  if (user.id) unmarkDeletedUser(user.id);

  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail || u.id === user.id);

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = users[existingIdx];
    const updated: ProvisionedUser = {
      ...existing,
      ...user,
      email: normalizedEmail,
      updatedAt: now,
    };
    users[existingIdx] = updated;
    saveAllUsers(users);
    return updated;
  } else {
    const newUser: ProvisionedUser = {
      id: user.id || crypto.randomUUID(),
      email: normalizedEmail,
      name: user.name || normalizedEmail.split('@')[0],
      role: (user.role?.toLowerCase() as any) || 'student',
      studentId: user.studentId,
      dept: user.dept || 'BSIT 402',
      status: user.status || 'Active',
      passwordHash: user.passwordHash || hashPassword('123'),
      requiresPasswordChange: user.requiresPasswordChange ?? true,
      mfaEnrolled: user.mfaEnrolled ?? false,
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    saveAllUsers(users);
    return newUser;
  }
}

/**
 * Updates a user's password dynamically.
 * Automatically hashes the password and updates requiresPasswordChange.
 */
export function updateUserPassword(
  identifier: string,
  newPassword: string,
  requiresPasswordChange: boolean = false
): boolean {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;

  const targetIdx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (targetIdx < 0) return false;

  const newHash = hashPassword(newPassword);
  users[targetIdx].passwordHash = newHash;
  users[targetIdx].requiresPasswordChange = requiresPasswordChange;
  users[targetIdx].updatedAt = new Date().toISOString();

  saveAllUsers(users);

  // Sync to Supabase Cloud
  saveCloudPasswordHash(users[targetIdx].email, newHash).catch(() => {});

  return true;
}

/**
 * Updates MFA enrollment state for a user.
 */
export function updateUserMfa(identifier: string, enrolled: boolean): boolean {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;

  const targetIdx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (targetIdx < 0) return false;

  users[targetIdx].mfaEnrolled = enrolled;
  users[targetIdx].updatedAt = new Date().toISOString();

  saveAllUsers(users);
  return true;
}

/**
 * Updates user account status ('Active' | 'Suspended' | 'Pending').
 */
export function updateUserStatus(
  identifier: string,
  status: 'Active' | 'Suspended' | 'Pending'
): boolean {
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;

  const targetIdx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (targetIdx < 0) return false;

  users[targetIdx].status = status;
  users[targetIdx].updatedAt = new Date().toISOString();

  saveAllUsers(users);
  return true;
}

/**
 * Deletes a user by identifier.
 */
export function deleteUserFromStore(identifier: string): boolean {
  const normalized = identifier.toLowerCase().trim();
  if (normalized === 'johndwayneguaniso.05242004@gmail.com') {
    return false; // Protect system admin from deletion
  }

  const users = loadAllUsers();
  const user = findUser(identifier);
  
  const targetId = user ? user.id.toLowerCase() : normalized;
  const targetEmail = user ? user.email.toLowerCase() : normalized;

  recordDeletedUser(targetId, targetEmail);

  const filtered = users.filter(
    (u) => u.id.toLowerCase() !== targetId && u.email.toLowerCase() !== targetEmail
  );
  saveAllUsers(filtered);
  return true;
}

