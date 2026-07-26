import React, { useState } from 'react';
import { DocumentTemplateVersion, MappingRule, CONFIDENCE_THRESHOLD } from '@/src/types/structuredDocument';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { AlertTriangle, Send, ShieldAlert } from 'lucide-react';
import { TemplateValidator } from '@/src/services/TemplateValidator';

interface VisualTemplateBuilderProps {
  version: DocumentTemplateVersion;
  onPublish: (updatedVersion: DocumentTemplateVersion) => Promise<void>;
}

const ENTITY_SOURCES = ['student', 'company', 'adviser', 'supervisor', 'practicum', 'submission'];
const BINDABLE_KINDS = ['field', 'date', 'checkbox', 'radio', 'dropdown', 'table', 'signature'];

export const VisualTemplateBuilder: React.FC<VisualTemplateBuilderProps> = ({ version, onPublish }) => {
  const [schemaJson, setSchemaJson] = useState(version.schema_json);
  const [mappingRules, setMappingRules] = useState<Record<string, MappingRule>>(() => {
    const rules: Record<string, MappingRule> = {};
    version.mapping_rules.forEach(r => { rules[r.blockId] = r; });
    return rules;
  });

  const [validationResult, setValidationResult] = useState(() => TemplateValidator.validate(version));

  const handleBindingChange = (blockId: string, source: string, key: string) => {
    if (!source || !key) return;
    setMappingRules(prev => ({
      ...prev,
      [blockId]: {
        id: prev[blockId]?.id || crypto.randomUUID(),
        blockId,
        binding: { source: source as any, key },
        confidence: 1.0,
        isManualOverride: true
      }
    }));
  };

  const handleOptionsChange = (blockId: string, optionsCsv: string) => {
    const opts = optionsCsv.split(',').map(s => s.trim()).filter(Boolean);
    setSchemaJson(prev => ({
      ...prev,
      sections: prev.sections.map(sec => ({
        ...sec,
        blocks: sec.blocks.map(b => b.id === blockId ? { ...b, options: opts } : b)
      }))
    }));
  };

  const handleColumnsChange = (blockId: string, columnsCsv: string) => {
    const cols = columnsCsv.split(',').map(s => s.trim()).filter(Boolean);
    setSchemaJson(prev => ({
      ...prev,
      sections: prev.sections.map(sec => ({
        ...sec,
        blocks: sec.blocks.map(b => b.id === blockId ? { ...b, columns: cols } : b)
      }))
    }));
  };

  const handlePublishClick = async () => {
    const validRules = (Object.values(mappingRules) as MappingRule[]).filter((r: MappingRule) => r.binding?.source && r.binding?.key);

    const updatedVersion: DocumentTemplateVersion = {
      ...version,
      schema_json: schemaJson,
      mapping_rules: validRules
    };

    const result = TemplateValidator.validate(updatedVersion);
    setValidationResult(result);

    if (result.isValid) {
      await onPublish(updatedVersion);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visual Template Builder</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Assign database field bindings, dropdown options, and table columns</p>
        </div>
        <Button onClick={handlePublishClick} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <Send className="w-4 h-4" /> Validate & Publish Template
        </Button>
      </div>

      {!validationResult.isValid && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" /> Cannot Publish: Template Validation Errors
          </div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {validationResult.issues.map((issue, idx) => (
              <li key={idx}>[{issue.severity.toUpperCase()}] {issue.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {schemaJson.sections.map(section => (
        <Card key={section.id} className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-lg border-b dark:border-zinc-800 pb-2">{section.title || 'Section'}</h3>
          {section.blocks.map(block => {
            const currentRule = mappingRules[block.id];
            const isLowConfidence = (block.confidence || 1.0) < CONFIDENCE_THRESHOLD && !currentRule?.isManualOverride;

            return (
              <div key={block.id} className={`p-4 rounded-lg border flex flex-col gap-3 ${isLowConfidence ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">{block.label || block.content}</span>
                      <Badge variant="outline" className="text-xs">{block.kind}</Badge>
                      {isLowConfidence && (
                        <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Low Confidence ({Math.round((block.confidence || 0) * 100)}%)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Block ID: {block.id}</p>
                  </div>

                  {BINDABLE_KINDS.includes(block.kind) && (
                    <div className="flex items-center gap-2">
                      <select
                        value={currentRule?.binding.source || ''}
                        onChange={(e) => handleBindingChange(block.id, e.target.value, currentRule?.binding.key || '')}
                        className="text-sm border border-slate-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                      >
                        <option value="">-- Select Source --</option>
                        {ENTITY_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <input
                        type="text"
                        placeholder="key (e.g. full_name)"
                        value={currentRule?.binding.key || ''}
                        onChange={(e) => handleBindingChange(block.id, currentRule?.binding.source || 'student', e.target.value)}
                        className="text-sm border border-slate-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 w-36"
                      />
                    </div>
                  )}
                </div>

                {['dropdown', 'radio'].includes(block.kind) && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-zinc-900 p-2 rounded border dark:border-zinc-800">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Options (CSV):</span>
                    <Input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={(block.options || []).join(', ')}
                      onChange={(e) => handleOptionsChange(block.id, e.target.value)}
                      className="text-xs h-7 bg-white dark:bg-zinc-950"
                    />
                  </div>
                )}

                {block.kind === 'table' && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-zinc-900 p-2 rounded border dark:border-zinc-800">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Table Columns (CSV):</span>
                    <Input
                      type="text"
                      placeholder="Date, Hours, Task Description"
                      value={(block.columns || []).join(', ')}
                      onChange={(e) => handleColumnsChange(block.id, e.target.value)}
                      className="text-xs h-7 bg-white dark:bg-zinc-950"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
};
