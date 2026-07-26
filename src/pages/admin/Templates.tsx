import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  FileCheck,
  ClipboardList,
  X,
  MoreVertical
} from 'lucide-react';
import { templateStorage, TemplateMetadata } from '@/src/lib/templateStorage';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadTargetGroup, setUploadTargetGroup] = useState<string | null>(null);
  const [uploadTargetType, setUploadTargetType] = useState<'main' | 'pdf_backup'>('main');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load metadata on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const metadata = await templateStorage.getMetadata();
      setTemplates(metadata);
    };
    loadTemplates();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdownId && !(e.target as HTMLElement).closest('.template-dropdown')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    if (!['DOCX', 'PDF', 'XLSX'].includes(fileExtension)) {
      toast.error('Only .docx, .pdf, and .xlsx files are supported.');
      return;
    }

    if (uploadTargetType === 'pdf_backup' && fileExtension !== 'PDF') {
      toast.error('A PDF backup must be a .pdf file.');
      return;
    }

    setIsUploading(true);
    try {
      if (uploadTargetType === 'pdf_backup' && replacingId) {
        await templateStorage.saveTemplateFile(`${replacingId}_pdf_backup`, file);
        toast.success(`PDF backup for "${file.name}" uploaded successfully!`);
        return;
      }

      let id = Date.now().toString();
      let group = uploadTargetGroup || 'Uploaded Templates';
      let version = 'v1.0';
      let templateName = file.name.replace(/\.(docx|pdf|xlsx)$/i, '');

      const allItems = [
        ...templates,
        ...hardcodedTemplates.flatMap(s => s.items)
      ];

      // Smart match existing template by ID or file name
      let existing = replacingId ? allItems.find(i => i.id === replacingId) : undefined;

      if (!existing) {
        const cleanUploadName = templateName.toLowerCase().replace(/[^a-z0-9]/g, '');
        existing = allItems.find(i => {
          const cleanItemName = i.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanItemName.includes(cleanUploadName) || cleanUploadName.includes(cleanItemName);
        });
      }

      if (existing) {
        id = existing.id;
        templateName = existing.name; // Keep official card title intact
        group = existing.group || group;
        version = existing.version ? `v${(parseFloat(existing.version.replace('v', '')) + 0.1).toFixed(1)}` : 'v1.1';
      }

      const newTemplate: TemplateMetadata = {
        id,
        name: templateName,
        type: fileExtension as any,
        version,
        updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: (file.size / 1024).toFixed(0) + ' KB',
        group,
        filename: file.name,
        isCustom: true
      };

      // Save file and metadata to IndexedDB
      await templateStorage.saveTemplateFile(id, file);

      let newMetadata;
      if (replacingId) {
        const existingIndex = templates.findIndex(t => t.id === replacingId);
        if (existingIndex >= 0) {
          newMetadata = [...templates];
          newMetadata[existingIndex] = newTemplate;
        } else {
          newMetadata = [...templates, newTemplate];
        }
      } else {
        newMetadata = [...templates, newTemplate];
      }

      await templateStorage.saveMetadata(newMetadata);
      setTemplates(newMetadata);
      toast.success(`Template "${newTemplate.name}" uploaded successfully!`);

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to upload template:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setReplacingId(null);
      setUploadTargetGroup(null);
      setUploadTargetType('main');
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await templateStorage.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      setDeletedIds(prev => new Set(prev).add(id));
      toast.success('Template deleted successfully.');
    } catch (err) {
      console.error('Failed to delete template', err);
      toast.error('Failed to delete template.');
    }
  };

  const handleDownloadSpecific = async (item: any, format: 'DOCX' | 'PDF') => {
    try {
      const uploadedIdsList = new Set(templates.map(t => t.id));
      let buffer: ArrayBuffer | undefined;

      if (format === 'PDF') {
        buffer = await templateStorage.getTemplatePdfBackup(item.id);
        if (!buffer && item.type === 'PDF' && uploadedIdsList.has(item.id)) {
          buffer = await templateStorage.getTemplateFile(item.id);
        }
      } else {
        if (item.type === 'DOCX' && uploadedIdsList.has(item.id)) {
          buffer = await templateStorage.getTemplateFile(item.id);
        }
      }

      if (buffer) {
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.name}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      if (item.filename) {
        const ext = item.filename.split('.').pop()?.toUpperCase();
        if (ext === format) {
          const a = document.createElement('a');
          a.href = `/templates/${item.filename}`;
          a.download = item.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        } else if (format === 'PDF' && ext === 'DOCX') {
          toast.error(`No PDF version available for "${item.name}". Upload a PDF file first.`);
          return;
        }
      }

      toast.error(`No ${format} file available for download.`);
    } catch (err) {
      console.error(`Download ${format} failed`, err);
      toast.error(`Failed to download ${format} file.`);
    }
  };

  const groupedTemplates = templates.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, TemplateMetadata[]>);

  const hardcodedTemplates = [
    {
      group: 'Before OJT Templates',
      items: [
        { name: 'Student Application Letter', type: 'DOCX', version: 'v1.0', updated: 'May 11, 2026', size: '320 KB', id: 'h11', group: 'Before OJT Templates', filename: 'FT-CRD-137-01 Student Application Letter Template.docx' },
        { name: 'Parent Consent Form (With Fee)', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '245 KB', id: 'h2_1', group: 'Before OJT Templates', filename: 'FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.pdf' },
        { name: 'Parent Consent Form (Without Fee)', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '213 KB', id: 'h2_2', group: 'Before OJT Templates', filename: 'FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf' },
        { name: 'Student Consent Form (With Fee)', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '216 KB', id: 'h2_3', group: 'Before OJT Templates', filename: 'FT-CRD-138-01 Student Consent Form with Training Fee Template.pdf' },
        { name: 'Student Consent Form (Without Fee)', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '241 KB', id: 'h2_4', group: 'Before OJT Templates', filename: 'FT-CRD-139-01 Student Consent Form without Training Fee Template.pdf' },
        { name: 'MOA Template', type: 'PDF', version: 'v1.0', updated: 'Mar 1, 2026', size: '2.5 MB', id: 'h3', group: 'Before OJT Templates', filename: 'FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.pdf' },
        { name: 'Endorsement Letter', type: 'DOCX', version: 'v3.0', updated: 'Apr 20, 2026', size: '850 KB', id: 'h4', group: 'Before OJT Templates', filename: 'FT-CRD-135-01 STI OJT Endorsement Letter Template.docx' },
        { name: 'Proposal Letter', type: 'DOCX', version: 'v1.0', updated: 'Apr 25, 2026', size: '400 KB', id: 'h12', group: 'Before OJT Templates', filename: 'FT-CRD-134-01 Proposal Letter to the Industry Template.docx' },
      ]
    },
    {
      group: 'In OJT Templates',
      items: [
        { name: 'Journal Template', type: 'DOCX', version: 'v1.0', updated: 'May 11, 2026', size: '280 KB', id: 'h5', group: 'In OJT Templates', filename: 'FT-CRD-167-00 Weekly Journal Template.docx' },
        { name: 'DTR Form', type: 'XLSX', version: 'v1.2', updated: 'Feb 10, 2026', size: '450 KB', id: 'h6', group: 'In OJT Templates', filename: 'DTR Form.xlsx' },
        { name: 'Training Plan Form', type: 'DOCX', version: 'v2.0', updated: 'Jan 5, 2026', size: '920 KB', id: 'h7', group: 'In OJT Templates', filename: 'FT-CRD-176-00 OJT Training Plan_BSIT-BSCS-BSIS-ACT-ITP.docx' },
      ]
    },
    {
      group: 'Final Templates',
      items: [
        { name: 'Integration Paper Template', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '111 KB', id: 'h8', group: 'Final Templates', filename: 'FT-CRD-127-01 Integration Paper Template.pdf' },
        { name: 'Performance Appraisal Template', type: 'PDF', version: 'v1.0', updated: 'Jan 1, 2026', size: '268 KB', id: 'h10', group: 'Final Templates', filename: 'FT-CRD-133-02 Performance Appraisal Template.pdf' },
      ]
    }
  ];

  const uploadedIds = new Set(templates.map(t => t.id));

  const allSections = hardcodedTemplates.map(section => {
    const uploadedItemsInThisGroup = groupedTemplates[section.group] || [];
    const processedItems = section.items.map(item => {
      if (uploadedIds.has(item.id) && !deletedIds.has(item.id)) {
        return uploadedItemsInThisGroup.find(t => t.id === item.id) || item;
      }
      return item;
    }).filter(Boolean);
    const newItems = uploadedItemsInThisGroup.filter(t => !section.items.find(h => h.id === t.id));

    return {
      group: section.group,
      items: [...processedItems, ...newItems]
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Official Templates</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Manage blank forms and templates distributed to students</p>
        </div>
        <div>
          <input
            type="file"
            accept=".docx,.pdf,.xlsx"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            icon={<Upload size={16} />}
            onClick={() => {
              setUploadTargetGroup(null);
              setReplacingId(null);
              setUploadTargetType('main');
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload New Template'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {allSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pl-1">{section.group}</h3>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 ml-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(section.items as any[]).map((item, i) => (
                <div key={i} className="flex flex-col justify-between relative group p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                  <div>
                    {/* Top Row: Icon + Name + Actions Dropdown */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          {item.type === 'DOCX' ? <FileText size={18} /> : item.type === 'XLSX' ? <ClipboardList size={18} /> : <FileCheck size={18} />}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug" title={item.name}>{item.name}</h4>
                      </div>
                      
                      {/* shadcn-style Dropdown Menu */}
                      <div className="relative template-dropdown shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Actions menu"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdownId === item.id && (
                          <div className="absolute right-0 top-7 z-30 w-40 p-1 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-xl shadow-xl shadow-black/10 space-y-0.5 animate-in fade-in-0 zoom-in-95">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                confirmDelete(item.id);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <Trash2 size={13} />
                              <span>Delete Template</span>
                            </button>
                            <button
                              onClick={() => setActiveDropdownId(null)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <X size={13} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 font-bold text-zinc-700 dark:text-zinc-300 text-[10px]">
                        {item.version}
                      </span>
                      <span>•</span>
                      <span className="font-semibold">{item.type}</span>
                      <span>•</span>
                      <span>{item.size}</span>
                      <span>•</span>
                      <span>{item.updated}</span>
                    </div>

                    {item.filename && (
                      <div className={cn(
                        "flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono mb-3 transition-colors",
                        item.isCustom
                          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                          : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                      )}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText size={12} className={item.isCustom ? "text-zinc-900 dark:text-zinc-100 shrink-0" : "text-zinc-400 shrink-0"} />
                          <span className="truncate" title={item.filename}>{item.filename}</span>
                        </div>
                        {item.isCustom && (
                          <span className="shrink-0 text-[9px] font-sans font-bold px-1.5 py-0.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded uppercase tracking-wide">
                            Updated
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Grid */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setReplacingId(item.id);
                        setUploadTargetGroup(section.group);
                        setUploadTargetType('pdf_backup');
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload size={12} />
                      <span>Upload PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownloadSpecific(item, 'PDF')}
                      className="px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download size={12} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setUploadTargetGroup(section.group);
                  setReplacingId(null);
                  setUploadTargetType('pdf_backup');
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-zinc-500 dark:text-zinc-400 group min-h-[140px] cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                  <Upload size={18} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Add to {section.group}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Upload PDF</p>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
