import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Calendar, FileText, Bell, Shield, Check, Database, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';

export const Settings: React.FC = () => {
  const tabs = [
    { id: 'general', label: 'General System', icon: Calendar },
    { id: 'documents', label: 'Document Requirements', icon: FileText },
    { id: 'notifications', label: 'Alerts & Emails', icon: Bell },
    { id: 'security', label: 'Roles & Security', icon: Shield },
    { id: 'data', label: 'Backup & Recovery', icon: Database },
  ] as const;

  type TabId = typeof tabs[number]['id'];
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaved(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">System Configuration</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage global practicum policies and technical requirements.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Save size={18} />
          )}
          <span>{isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex shrink-0 md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card title="Academic Configuration">
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Academic Year</label>
                        <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white">
                          <option>2023 - 2024</option>
                          <option selected>2024 - 2025</option>
                          <option>2025 - 2026</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Semester</label>
                        <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white">
                          <option>1st Semester</option>
                          <option selected>2nd Semester</option>
                          <option>Summer</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Required OJT Hours</label>
                        <input type="number" defaultValue={460} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="System Branding">
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Institution Name</label>
                      <input type="text" defaultValue="demo STI Marikina" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'documents' && (
              <Card title="Required Document Pipeline">
                <div className="p-6">
                  <div className="space-y-3">
                    {['Resume / CV', 'Parent/Guardian Consent Form', 'Memorandum of Agreement (MOA)', 'Endorsement Letter', 'Daily Time Record (DTR)', 'Supervisor Evaluation'].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doc}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase">Required</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card title="Automated Alerts">
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Document Submissions', desc: 'Notify advisers immediately when a student submits a new document.' },
                    { title: 'Weekly Progress Reports', desc: 'Send automated email summaries to advisers every Friday.' },
                    { title: 'AI Flag Alerts', desc: 'Trigger high-priority alerts if the AI detects anomalies in DTRs.' }
                  ].map((alert, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{alert.title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{alert.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card title="Security & Access Control">
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="text-zinc-400" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Two-Factor Authentication</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">Require 2FA for all Administrative and Adviser accounts.</p>
                      </div>
                    </div>
                    <button className="text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card title="System Database Backup">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg mb-6">
                      <div className="flex items-center gap-3">
                        <Database className="text-zinc-400" size={20} />
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Manual System Snapshot</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">Create a full backup of practicum records, accounts, and system data.</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-sm font-semibold text-white dark:text-zinc-900 bg-black dark:bg-white px-4 py-2 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shrink-0">
                        <Download size={16} />
                        Generate Backup
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Recent Backups</h4>
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Size</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {[
                              { date: 'May 04, 2026 23:59', size: '1.2 GB', type: 'Automated' },
                              { date: 'May 01, 2026 15:30', size: '1.1 GB', type: 'Manual' },
                            ].map((b, i) => (
                              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{b.date}</td>
                                <td className="px-4 py-3 text-zinc-500">{b.size}</td>
                                <td className="px-4 py-3 text-zinc-500">{b.type}</td>
                                <td className="px-4 py-3 text-right">
                                  <button className="text-xs font-semibold uppercase tracking-wide text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5">
                                    <RefreshCw size={12} /> Restore
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
                  <AlertTriangle className="text-red-600 dark:text-red-500 mt-0.5 shrink-0" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-red-900 dark:text-red-400">Database Recovery Warning</h4>
                    <p className="text-xs text-red-800 dark:text-red-300/80 mt-1 leading-relaxed">
                      Restoring from a backup will overwrite all current system data. Any student submissions, messages, or approvals made after the backup date will be permanently lost. Proceed with extreme caution.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
