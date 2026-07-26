# Template-Driven Document Management Platform Architecture

## Executive Summary & Core Architectural Principles

> **Core Principle**: *"The platform depends only on the `DocumentParser` interface. Any parser that produces the `StructuredDocument` model can replace the current implementation without requiring changes to rendering, storage, or export services."*

> **Domain Scope Statement**: *"The document platform is intentionally optimized for practicum-related documents. While the parsing and rendering layers are parser-independent, the binding system is domain-specific and targets entities managed by the practicum information system (student, adviser, company, supervisor, practicum, submission)."*

---

## Complete Supabase Database SQL Schema DDL

Run the following SQL migration script in your Supabase SQL Editor to create tables, indexes, RLS policies, and triggers:

```sql
-- 1. Master Templates Table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    phase TEXT NOT NULL CHECK (phase IN ('before_ojt', 'in_ojt', 'final')),
    current_version_id UUID, -- References active document_template_versions.id
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Immutable Template Versions Table
CREATE TABLE IF NOT EXISTS public.document_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    schema_json JSONB NOT NULL, -- Holds the StructuredDocument layout tree
    mapping_rules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of MappingRule objects
    status TEXT NOT NULL CHECK (status IN ('draft', 'needs_mapping', 'ready', 'published', 'archived')),
    published_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_template_version UNIQUE (template_id, version_number)
);

-- Circular foreign key for active version lookup
ALTER TABLE public.document_templates 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) 
REFERENCES public.document_template_versions(id) 
ON DELETE SET NULL;

-- 3. Student Document Instances Table
CREATE TABLE IF NOT EXISTS public.document_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE RESTRICT,
    template_version_id UUID NOT NULL REFERENCES public.document_template_versions(id) ON DELETE RESTRICT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    instance_version INT NOT NULL DEFAULT 1, -- Incremented on atomic DB update
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value map of FieldValue objects
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'adviser_review', 'revision_required', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_instances_updated_at
    BEFORE UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document Instance Integrity & Monotonic Version Trigger Function
CREATE OR REPLACE FUNCTION validate_document_instance_integrity()
RETURNS TRIGGER AS $$
DECLARE
    parent_template_id UUID;
    user_role TEXT;
BEGIN
    -- Extract JWT Role using COALESCE (supports top-level, app_metadata, and user_metadata)
    user_role := COALESCE(
        auth.jwt() ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role'
    );

    -- Verify that template_version_id belongs to the template_id stated
    SELECT template_id INTO parent_template_id 
    FROM public.document_template_versions 
    WHERE id = NEW.template_version_id;

    IF parent_template_id IS NULL OR parent_template_id <> NEW.template_id THEN
        RAISE EXCEPTION 'Mismatched template_version_id and template_id.';
    END IF;

    -- On UPDATE, enforce immutable columns and monotonic instance_version increments
    IF TG_OP = 'UPDATE' THEN
        -- Enforce optimistic locking version integrity (must remain unchanged or increment by exactly 1)
        IF OLD.instance_version IS DISTINCT FROM NEW.instance_version 
           AND NEW.instance_version IS DISTINCT FROM (OLD.instance_version + 1) THEN
            RAISE EXCEPTION 'instance_version must increment by exactly 1 or remain unchanged.';
        END IF;

        -- Prevent non-admin/adviser roles from altering immutable structural references
        IF user_role NOT IN ('admin', 'adviser') THEN
            IF OLD.template_id IS DISTINCT FROM NEW.template_id THEN
                RAISE EXCEPTION 'Cannot modify template_id on an existing document instance.';
            END IF;
            IF OLD.template_version_id IS DISTINCT FROM NEW.template_version_id THEN
                RAISE EXCEPTION 'Cannot modify template_version_id on an existing document instance.';
            END IF;
            IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
                RAISE EXCEPTION 'Cannot modify student_id on an existing document instance.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_validate_document_instance_integrity
    BEFORE INSERT OR UPDATE ON public.document_instances
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_instance_integrity();

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.document_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_id ON public.document_instances(student_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_template_version ON public.document_instances(template_version_id);
CREATE INDEX IF NOT EXISTS idx_document_instances_status ON public.document_instances(status);
CREATE INDEX IF NOT EXISTS idx_document_instances_student_status ON public.document_instances(student_id, status);
CREATE INDEX IF NOT EXISTS idx_document_templates_phase_cat ON public.document_templates(phase, category);

-- Partial Unique Index (Prevents duplicate in-flight active submissions per student per template)
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_student_instance 
ON public.document_instances(student_id, template_id) 
WHERE status NOT IN ('archived', 'approved');

-- Enable Row Level Security (RLS)
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_instances ENABLE ROW LEVEL SECURITY;

-- Note: Admin template creation/editing bypasses RLS via Supabase Service Role Key on the backend.
CREATE POLICY "Public templates are viewable by authenticated users" 
ON public.document_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public template versions are viewable by authenticated users" 
ON public.document_template_versions FOR SELECT TO authenticated USING (true);

-- Document Instances RLS Policies (Separated for Student vs Adviser Security)
CREATE POLICY "Students can view their own document instances" 
ON public.document_instances FOR SELECT TO authenticated 
USING (
    student_id = auth.uid()::text 
    OR COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
);

CREATE POLICY "Students can insert their own document instances" 
ON public.document_instances FOR INSERT TO authenticated 
WITH CHECK (
    student_id = auth.uid()::text 
    AND status = 'draft'
    AND EXISTS (
        SELECT 1 FROM public.document_template_versions v
        WHERE v.id = template_version_id AND v.status = 'published'
    )
);

CREATE POLICY "Students can update their own draft or revision instances" 
ON public.document_instances FOR UPDATE TO authenticated 
USING (student_id = auth.uid()::text AND status IN ('draft', 'revision_required'))
WITH CHECK (student_id = auth.uid()::text AND status IN ('draft', 'submitted', 'revision_required'));

CREATE POLICY "Advisers and admins can review and update instances" 
ON public.document_instances FOR UPDATE TO authenticated 
USING (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
)
WITH CHECK (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'adviser')
);
```

---

## UI Architecture & UI-to-Structure Connection Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Load & Async Merge Step                                             │
│    - Fetch `schema_json` (StructuredDocument)                          │
│    - Fetch Supabase profile data (`student.name`, `company.name`...)   │
│    - Merge profile bindings dynamically via `useEffect([profileData])` │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Component Render Step (`StructuredDocumentRenderer`)                │
│    - Iterates sections -> blocks                                       │
│    - Evaluates runtime `ValidationCondition` (dynamic show/hide)       │
│    - Renders all 13 BlockKinds:                                        │
│      * 'heading' | 'paragraph' | 'divider'                            │
│      * 'field' | 'date' | 'checkbox' | 'radio' | 'dropdown'            │
│      * 'table' (Editable 2D Grid with schema columns) | 'signature'    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Keystroke & Change Step                                             │
│    - User updates control -> setFieldValues & setIsDirty(true)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Debounced Autosave (useEffect listening to fieldValues & isSaving)  │
│    - Re-evaluates when `isSaving` turns false to catch trailing edits  │
│    - Backend compares payload & updates `instance_version`             │
│    - On 409 Conflict: renders "Reload Latest Version" recovery button   │
└───────────────────────────────────┬────────────────────────────────────┘
```

---

## Complete UI Component Code Implementations

### Student UI Component: `StructuredDocumentRenderer.tsx`

```tsx
// src/components/composer/StructuredDocumentRenderer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StructuredDocument, DocumentBlock, FieldValues, ValidationCondition } from '@/src/types/structuredDocument';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { FileText, Save, CheckCircle2, AlertCircle, RefreshCw, QrCode, Paperclip, Image as ImageIcon } from 'lucide-react';

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
        return <h2 key={block.id} className="text-xl font-bold text-slate-900 my-3">{block.content}</h2>;
      
      case 'paragraph':
        return <p key={block.id} className="text-slate-700 leading-relaxed my-2">{block.content}</p>;

      case 'divider':
        return <hr key={block.id} className="my-4 border-slate-200" />;

      case 'field':
      case 'date':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800">
              {block.label} {block.validation?.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type={block.kind === 'date' ? 'date' : 'text'}
              value={String(currentValue)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(block.id, e.target.value)}
              placeholder={`Enter ${block.label || 'value'}...`}
              className="bg-white border-slate-300 text-slate-900"
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
            <label htmlFor={block.id} className="text-sm font-medium text-slate-800 cursor-pointer">
              {block.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={block.id} className="my-3 flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800">{block.label}</label>
            <div className="flex items-center gap-4">
              {(block.options || ['Yes', 'No']).map(opt => (
                <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-800 cursor-pointer">
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
            <label className="text-sm font-semibold text-slate-800">{block.label}</label>
            <select
              value={String(currentValue)}
              disabled={isDisabled}
              onChange={(e) => handleFieldChange(block.id, e.target.value)}
              className="border border-slate-300 rounded-md p-2 text-slate-900 bg-white"
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
          <div key={block.id} className="my-4 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-800 text-sm border-b">
              {block.label || 'Table Matrix'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 font-semibold' : 'border-t'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r last:border-r-0">
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
            <label className="text-sm font-semibold text-slate-800">{block.label || 'Signature'}</label>
            <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center">
              <Input
                type="text"
                value={String(currentValue)}
                disabled={isDisabled}
                onChange={(e) => handleFieldChange(block.id, e.target.value)}
                placeholder="Type full legal name as digital signature..."
                className="font-serif italic text-lg bg-white"
              />
              <span className="text-xs text-slate-500 mt-1 block">Digital Signature Verification</span>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="my-3 flex justify-center">
            {block.content ? (
              <img src={block.content} alt={block.label || 'Document Asset'} className="max-h-40 rounded-lg border" />
            ) : (
              <div className="p-4 border rounded bg-slate-50 flex items-center gap-2 text-slate-400">
                <ImageIcon className="w-5 h-5" /> Image Asset Placeholder
              </div>
            )}
          </div>
        );

      case 'qr_code':
        return (
          <div key={block.id} className="my-3 p-3 border rounded-lg bg-slate-50 flex items-center gap-3 w-fit">
            <QrCode className="w-8 h-8 text-slate-700" />
            <div className="text-xs text-slate-600 font-mono">{block.content || 'VERIFIED-QR-CODE'}</div>
          </div>
        );

      case 'attachment':
        return (
          <div key={block.id} className="my-3 p-3 border rounded-lg bg-slate-50 flex items-center gap-3">
            <Paperclip className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-slate-800">{block.label || 'Attachment File'}</span>
          </div>
        );

      default:
        return <div key={block.id} className="my-2 text-sm text-slate-600">{block.content}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><FileText className="w-5 h-5" /></div>
          <h1 className="text-lg font-bold text-slate-900">{document.title}</h1>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3">
            {isSaving && (
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </Badge>
            )}
            {!isSaving && saveStatus === 'saved' && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Autosaved
              </Badge>
            )}
            {!isSaving && saveStatus === 'conflict' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1">
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
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Save failed
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {document.sections.map(section => (
          <div key={section.id} className="space-y-3">
            {section.title && <h3 className="text-md font-semibold text-slate-800 border-b pb-1">{section.title}</h3>}
            {section.blocks.map(block => renderBlock(block))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Admin UI Component: `VisualTemplateBuilder.tsx`

```tsx
// src/components/admin/VisualTemplateBuilder.tsx
import React, { useState } from 'react';
import { DocumentTemplateVersion, DocumentBlock, MappingRule, CONFIDENCE_THRESHOLD } from '@/src/types/structuredDocument';
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
    const validRules = Object.values(mappingRules).filter(r => r.binding?.source && r.binding?.key);

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
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Visual Template Builder</h2>
          <p className="text-sm text-slate-500">Assign database field bindings, dropdown options, and table columns</p>
        </div>
        <Button onClick={handlePublishClick} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <Send className="w-4 h-4" /> Validate & Publish Template
        </Button>
      </div>

      {!validationResult.isValid && (
        <Card className="p-4 border-red-200 bg-red-50 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700">
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
          <h3 className="font-semibold text-slate-800 text-lg border-b pb-2">{section.title || 'Section'}</h3>
          {section.blocks.map(block => {
            const currentRule = mappingRules[block.id];
            const isLowConfidence = (block.confidence || 1.0) < CONFIDENCE_THRESHOLD && !currentRule?.isManualOverride;

            return (
              <div key={block.id} className={`p-4 rounded-lg border flex flex-col gap-3 ${isLowConfidence ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{block.label || block.content}</span>
                      <Badge variant="outline" className="text-xs">{block.kind}</Badge>
                      {isLowConfidence && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Low Confidence ({Math.round((block.confidence || 0) * 100)}%)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Block ID: {block.id}</p>
                  </div>

                  {BINDABLE_KINDS.includes(block.kind) && (
                    <div className="flex items-center gap-2">
                      <select
                        value={currentRule?.binding.source || ''}
                        onChange={(e) => handleBindingChange(block.id, e.target.value, currentRule?.binding.key || '')}
                        className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-800"
                      >
                        <option value="">-- Select Source --</option>
                        {ENTITY_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <input
                        type="text"
                        placeholder="key (e.g. full_name)"
                        value={currentRule?.binding.key || ''}
                        onChange={(e) => handleBindingChange(block.id, currentRule?.binding.source || 'student', e.target.value)}
                        className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-800 w-36"
                      />
                    </div>
                  )}
                </div>

                {['dropdown', 'radio'].includes(block.kind) && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border">
                    <span className="font-semibold text-slate-700">Options (CSV):</span>
                    <Input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={(block.options || []).join(', ')}
                      onChange={(e) => handleOptionsChange(block.id, e.target.value)}
                      className="text-xs h-7 bg-white"
                    />
                  </div>
                )}

                {block.kind === 'table' && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border">
                    <span className="font-semibold text-slate-700">Table Columns (CSV):</span>
                    <Input
                      type="text"
                      placeholder="Date, Hours, Task Description"
                      value={(block.columns || []).join(', ')}
                      onChange={(e) => handleColumnsChange(block.id, e.target.value)}
                      className="text-xs h-7 bg-white"
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
```

---

## Complete Type Specifications

#### [NEW] [structuredDocument.ts](file:///c:/Users/johnd/Downloads/capstone%202%20testing/src/types/structuredDocument.ts)

```typescript
export const CONFIDENCE_THRESHOLD = 0.75;

export type BlockKind = 
  | 'heading' 
  | 'paragraph' 
  | 'field' 
  | 'checkbox' 
  | 'radio' 
  | 'dropdown' 
  | 'date' 
  | 'table' 
  | 'signature' 
  | 'image' 
  | 'attachment' 
  | 'qr_code' 
  | 'divider';

export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BlockStyle {
  align?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

export interface ValidationCondition {
  dependsOn: string; // blockId or field name
  operator: 'equals' | 'not_equals';
  value: unknown;
}

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  conditions?: ValidationCondition[];
}

export interface FieldBinding {
  source: 'student' | 'company' | 'adviser' | 'supervisor' | 'practicum' | 'submission';
  key: string;
}

export interface MappingRule {
  id: string;
  blockId: string;
  binding: FieldBinding;
  confidence: number;
  isManualOverride: boolean;
  assignedBy?: string;
}

export interface DocumentBlock {
  id: string; // Immutable ID e.g. 'blk_001'
  kind: BlockKind;
  content?: string;
  label?: string;
  editable?: boolean;
  binding?: FieldBinding;
  confidence?: number;
  validation?: ValidationRule;
  options?: string[]; // Options array for 'dropdown' and 'radio' block kinds
  columns?: string[]; // Column headers array for 'table' block kinds
  bbox?: BoundingBox;
  style?: BlockStyle;
  children?: DocumentBlock[];
}

export interface DocumentSection {
  id: string;
  title?: string;
  blocks: DocumentBlock[];
}

export interface StructuredDocument {
  id: string;
  title: string;
  sections: DocumentSection[];
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  current_version_id: string;
  category: string;
  phase: 'before_ojt' | 'in_ojt' | 'final';
  created_at: string;
}

export interface DocumentTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  schema_json: StructuredDocument;
  mapping_rules: MappingRule[];
  status: 'draft' | 'needs_mapping' | 'ready' | 'published' | 'archived';
  published_by?: string;
  created_at: string;
}

export interface FieldValue {
  blockId: string;
  value: string | number | boolean | Array<string> | Array<Array<string>>;
  updatedAt?: string;
  updatedBy?: string;
}

export type FieldValues = Record<string, FieldValue>;

export interface DocumentInstance {
  id: string;
  template_id: string;
  template_version_id: string; // Foreign Key to immutable `document_template_versions.id`
  student_id: string;
  student_name: string;
  instance_version: number; // Used for optimistic locking on autosave
  field_values: FieldValues;
  status: 'draft' | 'submitted' | 'adviser_review' | 'revision_required' | 'approved' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ParseMetadata {
  parserName: string;
  parserVersion: string;
  parsedAt: string;
  durationMs: number;
}

export interface ParseStatistics {
  blocksDetected: number;
  tablesDetected: number;
  imagesDetected: number;
  pagesProcessed: number;
  unmappedFields: number;
}

export interface ParserWarning {
  code: string;
  message: string;
  blockId?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ParserCapabilities {
  supportsTables: boolean;
  supportsOCR: boolean;
  supportsImages: boolean;
  supportsForms: boolean;
}

export interface ParserResult {
  document: StructuredDocument;
  warnings: ParserWarning[];
  overallConfidence: number;
  metadata: ParseMetadata;
  statistics: ParseStatistics;
}

export interface TemplateValidationIssue {
  code: string;
  message: string;
  blockId?: string;
  severity: 'error' | 'warning';
}

export interface TemplateValidationResult {
  isValid: boolean;
  issues: TemplateValidationIssue[];
}
```

---

## Migration, Cutover & Rollback Strategy

1. **Legacy Submission Retention**: Existing unstructured uploads (`student_documents` table) remain in read-only mode so historical student records are preserved without breaking past submissions.
2. **In-Flight Cutover Rule**: In-flight legacy submissions continue on the legacy path until completed or archived. Students only use the new `document_instances` workflow for new submissions once a template version is set to `published`.
3. **Template Rollback Runbook**: If a published template version contains layout/mapping errors post-publish, admins publish a new template version (`v2`). Existing in-progress student instances remain pinned to their immutable `template_version_id` (v1) to prevent data corruption.
4. **Template Migration Pipeline**: Existing DOCX/PDF templates are ingested via `ParserManager` to populate `document_templates` and `document_template_versions` with verified `schema_json` models.

---

## Existing Code Being Replaced & Refactored

| Existing File | Current Functionality | Replacement / Refactored Architecture |
| :--- | :--- | :--- |
| **`src/lib/documentGenerator.ts`** | Replaces regex `_{3,}` and `Date:` placeholders inside `.docx` XML buffers using `JSZip`. | Replaced by **`src/services/exporters/DocumentExporter.ts`** (`HTMLExporter`, `PDFExporter`, `DOCXExporter`) which statelessly compiles `StructuredDocument` + `FieldValues`. |
| **`src/lib/templateStorage.ts`** | Stores raw file buffers in Supabase storage and flat metadata in `template_metadata`. | Refactored to interface with **`document_templates`** and **`document_template_versions`** DB tables. |
| **`src/lib/submissionStorage.ts`** | Saves uploaded files as unstructured PDFs/images in Supabase storage. | Refactored to create **`document_instances`** linked to specific `template_version_id` snapshots with strongly-typed `field_values`. |
| **`src/components/compose/DocumentWorkflow.tsx`** | Hardcoded DOM tree-walker wrapping editable spans. | Refactored to render **`StructuredDocumentRenderer.tsx`**, dynamically mapping blocks to auto-filled React form components. |

---

## Operational Policies & Validation Gates

1. **Publish Gate (`TemplateValidator`)**: Before a `DocumentTemplateVersion` transitions from `'needs_mapping'` to `'ready'` / `'published'`, it must pass `TemplateValidator.validate(version)` enforcing:
   - All fields with static `required: true` OR conditional `conditions` MUST have an assigned `FieldBinding`.
   - Zero high-severity parser warnings.
   - Zero duplicate block IDs.
   - Valid document structure (no empty required sections).
2. **Template Status Lifecycle & Transition Triggers**:
   `'draft'` ──► `'needs_mapping'` ──► `TemplateValidator` PASS ──► `'ready'` (Awaiting manual publish click) ──► `'published'` ──► `'archived'`.
   - **`draft ➔ needs_mapping` Trigger**: Automatic the moment background parsing completes and `FieldDetectionService` emits initial mapping rules.
   - **Re-validation Trigger**: Any mutation to `mapping_rules` or `schema_json` while in `'ready'` status immediately forces a status reversion to `'needs_mapping'`, guaranteeing no template can reach `'published'` without re-evaluating `TemplateValidator` on its latest edits.
3. **Optimistic Locking & Change Granularity (`instance_version`)**:
   - **Frontend Dirty Tracking**: The React client tracks an `isDirty` flag via debounced keystrokes and deep JSON comparison against previously saved values. No-op save network requests are never sent.
   - **Backend Version Increment**: When a dirty payload is received, the backend compares the incoming `field_values` against the stored row; if values differ, it applies the update and atomically increments `instance_version = instance_version + 1`.
   - **Stale Protection**: If `incoming.instance_version !== stored.instance_version`, the server rejects with a `409 Conflict` error prompting the student to refresh.
4. **Deterministic Parser Selection Policy**: `ParserManager.selectParser(fileBuffer, fileName, overrideName)` evaluates:
   1. Admin explicit parser override (verifying `supportedFormats.includes(ext)`).
   2. Configured default parser matching the file format.
   3. Highest capability match score for the file format.
   4. Throws explicit `UnsupportedFormatError` if no parser is compatible.
5. **Measurable Export Acceptance Criteria**:
   - All headings and body layout preserved.
   - All tables retain exact row/column grid structure.
   - All editable fields remain interactive until export.
   - Exported PDF contains zero missing blocks.
   - Page count differs by no more than ±1 page from the original source template.

---

## Streamlined Implementation Milestones

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 1: Parser Proof of Concept Benchmark                         │
│ └── Benchmark 5 real practicum PDFs (MOA, Parent Consent, DTR, etc.).  │
├────────────────────────────────────────────────────────────────────────┤
│ Milestone 2: StructuredDocument & Template Versioning Schemas          │
│ └── Implement `DocumentTemplateVersion` immutable database schema.     │
├────────────────────────────────────────────────────────────────────────┤
│ Milestone 3: ParserManager & FieldDetectionService                     │
│ └── Implement `DocumentParser` policy & `CONFIDENCE_THRESHOLD`.        │
├────────────────────────────────────────────────────────────────────────┤
│ Milestone 4: Admin Visual Template Builder & TemplateValidator         │
│ └── Build `VisualTemplateBuilder.tsx` with confidence badges & gate.   │
│ └── Implement `TemplateValidator.test.ts` for all 4 failure modes.     │
├────────────────────────────────────────────────────────────────────────┤
│ Milestone 5: Student Renderer & Optimistic Autosave                    │
│ └── Build `StructuredDocumentRenderer.tsx` with optimistic locks.     │
│ └── Check `incoming.instance_version !== stored.instance_version`.     │
├────────────────────────────────────────────────────────────────────────┤
│ Milestone 6: Stateless High-Fidelity Exporters                         │
│ └── Implement `HTMLExporter`, `PDFExporter`, and `DOCXExporter`.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Verification & Proof of Concept Plan

### Milestone 1: Proof of Concept Benchmark
- Test 5 real practicum PDF templates (MOA, Application Letter, Parent Consent, DTR, Performance Evaluation).
- Validate:
  1. Heading and paragraph layout parsing.
  2. Table row/column structure preservation.
  3. Field label extraction, `ParseStatistics`, and `ParserWarning` generation.

### Milestone 4 Automated Testing
- Implement `TemplateValidator.test.ts` with test fixtures for each failure mode:
  1. Duplicate Block IDs
  2. Unmapped Required Fields (static & conditional)
  3. High-Severity Parser Warnings
  4. Empty Required Document Sections

### System Verification (Milestones 2-6)
- Execute `npx tsc --noEmit` to verify strict type compliance across all `StructuredDocument`, `TemplateValidator`, `DocumentInstance`, and `DocumentExporter` modules.
