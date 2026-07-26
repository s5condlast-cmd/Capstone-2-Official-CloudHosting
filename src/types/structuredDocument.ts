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
  supportedFormats: string[];
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
