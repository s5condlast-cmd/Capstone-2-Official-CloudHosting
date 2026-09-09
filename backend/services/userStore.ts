import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel
  ? path.join('/tmp', 'data')
  : path.resolve(process.cwd(), 'backend', 'data');
const DATA_FILE = path.join(DATA_DIR, 'provisioned_users.json');

// In-memory fallback cache to ensure zero crashes in serverless read-only environments
let memoryUsersCache: ProvisionedUser[] | null = null;

// Ensure data directory exists safely without crashing
function ensureDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Non-blocking in read-only filesystems (memory cache will serve requests)
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
    id: 'admin-main-001',
    email: 'johndwayneguaniso.05242004@gmail.com',
    name: 'John Dwayne Guaniso',
    role: 'admin',
    dept: 'System Administration',
    status: 'Active',
    passwordHash: hashPassword('123'),
    requiresPasswordChange: false,
    mfaEnrolled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-role-002',
    email: 'admin@practicum.edu',
    name: 'Administrator',
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
    id: 'adviser-role-003',
    email: 'adviser@practicum.edu',
    name: 'Dr. Sarah Johnson',
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
    id: 'supervisor-role-004',
    email: 'supervisor@practicum.edu',
    name: 'Engr. Paolo Reyes',
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
    id: 'student-role-005',
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
 * Loads all provisioned users from the persistent JSON file or in-memory cache.
 */
export function loadAllUsers(): ProvisionedUser[] {
  if (memoryUsersCache && memoryUsersCache.length > 0) {
    return memoryUsersCache;
  }

  let users: ProvisionedUser[] = [];

  try {
    ensureDirExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      if (raw && raw.trim()) {
        users = JSON.parse(raw) as ProvisionedUser[];
      }
    }
  } catch (err) {
    // Graceful fallback to memory store if filesystem is unavailable
  }

  let hasMutated = false;

  // Ensure default system seeds always exist and maintain official administrative roles
  for (const seed of DEFAULT_SYSTEM_SEEDS) {
    const existingIdx = users.findIndex(
      (u) => u.email.toLowerCase() === seed.email.toLowerCase() || u.id === seed.id
    );
    if (existingIdx === -1) {
      users.push(seed);
      hasMutated = true;
    } else if (seed.email.toLowerCase() === 'johndwayneguaniso.05242004@gmail.com' && users[existingIdx].role !== 'admin') {
      // Elevate official administrator
      users[existingIdx].role = 'admin';
      users[existingIdx].dept = 'System Administration';
      users[existingIdx].status = 'Active';
      users[existingIdx].passwordHash = seed.passwordHash;
      users[existingIdx].requiresPasswordChange = false;
      hasMutated = true;
    }
  }

  memoryUsersCache = users;
  if (hasMutated) {
    saveAllUsers(users);
  }
  return users;
}

/**
 * Atomically writes provisioned users to the persistent JSON file and in-memory cache.
 */
export function saveAllUsers(users: ProvisionedUser[]): void {
  // Always update in-memory cache first
  memoryUsersCache = [...users];

  try {
    ensureDirExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    // Non-blocking in serverless environments (in-memory store preserves state for the invocation)
  }
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

  users[targetIdx].passwordHash = hashPassword(newPassword);
  users[targetIdx].requiresPasswordChange = requiresPasswordChange;
  users[targetIdx].updatedAt = new Date().toISOString();

  saveAllUsers(users);
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
  const users = loadAllUsers();
  const user = findUser(identifier);
  if (!user) return false;

  const targetId = user.id.toLowerCase();
  const targetEmail = user.email.toLowerCase();

  const filtered = users.filter(
    (u) => u.id.toLowerCase() !== targetId && u.email.toLowerCase() !== targetEmail
  );
  saveAllUsers(filtered);
  return true;
}

