/**
 * editor-kit.tsx
 * Plate.js v53 plugin bundle for the institutional document editor.
 *
 * Included:
 * - Block Elements: paragraphs, H1-H6, blockquotes, lists (bullet, numbered, lic),
 *                   todos (checklists), toggles, tables (table, tr, td, th),
 *                   media (img, video, audio, file), horizontal rule (hr), links (a), date.
 * - Leaf Marks: bold, italic, underline, strikethrough, inline code, highlight,
 *               fontSize, color, backgroundColor, subscript, superscript, kbd.
 * - Block Properties: align, lineHeight, indent.
 */
import React from 'react';
import { createTSlatePlugin } from 'platejs';

// ---------------------------------------------------------------------------
// Element type constants
// ---------------------------------------------------------------------------
export const ELEMENT_PARAGRAPH = 'p';
export const ELEMENT_H1 = 'h1';
export const ELEMENT_H2 = 'h2';
export const ELEMENT_H3 = 'h3';
export const ELEMENT_H4 = 'h4';
export const ELEMENT_H5 = 'h5';
export const ELEMENT_H6 = 'h6';
export const ELEMENT_BLOCKQUOTE = 'blockquote';
export const ELEMENT_UL = 'ul';
export const ELEMENT_OL = 'ol';
export const ELEMENT_LI = 'li';
export const ELEMENT_LIC = 'lic';
export const ELEMENT_TODO = 'todo';
export const ELEMENT_TOGGLE = 'toggle';
export const ELEMENT_TABLE = 'table';
export const ELEMENT_TR = 'tr';
export const ELEMENT_TD = 'td';
export const ELEMENT_TH = 'th';
export const ELEMENT_HR = 'hr';
export const ELEMENT_LINK = 'a';
export const ELEMENT_DATE = 'date';
export const ELEMENT_IMAGE = 'img';
export const ELEMENT_VIDEO = 'video';
export const ELEMENT_AUDIO = 'audio';
export const ELEMENT_FILE = 'file';

// Mark type constants
export const MARK_BOLD = 'bold';
export const MARK_ITALIC = 'italic';
export const MARK_UNDERLINE = 'underline';
export const MARK_STRIKETHROUGH = 'strikethrough';
export const MARK_CODE = 'code';
export const MARK_HIGHLIGHT = 'highlight';
export const MARK_FONT_SIZE = 'fontSize';
export const MARK_COLOR = 'color';
export const MARK_BG_COLOR = 'backgroundColor';
export const MARK_SUBSCRIPT = 'subscript';
export const MARK_SUPERSCRIPT = 'superscript';
export const MARK_KBD = 'kbd';

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
// Heading plugins (H1–H6)
// ---------------------------------------------------------------------------
export const HeadingPlugin = createTSlatePlugin({
  key: 'heading',
  plugins: [
    createTSlatePlugin({ key: ELEMENT_H1, node: { isElement: true, type: ELEMENT_H1 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H1' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H2, node: { isElement: true, type: ELEMENT_H2 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H2' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H3, node: { isElement: true, type: ELEMENT_H3 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H3' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H4, node: { isElement: true, type: ELEMENT_H4 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H4' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H5, node: { isElement: true, type: ELEMENT_H5 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H5' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H6, node: { isElement: true, type: ELEMENT_H6 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H6' }] } } } }),
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
// List plugins (ul, ol, li, lic, todo, toggle)
// ---------------------------------------------------------------------------
export const ListPlugin = createTSlatePlugin({
  key: 'list',
  plugins: [
    createTSlatePlugin({ key: ELEMENT_UL, node: { isElement: true, type: ELEMENT_UL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'UL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_OL, node: { isElement: true, type: ELEMENT_OL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'OL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LI, node: { isElement: true, type: ELEMENT_LI }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'LI' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LIC, node: { isElement: true, type: ELEMENT_LIC } }),
    createTSlatePlugin({
      key: ELEMENT_TODO,
      node: {
        isElement: true,
        type: ELEMENT_TODO,
        component: ({ children, element, attributes }: any) => (
          <div className="flex items-start gap-2 my-1" {...attributes}>
            <input
              type="checkbox"
              checked={!!element.checked}
              onChange={(e) => {
                element.checked = e.target.checked;
              }}
              className="mt-1 cursor-pointer accent-primary"
            />
            <div className={element.checked ? 'line-through text-zinc-400' : ''}>
              {children}
            </div>
          </div>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_TOGGLE,
      node: {
        isElement: true,
        type: ELEMENT_TOGGLE,
        component: ({ children, attributes }: any) => (
          <details className="my-1.5 cursor-pointer rounded-md border border-zinc-200 dark:border-zinc-800 p-2" {...attributes}>
            <summary className="font-medium select-none text-sm text-zinc-700 dark:text-zinc-300">
              Toggle
            </summary>
            <div className="pt-2 pl-4">{children}</div>
          </details>
        ),
      },
    }),
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
// Media plugins (Image, Video, Audio, File)
// ---------------------------------------------------------------------------
export const MediaPlugin = createTSlatePlugin({
  key: 'media',
  plugins: [
    createTSlatePlugin({
      key: ELEMENT_IMAGE,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_IMAGE,
        component: ({ element, attributes }: any) => (
          <div className="my-3 select-none" contentEditable={false} {...attributes}>
            <img src={element.url} alt="" className="max-w-full rounded-md shadow-sm mx-auto block max-h-96" />
          </div>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_VIDEO,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_VIDEO,
        component: ({ element, attributes }: any) => (
          <div className="my-3 select-none" contentEditable={false} {...attributes}>
            <video controls src={element.url} className="max-w-full rounded-md mx-auto block max-h-96" />
          </div>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_AUDIO,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_AUDIO,
        component: ({ element, attributes }: any) => (
          <div className="my-3 select-none" contentEditable={false} {...attributes}>
            <audio controls src={element.url} className="w-full" />
          </div>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_FILE,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_FILE,
        component: ({ element, attributes }: any) => (
          <div className="my-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center gap-2 select-none" contentEditable={false} {...attributes}>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">ATTACHMENT</span>
            <a href={element.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium truncate">
              {element.name || element.url}
            </a>
          </div>
        ),
      },
    }),
  ],
});

// ---------------------------------------------------------------------------
// Mark plugins: bold, italic, underline, strikethrough, code, highlight
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
// Extended Mark plugins: fontSize, color, backgroundColor, subscript, superscript, kbd
// ---------------------------------------------------------------------------
export const FontSizePlugin = createTSlatePlugin({
  key: MARK_FONT_SIZE,
  node: {
    isLeaf: true,
    type: MARK_FONT_SIZE,
    component: ({ children, leaf, attributes }: any) => (
      <span style={{ fontSize: leaf.fontSize }} {...attributes}>
        {children}
      </span>
    ),
  },
});

export const FontColorPlugin = createTSlatePlugin({
  key: MARK_COLOR,
  node: {
    isLeaf: true,
    type: MARK_COLOR,
    component: ({ children, leaf, attributes }: any) => (
      <span style={{ color: leaf.color }} {...attributes}>
        {children}
      </span>
    ),
  },
});

export const BackgroundColorPlugin = createTSlatePlugin({
  key: MARK_BG_COLOR,
  node: {
    isLeaf: true,
    type: MARK_BG_COLOR,
    component: ({ children, leaf, attributes }: any) => (
      <span style={{ backgroundColor: leaf.backgroundColor }} {...attributes}>
        {children}
      </span>
    ),
  },
});

export const SubscriptPlugin = createTSlatePlugin({
  key: MARK_SUBSCRIPT,
  node: {
    isLeaf: true,
    type: MARK_SUBSCRIPT,
    component: ({ children, attributes }: any) => (
      <sub {...attributes}>{children}</sub>
    ),
  },
});

export const SuperscriptPlugin = createTSlatePlugin({
  key: MARK_SUPERSCRIPT,
  node: {
    isLeaf: true,
    type: MARK_SUPERSCRIPT,
    component: ({ children, attributes }: any) => (
      <sup {...attributes}>{children}</sup>
    ),
  },
});

export const KbdPlugin = createTSlatePlugin({
  key: MARK_KBD,
  node: {
    isLeaf: true,
    type: MARK_KBD,
    component: ({ children, attributes }: any) => (
      <kbd className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1 py-0.5 text-xs font-mono shadow-xs" {...attributes}>
        {children}
      </kbd>
    ),
  },
});

// ---------------------------------------------------------------------------
// Block property plugins: alignment, lineHeight, indent
// ---------------------------------------------------------------------------
export const AlignPlugin = createTSlatePlugin({
  key: 'align',
  inject: {
    nodeProps: {
      nodeKey: 'align',
    },
    targetPlugins: [
      ELEMENT_PARAGRAPH,
      ELEMENT_H1,
      ELEMENT_H2,
      ELEMENT_H3,
      ELEMENT_H4,
      ELEMENT_H5,
      ELEMENT_H6,
      ELEMENT_BLOCKQUOTE,
    ],
  },
});

export const LineHeightPlugin = createTSlatePlugin({
  key: 'lineHeight',
  inject: {
    nodeProps: {
      nodeKey: 'lineHeight',
    },
    targetPlugins: [
      ELEMENT_PARAGRAPH,
      ELEMENT_H1,
      ELEMENT_H2,
      ELEMENT_H3,
      ELEMENT_H4,
      ELEMENT_H5,
      ELEMENT_H6,
      ELEMENT_BLOCKQUOTE,
      ELEMENT_LI,
    ],
  },
});

export const IndentPlugin = createTSlatePlugin({
  key: 'indent',
  inject: {
    nodeProps: {
      nodeKey: 'indent',
    },
    targetPlugins: [
      ELEMENT_PARAGRAPH,
      ELEMENT_H1,
      ELEMENT_H2,
      ELEMENT_H3,
      ELEMENT_H4,
      ELEMENT_H5,
      ELEMENT_H6,
      ELEMENT_BLOCKQUOTE,
      ELEMENT_LI,
    ],
  },
});

// ---------------------------------------------------------------------------
// Combined plugin kit — export as array for createPlateEditor({ plugins })
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
  MediaPlugin,
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  HighlightPlugin,
  FontSizePlugin,
  FontColorPlugin,
  BackgroundColorPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  KbdPlugin,
  AlignPlugin,
  LineHeightPlugin,
  IndentPlugin,
];
