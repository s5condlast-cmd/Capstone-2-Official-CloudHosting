import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPlateEditor } from 'platejs/react';

import {
  setBlockType,
  toggleList,
  toggleMark,
} from '../src/components/editor/editor-commands';
import { editorPlugins } from '../src/components/editor/editor-kit';
import { ImageElement } from '../src/components/plate-ui/image-element';
import {
  serializeToDocx,
  leafToRuns,
  collectParagraphChildren,
  elementToTable,
} from '../src/components/editor/serializers/docxSerializer';
import {
  wrapContentEnvelope,
  unwrapContentEnvelope,
} from '../src/lib/documentHistoryStorage';
import { ExternalHyperlink } from 'docx';
function createEditor(value: any[]) {
  return createPlateEditor({ plugins: editorPlugins, value });
}

describe('Plate editor runtime wiring', () => {
  it('registers visible renderers for every toolbar-facing node type', () => {
    const editor = createEditor([{ type: 'p', children: [{ text: '' }] }]);
    const keys = [
      'p', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'todo', 'toggle',
      'table', 'tr', 'td', 'hr', 'a', 'date', 'img', 'video', 'audio', 'file',
      'bold', 'italic', 'underline', 'strikethrough', 'code', 'highlight',
      'fontSize', 'color', 'backgroundColor', 'subscript', 'superscript', 'kbd',
    ];

    for (const key of keys) {
      assert.equal(
        typeof editor.plugins[key]?.node?.component,
        'function',
        `${key} should have a React renderer`
      );
    }
  });

  it('applies marks and block types using the Plate v53 transform API', () => {
    const editor = createEditor([{ type: 'p', children: [{ text: 'Hello' }] }]);
    editor.tf.select({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    });

    toggleMark(editor, 'bold');
    setBlockType(editor, 'h2');

    assert.equal((editor.children[0] as any).type, 'h2');
    assert.equal((editor.children[0] as any).children[0].bold, true);
  });

  it('creates and removes structurally valid classic lists', () => {
    const editor = createEditor([
      { type: 'p', children: [{ text: 'One' }] },
      { type: 'p', children: [{ text: 'Two' }] },
    ]);
    editor.tf.select({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [1, 0], offset: 3 },
    });

    toggleList(editor, 'ul', 'square');
    assert.equal((editor.children[0] as any).type, 'ul');
    assert.equal((editor.children[0] as any).listStyleType, 'square');
    assert.deepEqual(
      (editor.children[0] as any).children.map((node: any) => node.type),
      ['li', 'li']
    );

    toggleList(editor, 'ul', 'square');
    assert.deepEqual(editor.children.map((node: any) => node.type), ['p', 'p']);
  });

  it('serializes editor structures to a non-empty Word document', async () => {
    const blob = await serializeToDocx([
      { type: 'h5', align: 'center', children: [{ text: 'Report', bold: true }] },
      {
        type: 'p',
        indent: 1,
        lineHeight: 2,
        children: [
          { text: 'Prepared ' },
          { type: 'date', date: '2026-09-16', children: [{ text: '' }] },
        ],
      },
      {
        type: 'ul',
        children: [{ type: 'li', children: [{ text: 'Item' }] }],
      },
      {
        type: 'table',
        children: [{
          type: 'tr',
          children: [{ type: 'td', children: [{ type: 'p', children: [{ text: 'Cell' }] }] }],
        }],
      },
    ] as any, 'Editor Runtime Test');

    assert.ok(blob.size > 1_000);
  });

  it('serializes images and font families accurately to docx', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx([
      {
        type: 'img',
        url: tinyPng,
        align: 'center',
        name: 'header-logo.png',
        children: [{ text: '' }],
      },
      {
        type: 'p',
        align: 'left',
        children: [
          { text: 'Times Roman Paragraph', fontFamily: '"Times New Roman", Times, serif' },
          { text: ' Arial Text', fontFamily: 'Arial, sans-serif' },
        ],
      },
    ] as any, 'Image and Font Test');

    assert.ok(blob.size > 1_500);
  });

  it('unwraps list items on empty line to paragraph on same line (Frame 1 to Frame 2 flow)', () => {
    const editor = createEditor([
      {
        type: 'ol',
        children: [
          { type: 'li', children: [{ text: 'asfdaf' }] },
          { type: 'li', children: [{ text: '' }] },
        ],
      },
    ]);

    // Select the empty 2nd item (path [0, 1, 0], offset 0)
    editor.tf.select({
      anchor: { path: [0, 1, 0], offset: 0 },
      focus: { path: [0, 1, 0], offset: 0 },
    });

    // 1st Backspace: unwrap list so it becomes a standard paragraph 'p' on this EXACT line!
    editor.tf.unwrapNodes({ match: (n: any) => n.type === 'ul' || n.type === 'ol', split: true });
    editor.tf.setNodes({ type: 'p' }, { match: (n: any) => n.type === 'li' || n.type === 'lic' });

    // Verify it is now a p following the ol (same line, Frame 1)
    assert.equal(editor.children.length, 2);
    assert.equal((editor.children[0] as any).type, 'ol');
    assert.equal((editor.children[1] as any).type, 'p');
    assert.equal((editor.children[1] as any).children[0].text, '');

    // 2nd Backspace: normal deleteBackward merges p back into asfdaf (Frame 2)
    editor.tf.deleteBackward();
    assert.equal(editor.children.length, 1);
    assert.equal((editor.children[0] as any).type, 'ol');
    assert.equal((editor.children[0] as any).children.length, 1);
    assert.equal((editor.children[0] as any).children[0].children[0].text, 'asfdaf');
  });

  it('unwraps todo and toggle blocks to paragraph on empty line', () => {
    const editor = createEditor([
      { type: 'p', children: [{ text: 'Heading' }] },
      { type: 'todo', checked: false, children: [{ text: '' }] },
    ]);

    editor.tf.select({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });

    editor.tf.setNodes({ type: 'p' }, { at: [1] });
    editor.tf.unsetNodes(['checked'], { at: [1] });

    assert.equal((editor.children[1] as any).type, 'p');
    assert.equal((editor.children[1] as any).checked, undefined);
  });

  it('reorders blocks using Plate transform moveNodes with correct displacement', () => {
    const editor = createEditor([
      { type: 'h1', children: [{ text: 'Title' }] },
      { type: 'p', children: [{ text: 'First paragraph' }] },
      { type: 'p', children: [{ text: 'Second paragraph' }] },
    ]);

    // Move first paragraph (index 1) to after second paragraph (index 2)
    let from = 1;
    let to = 2 + 1;
    if (from < to) to = to - 1;
    editor.tf.moveNodes({ at: [from], to: [to] });

    assert.equal((editor.children[1] as any).children[0].text, 'Second paragraph');
    assert.equal((editor.children[2] as any).children[0].text, 'First paragraph');
  });

  it('preserves image wrap mode, custom width, and cropZoom attributes on Slate node', () => {
    const editor = createEditor([
      {
        type: 'img',
        url: 'https://example.com/photo.png',
        width: 320,
        wrap: 'wrap',
        cropZoom: 1.5,
        align: 'center',
        children: [{ text: '' }],
      },
    ]);

    const imgNode = editor.children[0] as any;
    assert.equal(imgNode.type, 'img');
    assert.equal(imgNode.width, 320);
    assert.equal(imgNode.wrap, 'wrap');
    assert.equal(imgNode.cropZoom, 1.5);
    assert.equal(imgNode.align, 'center');

    // Update attributes via Plate transform
    editor.tf.setNodes(
      { wrap: 'inline', width: 450, cropZoom: 1.0 },
      { at: [0] }
    );

    const updated = editor.children[0] as any;
    assert.equal(updated.wrap, 'inline');
    assert.equal(updated.width, 450);
    assert.equal(updated.cropZoom, 1.0);
  });

  it('wires ImageElement as the active renderer for img nodes', () => {
    const editor = createEditor([{ type: 'p', children: [{ text: '' }] }]);
    assert.equal(
      editor.plugins.img?.node?.component,
      ImageElement,
      'img node must use ImageElement component with resize handles and toolbar'
    );
  });

  it('serializes native Word Header and Footer with moveable logo, text, and page numbers', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx(
      [{ type: 'p', children: [{ text: 'Body content of document' }] }] as any,
      'Header Footer Test',
      {
        header: {
          image: {
            url: tinyPng,
            name: 'header-logo.png',
            align: 'center',
            width: 160,
          },
          text: 'STI COLLEGE MARIKINA • PRACTICUM OFFICE',
          textAlign: 'center',
          scope: 'every_page',
        },
        footer: {
          image: {
            url: tinyPng,
            name: 'footer-seal.png',
            align: 'right',
            width: 120,
          },
          text: 'Confidential • For Academic Use Only',
          pageNumber: true,
          textAlign: 'center',
          scope: 'every_page',
        },
      }
    );

    assert.ok(blob.size > 2_000, 'Serialized DOCX with Header and Footer should be larger than 2KB');
  });

  it('serializes native Word Header and Footer with offsetPercent-derived alignment', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx(
      [{ type: 'p', children: [{ text: 'Body content' }] }] as any,
      'Offset Test',
      {
        header: {
          image: {
            url: tinyPng,
            width: 140,
            offsetPercent: 15, // <= 33 maps to 'left'
          },
        },
        footer: {
          image: {
            url: tinyPng,
            width: 140,
            offsetPercent: 85, // >= 67 maps to 'right'
          },
        },
      }
    );
    assert.ok(blob.size > 1_500);
  });

  it('serializes native Word Header and Footer with cropZoom attributes without errors', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx(
      [{ type: 'p', children: [{ text: 'Body content' }] }] as any,
      'Crop Test',
      {
        header: {
          image: {
            url: tinyPng,
            width: 220,
            cropZoom: 150,
          },
        },
        footer: {
          image: {
            url: tinyPng,
            width: 160,
            cropZoom: 120,
          },
        },
      }
    );
    assert.ok(blob.size > 1_500);
  });

  it('converts px font size strings to accurate half-points (16px -> 24 half-points / 12pt)', () => {
    const runs16px = leafToRuns({ text: 'Hello 16px', fontSize: '16px' });
    assert.equal(runs16px.length, 1);
    // 16px * 0.75 = 12pt = 24 half-points
    const rPr16 = (runs16px[0] as any).properties?.root;
    const sizeElem = rPr16?.find((e: any) => e?.rootKey === 'w:sz');
    assert.ok(sizeElem, 'w:sz element should be present');
    assert.equal(sizeElem.root[0]?.root?.val, 24, '16px must convert to 24 half-points (12pt), not 16 or 32');

    const runs12pt = leafToRuns({ text: 'Hello 12pt', fontSize: '12pt' });
    const rPr12 = (runs12pt[0] as any).properties?.root;
    const sizeElemPt = rPr12?.find((e: any) => e?.rootKey === 'w:sz');
    assert.equal(sizeElemPt.root[0]?.root?.val, 24, '12pt must convert to 24 half-points');
  });

  it('serializes inline link elements to ExternalHyperlink instances', () => {
    const linkElement = {
      type: 'a',
      url: 'https://sti.edu/practicum',
      children: [{ text: 'Practicum Portal' }],
    };
    const runs = collectParagraphChildren([linkElement as any]);
    assert.equal(runs.length, 1);
    assert.ok(runs[0] instanceof ExternalHyperlink, 'Link element must serialize to ExternalHyperlink');
    assert.equal((runs[0] as any).options?.link, 'https://sti.edu/practicum');
  });

  it('serializes table elements with cell widths, colSpan, and rowSpan', () => {
    const tableElement = {
      type: 'table',
      children: [
        {
          type: 'tr',
          header: true,
          children: [
            {
              type: 'th',
              colSpan: 2,
              rowSpan: 1,
              width: 300,
              children: [{ type: 'p', children: [{ text: 'Header Cell' }] }],
            },
          ],
        },
      ],
    };
    const docxTable = elementToTable(tableElement as any);
    assert.ok(docxTable, 'elementToTable should produce a docx Table');
  });

  it('wraps and unwraps document envelopes with headerFooter settings and backwards compatibility', () => {
    const sampleBody = [{ type: 'p', children: [{ text: 'Draft body' }] }];
    const sampleHf = {
      header: { text: 'Official STI Header', scope: 'first_page_only' as const },
      footer: { text: 'Confidential', pageNumber: true, scope: 'every_page' as const },
    };

    // 1. Wrap
    const envelope = wrapContentEnvelope(sampleBody, sampleHf, 42);
    assert.equal((envelope as any).schemaVersion, 1);
    assert.equal((envelope as any).type, 'document_envelope');
    assert.deepEqual((envelope as any).body, sampleBody);
    assert.deepEqual((envelope as any).headerFooter, sampleHf);

    // 2. Unwrap envelope
    const unwrapped = unwrapContentEnvelope(envelope);
    assert.deepEqual(unwrapped.content, sampleBody);
    assert.deepEqual(unwrapped.headerFooter, sampleHf);

    // 3. Unwrap legacy raw array (backwards-compatibility)
    const legacyUnwrapped = unwrapContentEnvelope(sampleBody);
    assert.deepEqual(legacyUnwrapped.content, sampleBody);
    assert.equal(legacyUnwrapped.headerFooter, undefined);
  });

  it('serializes document with first_page_only header and nested lists without errors', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const content = [
      {
        type: 'ul',
        children: [
          {
            type: 'li',
            children: [
              { type: 'lic', children: [{ text: 'Level 0 Bullet' }] },
              {
                type: 'ol',
                children: [
                  {
                    type: 'li',
                    children: [
                      { type: 'lic', children: [{ text: 'Level 1 Numbered' }] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const blob = await serializeToDocx(
      content as any,
      'Nested Lists and Scope Test',
      {
        header: {
          image: { url: tinyPng, width: 150 },
          text: 'First Page Only Header',
          scope: 'first_page_only',
        },
        footer: {
          text: 'Every Page Footer',
          pageNumber: true,
          scope: 'every_page',
        },
      }
    );

    assert.ok(blob.size > 2_000, 'Serialized DOCX with first_page_only header should be valid and >2KB');
  });

  it('enforces single-row Google Docs track, More tools anchor next to highlight, and horizontal popover with RemoveFormatting', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');

    // 1. Single row layout: must have scroll track with flex-nowrap and overflow-x-auto
    assert.ok(toolbarSrc.includes('flex-nowrap min-w-max'), 'Toolbar must have non-wrapping min-w-max track');
    assert.ok(toolbarSrc.includes('overflow-x-auto no-scrollbar'), 'Toolbar must have horizontal overflow scrolling');

    // 2. More tools button (⋮) positioned next to Highlight Color
    assert.ok(toolbarSrc.includes('moreAnchorRef'), 'More tools anchor must exist');
    assert.ok(toolbarSrc.includes('tooltip="More tools"'), 'More tools button must be present');
    assert.ok(toolbarSrc.includes('MoreVertical'), 'More tools must use MoreVertical icon');

    // 3. Popover alignment to left (align="end")
    assert.ok(toolbarSrc.includes('align="end"'), 'PortalPopover for More tools must use align="end"');

    // 4. RemoveFormatting icon used for clear format
    assert.ok(toolbarSrc.includes('RemoveFormatting'), 'Clear format must use RemoveFormatting icon');

    // 5. Obsolete legacy buttons must NOT be rendered in primary toolbar track
    assert.ok(!toolbarSrc.includes('<InsertToolbarButton editor={editor} />'), 'InsertToolbarButton must not be rendered in primary row');
    assert.ok(!toolbarSrc.includes('<TableToolbarButton editor={editor} />'), 'TableToolbarButton must not be rendered in primary row');
    assert.ok(!toolbarSrc.includes('<SpeechToTextToolbarButton editor={editor}'), 'SpeechToText must not be rendered in letter template toolbar');
  });

  it('enforces edge-to-edge divider line, borderless 750px resizable images, and rich text formatting', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');

    // 1. Edge-to-edge full-width divider line (spans the full 816px paper sheet across 96px padding)
    assert.ok(headerSrc.includes('-mx-[96px] w-[calc(100%+192px)]'), 'Header must span edge-to-edge across paper margins');
    assert.ok(footerSrc.includes('-mx-[96px] w-[calc(100%+192px)]'), 'Footer must span edge-to-edge across paper margins');

    // 2. Borderless free image sizing up to 750px without container dashed box or h-20 constraint
    assert.ok(!headerSrc.includes('border border-dashed border-zinc-300'), 'Header image must NOT have dashed container box');
    assert.ok(!footerSrc.includes('border border-dashed border-zinc-300'), 'Footer image must NOT have dashed container box');
    assert.ok(!headerSrc.includes('max-h-18'), 'Header logo must NOT be trapped in max-h-18');
    assert.ok(headerSrc.includes('Math.min(750'), 'Header logo must allow resizing up to 750px');
    assert.ok(footerSrc.includes('Math.min(750'), 'Footer logo must allow resizing up to 750px');

    // 3. Clean typing area (no placeholder="Header" or placeholder="Footer" text)
    assert.ok(!headerSrc.includes('placeholder="Header'), 'Header text input must be clean without placeholder="Header"');
    assert.ok(!footerSrc.includes('placeholder="Footer'), 'Footer text input must be clean without placeholder="Footer"');

    // 4. Toolbar activeHeaderFooter integration
    assert.ok(toolbarSrc.includes('activeHeaderFooter'), 'FixedToolbarButtons must support activeHeaderFooter');
    assert.ok(toolbarSrc.includes('onFormatHeaderFooter'), 'FixedToolbarButtons must support onFormatHeaderFooter');

    // 5. DOCX serializer rich header/footer text formatting
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx(
      [{ type: 'p', children: [{ text: 'Body text' }] }] as any,
      'Rich Header Footer Test',
      {
        header: {
          image: { url: tinyPng, width: 250 },
          text: 'Formatted Header',
          bold: true,
          italic: true,
          underline: true,
          color: '#003366',
          fontSize: 14,
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
        },
        footer: {
          text: 'Formatted Footer',
          pageNumber: true,
          bold: true,
          color: '#555555',
          fontSize: 10,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'right',
        },
      }
    );
    assert.ok(blob.size > 2_000, 'Serialized DOCX with rich formatted header and footer should be valid');
  });
});


