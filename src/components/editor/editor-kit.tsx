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
import {
  PlateElement,
  PlateLeaf,
  createTPlatePlugin,
  useEditorRef,
  usePath,
} from 'platejs/react';
import { FileText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { BlockDraggable } from '@/src/components/plate-ui/block-draggable';

const createTSlatePlugin = createTPlatePlugin;

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
// Render components
// ---------------------------------------------------------------------------

function blockStyle(element: any): React.CSSProperties {
  const indent = Math.max(0, Number(element?.indent) || 0);

  return {
    lineHeight: element?.lineHeight || undefined,
    marginLeft: indent ? `${indent * 1.5}rem` : undefined,
    textAlign: element?.align || undefined,
  };
}

import { ParagraphElement } from '@/src/components/plate-ui/paragraph-element';
import {
  HeadingElement,
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element,
} from '@/src/components/plate-ui/heading-element';
import { BlockquoteElement } from '@/src/components/plate-ui/blockquote-element';
import { CodeLeaf } from '@/src/components/plate-ui/code-leaf';
import { HighlightLeaf } from '@/src/components/plate-ui/highlight-leaf';
import { KbdLeaf } from '@/src/components/plate-ui/kbd-leaf';
import { HrElement } from '@/src/components/plate-ui/hr-element';
import { LinkElement } from '@/src/components/plate-ui/link-element';
import { DateElement } from '@/src/components/plate-ui/date-element';
import {
  TableElement,
  TableRowElement,
  TableCellElement,
  TableCellHeaderElement,
} from '@/src/components/plate-ui/table-element';
import { ToggleElement } from '@/src/components/plate-ui/toggle-element';
import { ImageElement } from '@/src/components/plate-ui/image-element';

export {
  ParagraphElement,
  HeadingElement,
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element,
  BlockquoteElement,
  CodeLeaf,
  HighlightLeaf,
  KbdLeaf,
  HrElement,
  HrElement as HorizontalRuleElement,
  LinkElement,
  DateElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  TableCellHeaderElement,
  ToggleElement,
  ImageElement,
};

function ListElement({ element, style, className, ...props }: any) {
  const ordered = element?.type === ELEMENT_OL;
  return (
    <BlockDraggable element={element} handleTopOffset="top-1">
      <PlateElement
        as={ordered ? 'ol' : 'ul'}
        element={element}
        style={{ listStyleType: element?.listStyleType || (ordered ? 'decimal' : 'disc'), ...style }}
        className={cn('my-1 ml-6 space-y-0.5', ordered ? 'list-decimal' : 'list-disc', className)}
        {...props}
      />
    </BlockDraggable>
  );
}

function ListItemElement({ element, style, className, ...props }: any) {
  return (
    <PlateElement
      as="li"
      element={element}
      style={{ ...blockStyle(element), ...style }}
      className={cn('m-0 px-0 py-0.5', className)}
      {...props}
    />
  );
}

function ListItemContentElement({ className, ...props }: any) {
  return <PlateElement as="span" className={cn('inline', className)} {...props} />;
}

function TodoElement({ children, element, style, ...props }: any) {
  const editor = useEditorRef();
  const path = usePath();

  return (
    <BlockDraggable element={element} handleTopOffset="top-1">
      <PlateElement
        as="div"
        element={element}
        style={{ ...blockStyle(element), ...style }}
        className="my-1 flex items-start gap-2"
        {...props}
      >
        <input
          type="checkbox"
          checked={Boolean(element?.checked)}
          onChange={(event) => editor.tf.setNodes({ checked: event.target.checked }, { at: path })}
          contentEditable={false}
          className="mt-1.5 cursor-pointer accent-primary"
          aria-label="Mark task complete"
        />
        <div className={element?.checked ? 'flex-1 text-zinc-400 line-through' : 'flex-1'}>
          {children}
        </div>
      </PlateElement>
    </BlockDraggable>
  );
}

function StrongLeaf({ className, ...props }: any) {
  return <PlateLeaf as="strong" className={cn('font-bold', className)} {...props} />;
}

function ItalicLeaf({ className, ...props }: any) {
  return <PlateLeaf as="em" className={cn('italic', className)} {...props} />;
}

function UnderlineLeaf({ className, ...props }: any) {
  return <PlateLeaf as="span" className={cn('underline underline-offset-2', className)} {...props} />;
}

function StrikethroughLeaf({ className, ...props }: any) {
  return <PlateLeaf as="s" className={cn('line-through', className)} {...props} />;
}


// ---------------------------------------------------------------------------
// Paragraph plugin
// ---------------------------------------------------------------------------
export const ParagraphPlugin = createTSlatePlugin({
  key: ELEMENT_PARAGRAPH,
  node: { component: ParagraphElement, isElement: true, type: ELEMENT_PARAGRAPH },
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
    createTSlatePlugin({ key: ELEMENT_H1, node: { component: HeadingElement, isElement: true, type: ELEMENT_H1 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H1' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H2, node: { component: HeadingElement, isElement: true, type: ELEMENT_H2 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H2' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H3, node: { component: HeadingElement, isElement: true, type: ELEMENT_H3 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H3' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H4, node: { component: HeadingElement, isElement: true, type: ELEMENT_H4 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H4' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H5, node: { component: HeadingElement, isElement: true, type: ELEMENT_H5 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H5' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_H6, node: { component: HeadingElement, isElement: true, type: ELEMENT_H6 }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'H6' }] } } } }),
  ],
});

// ---------------------------------------------------------------------------
// Block quote plugin
// ---------------------------------------------------------------------------
export const BlockquotePlugin = createTSlatePlugin({
  key: ELEMENT_BLOCKQUOTE,
  node: { component: BlockquoteElement, isElement: true, type: ELEMENT_BLOCKQUOTE },
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
    createTSlatePlugin({ key: ELEMENT_UL, node: { component: ListElement, isElement: true, type: ELEMENT_UL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'UL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_OL, node: { component: ListElement, isElement: true, type: ELEMENT_OL }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'OL' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LI, node: { component: ListItemElement, isElement: true, type: ELEMENT_LI }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'LI' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_LIC, node: { component: ListItemContentElement, isElement: true, type: ELEMENT_LIC } }),
    createTSlatePlugin({
      key: ELEMENT_TODO,
      node: {
        component: TodoElement,
        isElement: true,
        type: ELEMENT_TODO,
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_TOGGLE,
      node: {
        component: ToggleElement,
        isElement: true,
        type: ELEMENT_TOGGLE,
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
    createTSlatePlugin({ key: ELEMENT_TABLE, node: { component: TableElement, isElement: true, type: ELEMENT_TABLE }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TABLE' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TR, node: { component: TableRowElement, isElement: true, type: ELEMENT_TR }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TR' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TD, node: { component: TableCellElement, isElement: true, type: ELEMENT_TD }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TD' }] } } } }),
    createTSlatePlugin({ key: ELEMENT_TH, node: { component: TableCellHeaderElement, isElement: true, type: ELEMENT_TH }, parsers: { html: { deserializer: { rules: [{ validNodeName: 'TH' }] } } } }),
  ],
});

// ---------------------------------------------------------------------------
// Horizontal rule plugin
// ---------------------------------------------------------------------------
export const HorizontalRulePlugin = createTSlatePlugin({
  key: ELEMENT_HR,
  node: { component: HrElement, isElement: true, isVoid: true, type: ELEMENT_HR },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'HR' }] } },
  },
});

// ---------------------------------------------------------------------------
// Link plugin
// ---------------------------------------------------------------------------
export const LinkPlugin = createTSlatePlugin({
  key: ELEMENT_LINK,
  node: { component: LinkElement, isElement: true, isInline: true, type: ELEMENT_LINK },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'A' }] } },
  },
});

// ---------------------------------------------------------------------------
// Date field plugin (void inline element)
// ---------------------------------------------------------------------------
export const DatePlugin = createTSlatePlugin({
  key: ELEMENT_DATE,
  node: { component: DateElement, isElement: true, isInline: true, isVoid: true, type: ELEMENT_DATE },
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
        component: ImageElement,
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_VIDEO,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_VIDEO,
        component: ({ children, element, ...props }: any) => (
          <BlockDraggable element={element} handleTopOffset="top-3">
            <PlateElement as="div" className="my-4" element={element} {...props}>
              <div contentEditable={false} className="select-none">
                <video controls src={element.url} className="mx-auto block max-h-96 max-w-full rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs" />
              </div>
              {children}
            </PlateElement>
          </BlockDraggable>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_AUDIO,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_AUDIO,
        component: ({ children, element, ...props }: any) => (
          <BlockDraggable element={element} handleTopOffset="top-2">
            <PlateElement as="div" className="my-3" element={element} {...props}>
              <div contentEditable={false} className="select-none p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
                <audio controls src={element.url} className="w-full" />
              </div>
              {children}
            </PlateElement>
          </BlockDraggable>
        ),
      },
    }),
    createTSlatePlugin({
      key: ELEMENT_FILE,
      node: {
        isElement: true,
        isVoid: true,
        type: ELEMENT_FILE,
        component: ({ children, element, ...props }: any) => (
          <BlockDraggable element={element} handleTopOffset="top-2">
            <PlateElement as="div" className="my-2.5" element={element} {...props}>
              <div className="flex select-none items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/60 shadow-2xs hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors" contentEditable={false}>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {element.name || element.url}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Attachment</p>
                </div>
                <a
                  href={element.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/20 transition-colors shrink-0"
                >
                  Download
                </a>
              </div>
              {children}
            </PlateElement>
          </BlockDraggable>
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
  node: { component: StrongLeaf, isLeaf: true, type: MARK_BOLD },
  shortcuts: { toggle: { keys: 'mod+b' } },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['STRONG', 'B'] }] } },
  },
});

export const ItalicPlugin = createTSlatePlugin({
  key: MARK_ITALIC,
  node: { component: ItalicLeaf, isLeaf: true, type: MARK_ITALIC },
  shortcuts: { toggle: { keys: 'mod+i' } },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['EM', 'I'] }] } },
  },
});

export const UnderlinePlugin = createTSlatePlugin({
  key: MARK_UNDERLINE,
  node: { component: UnderlineLeaf, isLeaf: true, type: MARK_UNDERLINE },
  shortcuts: { toggle: { keys: 'mod+u' } },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'U' }] } },
  },
});

export const StrikethroughPlugin = createTSlatePlugin({
  key: MARK_STRIKETHROUGH,
  node: { component: StrikethroughLeaf, isLeaf: true, type: MARK_STRIKETHROUGH },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: ['S', 'DEL', 'STRIKE'] }] } },
  },
});

export const CodePlugin = createTSlatePlugin({
  key: MARK_CODE,
  node: { component: CodeLeaf, isLeaf: true, type: MARK_CODE },
  shortcuts: { toggle: { keys: 'mod+e' } },
  parsers: {
    html: { deserializer: { rules: [{ validNodeName: 'CODE' }] } },
  },
});

export const HighlightPlugin = createTSlatePlugin({
  key: MARK_HIGHLIGHT,
  node: { component: HighlightLeaf, isLeaf: true, type: MARK_HIGHLIGHT },
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
    component: ({ leaf, style, ...props }: any) => (
      <PlateLeaf style={{ fontSize: leaf.fontSize, ...style }} {...props} />
    ),
  },
});

export const FontColorPlugin = createTSlatePlugin({
  key: MARK_COLOR,
  node: {
    isLeaf: true,
    type: MARK_COLOR,
    component: ({ leaf, style, ...props }: any) => (
      <PlateLeaf style={{ color: leaf.color, ...style }} {...props} />
    ),
  },
});

export const BackgroundColorPlugin = createTSlatePlugin({
  key: MARK_BG_COLOR,
  node: {
    isLeaf: true,
    type: MARK_BG_COLOR,
    component: ({ leaf, style, ...props }: any) => (
      <PlateLeaf style={{ backgroundColor: leaf.backgroundColor, ...style }} {...props} />
    ),
  },
});

export const SubscriptPlugin = createTSlatePlugin({
  key: MARK_SUBSCRIPT,
  node: {
    isLeaf: true,
    type: MARK_SUBSCRIPT,
    component: (props: any) => <PlateLeaf as="sub" {...props} />,
  },
});

export const SuperscriptPlugin = createTSlatePlugin({
  key: MARK_SUPERSCRIPT,
  node: {
    isLeaf: true,
    type: MARK_SUPERSCRIPT,
    component: (props: any) => <PlateLeaf as="sup" {...props} />,
  },
});

export const KbdPlugin = createTSlatePlugin({
  key: MARK_KBD,
  node: {
    isLeaf: true,
    type: MARK_KBD,
    component: (props: any) => (
      <PlateLeaf as="kbd" className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-xs shadow-xs dark:border-zinc-700 dark:bg-zinc-800" {...props} />
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
