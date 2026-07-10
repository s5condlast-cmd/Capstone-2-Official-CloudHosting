import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Download, AlertCircle } from 'lucide-react';
import { FormField } from '@/src/components/review/templateFields';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { cn } from '@/src/lib/utils';

interface DocumentFormProps {
  title: string;
  docUrl: string;
  fields: FormField[];
  description?: string;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  title,
  docUrl,
  fields,
  description
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach(f => {
      const val = formData[f.key] || '';
      if (!val.trim()) {
        newErrors[f.key] = `${f.label} is required`;
      } else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) {
        newErrors[f.key] = `Invalid email format`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownloadDocx = async () => {
    setGenerationError(null);
    if (!validate()) return;
    
    setIsGeneratingDocx(true);
    try {
      const blob = await documentGenerator.generateDocx(docUrl, formData);
      documentGenerator.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_Outline.docx`);
    } catch (err) {
      console.error(err);
      setGenerationError('Failed to generate DOCX. Please ensure the template exists.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <Card title={`Generate ${title}`}>
      <div className="space-y-6">
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        )}

        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  rows={3}
                  className={cn(
                    "w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 resize-none transition-all shadow-sm",
                    errors[field.key]
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-500/30 focus:border-zinc-400 dark:focus:border-zinc-600"
                  )}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className={cn(
                    "w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm",
                    errors[field.key]
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-500/30 focus:border-zinc-400 dark:focus:border-zinc-600"
                  )}
                />
              )}
              {errors[field.key] && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 mt-1">
                  <AlertCircle size={12} /> {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
          {generationError && (
            <p className="text-xs text-red-500 font-medium flex-1">{generationError}</p>
          )}
          <div className="flex-1"></div>
          <Button
            icon={<Download size={16} />}
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx}
            className="w-full sm:w-auto"
          >
            {isGeneratingDocx ? 'Generating Outline...' : 'Download DOCX Outline'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
