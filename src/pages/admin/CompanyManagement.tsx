import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Globe,
  PlusCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

interface CompanyRecord {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  industry: string;
  status: 'Active' | 'Inactive' | 'Pending MOA';
  moaExpiry: string;
  supervisors: string[];
  students: string[];
  website: string;
}

const mockCompanies: CompanyRecord[] = [
  {
    id: 'co-1',
    name: 'InnoTech Labs',
    industry: 'IT Services & Consulting',
    contactNumber: '+63 2 8123 4567',
    address: '12F Tech Tower, Ortigas Center, Pasig City',
    status: 'Active',
    moaExpiry: 'Dec 31, 2026',
    supervisors: ['Engr. Paolo Reyes'],
    students: ['Maria Santos', 'John Smith'],
    website: 'www.innotechlabs.com'
  },
  {
    id: 'co-2',
    name: 'TechCorp Solutions Inc.',
    industry: 'Software Development',
    contactNumber: '+63 2 8987 6543',
    address: 'Suite 402, Cyber Plaza, Makati City',
    status: 'Active',
    moaExpiry: 'Oct 15, 2026',
    supervisors: ['Mr. James Tan'],
    students: ['Alice Brown'],
    website: 'www.techcorp.com'
  },
  {
    id: 'co-3',
    name: 'Pixel Perfect Co.',
    industry: 'Creative & Digital Media',
    contactNumber: '+63 2 8333 4444',
    address: '5F Art Hub, Lilac St., Marikina City',
    status: 'Pending MOA',
    moaExpiry: 'Pending Verification',
    supervisors: ['Ms. Clara Gomez'],
    students: ['Sarah Lee'],
    website: 'www.pixelperfect.design'
  },
  {
    id: 'co-4',
    name: 'CloudNet Systems',
    industry: 'Cloud Infrastructure & Networks',
    contactNumber: '+63 2 8555 1212',
    address: '88 Cyber Way, Cubao, Quezon City',
    status: 'Active',
    moaExpiry: 'Jan 20, 2027',
    supervisors: ['Mr. Robert Chang'],
    students: [],
    website: 'www.cloudnetsystems.net'
  }
];

export const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyRecord[]>(mockCompanies);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Pending MOA' | 'Inactive'>('all');
  const [expandedCoId, setExpandedCoId] = useState<string | null>(null);

  // Modal / Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoName, setNewCoName] = useState('');
  const [newCoIndustry, setNewCoIndustry] = useState('IT Services');
  const [newCoAddress, setNewCoAddress] = useState('');
  const [newCoContact, setNewCoContact] = useState('');

  const filtered = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.industry.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoName.trim() || !newCoAddress.trim() || !newCoContact.trim()) {
      toast.error('Please fill in all required company fields.');
      return;
    }

    const newCompany: CompanyRecord = {
      id: `co-${companies.length + 1}`,
      name: newCoName,
      industry: newCoIndustry,
      contactNumber: newCoContact,
      address: newCoAddress,
      status: 'Pending MOA',
      moaExpiry: 'Awaiting MOA Submission',
      supervisors: [],
      students: [],
      website: `${newCoName.toLowerCase().replace(/\s+/g, '')}.com`
    };

    setCompanies([newCompany, ...companies]);
    toast.success(`${newCoName} registered successfully! MOA Status: Pending.`);
    setShowAddModal(false);
    setNewCoName('');
    setNewCoAddress('');
    setNewCoContact('');
  };

  const handleRenewMOA = (id: string, name: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: 'Active', moaExpiry: 'July 15, 2027' };
      }
      return c;
    }));
    toast.success(`MOA partnership for ${name} renewed successfully!`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Partner Company Management</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Add companies, monitor Memorandum of Agreement (MOA) status, and manage supervisor/student rosters.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Partner Company
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">MOA Status</span>
            <div className="flex flex-wrap items-center gap-1">
              {(['all', 'Active', 'Pending MOA'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                    statusFilter === f
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {f === 'all' ? 'All Partners' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full xl:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-9 text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" 
              placeholder="Search companies or industry..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Companies List */}
      <Card title="Partner Registry" className="overflow-hidden">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Industry</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">MOA Expiration</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">Supervisors</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-center">Active Interns</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
              {filtered.map((co, i) => (
                <React.Fragment key={co.id}>
                  <tr 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => setExpandedCoId(expandedCoId === co.id ? null : co.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{co.name}</span>
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                            <Globe size={10} /> {co.website}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">{co.industry}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{co.moaExpiry}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">{co.supervisors.length}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">{co.students.length}</td>
                    <td className="px-6 py-4">
                      <Badge variant={co.status === 'Active' ? 'success' : 'warning'}>
                        {co.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        icon={expandedCoId === co.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCoId(expandedCoId === co.id ? null : co.id);
                        }}
                      >
                        {expandedCoId === co.id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Detail Panel */}
                  {expandedCoId === co.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-0">
                        <div className="my-4 p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Contact Info & Supervisors */}
                            <div className="space-y-3.5">
                              <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Company Information</h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <MapPin size={13} className="text-zinc-400 shrink-0" />
                                    <span>{co.address}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <Phone size={13} className="text-zinc-400 shrink-0" />
                                    <span>{co.contactNumber}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2">
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Registered Supervisors</h4>
                                {co.supervisors.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {co.supervisors.map((s, idx) => (
                                      <Badge key={idx} variant="neutral">{s}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">No registered company supervisors.</span>
                                )}
                              </div>
                            </div>

                            {/* Right: Students list & MOA management */}
                            <div className="space-y-4 flex flex-col justify-between">
                              <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Assigned Interns</h4>
                                {co.students.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {co.students.map((st, idx) => (
                                      <Badge key={idx} variant="success">{st}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">No active interns currently assigned to this company.</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                {co.status === 'Pending MOA' ? (
                                  <Button 
                                    variant="primary"
                                    className="flex-1" 
                                    icon={<FileCheck size={14} />}
                                    onClick={() => handleRenewMOA(co.id, co.name)}
                                  >
                                    Approve & Finalize MOA
                                  </Button>
                                ) : (
                                  <>
                                    <Button variant="outline" className="flex-1" icon={<PlusCircle size={14} />}>Assign Student</Button>
                                    <Button variant="secondary" className="flex-1" icon={<Calendar size={14} />} onClick={() => handleRenewMOA(co.id, co.name)}>Extend Partnership</Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Register Partner Company</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Initialize a new internship industry partner.</p>
              </div>
            </div>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Company Name</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-800 dark:text-zinc-200 font-medium"
                  placeholder="e.g. Acme Corp Solutions"
                  value={newCoName}
                  onChange={e => setNewCoName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Industry Category</label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-800 dark:text-zinc-200 font-medium"
                  value={newCoIndustry}
                  onChange={e => setNewCoIndustry(e.target.value)}
                >
                  <option value="IT Services & Consulting">IT Services & Consulting</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Creative & Digital Media">Creative & Digital Media</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Office Address</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-800 dark:text-zinc-200 font-medium"
                  placeholder="e.g. 45F Emerald Tower, Pasig City"
                  value={newCoAddress}
                  onChange={e => setNewCoAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Contact Number</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-zinc-800 dark:text-zinc-200 font-medium"
                  placeholder="e.g. +63 2 8111 2222"
                  value={newCoContact}
                  onChange={e => setNewCoContact(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Register Partner</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
