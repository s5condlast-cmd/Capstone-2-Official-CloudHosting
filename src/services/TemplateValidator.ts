import { DocumentTemplateVersion, TemplateValidationResult, TemplateValidationIssue } from '@/src/types/structuredDocument';

export class TemplateValidator {
  public static validate(version: DocumentTemplateVersion): TemplateValidationResult {
    const issues: TemplateValidationIssue[] = [];
    const blockIdMap = new Map<string, number>();

    const mappingRuleMap = new Map<string, any>();
    version.mapping_rules.forEach(r => {
      if (r.binding?.source && r.binding?.key) {
        mappingRuleMap.set(r.blockId, r.binding);
      }
    });

    if (!version.schema_json.sections || version.schema_json.sections.length === 0) {
      issues.push({
        code: 'EMPTY_DOCUMENT',
        message: 'Document template contains zero sections.',
        severity: 'error'
      });
    }

    version.schema_json.sections.forEach((section, sIdx) => {
      if (!section.blocks || section.blocks.length === 0) {
        issues.push({
          code: 'EMPTY_SECTION',
          message: `Section ${sIdx + 1} (${section.title || 'Untitled'}) contains zero blocks.`,
          severity: 'warning'
        });
      }

      section.blocks.forEach(block => {
        // 1. Check for Duplicate Block IDs
        const count = (blockIdMap.get(block.id) || 0) + 1;
        blockIdMap.set(block.id, count);
        if (count > 1) {
          issues.push({
            code: 'DUPLICATE_BLOCK_ID',
            message: `Duplicate block ID detected: '${block.id}'.`,
            blockId: block.id,
            severity: 'error'
          });
        }

        // 2. Check Static or Conditional Required Bindings
        const isRequiredStatic = block.validation?.required === true;
        const hasConditions = Boolean(block.validation?.conditions && block.validation.conditions.length > 0);
        const hasAssignedBinding = mappingRuleMap.has(block.id) || Boolean(block.binding?.source && block.binding?.key);

        if ((isRequiredStatic || hasConditions) && !hasAssignedBinding) {
          issues.push({
            code: 'UNMAPPED_REQUIRED_FIELD',
            message: `Required or conditional block '${block.label || block.id}' has no assigned field binding.`,
            blockId: block.id,
            severity: 'error'
          });
        }
      });
    });

    const hasErrors = issues.some(i => i.severity === 'error');

    return {
      isValid: !hasErrors,
      issues
    };
  }
}
