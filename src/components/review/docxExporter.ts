import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// Helper to parse **bold** and *italic*
const parseInlineFormatting = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  
  // A simple regex approach for bold
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  
  for (const bPart of boldParts) {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      runs.push(new TextRun({ 
        text: bPart.slice(2, -2), 
        bold: true,
        font: "Arial",
        size: 22 // 11pt
      }));
    } else {
      // Check for italics inside non-bold parts
      const italicParts = bPart.split(/(\*.*?\*)/g);
      for (const iPart of italicParts) {
        if (iPart.startsWith('*') && iPart.endsWith('*')) {
          runs.push(new TextRun({ 
            text: iPart.slice(1, -1), 
            italics: true,
            font: "Arial",
            size: 22 // 11pt
          }));
        } else {
          if (iPart) {
            runs.push(new TextRun({ 
              text: iPart,
              font: "Arial",
              size: 22 // 11pt
            }));
          }
        }
      }
    }
  }

  return runs;
};

export const exportMarkdownToDocx = async (markdown: string, title: string): Promise<Blob> => {
  // Clean up Lexical's visual backslash escapes (e.g. \[Student Name\] or \_italic\_)
  const cleanMarkdown = markdown.replace(/\\([\[\]\_\*])/g, '$1');

  const lines = cleanMarkdown.split('\n');
  const docChildren: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line -> add empty paragraph with spacing to preserve layout linebreaks
      docChildren.push(new Paragraph({ 
        children: [new TextRun({ text: "" })],
        spacing: { after: 120 }
      }));
      continue;
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('# ', ''),
              bold: true,
              size: 28, // 14pt
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }
    
    if (line.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('## ', ''),
              bold: true,
              size: 24, // 12pt
              font: "Arial"
            })
          ],
          spacing: { before: 180, after: 120 },
        })
      );
      continue;
    }

    // Handle lists
    if (line.match(/^[\*\-]\s+/) || line.match(/^\d+\.\s+/)) {
      const isNumbered = line.match(/^\d+\.\s+/);
      let textContent = line;
      
      // If bullet, remove the bullet char, if numbered, keep it as text to avoid complex numbering setups
      if (!isNumbered) {
        textContent = line.replace(/^[\*\-]\s+/, '');
      }
      
      const runs = parseInlineFormatting(textContent);
      
      docChildren.push(
        new Paragraph({
          children: runs,
          bullet: isNumbered ? undefined : { level: 0 },
          spacing: { after: 120, line: 276 } // 1.15 line spacing
        })
      );
      continue;
    }

    // Standard Paragraph
    const runs = parseInlineFormatting(line);
    docChildren.push(
      new Paragraph({
        children: runs,
        spacing: { after: 120, line: 276 } // 1.15 line spacing
      })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              after: 120, // 6pt space after
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch margins (1440 twips)
              bottom: 1440,
              left: 1440,
              right: 1440,
            }
          }
        },
        children: docChildren,
      },
    ],
  });

  return Packer.toBlob(doc);
};
