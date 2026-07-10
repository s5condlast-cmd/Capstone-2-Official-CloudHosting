import JSZip from 'jszip';

export interface ExtractedField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

export async function extractTagsFromDocx(buffer: ArrayBuffer): Promise<ExtractedField[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    
    if (!documentXml) {
      console.warn('Could not find word/document.xml in the provided DOCX buffer.');
      return [];
    }

    // A naïve regex to find {tags} inside the xml text nodes
    // Note: Word sometimes splits tags across <w:t> nodes if formatting changes in the middle of a tag.
    // easy-template-x handles this during replacement, but for our simple extraction we might miss some if they are heavily split.
    // A better approach is to strip all XML tags first to get pure text, then find {tags}.
    
    const pureText = documentXml.replace(/<[^>]+>/g, '');
    const tagRegex = /\{([^}]+)\}/g;
    const matches = [...pureText.matchAll(tagRegex)];
    
    const uniqueTags = Array.from(new Set(matches.map(m => m[1].trim())));
    
    return uniqueTags.map(tag => {
      // Guess type and label based on tag name
      const lowerTag = tag.toLowerCase();
      let type = 'text';
      if (lowerTag.includes('date')) type = 'date';
      else if (lowerTag.includes('email')) type = 'email';
      else if (lowerTag.includes('summary') || lowerTag.includes('desc') || lowerTag.includes('remarks')) type = 'textarea';

      // Convert camelCase or snake_case to Title Case for label
      const label = tag
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      return {
        key: tag,
        label,
        type,
        placeholder: `Enter ${label.toLowerCase()}...`
      };
    });

  } catch (error) {
    console.error('Failed to extract tags from DOCX:', error);
    return [];
  }
}
