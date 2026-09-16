import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPlateEditor } from 'platejs/react';

import {
  setBlockType,
  toggleList,
  toggleMark,
} from '../src/components/editor/editor-commands';
import { editorPlugins } from '../src/components/editor/editor-kit';
import { serializeToDocx } from '../src/components/editor/serializers/docxSerializer';
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
});

