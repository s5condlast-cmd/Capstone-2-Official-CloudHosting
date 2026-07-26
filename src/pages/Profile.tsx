import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { 
  User as UserIcon, 
  Mail as MailIcon, 
  Phone as PhoneIcon, 
  MapPin as MapPinIcon, 
  Shield as ShieldIcon, 
  Camera as CameraIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Building as BuildingIcon
} from 'lucide-react';
import { User as UserType } from '@/src/types';

interface ProfileProps {
  user: UserType | null;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="text-center p-8">
            <div className="relative inline-block mb-3">
              <div className="w-32 h-32 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-white shadow-xl flex items-center justify-center text-zinc-300">
                <UserIcon size={64} strokeWidth={1} />
              </div>
              <button className="absolute bottom-1 right-1 p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-full border border-white shadow-lg hover:scale-110 transition-transform">
                <CameraIcon size={16} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</h3>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mt-1">{user?.role} PORTAL ACCESS</p>
            
            <div className="mt-8 pt-8 border-t border-zinc-50 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tight">Account Status</span>
                <Badge variant="success">verified</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tight">Last Activity</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">2 mins ago</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Form */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Personal Information" action={<Button size="sm" icon={<SaveIcon size={14} />}>Save Changes</Button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Full Legal Name" defaultValue={user?.role === 'student' ? 'John Dwayne B. Guaniso' : user?.name} />
               <Input label="Email Address" type="email" defaultValue={user?.email} />
               <Input label="Contact Number" placeholder="+63 9XX XXX XXXX" />
               <Input label="Department/Major" defaultValue={user?.department || 'College of Computer Studies'} />
               
               <div className="md:col-span-2">
                 <Input label="Current Address" icon={<MapPinIcon size={14} />} placeholder="123 Academic St. University Town" />
               </div>
            </div>
          </Card>


          {user?.role === 'adviser' && (
            <Card title="Advisory Overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block">Assigned Sections</span>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">IT401, IT402, CS401</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block">Total Students</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">45 Active</span>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block">Primary Role</span>
                    <Badge variant="outline">Practicum Coordinator</Badge>
                 </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
