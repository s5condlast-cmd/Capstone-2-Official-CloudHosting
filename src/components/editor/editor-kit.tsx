/**
 * editor-kit.tsx
 * Plate.js v53 plugin bundle for the institutional document editor.
 *
 * Included: paragraphs, H1-H4, lists, tables, blockquotes, dividers,
 *           bold, italic, underline, alignment, links, date field.
 *
 * Excluded per plan: AI plugins, code blocks, Markdown export, HTML export.
 * Speech-to-text remains exclusive to WeeklyJournal.tsx.
 */
import React from 'react';
import { createSlatePlugin, createTSlatePlugin } from 'platejs';

// ---------------------------------------------------------------------------
// Element type constants
// ---------------------------------------------------------------------------
export const ELEMENT_PARAGRAPH = 'p';
export const ELEMENT_H1 = 'h1';
export const ELEMENT_H2 = 'h2';
export const ELEMENT_H3 = 'h3';
export const ELEMENT_H4 = 'h4';
export const ELEMENT_BLOCKQUOTE = 'blockquote';
export const ELEMENT_UL = 'ul';
export const ELEMENT_OL = 'ol';
export const ELEMENT_LI = 'li';
export const ELEMENT_LIC = 'lic';
export const ELEMENT_TABLE = 'table';
export const ELEMENT_TR = 'tr';
export const ELEMENT_TD = 'td';
export const ELEMENT_TH = 'th';
export const ELEMENT_HR = 'hr';
export const ELEMENT_LINK = 'a';
export const ELEMENT_DATE = 'date';

// Mark type constants
export const MARK_BOLD = 'bold';
export const MARK_ITALIC = 'italic';
export const MARK_UNDERLINE = 'underline';
export const MARK_STRIKETHROUGH = 'strikethrough';
export const MARK_CODE = 'code';
export const MARK_HIGHLIGHT = 'highlight';

// ---------------------------------------------------------------------------
// Paragraph plugin
// ---------------------------------------------------------------------------
export const ParagraphPlugin = createTSlatePlugin({
  key: ELEMENT_PARAGRAPH,
  node: { isElement: true, type: ELEMENT_PARAGRAPH },
  parsers: {
    html: {
      deserializer: {
        rules: [{ validNodeName: ['P', 'DIV'] }],
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Heading plugins (H1–H4)
// ---------------------------------------------------------------------------
export const HeadingPlugin = createTSlatePlugin({
  key: 'heading',
  plugins: [
    createTSlatePlugin({ key: ELEMENT_H1, node: { isElement: true, type: ELEMENT_H1 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H1' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H2, node: { isElement: true, type: ELEMENT_H2 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H2' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H3, node: { isElement: true, type: ELEMENT_H3 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H3' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H4, node: { isElement: true, type: ELEMENT_H4 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H4' }] } } } }),
  ],
});

// ---------------------------------------------------------------------------
// Block quote plugin
// ---------------------------------------------------------------------------
export const BlockquotePlugin = createTSlatePlugin({
  key: ELEMENT_BLOCKQUOTE,
  node: { isElement: true, type: ELEMENT_BLOCKQUOTE },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'BLOCKQUOTE' }] } },
  },
});

// ---------------------------------------------------------------------------
// List plugins
// ---------------------------------------------------------------------------
export const ListPlugin = createTSlatePlugin({
  key: 'list',
  plugins: [
    createTSlatePlugin({ key: ELEMENT_UL, node: { isElement: true, type: ELEMENT_UL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'UL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_OL, node: { isElement: true, type: ELEMENT_OL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'OL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LI, node: { isElement: true, type: ELEMENT_LI }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'LI' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LIC, node: { isElement: true, type: ELEMENT_LIC } }),
  ],
});

// ---------------------------------------------------------------------------
// Table plugins
// ---------------------------------------------------------------------------
export const TablePlugin = createTSlatePlugin({
  key: 'table',
  plugins: [
    createTSlatePlugin({ key: ELEMENT_TABLE, node: { isElement: true, type: ELEMENT_TABLE }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TABLE' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TR, node: { isElement: true, type: ELEMENT_TR }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TR' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TD, node: { isElement: true, type: ELEMENT_TD }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TD' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TH, node: { isElement: true, type: ELEMENT_TH }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TH' }] } } } }),
  ],
});

// ---------------------------------------------------------------------------
// Horizontal rule plugin
// ---------------------------------------------------------------------------
export const HorizontalRulePlugin = createTSlatePlugin({
  key: ELEMENT_HR,
  node: { isElement: true, isVoid: true, type: ELEMENT_HR },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'HR' }] } },
  },
});

// ---------------------------------------------------------------------------
// Link plugin
// ---------------------------------------------------------------------------
export const LinkPlugin = createTSlatePlugin({
  key: ELEMENT_LINK,
  node: { isElement: true, isInline: true, type: ELEMENT_LINK },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'A' }] } },
  },
});

// ---------------------------------------------------------------------------
// Date field plugin (void inline element)
// ---------------------------------------------------------------------------
export const DatePlugin = createTSlatePlugin({
  key: ELEMENT_DATE,
  node: { isElement: true, isInline: true, isVoid: true, type: ELEMENT_DATE },
});

// ---------------------------------------------------------------------------
// Mark plugins: bold, italic, underline
// ---------------------------------------------------------------------------
export const BoldPlugin = createTSlatePlugin({
  key: MARK_BOLD,
  node: { isLeaf: true, type: MARK_BOLD },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['STRONG', 'B'] }] } },
  },
});

export const ItalicPlugin = createTSlatePlugin({
  key: MARK_ITALIC,
  node: { isLeaf: true, type: MARK_ITALIC },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['EM', 'I'] }] } },
  },
});

export const UnderlinePlugin = createTSlatePlugin({
  key: MARK_UNDERLINE,
  node: { isLeaf: true, type: MARK_UNDERLINE },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'U' }] } },
  },
});

export const StrikethroughPlugin = createTSlatePlugin({
  key: MARK_STRIKETHROUGH,
  node: { isLeaf: true, type: MARK_STRIKETHROUGH },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['S', 'DEL', 'STRIKE'] }] } },
  },
});

export const CodePlugin = createTSlatePlugin({
  key: MARK_CODE,
  node: { isLeaf: true, type: MARK_CODE },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'CODE' }] } },
  },
});

export const HighlightPlugin = createTSlatePlugin({
  key: MARK_HIGHLIGHT,
  node: { isLeaf: true, type: MARK_HIGHLIGHT },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'MARK' }] } },
  },
});

// ---------------------------------------------------------------------------
// Alignment plugin (stored as node.align property)
// ---------------------------------------------------------------------------
export const AlignPlugin = createTSlatePlugin({
  key: 'align',
  inject: {
    nodeProps: {
      nodeKey: 'align',
    },
    targetPlugins: [ELEMENT_PARAGRAPH, ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4],
  },
});

// ---------------------------------------------------------------------------
// Combined plugin kit — export as array for createEditor({ plugins })
// ---------------------------------------------------------------------------
export const editorPlugins = [
  ParagraphPlugin,
  HeadingPlugin,
  BlockquotePlugin,
  ListPlugin,
  TablePlugin,
  HorizontalRulePlugin,
  LinkPlugin,
  DatePlugin,
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  HighlightPlugin,
  AlignPlugin,
];
