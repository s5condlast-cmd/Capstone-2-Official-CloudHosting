import { StructuredDocument, MappingRule, CONFIDENCE_THRESHOLD, FieldBinding } from '@/src/types/structuredDocument';

const DOMAIN_KEYWORDS: Record<string, FieldBinding> = {
  'student name': { source: 'student', key: 'full_name' },
  'student full name': { source: 'student', key: 'full_name' },
  'student id': { source: 'student', key: 'student_number' },
  'company name': { source: 'company', key: 'name' },
  'company address': { source: 'company', key: 'address' },
  'adviser name': { source: 'adviser', key: 'full_name' },
  'supervisor name': { source: 'supervisor', key: 'full_name' },
  'submission date': { source: 'submission', key: 'submitted_at' },
  'date': { source: 'submission', key: 'submitted_at' }
};

export class FieldDetectionService {
  public static detectMappingRules(document: StructuredDocument): MappingRule[] {
    const rules: MappingRule[] = [];

    document.sections.forEach(section => {
      section.blocks.forEach(block => {
        const textToMatch = (block.label || block.content || '').toLowerCase().trim();

        for (const [keyword, binding] of Object.entries(DOMAIN_KEYWORDS)) {
          if (textToMatch.includes(keyword)) {
            const confidence = textToMatch === keyword ? 0.95 : 0.80;

            rules.push({
              id: crypto.randomUUID(),
              blockId: block.id,
              binding,
              confidence,
              isManualOverride: false
            });
            break;
          }
        }
      });
    });

    return rules;
  }
}
