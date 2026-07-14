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
  Clock,
  X,
  Info,
  RefreshCw
} from 'lucide-react';
import { templateStorage, TemplateMetadata } from '@/src/lib/templateStorage';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadTargetGroup, setUploadTargetGroup] = useState<string | null>(null);
  const [uploadTargetType, setUploadTargetType] = useState<'main' | 'pdf_backup'>('main');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load metadata on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const metadata = await templateStorage.getMetadata();
      if (metadata) {
        setTemplates(metadata);
      }
    };
    loadTemplates();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    if (!['DOCX', 'PDF', 'XLSX'].includes(fileExtension)) {
      alert('Only .docx, .pdf, and .xlsx files are supported.');
      return;
    }

    if (uploadTargetType === 'pdf_backup' && fileExtension !== 'PDF') {
      alert('A PDF backup must be a .pdf file.');
      return;
    }

    setIsUploading(true);
    try {
      if (uploadTargetType === 'pdf_backup' && replacingId) {
        await templateStorage.saveTemplateFile(`${replacingId}_pdf_backup`, file);
        alert('PDF backup uploaded successfully!');
        return;
      }

      let id = Date.now().toString();
      let group = uploadTargetGroup || 'Uploaded Templates';
      let version = 'v1.0';

      // Find original group if replacing
      if (replacingId) {
        id = replacingId;
        const allItems = [
          ...templates,
          ...hardcodedTemplates.flatMap(s => s.items)
        ];
        const existing = allItems.find(i => i.id === replacingId);
        if (existing) {
          group = existing.group || 'Uploaded Templates';
          version = existing.version ? `v${(parseFloat(existing.version.replace('v', '')) + 0.1).toFixed(1)}` : 'v1.1';
        }
      }

      const newTemplate: TemplateMetadata = {
        id,
        name: file.name.replace(/\.(docx|pdf|xlsx)$/i, ''),
        type: fileExtension as any,
        version,
        updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: (file.size / 1024).toFixed(0) + ' KB',
        group
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

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to upload template:', error);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
      setReplacingId(null);
      setUploadTargetGroup(null);
      setUploadTargetType('main');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await templateStorage.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      setDeletedIds(prev => new Set(prev).add(id));
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
          alert(`No PDF version available for this template. Please upload a PDF backup first.`);
          return;
        }
      }

      alert(`No ${format} file available for download.`);
    } catch (err) {
      console.error(`Download ${format} failed`, err);
      alert(`Failed to download ${format} file.`);
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

      <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <Info className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" size={18} />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Template Authoring Guide</h4>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
            When designing DOCX templates, the system will automatically convert specific text patterns into interactive fields for students to fill out. 
            Use <strong>[Square Brackets]</strong> or <strong>&lt;Angle Brackets&gt;</strong> for text variables, and use <strong>_________</strong> (3 or more underscores) for blank lines. 
            A standalone <strong>Date</strong> paragraph will automatically become a date picker.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {allSections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-1">{section.group}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(section.items as any[]).map((item, i) => (
                <Card key={i} className="flex flex-col relative group overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {item.type === 'DOCX' ? <FileText size={20} /> : item.type === 'XLSX' ? <ClipboardList size={20} /> : <FileCheck size={20} />}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={<Trash2 size={14} className="text-red-500" />} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</h4>

                    {item.filename && (
                      <div className="mt-2.5 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Target Filename</p>
                        <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{item.filename}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {item.version}
                      </span>
                      <span>·</span>
                      <span>{item.type}</span>
                      <span>·</span>
                      <span>{item.size}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      <Clock size={12} />
                      Updated {item.updated}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 grid grid-cols-2 gap-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      icon={<Upload size={14} />} 
                      className="w-full justify-center"
                      onClick={() => {
                        setReplacingId(item.id);
                        setUploadTargetGroup(section.group);
                        setUploadTargetType('main');
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload DOCX
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      icon={<Upload size={14} />} 
                      className="w-full justify-center"
                      onClick={() => {
                        setReplacingId(item.id);
                        setUploadTargetGroup(section.group);
                        setUploadTargetType('pdf_backup');
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Download size={14} />} 
                      className="w-full justify-center"
                      onClick={() => handleDownloadSpecific(item, 'DOCX')}
                    >
                      Download DOCX
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Download size={14} />} 
                      className="w-full justify-center"
                      onClick={() => handleDownloadSpecific(item, 'PDF')}
                    >
                      Download PDF
                    </Button>
                  </div>
                </Card>
              ))}

              <button
                onClick={() => {
                  setUploadTargetGroup(section.group);
                  setReplacingId(null);
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-zinc-500 dark:text-zinc-400 group min-h-[220px]"
              >
                <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                  <Upload size={20} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add to {section.group}</p>
                  <p className="text-xs mt-1">Upload DOCX or PDF</p>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
