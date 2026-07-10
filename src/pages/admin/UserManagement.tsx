import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  UserPlus,
  ShieldCheck,
  Ban,
  ChevronRight,
  Users,
  Briefcase,
  Shield,
  KeyRound
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

type UserRole = 'Student' | 'Adviser' | 'Admin';
type TabKey = 'all' | 'students' | 'advisers' | 'admins';

interface UserRecord {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'Active' | 'Suspended' | 'Pending';
  dept: string;
  resetRequested?: boolean;
}

const allUsers: UserRecord[] = [
  { id: '1', name: 'Alice Brown', role: 'Student', email: 'alice.b@edu.ph', status: 'Active', dept: '__BSIT 402_401__' },
  { id: '2', name: 'Dr. Sarah Johnson', role: 'Adviser', email: 's.johnson@edu.ph', status: 'Active', dept: 'BSIT 402' },
  { id: '3', name: 'Charlie Davis', role: 'Student', email: 'c.davis@edu.ph', status: 'Active', dept: '__BSIT 402_401__', resetRequested: true },
  { id: '4', name: 'Bob White', role: 'Student', email: 'b.white@edu.ph', status: 'Suspended', dept: 'BSIT 402' },
  { id: '5', name: 'Prof. Mike Ross', role: 'Adviser', email: 'm.ross@edu.ph', status: 'Active', dept: '__BSIT 402_401__' },
  { id: '6', name: 'Maria Santos', role: 'Student', email: 'm.santos@edu.ph', status: 'Active', dept: '__BSIT 402_401__' },
  { id: '7', name: 'John Reyes', role: 'Student', email: 'j.reyes@edu.ph', status: 'Active', dept: 'BSIT 402' },
  { id: '8', name: 'Eva Green', role: 'Student', email: 'e.green@edu.ph', status: 'Pending', dept: '__BSIT 402_401__' },
  { id: '9', name: 'Dr. Emily Blunt', role: 'Adviser', email: 'e.blunt@edu.ph', status: 'Active', dept: 'BSIT 402' },
  { id: '10', name: 'Admin User', role: 'Admin', email: 'admin@edu.ph', status: 'Active', dept: 'System' },
  { id: '11', name: 'Robert Cruz', role: 'Student', email: 'r.cruz@edu.ph', status: 'Active', dept: 'BSIT 402', resetRequested: true },
  { id: '12', name: 'James Tan', role: 'Student', email: 'j.tan@edu.ph', status: 'Suspended', dept: '__BSIT 402_401__' },
];

const tabs: { key: TabKey; label: string; icon: React.ElementType; roleFilter?: UserRole }[] = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'students', label: 'Students', icon: GraduationCap, roleFilter: 'Student' },
  { key: 'advisers', label: 'Advisers', icon: Briefcase, roleFilter: 'Adviser' },
  { key: 'admins', label: 'Admins', icon: Shield, roleFilter: 'Admin' },
];

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const currentTabConfig = tabs.find(t => t.key === activeTab)!;
  
  const filtered = allUsers.filter(u => {
    const matchRole = !currentTabConfig.roleFilter || u.role === currentTabConfig.roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    
    let matchFilter = true;
    if (activeFilter === 'Password Resets') matchFilter = !!u.resetRequested;
    if (activeFilter === 'Inactive Users') matchFilter = u.status === 'Suspended';
    if (activeFilter === 'Pending Approval') matchFilter = u.status === 'Pending';

    return matchRole && matchSearch && matchFilter;
  });

  const getCounts = (role?: UserRole) => allUsers.filter(u => !role || u.role === role).length;

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
             {tag === 'Password Resets' && activeFilter !== tag && (
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
            <Button size="sm" icon={<UserPlus size={14} />} className="whitespace-nowrap">Add User</Button>
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
                        {u.name[0]}
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{u.role}</span>
                      <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase">{u.dept}</span>
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
                         onClick={() => toast.success(`Password reset initiated for ${u.name}`)}
                         title="Reset Password"
                       >
                         <KeyRound size={14} className={u.resetRequested ? "animate-pulse" : ""} />
                       </Button>
                       <Button size="sm" variant="outline" className="p-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"><Mail size={14} /></Button>
                       <Button size="sm" variant="outline" className="p-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"><ShieldCheck size={14} /></Button>
                       <Button size="sm" variant="danger" className="p-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"><Ban size={14} /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">No users found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
