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
  X
} from 'lucide-react';
import { templateStorage, TemplateMetadata } from '@/src/lib/templateStorage';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

    if (!file.name.endsWith('.docx')) {
      alert('Please upload a .docx file.');
      return;
    }

    setIsUploading(true);
    try {
      const id = Date.now().toString();
      const newTemplate: TemplateMetadata = {
        id,
        name: file.name.replace('.docx', ''),
        type: 'DOCX',
        version: 'v1.0',
        updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: (file.size / 1024).toFixed(0) + ' KB',
        group: 'Uploaded Templates'
      };

      // Save file and metadata to IndexedDB
      await templateStorage.saveTemplateFile(id, file);
      
      const newMetadata = [...templates, newTemplate];
      await templateStorage.saveMetadata(newMetadata);
      setTemplates(newMetadata);
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to upload template:', error);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await templateStorage.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  // Group templates by their group name
  const groupedTemplates = templates.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, TemplateMetadata[]>);

  // Add the hardcoded ones if no uploaded exist for demo
  const hardcodedTemplates = [
    {
      group: 'Before OJT Templates',
      items: [
        { name: 'Resume Template', type: 'DOCX', version: 'v1.0', updated: 'May 11, 2026', size: '320 KB', id: 'h1' },
        { name: 'Letter of Consent', type: 'PDF', version: 'v2.1', updated: 'Apr 15, 2026', size: '1.2 MB', id: 'h2' },
        { name: 'MOA Template', type: 'PDF', version: 'v1.0', updated: 'Mar 1, 2026', size: '2.5 MB', id: 'h3' },
        { name: 'Endorsement Letter', type: 'DOCX', version: 'v3.0', updated: 'Apr 20, 2026', size: '850 KB', id: 'h4' },
      ]
    },
    {
      group: 'In OJT Templates',
      items: [
        { name: 'Journal Template', type: 'DOCX', version: 'v1.0', updated: 'May 11, 2026', size: '280 KB', id: 'h5' },
        { name: 'DTR Form', type: 'XLSX', version: 'v1.2', updated: 'Feb 10, 2026', size: '450 KB', id: 'h6' },
        { name: 'Training Plan Form', type: 'DOCX', version: 'v2.0', updated: 'Jan 5, 2026', size: '920 KB', id: 'h7' },
      ]
    },
    {
      group: 'Final Templates',
      items: [
        { name: 'Letter of Recognition', type: 'DOCX', version: 'v1.0', updated: 'May 11, 2026', size: '450 KB', id: 'h8' },
        { name: 'OJT Certification', type: 'PDF', version: 'v1.0', updated: 'May 11, 2026', size: '380 KB', id: 'h9' },
        { name: 'Evaluation Form', type: 'PDF', version: 'v1.0', updated: 'Jan 1, 2026', size: '1.5 MB', id: 'h10' },
      ]
    }
  ];

  const allSections = [
    // Include dynamically uploaded templates first if they exist
    ...(Object.keys(groupedTemplates).length > 0 ? 
      Object.entries(groupedTemplates).map(([group, items]) => ({ group, items })) 
      : []),
    ...hardcodedTemplates
  ];

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
            accept=".docx" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button 
            icon={<Upload size={16} />} 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload New Template'}
          </Button>
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
                    {item.group === 'Uploaded Templates' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors" 
                          title="Delete Template"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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

                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <Button variant="outline" size="sm" icon={<Download size={14} />} className="w-full justify-center">Download</Button>
                    <Button variant="secondary" size="sm" icon={<Upload size={14} />} className="w-full justify-center">Replace</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
