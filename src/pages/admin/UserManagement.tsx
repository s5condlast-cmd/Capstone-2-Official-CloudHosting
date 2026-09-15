import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { apiJson } from '@/src/lib/api';
import { useAuth } from '@/src/contexts/AuthContext';
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
  Smartphone,
  Copy
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
  adviserId?: string;
  supervisorId?: string;
  resetRequested?: boolean;
  mfaEnrolled?: boolean;
}

interface CredentialReceipt {
  user: Pick<UserRecord, 'id' | 'name' | 'email' | 'role'>;
  temporaryPassword: string;
  portalLink: string;
}

const tabs: { key: TabKey; label: string; icon: React.ElementType; roleFilter?: UserRole }[] = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'students', label: 'Students', icon: GraduationCap, roleFilter: 'Student' },
  { key: 'advisers', label: 'Advisers', icon: Briefcase, roleFilter: 'Adviser' },
  { key: 'supervisors', label: 'Supervisors', icon: Briefcase, roleFilter: 'Supervisor' },
  { key: 'admins', label: 'Admins', icon: Shield, roleFilter: 'Admin' },
];

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
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
  const [formAdviserId, setFormAdviserId] = useState('');
  const [formSupervisorId, setFormSupervisorId] = useState('');
  const [assignmentUser, setAssignmentUser] = useState<UserRecord | null>(null);
  const [formDept, setFormDept] = useState('BSIT 402');
  const [formCompanyName, setFormCompanyName] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [credentialReceipt, setCredentialReceipt] = useState<CredentialReceipt | null>(null);

  // ── Fetch Users from Supabase Database and backend directory on mount ──
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiJson<{ users: UserRecord[] }>('/api/users');
      setUsers(data.users);
    } catch (error) {
      setUsers([]);
      toast.error(error instanceof Error ? error.message : 'Unable to load users.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const currentTabConfig = tabs.find(t => t.key === activeTab)!;
  
  const filtered = users.filter(u => {
    const matchRole = !currentTabConfig.roleFilter || u.role === currentTabConfig.roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    
    let matchFilter = true;
    if (activeFilter === 'Password Setup Required') matchFilter = !!u.resetRequested;
    if (activeFilter === 'Inactive Users') matchFilter = u.status === 'Suspended';
    if (activeFilter === 'Pending Approval') matchFilter = u.status === 'Pending';

    return matchRole && matchSearch && matchFilter;
  });

  const getCounts = (role?: UserRole) => users.filter(u => !role || u.role === role).length;

  // ── Handle Add User Submission directly into Supabase & Persistent Backend ──
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormSubmitting(true);
    try {
      const result = await apiJson<CredentialReceipt>('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim().toLowerCase(), role: formRole,
          studentId: formStudentId.trim() || undefined, dept: formDept.trim(), companyName: formCompanyName.trim() || undefined,
          adviserId: formRole === 'Student' ? formAdviserId || undefined : undefined,
          supervisorId: formRole === 'Student' ? formSupervisorId || undefined : undefined }),
      });
      toast.success('Account created. Copy the credentials before closing the dialog.');
      setIsAddUserOpen(false); setFormName(''); setFormEmail(''); setFormStudentId('');
      setCredentialReceipt(result);
      await fetchUsers();
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Account creation failed.'); }
    finally { setFormSubmitting(false); }
  };
  const performUserAction = async (user: UserRecord, suffix: string, method: string, message: string, body?: object) => {
    try {
      await apiJson('/api/users/' + encodeURIComponent(user.id) + suffix, { method,
        headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      toast.success(message); await fetchUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Account update failed.'); }
  };
  const handleResetPassword = async (user: UserRecord) => {
    if (!confirm(`Reset ${user.email}'s password and revoke all existing sessions? A temporary password will be shown once.`)) return;
    try {
      const result = await apiJson<Omit<CredentialReceipt, 'user'>>(`/api/users/${encodeURIComponent(user.id)}/reset-password`, { method: 'POST' });
      setCredentialReceipt({ ...result, user });
      toast.success('Password reset. Copy the credentials before closing the dialog.');
      await fetchUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Password reset failed.'); }
  };

  const credentialMessage = credentialReceipt ? `Practicum Portal Account

Name: ${credentialReceipt.user.name}
Email: ${credentialReceipt.user.email}
Temporary Password: ${credentialReceipt.temporaryPassword}
Portal: ${credentialReceipt.portalLink}

Sign in and immediately create your private password. Do not share these credentials. Delete this message after changing your password.` : '';
  const closeCredentialReceipt = () => setCredentialReceipt(null);
  const copyCredentials = async () => {
    try { await navigator.clipboard.writeText(credentialMessage); toast.success('Credentials copied. Send them only in a private message.'); }
    catch { toast.error('Clipboard access failed. Select and copy the credentials manually.'); }
  };
  const handleResetMfa = async (user: UserRecord) => {
    const isSelfReset = user.id === currentUser?.id;
    const prompt = isSelfReset
      ? 'Reset your authenticator? This immediately signs you out. Delete the old entry from your authenticator app, then sign in and scan the new QR code.'
      : 'Have you verified ' + user.name + "'s identity? This removes their Supabase authenticator factor and revokes existing sessions. They must also delete the old entry from their authenticator app.";
    if (!confirm(prompt)) return;
    try {
      const result = await apiJson<{ message: string }>(`/api/users/${encodeURIComponent(user.id)}/reset-mfa`, { method: 'POST' });
      toast.success(result.message);
      if (isSelfReset) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        window.location.assign('/login');
        return;
      }
      await fetchUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Authenticator reset failed.'); }
  };
  const handleDeleteUser = async (user: UserRecord) => {
    if (!confirm('Disable and delete the login for ' + user.name + '? Historical records will be retained.')) return;
    await performUserAction(user, '', 'DELETE', 'Account access removed.');
  };
  const handleToggleStatus = async (user: UserRecord) => {
    const status = user.status === 'Active' ? 'Suspended' : 'Active';
    await performUserAction(user, '/status', 'PATCH', 'Account status updated.', { status });
  };

  const reviewerFields = <div className="space-y-3">
    <label className="block text-sm">Assigned adviser<select className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 dark:bg-zinc-900" value={formAdviserId} onChange={e => setFormAdviserId(e.target.value)}>
      <option value="">Not assigned</option>{users.filter(u => u.role === 'Adviser' && u.status === 'Active').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select></label>
    <label className="block text-sm">Assigned supervisor<select className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 dark:bg-zinc-900" value={formSupervisorId} onChange={e => setFormSupervisorId(e.target.value)}>
      <option value="">Not assigned</option>{users.filter(u => u.role === 'Supervisor' && u.status === 'Active').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select></label>
    <p className="text-xs text-zinc-500">Only assigned reviewers and administrators can access this student's submissions.</p>
  </div>;
  return (
    <div className="space-y-8 pb-12">
      {credentialReceipt && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5">
        <div role="dialog" aria-modal="true" aria-label="Temporary account credentials" className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Temporary credentials</h2>
              <p className="mt-1 text-sm text-zinc-500">Shown once. Send privately through Messenger, SMS, or another verified direct channel.</p></div>
            <button type="button" onClick={closeCredentialReceipt} aria-label="Close and clear credentials" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={17} /></button>
          </div>
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div><span className="text-zinc-500">Name</span><p className="font-semibold">{credentialReceipt.user.name}</p></div>
            <div><span className="text-zinc-500">Email</span><p className="font-mono font-semibold select-all">{credentialReceipt.user.email}</p></div>
            <div><span className="text-zinc-500">Temporary password</span><p className="break-all font-mono text-base font-bold select-all">{credentialReceipt.temporaryPassword}</p></div>
            <div><span className="text-zinc-500">Role</span><p className="font-semibold">{credentialReceipt.user.role}</p></div>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">Do not post credentials in a group chat or save them in a spreadsheet. Verify the recipient before sending.</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={closeCredentialReceipt}>Close & Clear</Button>
            <Button type="button" icon={<Copy size={14} />} onClick={copyCredentials}>Copy Credentials</Button></div>
        </div>
      </div>}
      {assignmentUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
        <form role="dialog" aria-modal="true" aria-label="Assign student reviewers" className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 dark:bg-zinc-950" onSubmit={async e => {
          e.preventDefault(); setFormSubmitting(true); setFormError('');
          try {
            await apiJson(`/api/users/${assignmentUser.id}/assignment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adviserId: formAdviserId || null, supervisorId: formSupervisorId || null }) });
            setAssignmentUser(null); await fetchUsers(); toast.success('Reviewer assignments saved.');
          } catch (error) { setFormError(error instanceof Error ? error.message : 'Assignments were not saved.'); }
          finally { setFormSubmitting(false); }
        }}>
          <h2 className="text-lg font-semibold">Reviewers for {assignmentUser.name}</h2>{reviewerFields}
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3"><button type="button" disabled={formSubmitting} onClick={() => setAssignmentUser(null)}>Cancel</button><Button type="submit" disabled={formSubmitting}>Save assignments</Button></div>
        </form>
      </div>}
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
         {['Password Setup Required', 'Inactive Users', 'Pending Approval'].map((tag, i) => (
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
             {tag === 'Password Setup Required' && activeFilter !== tag && users.some(u => u.resetRequested) && (
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
                setFormAdviserId(''); setFormSupervisorId('');
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
                               Password Setup Required
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
                       {u.role === 'Student' && <Button size="sm" variant="outline" title="Assign reviewers" onClick={() => {
                         setFormAdviserId(u.adviserId || ''); setFormSupervisorId(u.supervisorId || ''); setFormError(''); setAssignmentUser(u);
                       }}><Users size={14} /></Button>}
                       <Button 
                         size="sm" 
                         variant={u.resetRequested ? "default" : "outline"}
                         className={cn("p-2", u.resetRequested ? "bg-red-600 hover:bg-red-700 text-white" : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                         onClick={() => handleResetPassword(u)}
                         title="Issue a one-time temporary password"
                       >
                         <KeyRound size={14} className={u.resetRequested ? "animate-pulse" : ""} />
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         disabled={!u.mfaEnrolled}
                         className={cn("p-2", !u.mfaEnrolled ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/40" : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                         onClick={() => handleResetMfa(u)}
                         title={u.id === currentUser?.id ? "Reset my authenticator, sign out, and require a new QR code" : u.mfaEnrolled ? "Remove this factor and require a new QR code" : "Authenticator enrollment is already required"}
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
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@practicum.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                  />
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                    This email is the account name. It does not need to be a Gmail address.
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

                {formRole === 'Student' && reviewerFields}
                <p className="text-sm text-zinc-500">A unique temporary password will be generated. Send it only through a private message to the verified user.</p>

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
                        <span>Create account</span>
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
