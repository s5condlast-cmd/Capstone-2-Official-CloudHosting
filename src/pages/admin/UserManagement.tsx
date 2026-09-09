import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { supabase } from '@/src/lib/supabase';
import { 
  GraduationCap, 
  Search, 
  Mail, 
  UserPlus, 
  ShieldCheck, 
  Ban, 
  Users, 
  Briefcase, 
  Shield, 
  KeyRound,
  X,
  Building2,
  Lock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  QrCode,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

type UserRole = 'Student' | 'Adviser' | 'Admin' | 'Supervisor';
type TabKey = 'all' | 'students' | 'advisers' | 'supervisors' | 'admins';

interface UserRecord {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'Active' | 'Suspended' | 'Pending';
  dept: string;
  studentId?: string;
  resetRequested?: boolean;
  mfaEnrolled?: boolean;
}

const tabs: { key: TabKey; label: string; icon: React.ElementType; roleFilter?: UserRole }[] = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'students', label: 'Students', icon: GraduationCap, roleFilter: 'Student' },
  { key: 'advisers', label: 'Advisers', icon: Briefcase, roleFilter: 'Adviser' },
  { key: 'supervisors', label: 'Supervisors', icon: Briefcase, roleFilter: 'Supervisor' },
  { key: 'admins', label: 'Admins', icon: Shield, roleFilter: 'Admin' },
];

const isUuid = (val?: string): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());

async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  return { error: `Server error (${res.status}): ${text.slice(0, 120)}` };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // ── Modal State ──
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Student');
  const [formStudentId, setFormStudentId] = useState('');
  const [formDept, setFormDept] = useState('BSIT 402');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Fetch Users from Supabase Database and backend directory on mount ──
  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch from unified API endpoint (auto-seeds institutional users and synchronizes persistent stores)
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
              setUsers(data.users);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // Non-blocking fallback to direct Supabase query
      }

      // 2. Direct Supabase Database query fallback
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[UserManagement] Supabase fetch error:', error);
        toast.error('Failed to load user directory from database');
        return;
      }

      if (data) {
        const mappedUsers: UserRecord[] = data.map((p: any) => {
          const roleRaw = (p.role || 'student').toLowerCase();
          const roleCapitalized: UserRole =
            roleRaw === 'admin' ? 'Admin' :
            roleRaw === 'adviser' ? 'Adviser' :
            roleRaw === 'supervisor' ? 'Supervisor' : 'Student';

          const status: 'Active' | 'Suspended' | 'Pending' =
            p.status ? p.status : (p.is_activated === false ? 'Suspended' : 'Active');

          const dept =
            p.section || p.department || p.company_name || p.program || (roleCapitalized === 'Student' ? 'BSIT 402' : 'General');

          return {
            id: p.id,
            name: p.full_name || p.email.split('@')[0],
            role: roleCapitalized,
            email: p.email,
            status,
            dept,
            studentId: p.student_id || undefined,
            resetRequested: !!p.requires_password_change,
            mfaEnrolled: !!p.mfa_enrolled,
          };
        });
        setUsers(mappedUsers);
      }
    } catch (err: any) {
      console.error('[UserManagement] Fetch exception:', err);
      toast.error('Error connecting to database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const currentTabConfig = tabs.find(t => t.key === activeTab)!;
  
  const filtered = users.filter(u => {
    const matchRole = !currentTabConfig.roleFilter || u.role === currentTabConfig.roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    
    let matchFilter = true;
    if (activeFilter === 'Password Resets') matchFilter = !!u.resetRequested;
    if (activeFilter === 'Inactive Users') matchFilter = u.status === 'Suspended';
    if (activeFilter === 'Pending Approval') matchFilter = u.status === 'Pending';

    return matchRole && matchSearch && matchFilter;
  });

  const getCounts = (role?: UserRole) => users.filter(u => !role || u.role === role).length;

  // ── Handle Add User Submission directly into Supabase & Persistent Backend ──
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Please enter the user\'s full name.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Please enter a username or institutional email address.');
      return;
    }

    setFormSubmitting(true);
    try {
      const trimmedInput = formEmail.trim().toLowerCase();
      const normalizedEmail = trimmedInput.includes('@')
        ? trimmedInput
        : `${trimmedInput}@practicum.edu`;
      const roleLower = formRole.toLowerCase();
      const initialPassword = formPassword.trim() || '123';
      const assignedStudentId = formRole === 'Student' ? (formStudentId.trim() || undefined) : undefined;
      const deptInfo = formRole === 'Student' 
        ? formDept.trim() 
        : (formRole === 'Supervisor' ? formCompanyName.trim() : formDept.trim());

      // 1. Call backend provisioning API as the primary authority (persists to userStore, memory cache, and Supabase)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: normalizedEmail,
          role: formRole,
          studentId: assignedStudentId,
          dept: deptInfo,
          companyName: formRole === 'Supervisor' ? formCompanyName.trim() : undefined,
          password: initialPassword,
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user in directory.');
      }

      // Clear any previous local storage verification for this email
      const cleanKey = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '');
      localStorage.removeItem(`pwd_changed_${cleanKey}`);
      localStorage.removeItem(`mfa_enrolled_${cleanKey}`);
      localStorage.removeItem(`mfa_trusted_${cleanKey}`);

      // 2. Direct best-effort Supabase client sync (non-blocking)
      try {
        const coreProfile: any = {
          email: normalizedEmail,
          full_name: formName.trim(),
          role: roleLower,
          student_id: assignedStudentId || null,
          program: roleLower === 'student' ? (deptInfo.split(' ')[0] || 'BSIT') : null,
          section: roleLower === 'student' ? deptInfo : null,
          department: roleLower === 'adviser' ? deptInfo : null,
          company_name: roleLower === 'supervisor' ? deptInfo : null,
          is_activated: true,
          status: 'Active',
          requires_password_change: true,
          mfa_enrolled: false,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('profiles').upsert(coreProfile, { onConflict: 'email' });
      } catch (clientSyncErr) {
        console.warn('[UserManagement] Client-side Supabase sync note:', clientSyncErr);
      }

      toast.success(`User ${formName.trim()} created! Initial password: ${initialPassword}`);
      setIsAddUserOpen(false);

      // Reset form fields
      setFormName('');
      setFormEmail('');
      setFormRole('Student');
      setFormStudentId('');
      setFormDept('BSIT 402');
      setFormCompanyName('');
      setFormPassword('123');

      // Refresh directory list
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Handle Admin Reset of Credentials & Google Authenticator ──
  const handleResetPassword = async (user: UserRecord) => {
    if (!confirm(`Reset credentials and Google Authenticator for ${user.name}?\n\nThis will:\n1. Reset temporary password to '123'\n2. Require password update on next login\n3. Reset Google Authenticator verification\n\nThe user will be required to change their password and re-verify Google Authenticator on their next login.`)) {
      return;
    }

    try {
      // 1. Clear verification cache
      const cleanKey = user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      localStorage.removeItem(`mfa_enrolled_${cleanKey}`);
      localStorage.removeItem(`mfa_trusted_${cleanKey}`);
      localStorage.removeItem(`pwd_changed_${cleanKey}`);
      if (user.email.includes('@')) {
        const prefixKey = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        localStorage.removeItem(`mfa_enrolled_${prefixKey}`);
        localStorage.removeItem(`mfa_trusted_${prefixKey}`);
        localStorage.removeItem(`pwd_changed_${prefixKey}`);
      }
      if (user.email.toLowerCase() === 'johndwayneguaniso.05242004@gmail.com') {
        ['johndwayne', 'johndwayneguaniso', 'john.dwayne'].forEach((alias) => {
          const aKey = alias.replace(/[^a-zA-Z0-9]/g, '');
          localStorage.removeItem(`mfa_enrolled_${aKey}`);
          localStorage.removeItem(`mfa_trusted_${aKey}`);
          localStorage.removeItem(`pwd_changed_${aKey}`);
        });
      }

      // 2. Call backend reset endpoint to reset password to 123 and clear MFA
      await fetch(`/api/users/${encodeURIComponent(user.email || user.id)}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: '123', email: user.email }),
      }).catch((e) => console.warn('[UserManagement] Reset API notice:', e));

      // 3. Safe UUID Supabase update
      try {
        const filter = isUuid(user.id)
          ? `id.eq.${user.id},email.ilike.${user.email}`
          : `email.ilike.${user.email}`;

        await supabase
          .from('profiles')
          .update({ 
            requires_password_change: true, 
            mfa_enrolled: false, 
            updated_at: new Date().toISOString() 
          })
          .or(filter);
      } catch (dbErr) {
        console.warn('[UserManagement] Supabase reset update notice:', dbErr);
      }

      setUsers(prev => prev.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? { ...u, resetRequested: true, mfaEnrolled: false } : u));
      toast.success(`Reset complete for ${user.name}! Password set to '123' and Google Authenticator reset.`);
    } catch {
      toast.error('Failed to reset user credentials.');
    }
  };

  // ── Handle Admin Reset of Google Authenticator (MFA) Only ──
  const handleResetMfa = async (user: UserRecord) => {
    if (!confirm(`Reset Google Authenticator verification for ${user.name}?\n\nThe user will be prompted to scan a new Google Authenticator QR code on their next login.`)) {
      return;
    }

    try {
      const cleanKey = user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      localStorage.removeItem(`mfa_enrolled_${cleanKey}`);
      localStorage.removeItem(`mfa_trusted_${cleanKey}`);
      if (user.email.includes('@')) {
        const prefixKey = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        localStorage.removeItem(`mfa_enrolled_${prefixKey}`);
        localStorage.removeItem(`mfa_trusted_${prefixKey}`);
      }
      if (user.email.toLowerCase() === 'johndwayneguaniso.05242004@gmail.com') {
        ['johndwayne', 'johndwayneguaniso', 'john.dwayne'].forEach((alias) => {
          const aKey = alias.replace(/[^a-zA-Z0-9]/g, '');
          localStorage.removeItem(`mfa_enrolled_${aKey}`);
          localStorage.removeItem(`mfa_trusted_${aKey}`);
        });
      }

      // Call backend reset MFA endpoint
      await fetch(`/api/users/${encodeURIComponent(user.email || user.id)}/reset-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      }).catch((e) => console.warn('[UserManagement] Reset MFA API notice:', e));

      // Safe UUID Supabase update
      try {
        const filter = isUuid(user.id)
          ? `id.eq.${user.id},email.ilike.${user.email}`
          : `email.ilike.${user.email}`;

        await supabase
          .from('profiles')
          .update({ 
            mfa_enrolled: false, 
            updated_at: new Date().toISOString() 
          })
          .or(filter);
      } catch (dbErr) {
        console.warn('[UserManagement] Supabase MFA update notice:', dbErr);
      }

      setUsers(prev => prev.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? { ...u, mfaEnrolled: false } : u));
      toast.success(`Google Authenticator reset for ${user.name}!`);
    } catch {
      toast.error('Failed to reset Google Authenticator.');
    }
  };

  // ── Handle Delete User from Directory and Persistent Stores ──
  const handleDeleteUser = async (user: UserRecord) => {
    if (user.email.toLowerCase() === 'johndwayneguaniso.05242004@gmail.com') {
      toast.error('The primary system administrator account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.name} from the directory?`)) return;
    try {
      // 1. Call backend delete API (removes from userStore, persistent blacklist, and Supabase Auth admin)
      await fetch(`/api/users/${encodeURIComponent(user.id || user.email)}`, {
        method: 'DELETE',
      }).catch((e) => console.warn('[UserManagement] Backend delete notice:', e));

      // 2. Safe UUID Supabase delete
      try {
        const filter = isUuid(user.id)
          ? `id.eq.${user.id},email.ilike.${user.email}`
          : `email.ilike.${user.email}`;

        await supabase.from('profiles').delete().or(filter);
      } catch (dbErr) {
        console.warn('[UserManagement] Supabase delete note:', dbErr);
      }

      setUsers(prev => prev.filter(u => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase()));
      toast.success(`User ${user.name} removed from directory.`);
    } catch (err: any) {
      toast.error('Failed to delete user from directory.');
    }
  };

  // ── Handle Status Toggle across Database and Backend Stores ──
  const handleToggleStatus = async (user: UserRecord) => {
    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const nextIsActivated = nextStatus === 'Active';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    try {
      // 1. Call backend status PATCH API (updates userStore and in-memory store)
      await fetch(`/api/users/${encodeURIComponent(user.id || user.email)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch((e) => console.warn('[UserManagement] Backend status notice:', e));

      // 2. Safe UUID Supabase profiles update
      try {
        const filter = isUuid(user.id)
          ? `id.eq.${user.id},email.ilike.${user.email}`
          : `email.ilike.${user.email}`;

        await supabase
          .from('profiles')
          .update({ 
            status: nextStatus,
            is_activated: nextIsActivated, 
            updated_at: new Date().toISOString() 
          })
          .or(filter);
      } catch (dbErr) {
        console.warn('[UserManagement] Supabase status update note:', dbErr);
      }

      toast.info(`${user.name} status updated to ${nextStatus}`);
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
      toast.error('Failed to update user status in database');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === tab.key
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/60"
            )}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
              activeTab === tab.key 
                ? "bg-white/20 dark:bg-black/20 text-white dark:text-zinc-900" 
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            )}>
              {getCounts(tab.roleFilter)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
         {['Password Resets', 'Inactive Users', 'Pending Approval'].map((tag, i) => (
           <button 
             key={i} 
             onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
             className={cn(
               "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all",
               activeFilter === tag 
                 ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                 : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
             )}
           >
             {tag}
             {tag === 'Password Resets' && activeFilter !== tag && users.some(u => u.resetRequested) && (
               <span className="ml-2 w-2 h-2 inline-block rounded-full bg-red-500 animate-pulse"></span>
             )}
           </button>
         ))}
      </div>

      <Card 
        title="Directory & Access Management" 
        className="overflow-hidden"
        action={
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
               <input 
                 className="bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-9 text-[10px] font-bold uppercase outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all w-full sm:w-48" 
                 placeholder="Search system..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
            </div>
            <Button 
              size="sm" 
              variant="outline"
              icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
              onClick={fetchUsers}
              disabled={isLoading}
              title="Refresh Directory"
            >
              Refresh
            </Button>
            <Button 
              size="sm" 
              icon={<UserPlus size={14} />} 
              onClick={() => {
                setFormError('');
                setIsAddUserOpen(true);
              }}
              className="whitespace-nowrap"
            >
              Add User
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Identity</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Role/Dept</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Security Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((u, i) => (
                <motion.tr 
                  key={u.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-all">
                        {(u.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          {u.name}
                          {u.resetRequested && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[9px] uppercase tracking-wider font-bold animate-pulse">
                              Reset Requested
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{u.email}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {u.mfaEnrolled ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 px-1.5 py-0.5 rounded">
                              <ShieldCheck size={10} /> Authenticator Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 px-1.5 py-0.5 rounded">
                              <ShieldAlert size={10} /> Authenticator Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{u.role}</span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">{u.dept}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.status === 'Active' ? 'success' : u.status === 'Pending' ? 'warning' : 'error'}>{u.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         size="sm" 
                         variant={u.resetRequested ? "default" : "outline"}
                         className={cn("p-2", u.resetRequested ? "bg-red-600 hover:bg-red-700 text-white" : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                         onClick={() => handleResetPassword(u)}
                         title="Reset Password to '123' & Reset Authenticator"
                       >
                         <KeyRound size={14} className={u.resetRequested ? "animate-pulse" : ""} />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className={cn("p-2", !u.mfaEnrolled ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                         onClick={() => handleResetMfa(u)}
                         title={u.mfaEnrolled ? "Reset Google Authenticator (prompt new QR code)" : "Authenticator pending verification"}
                       >
                         <QrCode size={14} />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="p-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                         onClick={() => window.open(`mailto:${u.email}`)}
                         title="Contact User"
                       >
                         <Mail size={14} />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="danger" 
                         className="p-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                         onClick={() => handleToggleStatus(u)}
                         title={u.status === 'Active' ? 'Suspend User' : 'Reactivate User'}
                       >
                         <Ban size={14} />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="p-2 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                         onClick={() => handleDeleteUser(u)}
                         title="Delete User"
                       >
                         <Trash2 size={14} />
                       </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Loader2 size={24} className="animate-spin text-zinc-400" />
                      <p className="text-xs font-medium text-zinc-400">Loading user directory from Supabase…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      title="No Users Found"
                      description={search ? `No accounts matched "${search}". Try searching for another name or email.` : "No user accounts registered for this role or filter."}
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL: Register New User ── */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-xs">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Register New User</h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      Provision an authorized account in the institutional directory.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                    {formError}
                  </div>
                )}

                {/* Role Picker */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                    User Role
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Student', 'Adviser', 'Supervisor', 'Admin'] as UserRole[]).map((r) => {
                      const Icon = r === 'Student' ? GraduationCap : r === 'Adviser' ? Briefcase : r === 'Supervisor' ? Building2 : Shield;
                      const isSelected = formRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFormRole(r);
                            if (r === 'Student') setFormDept('BSIT 402');
                            else if (r === 'Adviser') setFormDept('College of Computer Studies');
                            else if (r === 'Supervisor') setFormDept('InnoTech Labs');
                            else if (r === 'Admin') setFormDept('Practicum Coordinator');
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all gap-1.5 cursor-pointer",
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
                              : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          )}
                        >
                          <Icon size={16} />
                          <span className="text-[11px]">{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Dwayne B. Guaniso"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                  />
                </div>

                {/* Email Address / Username */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Username, Student ID, or Institutional Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. carlos, 02000249822, or student@practicum.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                  />
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                    No Gmail required. You can enter a simple username, student ID, or institutional email.
                  </p>
                </div>

                {/* Role Specific Fields */}
                {formRole === 'Student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Student ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 02000249822"
                        value={formStudentId}
                        onChange={(e) => setFormStudentId(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Course & Section
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BSIT 402"
                        value={formDept}
                        onChange={(e) => setFormDept(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                )}

                {formRole === 'Adviser' && (
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Academic Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. College of Computer Studies"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                    />
                  </div>
                )}

                {formRole === 'Supervisor' && (
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Host Training Establishment / Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. InnoTech Labs, Makati City"
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                    />
                  </div>
                )}

                {formRole === 'Admin' && (
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Practicum Coordinator / Dean"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                    />
                  </div>
                )}

                {/* Initial Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Initial Password
                    </label>
                    <span className="text-[10px] text-zinc-400 font-medium">Default is 123</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all font-mono"
                  />
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                    The user can immediately sign in with this password from the Login page.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="min-w-[120px] flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Create User</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
