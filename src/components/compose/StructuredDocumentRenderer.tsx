import React, { useState, useEffect, useRef } from 'react';
import { StructuredDocument, DocumentBlock, FieldValues, ValidationCondition } from '@/src/types/structuredDocument';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { FileText, CheckCircle2, AlertCircle, RefreshCw, QrCode, Paperclip, Image as ImageIcon } from 'lucide-react';

interface StructuredDocumentRendererProps {
  document: StructuredDocument;
  initialValues?: FieldValues;
  profileData?: Record<string, any>;
  readOnly?: boolean;
  onSave?: (fieldValues: FieldValues) => Promise<void>;
  onReloadLatest?: () => Promise<void>;
}

export const StructuredDocumentRenderer: React.FC<StructuredDocumentRendererProps> = ({
  document,
  initialValues = {},
  profileData,
  readOnly = false,
  onSave,
  onReloadLatest
}) => {
  const [fieldValues, setFieldValues] = useState<FieldValues>(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error' | 'conflict'>('idle');

  // Dynamically merge profileData when it resolves asynchronously
  useEffect(() => {
    if (!profileData) return;
    setFieldValues(prev => {
      const next = { ...prev };
      let changed = false;
      document.sections.forEach(section => {
        section.blocks.forEach(block => {
          if (block.binding && !next[block.id]) {
            const profileVal = profileData[block.binding.source]?.[block.binding.key];
            if (profileVal !== undefined) {
              next[block.id] = { blockId: block.id, value: profileVal, updatedAt: new Date().toISOString() };
              changed = true;
            }
          }
        });
      });
      return changed ? next : prev;
    });
  }, [profileData, document]);

  // Debounced Autosave (500ms delay) with trailing edits recovery (isSaving in dep array)
  useEffect(() => {
    if (!isDirty || readOnly || !onSave || isSavingRef.current) return;
    const timer = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        setIsSaving(true);
        await onSave(fieldValues);
        setIsDirty(false);
        setSaveStatus('saved');
      } catch (err: any) {
        if (err?.status === 409 || err?.message?.includes('409') || err?.message?.includes('conflict')) {
          setSaveStatus('conflict');
        } else {
          setSaveStatus('error');
        }
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fieldValues, isDirty, readOnly, onSave, isSaving]);

  const handleFieldChange = (blockId: string, val: any) => {
    if (readOnly || saveStatus === 'conflict') return;
    setFieldValues(prev => ({
      ...prev,
      [blockId]: { blockId, value: val, updatedAt: new Date().toISOString() }
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleTableCellChange = (block: DocumentBlock, rowIndex: number, colIndex: number, cellVal: string) => {
    if (readOnly || saveStatus === 'conflict') return;
    const headerCols = block.columns || ['Date', 'Hours', 'Task Description'];
    const currentTable: string[][] = fieldValues[block.id]?.value || [
      headerCols,
      new Array(headerCols.length).fill('')
    ];
    const newTable = currentTable.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => cIdx === colIndex ? cellVal : cell) : row
    );
    handleFieldChange(block.id, newTable);
  };

  const isConditionMet = (conditions?: ValidationCondition[]): boolean => {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(cond => {
      const depVal = fieldValues[cond.dependsOn]?.value;
      if (cond.operator === 'equals') return depVal === cond.value;
      if (cond.operator === 'not_equals') return depVal !== cond.value;
      return true;
    });
  };

  const renderBlock = (block: DocumentBlock) => {
    if (!isConditionMet(block.validation?.conditions)) return null;

    const currentValue = fieldValues[block.id]?.value ?? '';
    const isDisabled = readOnly || block.editable === false || saveStatus === 'conflict';

    switch (block.kind) {
      case 'heading':
        return <h2 key={block.id} className="text-xl font-bold text-slate-900 dark:text-white my-3">{block.content}</h2>;

      case 'paragraph':
        return <p key={block.id} className="text-slate-700 dark:text-zinc-300 leading-relaxed my-2">{block.content}</p>;

      case 'divider':
        return <hr key={block.id} className="my-4 border-slate-200 dark:border-zinc-800" />;

      case 'field':
      case 'date':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {block.label} {block.validation?.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type={block.kind === 'date' ? 'date' : 'text'}
              value={String(currentValue)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(block.id, e.target.value)}
              placeholder={`Enter ${block.label || 'value'}...`}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={block.id} className="my-3 flex items-center gap-2">
            <input
              type="checkbox"
              id={block.id}
              checked={Boolean(currentValue)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(block.id, e.target.checked)}
              className="w-4 h-4 rounded text-primary"
            />
            <label htmlFor={block.id} className="text-sm font-medium text-slate-800 dark:text-zinc-200 cursor-pointer">
              {block.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{block.label}</label>
            <div className="flex items-center gap-4">
              {(block.options || ['Yes', 'No']).map(opt => (
                <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="radio"
                    name={block.id}
                    value={opt}
                    checked={currentValue === opt}
                    disabled={isDisabled}
                    onChange={(e) => handleFieldChange(block.id, e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{block.label}</label>
            <select
              value={String(currentValue)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(block.id, e.target.value)}
              className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-zinc-950"
            >
              <option value="">-- Select Option --</option>
              {(block.options || []).map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'table':
        const headerCols = block.columns || ['Date', 'Hours', 'Task Description'];
        const tableData: string[][] = Array.isArray(currentValue) ? currentValue : [
          headerCols,
          new Array(headerCols.length).fill('')
        ];
        return (
          <div key={block.id} className="my-4 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-zinc-900 px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 text-sm border-b dark:border-zinc-800">
              {block.label || 'Table Matrix'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 dark:bg-zinc-900 font-semibold' : 'border-t dark:border-zinc-800'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r dark:border-zinc-800 last:border-r-0">
                          <Input
                            type="text"
                            value={cell}
                            disabled={isDisabled || rIdx === 0}
                            onChange={(e) => handleTableCellChange(block, rIdx, cIdx, e.target.value)}
                            className="text-xs h-8 bg-transparent border-0 focus:ring-1"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{block.label || 'Signature'}</label>
            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 bg-slate-50 dark:bg-zinc-900 text-center">
              <Input
                type="text"
                value={String(currentValue)}
                disabled={isDisabled}
                onChange={(e) => handleFieldChange(block.id, e.target.value)}
                placeholder="Type full legal name as digital signature..."
                className="font-serif italic text-lg bg-white dark:bg-zinc-950"
              />
              <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">Digital Signature Verification</span>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="my-3 flex justify-center">
            {block.content ? (
              <img src={block.content} alt={block.label || 'Document Asset'} className="max-h-40 rounded-lg border dark:border-zinc-800" />
            ) : (
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center gap-2 text-slate-400">
                <ImageIcon className="w-5 h-5" /> Image Asset Placeholder
              </div>
            )}
          </div>
        );

      case 'qr_code':
        return (
          <div key={block.id} className="my-3 p-3 border rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center gap-3 w-fit">
            <QrCode className="w-8 h-8 text-slate-700 dark:text-zinc-300" />
            <div className="text-xs text-slate-600 dark:text-zinc-400 font-mono">{block.content || 'VERIFIED-QR-CODE'}</div>
          </div>
        );

      case 'attachment':
        return (
          <div key={block.id} className="my-3 p-3 border rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center gap-3">
            <Paperclip className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{block.label || 'Attachment File'}</span>
          </div>
        );

      default:
        return <div key={block.id} className="my-2 text-sm text-slate-600 dark:text-zinc-400">{block.content}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-8">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><FileText className="w-5 h-5" /></div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{document.title}</h1>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3">
            {isSaving && (
              <Badge variant="secondary" className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </Badge>
            )}
            {!isSaving && saveStatus === 'saved' && (
              <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Autosaved
              </Badge>
            )}
            {!isSaving && saveStatus === 'conflict' && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Version Conflict
                </Badge>
                {onReloadLatest && (
                  <Button size="sm" variant="outline" onClick={onReloadLatest} className="text-xs gap-1">
                    <RefreshCw className="w-3 h-3" /> Reload Latest Version
                  </Button>
                )}
              </div>
            )}
            {!isSaving && saveStatus === 'error' && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Save failed
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {document.sections.map(section => (
          <div key={section.id} className="space-y-3">
            {section.title && <h3 className="text-md font-semibold text-slate-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-1">{section.title}</h3>}
            {section.blocks.map(block => renderBlock(block))}
          </div>
        ))}
      </div>
    </div>
  );
};
