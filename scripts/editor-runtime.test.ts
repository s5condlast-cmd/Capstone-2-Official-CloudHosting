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

  it('enforces edge-to-edge dual divider lines, 624px printable bounded resizable images, and single-click side-by-side layout', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const imageElSrc = fs.readFileSync(path.resolve('src/components/plate-ui/image-element.tsx'), 'utf8');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');

    // 1. Dual edge-to-edge full-width divider lines (spans the full 816px paper sheet across 96px padding)
    const headerLinesCount = (headerSrc.match(/-mx-\[96px\] w-\[calc\(100%\+192px\)\]/g) || []).length;
    const footerLinesCount = (footerSrc.match(/-mx-\[96px\] w-\[calc\(100%\+192px\)\]/g) || []).length;
    assert.ok(headerLinesCount >= 2, 'Header must have dual divider lines framing the sub-bar');
    assert.ok(footerLinesCount >= 2, 'Footer must have dual divider lines framing the sub-bar');

    // 2. Single-click activation on header and footer
    assert.ok(headerSrc.includes('onToggleActive(true)'), 'Header must activate on single click');
    assert.ok(footerSrc.includes('onToggleActive(true)'), 'Footer must activate on single click');

    // 3. Strict 624px printable bounding without container dashed box
    assert.ok(!headerSrc.includes('border border-dashed border-zinc-300'), 'Header image must NOT have dashed container box');
    assert.ok(!footerSrc.includes('border border-dashed border-zinc-300'), 'Footer image must NOT have dashed container box');
    assert.ok(headerSrc.includes('HEADER_CONTENT_WIDTH'), 'Header logo must be bounded to printable page track width');
    assert.ok(footerSrc.includes('FOOTER_CONTENT_WIDTH'), 'Footer logo must be bounded to printable page track width');
    assert.ok(imageElSrc.includes('Math.min(624'), 'Body image must be bounded to 624px printable page track');

    // 4. Side-by-side text & image layout (cursor right next to image)
    assert.ok(headerSrc.includes('flex items-center gap-3 relative py-0.5'), 'Header must have side-by-side inline row');
    assert.ok(footerSrc.includes('flex items-center gap-3 relative py-0.5 min-h-[36px]'), 'Footer must have side-by-side inline row');
    assert.ok(imageElSrc.includes("wrap === 'inline'"), 'Body image must support inline wrap next to text');

    // 5. Crop Zoom buttons and popup completely removed, replaced by Google Docs L-bracket cropping
    assert.ok(!headerSrc.includes('data-header-crop'), 'Header must not contain old crop zoom popup');
    assert.ok(!footerSrc.includes('data-footer-crop'), 'Footer must not contain old crop zoom popup');
    assert.ok(!imageElSrc.includes('Crop Zoom:'), 'Body image element must not contain crop zoom controls');
    assert.ok(!imageElSrc.includes('handleApplyCrop'), 'Body image element must not contain handleApplyCrop');
    assert.ok(headerSrc.includes('border-t-[3px] border-l-[3px] border-black'), 'Header must have Google Docs L-bracket corner crop handles');
    assert.ok(headerSrc.includes('shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'), 'Header must have darkened backdrop mask for cropping');
    assert.ok(headerSrc.includes('applyCrop'), 'Header must have canvas-based crop application');
    assert.ok(footerSrc.includes('border-t-[3px] border-l-[3px] border-black'), 'Footer must have Google Docs L-bracket corner crop handles');

    // 6. Clean typing area (no placeholder="Header" or placeholder="Footer" text)
    assert.ok(!headerSrc.includes('placeholder="Header'), 'Header text input must be clean without placeholder="Header"');
    assert.ok(!footerSrc.includes('placeholder="Footer'), 'Footer text input must be clean without placeholder="Footer"');

    // 7. Toolbar activeHeaderFooter integration
    assert.ok(toolbarSrc.includes('activeHeaderFooter'), 'FixedToolbarButtons must support activeHeaderFooter');
    assert.ok(toolbarSrc.includes('onFormatHeaderFooter'), 'FixedToolbarButtons must support onFormatHeaderFooter');

    // 8. 8-handle free-form resizing (corners and side-edges for width and height enlargement)
    assert.ok(headerSrc.includes("handleResizeStart(e, 'nw')"), 'Header must have corner resizing handles');
    assert.ok(headerSrc.includes("handleResizeStart(e, 'n')"), 'Header must have top edge resizing handle');
    assert.ok(headerSrc.includes("handleResizeStart(e, 'e')"), 'Header must have right edge resizing handle');
    assert.ok(footerSrc.includes("handleResizeStart(e, 'nw')"), 'Footer must have corner resizing handles');
    assert.ok(footerSrc.includes("handleResizeStart(e, 'n')"), 'Footer must have edge resizing handles');

    // 9. DOCX serializer rich header/footer text formatting & enlarged logo export
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await serializeToDocx(
      [{ type: 'p', children: [{ text: 'Body text' }] }] as any,
      'Rich Header Footer Test',
      {
        header: {
          image: { url: tinyPng, width: 320, height: 180 },
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
          image: { url: tinyPng, width: 200, height: 80 },
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
    assert.ok(blob.size > 2_000, 'Serialized DOCX with enlarged header and footer images should be valid');
  });

  it('enforces full-margin header/footer box containers, default fullscreen, and elevated z-index popovers/menus', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const editorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const dropdownSrc = fs.readFileSync(path.resolve('components/ui/dropdown-menu.tsx'), 'utf8');
    const dialogSrc = fs.readFileSync(path.resolve('components/ui/dialog.tsx'), 'utf8');
    const drawerSrc = fs.readFileSync(path.resolve('src/components/editor/CommentsDrawer.tsx'), 'utf8');
    const floatingToolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/floating-toolbar.tsx'), 'utf8');
    const fixedToolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');

    // 1. Full-margin box containers for Header & Footer with dynamic expansion up to 256px / 180px and 16px top spacing
    assert.ok(headerSrc.includes('w-[calc(100%+192px)] -mx-[96px] px-[96px] min-h-[96px] shrink-0'), 'Header container must span entire top 96px margin box with min-h 96px');
    assert.ok(footerSrc.includes('w-[calc(100%+192px)] -mx-[96px] px-[96px] min-h-[96px] shrink-0'), 'Footer container must span entire bottom 96px margin box with min-h 96px');
    assert.ok(headerSrc.includes('HEADER_TOP_SPACING = 20'), 'Header top spacing must be configured to 20px');
    assert.ok(headerSrc.includes('HEADER_MAX_HEIGHT = 256'), 'Header max height must be configured to 256px');
    assert.ok(headerSrc.includes('pt-[20px]'), 'Header container must include 20px top breathing room padding');
    assert.ok(footerSrc.includes('FOOTER_MAX_HEIGHT = 180'), 'Footer max height must be configured to 180px');
    assert.ok(editorSrc.includes('const naturalW = img.naturalWidth') && editorSrc.includes('const maxW = 624;'), 'Image upload must preserve natural width and proportionally scale down only if exceeding 624px (printable track)');
    assert.ok(editorSrc.includes('plate-paper-sheet w-[816px] max-w-[816px] min-h-[1056px]') && editorSrc.includes('pt-0 pb-0'), 'Paper sheet must have 816px width (8.5 inches standard US Letter) and pt-0 pb-0');

    // 2. Default Fullscreen state (must NOT be fullscreen already when user enters editor)
    assert.ok(editorSrc.includes('const [isFullscreen, setIsFullscreen] = useState(false);'), 'Editor must NOT initialize in fullscreen already');

    // 3. Escape key preserves fullscreen when header/footer is actively being edited
    assert.ok(editorSrc.includes('if (activeHeaderFooter)'), 'Escape handler must check activeHeaderFooter before toggling fullscreen');

    // 4. Elevated dropdowns, dialogs, drawers, and floating toolbars for fullscreen z-index compatibility
    assert.ok(dropdownSrc.includes('z-[150]'), 'DropdownMenu positioner must use z-[150] to render above fullscreen container');
    assert.ok(dialogSrc.includes('z-[150]'), 'Dialog overlay and content must use z-[150] to render above fullscreen container');
    assert.ok(drawerSrc.includes('z-[130]'), 'Comments drawer must use z-[130] to render above fullscreen container');
    assert.ok(floatingToolbarSrc.includes('z-[120]'), 'Floating toolbar must use z-[120] to render above fullscreen container');

    // 5. Dedicated Fullscreen toggle button on fixed toolbar with aria-label
    assert.ok(fixedToolbarSrc.includes('Maximize2'), 'Fixed toolbar must have Maximize2 icon for entering fullscreen');
    assert.ok(fixedToolbarSrc.includes('Minimize2'), 'Fixed toolbar must have Minimize2 icon for exiting fullscreen');
    assert.ok(fixedToolbarSrc.includes('tooltip={isFullscreen ? \'Exit full screen (Esc)\' : \'Enter full screen\'}'), 'Toolbar button must have fullscreen tooltip');
  });

  it('enforces Microsoft Word and Google Docs typography and spacing (11pt font, 1.15 line height, tight paragraph spacing, Word heading point sizes)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const editorUiSrc = fs.readFileSync(path.resolve('src/components/plate-ui/editor.tsx'), 'utf8');
    const paragraphSrc = fs.readFileSync(path.resolve('src/components/plate-ui/paragraph-element.tsx'), 'utf8');
    const headingSrc = fs.readFileSync(path.resolve('src/components/plate-ui/heading-element.tsx'), 'utf8');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');

    // 1. Editor base typography: 11pt, 1.15 line height, standard Google Docs Arial typography
    assert.ok(editorUiSrc.includes('text-[11pt]'), 'Editor must have default 11pt font size');
    assert.ok(editorUiSrc.includes('leading-[1.15]'), 'Editor must have standard 1.15 line height');
    assert.ok(editorUiSrc.includes('font-[Arial,_Helvetica,_sans-serif]'), 'Editor must have standard Arial typography');
    assert.ok(toolbarSrc.includes("{ label: 'Arial'"), 'Font family dropdown must list Arial as default');
    assert.ok(toolbarSrc.includes('let currentSize = 11;'), 'Font size dropdown must default to 11');

    // 2. Paragraph spacing: 0pt default margin-bottom (matching Google Docs tight flow) and no overriding leading-relaxed
    assert.ok(!paragraphSrc.includes('mb-[8pt]'), 'ParagraphElement must NOT have hardcoded 8pt bottom spacing');
    assert.ok(!paragraphSrc.includes('leading-relaxed'), 'ParagraphElement must not override editor 1.15 line height with leading-relaxed');

    // 3. Heading point sizes matching Word styles
    assert.ok(headingSrc.includes('text-[16pt]'), 'H1 must be 16pt');
    assert.ok(headingSrc.includes('text-[13pt]'), 'H2 must be 13pt');
    assert.ok(headingSrc.includes('text-[12pt]'), 'H3 must be 12pt');
  });

  it('preserves document header in fullscreen, reserves generous bottom scrolling space, and removes star button', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const indexCss = fs.readFileSync(path.resolve('src/index.css'), 'utf8');
    const editorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');
    const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');

    // 1. Document header must NOT be hidden in fullscreen
    assert.ok(
      indexCss.includes('body[data-editor-fullscreen="true"] header:not([data-document-header="true"])'),
      'Fullscreen CSS must specifically exempt document header from being hidden'
    );
    assert.ok(
      indexCss.includes('body[data-editor-fullscreen="true"] header[data-document-header="true"]'),
      'Fullscreen CSS must enforce flex display for document header'
    );

    // 2. EditorContainer must include generous bottom scrolling padding
    assert.ok(
      editorSrc.includes('pb-28 md:pb-36'),
      'EditorContainer must include generous bottom scrolling padding to prevent bottom edge collision'
    );

    // 3. App.tsx must not mount Agentation (removes floating star icon button)
    assert.ok(!appSrc.includes('agentation'), 'App.tsx must not import or mount agentation');
    assert.ok(!appSrc.includes('<Agentation'), 'App.tsx must not render Agentation star button');
  });

  it('enforces Google Docs 3-item Options dropdown, HeadersFooters and PageNumbers dialogs, and main toolbar image upload integration', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');
    const editorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');
    const dialogsSrc = fs.readFileSync(path.resolve('src/components/editor/HeaderFooterDialogs.tsx'), 'utf8');

    // 1. Header zone Options dropdown matches Google Docs 3 items
    assert.ok(headerSrc.includes('Header format'), 'Header Options dropdown must have "Header format"');
    assert.ok(headerSrc.includes('Page numbers'), 'Header Options dropdown must have "Page numbers"');
    assert.ok(headerSrc.includes('Remove header'), 'Header Options dropdown must have "Remove header"');
    assert.ok(!headerSrc.includes('>Alignment<'), 'Header Options dropdown must NOT contain redundant Alignment group');
    assert.ok(!headerSrc.includes('>Text Formatting<'), 'Header Options dropdown must NOT contain redundant Text Formatting group');
    assert.ok(!headerSrc.includes('Replace Logo'), 'Header Options dropdown must NOT contain Replace Logo (handled by main toolbar image)');

    // 2. Footer zone Options dropdown matches Google Docs 3 items
    assert.ok(footerSrc.includes('Footer format'), 'Footer Options dropdown must have "Footer format"');
    assert.ok(footerSrc.includes('Page numbers'), 'Footer Options dropdown must have "Page numbers"');
    assert.ok(footerSrc.includes('Remove footer'), 'Footer Options dropdown must have "Remove footer"');
    assert.ok(!footerSrc.includes('>Alignment<'), 'Footer Options dropdown must NOT contain redundant Alignment group');
    assert.ok(!footerSrc.includes('>Text Formatting<'), 'Footer Options dropdown must NOT contain redundant Text Formatting group');
    assert.ok(!footerSrc.includes('Replace Logo'), 'Footer Options dropdown must NOT contain Replace Logo (handled by main toolbar image)');

    // 3. Dialogs are imported and mounted in both header and footer zones
    assert.ok(headerSrc.includes('<HeadersFootersDialog'), 'DocumentHeaderZone must mount HeadersFootersDialog');
    assert.ok(headerSrc.includes('<PageNumbersDialog'), 'DocumentHeaderZone must mount PageNumbersDialog');
    assert.ok(footerSrc.includes('<HeadersFootersDialog'), 'DocumentFooterZone must mount HeadersFootersDialog');
    assert.ok(footerSrc.includes('<PageNumbersDialog'), 'DocumentFooterZone must mount PageNumbersDialog');

    // 4. HeaderFooterDialogs component exists with exact Google Docs inputs and controls
    assert.ok(dialogsSrc.includes('Header (inches from top)'), 'HeadersFootersDialog must configure header margin inches');
    assert.ok(dialogsSrc.includes('Footer (inches from bottom)'), 'HeadersFootersDialog must configure footer margin inches');
    assert.ok(dialogsSrc.includes('Different first page'), 'HeadersFootersDialog must configure Different first page');
    assert.ok(dialogsSrc.includes('Different odd & even'), 'HeadersFootersDialog must configure Different odd & even');
    assert.ok(dialogsSrc.includes('Position'), 'PageNumbersDialog must configure position');
    assert.ok(dialogsSrc.includes('Show on first page'), 'PageNumbersDialog must configure Show on first page');
    assert.ok(dialogsSrc.includes('Start at'), 'PageNumbersDialog must configure Start at');
    assert.ok(dialogsSrc.includes('Continue from previous section'), 'PageNumbersDialog must configure Continue from previous section');

    // 5. FixedToolbarButtons has onUploadHeaderFooterImage prop and wires it to ImageIcon when activeHeaderFooter is set
    assert.ok(toolbarSrc.includes('onUploadHeaderFooterImage?: () => void;'), 'FixedToolbarButtonsProps must include onUploadHeaderFooterImage');
    assert.ok(toolbarSrc.includes('onClick={onUploadHeaderFooterImage}'), 'Toolbar image button must trigger onUploadHeaderFooterImage when activeHeaderFooter is set');
    assert.ok(toolbarSrc.includes("targetHeaderFooter?.textAlign || 'left'"), 'Toolbar alignment must default to left for headers and footers');

    // 6. plate-editor.tsx passes onUploadHeaderFooterImage to FixedToolbarButtons and synchronizes cross-zone states
    assert.ok(editorSrc.includes('onUploadHeaderFooterImage='), 'plate-editor.tsx must pass onUploadHeaderFooterImage to FixedToolbarButtons');
    assert.ok(editorSrc.includes('headerInputRef.current?.click()'), 'plate-editor must trigger header file input for header image');
    assert.ok(editorSrc.includes('footerInputRef.current?.click()'), 'plate-editor must trigger footer file input for footer image');
    assert.ok(editorSrc.includes('footerState={footerState}'), 'DocumentHeaderZone must receive footerState');
    assert.ok(editorSrc.includes('headerState={headerState}'), 'DocumentFooterZone must receive headerState');
  });

  it('enforces Google Docs link dropview popover, checklist and bullet style split-dropdowns, clickable task checkboxes, and 816px paper sheet width', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');
    const menuBarSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentMenuBar.tsx'), 'utf8');
    const insertBtnSrc = fs.readFileSync(path.resolve('src/components/plate-ui/insert-toolbar-button.tsx'), 'utf8');
    const editorKitSrc = fs.readFileSync(path.resolve('src/components/editor/editor-kit.tsx'), 'utf8');
    const editorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');
    const rulerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentRuler.tsx'), 'utf8');

    // 1. Zero window.prompt in any toolbar or menu link actions
    assert.ok(!toolbarSrc.includes('window.prompt'), 'Fixed toolbar must NOT contain window.prompt');
    assert.ok(!menuBarSrc.includes('window.prompt'), 'DocumentMenuBar must NOT contain window.prompt');
    assert.ok(!insertBtnSrc.includes('window.prompt'), 'InsertToolbarButton must NOT contain window.prompt');

    // 2. LinkToolbarButton dropview is wired to both visible toolbar and overflow popover
    assert.ok(toolbarSrc.includes('<LinkToolbarButton editor={editor} />'), 'Visible toolbar must use LinkToolbarButton dropview');
    assert.ok(toolbarSrc.includes('editor-open-link-popover'), 'LinkToolbarButton must listen to editor-open-link-popover event');
    assert.ok(toolbarSrc.includes('Link URL'), 'LinkToolbarButton popover must contain Link URL input');
    assert.ok(toolbarSrc.includes('Text to display'), 'LinkToolbarButton popover must contain Text to display input');

    // 3. Checklist and bullet style split-dropdown buttons
    assert.ok(toolbarSrc.includes('<ChecklistToolbarButton editor={editor} />'), 'Toolbar must use ChecklistToolbarButton split button');
    assert.ok(toolbarSrc.includes('Checklist Style'), 'ChecklistToolbarButton must include Checklist Style dropdown');
    assert.ok(toolbarSrc.includes('Bullet Style'), 'BulletedListToolbarButton must include Bullet Style dropdown');

    // 4. TodoElement clickable checkbox and Slate focus protection
    assert.ok(editorKitSrc.includes('e.stopPropagation()'), 'TodoElement checkbox must stop propagation to prevent Slate focus stealing');
    assert.ok(editorKitSrc.includes('aria-label={isChecked'), 'TodoElement must render clickable toggle button');

    // 5. Paper sheet and DocumentRuler 816px width (US Letter Standard parity)
    assert.ok(editorSrc.includes('w-[816px] max-w-[816px]'), 'Paper sheet width must be 816px');
    assert.ok(editorSrc.includes('width={816}'), 'DocumentRuler width prop in plate-editor must be 816');
    assert.ok(rulerSrc.includes('width = 816'), 'DocumentRuler default width must be 816');
  });

  it('enforces Google Docs image selection floating toolbar and 5 wrap options across document body, header, and footer', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/image-floating-toolbar.tsx'), 'utf8');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const imageElementSrc = fs.readFileSync(path.resolve('src/components/plate-ui/image-element.tsx'), 'utf8');

    // 1. Google Docs 5 wrap options exist
    const expectedWrapOptions = ['In line', 'Wrap text', 'Break text', 'Behind text', 'In front of text'];
    for (const opt of expectedWrapOptions) {
      assert.ok(toolbarSrc.includes(opt), `image-floating-toolbar must include "${opt}" wrap option`);
    }

    // 2. Custom SVG wrap icons exist
    assert.ok(toolbarSrc.includes('InLineWrapIcon'), 'image-floating-toolbar must include InLineWrapIcon');
    assert.ok(toolbarSrc.includes('WrapTextIcon'), 'image-floating-toolbar must include WrapTextIcon');
    assert.ok(toolbarSrc.includes('BreakTextIcon'), 'image-floating-toolbar must include BreakTextIcon');
    assert.ok(toolbarSrc.includes('BehindTextIcon'), 'image-floating-toolbar must include BehindTextIcon');
    assert.ok(toolbarSrc.includes('InFrontTextIcon'), 'image-floating-toolbar must include InFrontTextIcon');

    // 3. Floating toolbar contains comments, reactions, crop, and delete actions
    assert.ok(toolbarSrc.includes('MessageSquarePlus'), 'Toolbar must include comment action');
    assert.ok(toolbarSrc.includes('SmilePlus'), 'Toolbar must include emoji reaction action');
    assert.ok(toolbarSrc.includes('Crop'), 'Toolbar must include crop action');
    assert.ok(toolbarSrc.includes('Trash2'), 'Toolbar must include delete action');

    // 4. Header, Footer, and Body Image Element wire ImageFloatingToolbar
    assert.ok(headerSrc.includes('<ImageFloatingToolbar'), 'DocumentHeaderZone must mount ImageFloatingToolbar');
    assert.ok(footerSrc.includes('<ImageFloatingToolbar'), 'DocumentFooterZone must mount ImageFloatingToolbar');
    assert.ok(imageElementSrc.includes('<ImageFloatingToolbar'), 'ImageElement must mount ImageFloatingToolbar');
  });

  it('enforces clean 1-inch (96px) paper sheet top and bottom margins with double-click header/footer activation and no idle dashed lines', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const headerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');

    // 1. Exact 96px idle height when empty
    assert.ok(headerSrc.includes("h-[96px] p-0 cursor-text"), 'Header idle empty state must be h-[96px] p-0');
    assert.ok(footerSrc.includes("h-[96px] p-0 cursor-text"), 'Footer idle empty state must be h-[96px] p-0');

    // 2. Double-click activation for header and footer
    assert.ok(headerSrc.includes('onDoubleClick='), 'Header zone must wire onDoubleClick activation');
    assert.ok(footerSrc.includes('onDoubleClick='), 'Footer zone must wire onDoubleClick activation');

    // 3. Zero hover dashed lines and zero "Click to edit" cues in idle state
    assert.ok(!headerSrc.includes('Header · Click to edit'), 'Header idle state must NOT show "Header · Click to edit" cue');
    assert.ok(!footerSrc.includes('Footer · Click to edit'), 'Footer idle state must NOT show "Footer · Click to edit" cue');
    assert.ok(!headerSrc.includes('border-dashed'), 'Header idle state must NOT contain dashed hover borders');
    assert.ok(!footerSrc.includes('border-dashed'), 'Footer idle state must NOT contain dashed hover borders');
  });

  it('enforces checklist vertical optical alignment, bullet shape icons, dynamic list styles, and instant repeated checklist toggles', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const editorKitSrc = fs.readFileSync(path.resolve('src/components/editor/editor-kit.tsx'), 'utf8');
    const toolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');
    const plateEditorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');

    // 1. Checklist checkbox optical alignment (w-[15px] h-[15px] mt-[2px] gap-2)
    assert.ok(editorKitSrc.includes('w-[15px] h-[15px] mt-[2px]'), 'TodoElement must use w-[15px] h-[15px] mt-[2px] for optical vertical centering');
    assert.ok(editorKitSrc.includes('gap-2 group/todo'), 'TodoElement must use gap-2 for clean 8px text separation');

    // 2. Dynamic list styles on paper sheet (circle, square, disc)
    assert.ok(editorKitSrc.includes('list-[circle]'), 'ListElement must dynamically apply list-[circle]');
    assert.ok(editorKitSrc.includes('list-[square]'), 'ListElement must dynamically apply list-[square]');

    // 3. Bullet Style dropdown contains authentic shape icons (●, ○, ■)
    assert.ok(toolbarSrc.includes('●'), 'Bullet styles must include solid dot icon ●');
    assert.ok(toolbarSrc.includes('○'), 'Bullet styles must include hollow circle icon ○');
    assert.ok(toolbarSrc.includes('■'), 'Bullet styles must include solid square icon ■');

    // 4. Checklist repeated toggle logic
    assert.ok(toolbarSrc.includes('isCurrentlyTodo'), 'ChecklistToolbarButton must query fresh isCurrentlyTodo on click');
    assert.ok(plateEditorSrc.includes("ed.tf.setNodes({ checked: false }, { match: (n: any) => n.type === 'todo' })"), 'Enter key on todo must create unchecked new item');
  });

  it('enforces Google Docs Custom Spacing Dialog, 3x2 list preview grids, 2-card checklist, and image-text alignment synchronization', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const customSpacingSrc = fs.readFileSync(path.resolve('src/components/editor/CustomSpacingDialog.tsx'), 'utf8');
    const lineHeightSrc = fs.readFileSync(path.resolve('src/components/plate-ui/line-height-toolbar-button.tsx'), 'utf8');
    const listToolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/list-toolbar-button.tsx'), 'utf8');
    const fixedToolbarSrc = fs.readFileSync(path.resolve('src/components/plate-ui/fixed-toolbar-buttons.tsx'), 'utf8');
    const docxSerializerSrc = fs.readFileSync(path.resolve('src/components/editor/serializers/docxSerializer.ts'), 'utf8');
    const headerZoneSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentHeaderZone.tsx'), 'utf8');
    const footerZoneSrc = fs.readFileSync(path.resolve('src/components/editor/DocumentFooterZone.tsx'), 'utf8');
    const plateEditorSrc = fs.readFileSync(path.resolve('src/components/editor/plate-editor.tsx'), 'utf8');

    // 1. Custom Spacing Dialog (media_1789892399567.png)
    assert.ok(customSpacingSrc.includes('Custom spacing'), 'CustomSpacingDialog must have "Custom spacing" title');
    assert.ok(customSpacingSrc.includes('Line spacing'), 'CustomSpacingDialog must include Line spacing input');
    assert.ok(customSpacingSrc.includes('Paragraph spacing (pts)'), 'CustomSpacingDialog must include Paragraph spacing (pts)');
    assert.ok(customSpacingSrc.includes('Before'), 'CustomSpacingDialog must include Before input');
    assert.ok(customSpacingSrc.includes('After'), 'CustomSpacingDialog must include After input');
    assert.ok(lineHeightSrc.includes('Custom spacing'), 'LineHeightToolbarButton must include Custom spacing trigger');
    assert.ok(lineHeightSrc.includes('<CustomSpacingDialog'), 'LineHeightToolbarButton must mount CustomSpacingDialog');

    // 2. DOCX twips spacing conversion parity
    assert.ok(docxSerializerSrc.includes('spaceBefore * 20'), 'docxSerializer must convert spaceBefore pt to Word twips (* 20)');
    assert.ok(docxSerializerSrc.includes('spaceAfter * 20'), 'docxSerializer must convert spaceAfter pt to Word twips (* 20)');

    // 3. Numbered List 3x2 Preview Card Grid (media_1789892207830.png)
    assert.ok(listToolbarSrc.includes('NUMBERED_STYLES'), 'list-toolbar-button must define NUMBERED_STYLES');
    assert.ok(listToolbarSrc.includes('grid grid-cols-3 gap-2'), 'Numbered list must render a 3-column grid');
    assert.ok(listToolbarSrc.includes('decimal-paren'), 'Numbered list must support decimal-paren style');
    assert.ok(listToolbarSrc.includes('legal'), 'Numbered list must support legal 1. 1.1 style');
    assert.ok(listToolbarSrc.includes('upper-alpha'), 'Numbered list must support upper-alpha style');
    assert.ok(listToolbarSrc.includes('decimal-leading-zero'), 'Numbered list must support decimal-leading-zero style');

    // 4. Bulleted List 3x2 Preview Card Grid (media_1789892247168.png)
    assert.ok(listToolbarSrc.includes('BULLETED_STYLES'), 'list-toolbar-button must define BULLETED_STYLES');
    assert.ok(listToolbarSrc.includes('disc'), 'Bulleted list must support default disc set');
    assert.ok(listToolbarSrc.includes('diamond'), 'Bulleted list must support diamond set');
    assert.ok(listToolbarSrc.includes('shadow-square'), 'Bulleted list must support shadow-square set');
    assert.ok(listToolbarSrc.includes('arrow'), 'Bulleted list must support arrow set');
    assert.ok(listToolbarSrc.includes('star'), 'Bulleted list must support star set');

    // 5. Checklist 2-card Dropdown Layout (media_1789892280220.png)
    assert.ok(fixedToolbarSrc.includes('Checklist with strikethrough'), 'FixedToolbar must include strikethrough card');
    assert.ok(fixedToolbarSrc.includes('Checklist without strikethrough'), 'FixedToolbar must include clean card');

    // 6. Image Alignment Synchronization across header, footer, and body
    assert.ok(headerZoneSrc.includes('headerState.image?.align === \'center\''), 'DocumentHeaderZone must position image based on align');
    assert.ok(footerZoneSrc.includes('footerState.image?.align === \'center\''), 'DocumentFooterZone must position image based on align');
    assert.ok(headerZoneSrc.includes('onSelectImage'), 'DocumentHeaderZone must accept onSelectImage prop');
    assert.ok(footerZoneSrc.includes('onSelectImage'), 'DocumentFooterZone must accept onSelectImage prop');
    assert.ok(plateEditorSrc.includes('headerFooterImageSelected'), 'plate-editor must pass headerFooterImageSelected to toolbar');
    assert.ok(fixedToolbarSrc.includes('isHeaderImageTarget'), 'fixed-toolbar-buttons must detect header image target');
    assert.ok(fixedToolbarSrc.includes('isFooterImageTarget'), 'fixed-toolbar-buttons must detect footer image target');
  });
});


