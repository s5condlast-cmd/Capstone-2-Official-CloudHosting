'use client';

import * as React from 'react';

import { CopilotPlugin } from '@platejs/ai/react';
import { useElement, usePluginOption } from 'platejs/react';

export function GhostText() {
  const element = useElement();

  const isSuggested = usePluginOption(
    CopilotPlugin,
    'isSuggested',
    element.id as string
  );

  if (!isSuggested) return null;

  return <GhostTextContent />;
}

function GhostTextContent() {
  const suggestionText = usePluginOption(CopilotPlugin, 'suggestionText');

  return (
    <span
      className="pointer-events-none text-muted-foreground/70 max-sm:hidden"
      contentEditable={false}
    >
      {suggestionText && suggestionText}
    </span>
  );
}
'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  type CursorData,
  type CursorOverlayState,
  useCursorOverlay,
} from '@platejs/selection/react';
import { getTableGridAbove } from '@platejs/table';
import { RangeApi } from 'platejs';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';

export function CursorOverlay() {
  const { cursors } = useCursorOverlay();

  return (
    <>
      {cursors.map((cursor) => (
        <Cursor key={cursor.id} {...cursor} />
      ))}
    </>
  );
}

function Cursor({
  id,
  caretPosition,
  data,
  selection,
  selectionRects,
}: CursorOverlayState<CursorData>) {
  const editor = useEditorRef();
  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const { style, selectionStyle = style } = data ?? ({} as CursorData);
  const isCursor = RangeApi.isCollapsed(selection);

  if (streaming) return null;

  // Skip overlay for multi-cell table selection (table has its own selection UI)
  if (id === 'selection' && selection) {
    const cellEntries = getTableGridAbove(editor, {
      at: selection,
      format: 'cell',
    });

    if (cellEntries.length > 1) {
      return null;
    }
  }

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          key={i}
          className={cn(
            'pointer-events-none absolute z-10',
            id === 'selection' && 'bg-brand/25',
            id === 'selection' && isCursor && 'bg-primary'
          )}
          style={{
            ...selectionStyle,
            ...position,
          }}
        />
      ))}
      {caretPosition && (
        <div
          className={cn(
            'pointer-events-none absolute z-10 w-0.5',
            id === 'drag' && 'w-px bg-brand'
          )}
          style={{ ...caretPosition, ...style }}
        />
      )}
    </>
  );
}
'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';
import type { PlateContentProps, PlateViewProps } from 'platejs/react';

import { cva } from 'class-variance-authority';
import { PlateContainer, PlateContent, PlateView } from 'platejs/react';

import { cn } from '@/lib/utils';

const editorContainerVariants = cva(
  'relative w-full cursor-text select-text overflow-y-auto caret-primary selection:bg-brand/25 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        comment: cn(
          'flex flex-wrap justify-between gap-1 px-1 py-0.5 text-sm',
          'rounded-md border-[1.5px] border-transparent bg-transparent',
          'has-[[data-slate-editor]:focus]:border-brand/50 has-[[data-slate-editor]:focus]:ring-2 has-[[data-slate-editor]:focus]:ring-brand/30',
          'has-aria-disabled:border-input has-aria-disabled:bg-muted'
        ),
        default: 'h-full',
        demo: 'h-[650px]',
        select: cn(
          'group rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'has-data-readonly:w-fit has-data-readonly:cursor-default has-data-readonly:border-transparent has-data-readonly:focus-within:[box-shadow:none]'
        ),
      },
    },
  }
);

export function EditorContainer({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof editorContainerVariants>) {
  return (
    <PlateContainer
      className={cn(
        'ignore-click-outside/toolbar',
        editorContainerVariants({ variant }),
        className
      )}
      {...props}
    />
  );
}

const editorVariants = cva(
  cn(
    'group/editor',
    'relative w-full cursor-text select-text overflow-x-hidden whitespace-break-spaces break-words',
    'rounded-md ring-offset-background focus-visible:outline-none',
    '**:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2 placeholder:text-muted-foreground/80 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
    '[&_strong]:font-bold'
  ),
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-50',
      },
      focused: {
        true: 'ring-2 ring-ring ring-offset-2',
      },
      variant: {
        ai: 'w-full px-0 text-base md:text-sm',
        aiChat:
          'max-h-[min(70vh,320px)] w-full overflow-y-auto px-3 py-2 text-base md:text-sm',
        comment: cn('rounded-none border-none bg-transparent text-sm'),
        default:
          'size-full px-16 pt-4 pb-72 text-base sm:px-[max(64px,calc(50%-350px))]',
        demo: 'size-full px-16 pt-4 pb-72 text-base sm:px-[max(64px,calc(50%-350px))]',
        fullWidth: 'size-full px-16 pt-4 pb-72 text-base sm:px-24',
        none: '',
        select: 'px-3 py-2 text-base data-readonly:w-fit',
      },
    },
  }
);

export type EditorProps = PlateContentProps &
  VariantProps<typeof editorVariants>;

export const Editor = ({
  className,
  disabled,
  focused,
  variant,
  ref,
  ...props
}: EditorProps & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <PlateContent
    ref={ref}
    className={cn(
      editorVariants({
        disabled,
        focused,
        variant,
      }),
      className
    )}
    disabled={disabled}
    disableDefaultStyles
    {...props}
  />
);

Editor.displayName = 'Editor';

export function EditorView({
  className,
  variant,
  ...props
}: PlateViewProps & VariantProps<typeof editorVariants>) {
  return (
    <PlateView
      {...props}
      className={cn(editorVariants({ variant }), className)}
    />
  );
}

EditorView.displayName = 'EditorView';
import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';
import { type PlateStaticProps, PlateStatic } from 'platejs/static';

import { cn } from '@/lib/utils';

export const editorVariants = cva(
  cn(
    'group/editor',
    'relative w-full cursor-text select-text overflow-x-hidden whitespace-break-spaces break-words',
    'rounded-md ring-offset-background focus-visible:outline-none',
    'placeholder:text-muted-foreground/80 **:data-slate-placeholder:top-[auto_!important] **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
    '[&_strong]:font-bold'
  ),
  {
    defaultVariants: {
      variant: 'none',
    },
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-50',
      },
      focused: {
        true: 'ring-2 ring-ring ring-offset-2',
      },
      variant: {
        ai: 'w-full px-0 text-base md:text-sm',
        aiChat:
          'max-h-[min(70vh,320px)] w-full overflow-y-auto px-5 py-3 text-base md:text-sm',
        default:
          'size-full px-16 pt-4 pb-72 text-base sm:px-[max(64px,calc(50%-350px))]',
        demo: 'size-full px-16 pt-4 pb-72 text-base sm:px-[max(64px,calc(50%-350px))]',
        fullWidth: 'size-full px-16 pt-4 pb-72 text-base sm:px-24',
        none: '',
        select: 'px-3 py-2 text-base data-readonly:w-fit',
      },
    },
  }
);

export function EditorStatic({
  className,
  variant,
  ...props
}: PlateStaticProps & VariantProps<typeof editorVariants>) {
  return (
    <PlateStatic
      className={cn(editorVariants({ variant }), className)}
      {...props}
    />
  );
}
'use client';

import { type PlateElementProps, PlateElement } from 'platejs/react';

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="my-1 border-l-2 pl-6 italic"
      {...props}
    />
  );
}
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';

const headingVariants = cva(
  'relative mb-1 data-[nav-target=true]:rounded-md data-[nav-target=true]:bg-(--color-highlight)',
  {
    variants: {
      variant: {
        h1: 'mt-[1.6em] pb-1 font-bold font-heading text-4xl',
        h2: 'mt-[1.4em] pb-px font-heading font-semibold text-2xl tracking-tight',
        h3: 'mt-[1em] pb-px font-heading font-semibold text-xl tracking-tight',
        h4: 'mt-[0.75em] font-heading font-semibold text-lg tracking-tight',
        h5: 'mt-[0.75em] font-semibold text-lg tracking-tight',
        h6: 'mt-[0.75em] font-semibold text-base tracking-tight',
      },
    },
  }
);

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { type VariantProps, cva } from 'class-variance-authority';
import { SlateElement } from 'platejs/static';

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'mt-[1.6em] pb-1 font-bold font-heading text-4xl',
      h2: 'mt-[1.4em] pb-px font-heading font-semibold text-2xl tracking-tight',
      h3: 'mt-[1em] pb-px font-heading font-semibold text-xl tracking-tight',
      h4: 'mt-[0.75em] font-heading font-semibold text-lg tracking-tight',
      h5: 'mt-[0.75em] font-semibold text-lg tracking-tight',
      h6: 'mt-[0.75em] font-semibold text-base tracking-tight',
    },
  },
});

export function HeadingElementStatic({
  variant = 'h1',
  ...props
}: SlateElementProps & VariantProps<typeof headingVariants>) {
  const id = props.element.id as string | undefined;

  return (
    <SlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {/* Bookmark anchor for DOCX TOC internal links */}
      {!!id && <span id={id} />}
      {props.children}
    </SlateElement>
  );
}

export function H1ElementStatic(props: SlateElementProps) {
  return <HeadingElementStatic variant="h1" {...props} />;
}

export function H2ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>
) {
  return <HeadingElementStatic variant="h2" {...props} />;
}

export function H3ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>
) {
  return <HeadingElementStatic variant="h3" {...props} />;
}

export function H4ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>
) {
  return <HeadingElementStatic variant="h4" {...props} />;
}

export function H5ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>
) {
  return <HeadingElementStatic variant="h5" {...props} />;
}

export function H6ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>
) {
  return <HeadingElementStatic variant="h6" {...props} />;
}
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { cn } from '@/lib/utils';

export function HrElement(props: PlateElementProps) {
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement {...props}>
      <div className="py-6" contentEditable={false}>
        <hr
          className={cn(
            'h-0.5 rounded-sm border-none bg-muted bg-clip-content',
            selected && focused && 'ring-2 ring-ring ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="cursor-text py-6" contentEditable={false}>
        <hr
          className={cn(
            'h-0.5 rounded-sm border-none bg-muted bg-clip-content'
          )}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ParagraphElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className={cn('m-0 px-0 py-1')}>
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className={cn('m-0 px-0 py-1')}>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm"
    >
      {props.children}
    </PlateLeaf>
  );
}
import * as React from 'react';

import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf
      {...props}
      as="code"
      className="whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm"
    >
      {props.children}
    </SlateLeaf>
  );
}
'use client';

import * as React from 'react';

import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="bg-highlight/30 text-inherit">
      {props.children}
    </PlateLeaf>
  );
}
import * as React from 'react';

import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function HighlightLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="mark" className="bg-highlight/30 text-inherit">
      {props.children}
    </SlateLeaf>
  );
}
'use client';

import * as React from 'react';

import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf } from 'platejs/react';

export function KbdLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="kbd"
      className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-sm shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(248,_249,_250)_0px_1px_5px_0px_inset,_rgb(193,_200,_205)_0px_0px_0px_0.5px,_rgb(193,_200,_205)_0px_2px_1px_-1px,_rgb(193,_200,_205)_0px_1px_0px_0px] dark:shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(26,_29,_30)_0px_1px_5px_0px_inset,_rgb(76,_81,_85)_0px_0px_0px_0.5px,_rgb(76,_81,_85)_0px_2px_1px_-1px,_rgb(76,_81,_85)_0px_1px_0px_0px]"
    >
      {props.children}
    </PlateLeaf>
  );
}
import * as React from 'react';

import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function KbdLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf
      {...props}
      as="kbd"
      className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-sm shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(248,_249,_250)_0px_1px_5px_0px_inset,_rgb(193,_200,_205)_0px_0px_0px_0.5px,_rgb(193,_200,_205)_0px_2px_1px_-1px,_rgb(193,_200,_205)_0px_1px_0px_0px] dark:shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(26,_29,_30)_0px_1px_5px_0px_inset,_rgb(76,_81,_85)_0px_0px_0px_0.5px,_rgb(76,_81,_85)_0px_2px_1px_-1px,_rgb(76,_81,_85)_0px_1px_0px_0px]"
    >
      {props.children}
    </SlateLeaf>
  );
}
'use client';

import * as React from 'react';

import { useCalloutEmojiPicker } from '@platejs/callout/react';
import { useEmojiDropdownMenuState } from '@platejs/emoji/react';
import { PlateElement } from 'platejs/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { EmojiPicker, EmojiPopover } from './emoji-toolbar-button';

export function CalloutElement({
  attributes,
  children,
  className,
  ...props
}: React.ComponentProps<typeof PlateElement>) {
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
    closeOnSelect: true,
  });

  const { emojiToolbarDropdownProps, props: calloutProps } =
    useCalloutEmojiPicker({
      isOpen,
      setIsOpen,
    });

  return (
    <PlateElement
      className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)}
      style={{
        backgroundColor: props.element.backgroundColor as any,
      }}
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true,
      }}
      {...props}
    >
      <div className="flex w-full gap-2 rounded-md">
        <EmojiPopover
          {...emojiToolbarDropdownProps}
          control={
            <Button
              variant="ghost"
              className="size-6 select-none p-1 text-[18px] hover:bg-muted-foreground/15"
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
              }}
              contentEditable={false}
            >
              {(props.element.icon as any) || '💡'}
            </Button>
          }
        >
          <EmojiPicker {...emojiPickerState} {...calloutProps} />
        </EmojiPopover>
        <div className="w-full">{children}</div>
      </div>
    </PlateElement>
  );
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function CalloutElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  return (
    <SlateElement
      className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)}
      style={{
        backgroundColor: props.element.backgroundColor as any,
      }}
      {...props}
    >
      <div className="flex w-full gap-2 rounded-md">
        <div
          className="size-6 select-none text-[18px]"
          style={{
            fontFamily:
              '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
          }}
        >
          <span data-plate-prevent-deserialization>
            {(props.element.icon as any) || '💡'}
          </span>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </SlateElement>
  );
}

/**
 * DOCX-compatible callout component using table layout for side-by-side icon and content.
 */
export function CalloutElementDocx({ children, ...props }: SlateElementProps) {
  const backgroundColor =
    (props.element.backgroundColor as string) || '#f4f4f5';
  const icon = (props.element.icon as string) || '💡';

  return (
    <SlateElement {...props}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: 'none',
          backgroundColor,
          borderRadius: '4px',
          marginTop: '4pt',
          marginBottom: '4pt',
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '30px',
                verticalAlign: 'top',
                padding: '8px 4px 8px 8px',
                border: 'none',
                fontSize: '18px',
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
              }}
            >
              <span data-plate-prevent-deserialization>{icon}</span>
            </td>
            <td
              style={{
                verticalAlign: 'top',
                padding: '8px 8px 8px 4px',
                border: 'none',
              }}
            >
              {children}
            </td>
          </tr>
        </tbody>
      </table>
    </SlateElement>
  );
}
'use client';
/* eslint-disable react-hooks/refs */

import * as React from 'react';

import type { Emoji } from '@emoji-mart/data';

import {
  type EmojiCategoryList,
  type EmojiIconList,
  type GridRow,
  EmojiSettings,
} from '@platejs/emoji';
import {
  type EmojiDropdownMenuOptions,
  type UseEmojiPickerType,
  useEmojiDropdownMenuState,
} from '@platejs/emoji/react';
import * as Popover from '@radix-ui/react-popover';
import {
  AppleIcon,
  ClockIcon,
  CompassIcon,
  FlagIcon,
  LeafIcon,
  LightbulbIcon,
  MusicIcon,
  SearchIcon,
  SmileIcon,
  StarIcon,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ToolbarButton } from '@/components/ui/toolbar';

export function EmojiToolbarButton({
  options,
  ...props
}: {
  options?: EmojiDropdownMenuOptions;
} & React.ComponentPropsWithoutRef<typeof ToolbarButton>) {
  const { emojiPickerState, isOpen, setIsOpen } =
    useEmojiDropdownMenuState(options);

  return (
    <EmojiPopover
      control={
        <ToolbarButton pressed={isOpen} tooltip="Emoji" isDropdown {...props}>
          <SmileIcon />
        </ToolbarButton>
      }
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <EmojiPicker
        {...emojiPickerState}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        settings={options?.settings}
      />
    </EmojiPopover>
  );
}

export function EmojiPopover({
  children,
  control,
  isOpen,
  setIsOpen,
}: {
  children: React.ReactNode;
  control: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>{control}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="z-100">{children}</Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function EmojiPicker({
  clearSearch,
  emoji,
  emojiLibrary,
  focusedCategory,
  hasFound,
  i18n,
  icons = {
    categories: emojiCategoryIcons,
    search: emojiSearchIcons,
  },
  isSearching,
  refs,
  searchResult,
  searchValue,
  setSearch,
  settings = EmojiSettings,
  visibleCategories,
  handleCategoryClick,
  onMouseOver,
  onSelectEmoji,
}: Omit<UseEmojiPickerType, 'icons'> & {
  icons?: EmojiIconList<React.ReactElement>;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-popover text-popover-foreground',
        'h-[23rem] w-80 border shadow-md'
      )}
    >
      <EmojiPickerNavigation
        onClick={handleCategoryClick}
        emojiLibrary={emojiLibrary}
        focusedCategory={focusedCategory}
        i18n={i18n}
        icons={icons}
      />
      <EmojiPickerSearchBar
        i18n={i18n}
        searchValue={searchValue}
        setSearch={setSearch}
      >
        <EmojiPickerSearchAndClear
          clearSearch={clearSearch}
          i18n={i18n}
          searchValue={searchValue}
        />
      </EmojiPickerSearchBar>
      <EmojiPickerContent
        onMouseOver={onMouseOver}
        onSelectEmoji={onSelectEmoji}
        emojiLibrary={emojiLibrary}
        i18n={i18n}
        isSearching={isSearching}
        refs={refs}
        searchResult={searchResult}
        settings={settings}
        visibleCategories={visibleCategories}
      />
      <EmojiPickerPreview
        emoji={emoji}
        hasFound={hasFound}
        i18n={i18n}
        isSearching={isSearching}
      />
    </div>
  );
}

const EmojiButton = React.memo(function EmojiButton({
  emoji,
  index,
  onMouseOver,
  onSelect,
}: {
  emoji: Emoji;
  index: number;
  onMouseOver: (emoji?: Emoji) => void;
  onSelect: (emoji: Emoji) => void;
}) {
  return (
    <button
      className="group relative flex size-9 cursor-pointer items-center justify-center border-none bg-transparent text-2xl leading-none"
      onClick={() => onSelect(emoji)}
      onMouseEnter={() => onMouseOver(emoji)}
      onMouseLeave={() => onMouseOver()}
      aria-label={emoji.skins[0].native}
      data-index={index}
      tabIndex={-1}
      type="button"
    >
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span
        className="relative"
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
        }}
        data-emoji-set="native"
      >
        {emoji.skins[0].native}
      </span>
    </button>
  );
});

const RowOfButtons = React.memo(function RowOfButtons({
  emojiLibrary,
  row,
  onMouseOver,
  onSelectEmoji,
}: {
  row: GridRow;
} & Pick<
  UseEmojiPickerType,
  'emojiLibrary' | 'onMouseOver' | 'onSelectEmoji'
>) {
  return (
    <div key={row.id} className="flex" data-index={row.id}>
      {row.elements.map((emojiId, index) => (
        <EmojiButton
          key={emojiId}
          onMouseOver={onMouseOver}
          onSelect={onSelectEmoji}
          emoji={emojiLibrary.getEmoji(emojiId)}
          index={index}
        />
      ))}
    </div>
  );
});

function EmojiPickerContent({
  emojiLibrary,
  i18n,
  isSearching = false,
  refs,
  searchResult,
  settings = EmojiSettings,
  visibleCategories,
  onMouseOver,
  onSelectEmoji,
}: Pick<
  UseEmojiPickerType,
  | 'emojiLibrary'
  | 'i18n'
  | 'isSearching'
  | 'onMouseOver'
  | 'onSelectEmoji'
  | 'refs'
  | 'searchResult'
  | 'settings'
  | 'visibleCategories'
>) {
  const getRowWidth = settings.perLine.value * settings.buttonSize.value;

  const isCategoryVisible = React.useCallback(
    (categoryId: any) =>
      visibleCategories.has(categoryId)
        ? visibleCategories.get(categoryId)
        : false,
    [visibleCategories]
  );

  const EmojiList = React.useCallback(
    () =>
      emojiLibrary
        .getGrid()
        .sections()
        .map(({ id: categoryId }) => {
          const section = emojiLibrary.getGrid().section(categoryId);
          const { buttonSize } = settings;

          return (
            <div
              key={categoryId}
              ref={section.root}
              style={{ width: getRowWidth }}
              data-id={categoryId}
            >
              <div className="-top-px sticky z-1 bg-popover/90 p-1 py-2 font-semibold text-sm backdrop-blur-xs">
                {i18n.categories[categoryId]}
              </div>
              <div
                className="relative flex flex-wrap"
                style={{ height: section.getRows().length * buttonSize.value }}
              >
                {isCategoryVisible(categoryId) &&
                  section
                    .getRows()
                    .map((row: GridRow) => (
                      <RowOfButtons
                        key={row.id}
                        onMouseOver={onMouseOver}
                        onSelectEmoji={onSelectEmoji}
                        emojiLibrary={emojiLibrary}
                        row={row}
                      />
                    ))}
              </div>
            </div>
          );
        }),
    [
      emojiLibrary,
      getRowWidth,
      i18n.categories,
      isCategoryVisible,
      onSelectEmoji,
      onMouseOver,
      settings,
    ]
  );

  const SearchList = React.useCallback(
    () => (
      <div style={{ width: getRowWidth }} data-id="search">
        <div className="-top-px sticky z-1 bg-popover/90 p-1 py-2 font-semibold text-card-foreground text-sm backdrop-blur-xs">
          {i18n.searchResult}
        </div>
        <div className="relative flex flex-wrap">
          {searchResult.map((emoji: Emoji, index: number) => (
            <EmojiButton
              key={emoji.id}
              onMouseOver={onMouseOver}
              onSelect={onSelectEmoji}
              emoji={emojiLibrary.getEmoji(emoji.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    ),
    [
      emojiLibrary,
      getRowWidth,
      i18n.searchResult,
      searchResult,
      onSelectEmoji,
      onMouseOver,
    ]
  );

  return (
    <div
      ref={refs.current.contentRoot}
      className={cn(
        'h-full min-h-[50%] overflow-y-auto overflow-x-hidden px-2',
        '[&::-webkit-scrollbar]:w-4',
        '[&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:size-0',
        '[&::-webkit-scrollbar-thumb]:min-h-11 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/25',
        '[&::-webkit-scrollbar-thumb]:border-4 [&::-webkit-scrollbar-thumb]:border-popover [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:bg-clip-padding'
      )}
      data-id="scroll"
    >
      <div ref={refs.current.content} className="h-full">
        {isSearching ? SearchList() : EmojiList()}
      </div>
    </div>
  );
}

function EmojiPickerSearchBar({
  children,
  i18n,
  searchValue,
  setSearch,
}: {
  children: React.ReactNode;
} & Pick<UseEmojiPickerType, 'i18n' | 'searchValue' | 'setSearch'>) {
  return (
    <div className="flex items-center px-2">
      <div className="relative flex grow items-center">
        <input
          className="block w-full appearance-none rounded-full border-0 bg-muted px-10 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          value={searchValue}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={i18n.search}
          aria-label="Search"
          autoComplete="off"
          type="text"
          autoFocus
        />
        {children}
      </div>
    </div>
  );
}

function EmojiPickerSearchAndClear({
  clearSearch,
  i18n,
  searchValue,
}: Pick<UseEmojiPickerType, 'clearSearch' | 'i18n' | 'searchValue'>) {
  return (
    <div className="flex items-center text-foreground">
      <div
        className={cn(
          '-translate-y-1/2 absolute top-1/2 left-2.5 z-10 flex size-5 items-center justify-center text-foreground'
        )}
      >
        {emojiSearchIcons.loupe}
      </div>
      {searchValue && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            '-translate-y-1/2 absolute top-1/2 right-0.5 flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-popover-foreground hover:bg-transparent'
          )}
          onClick={clearSearch}
          title={i18n.clear}
          aria-label="Clear"
          type="button"
        >
          {emojiSearchIcons.delete}
        </Button>
      )}
    </div>
  );
}

function EmojiPreview({ emoji }: Pick<UseEmojiPickerType, 'emoji'>) {
  return (
    <div className="flex h-14 max-h-14 min-h-14 items-center border-muted border-t p-2">
      <div className="flex items-center justify-center text-2xl">
        {emoji?.skins[0].native}
      </div>
      <div className="overflow-hidden pl-2">
        <div className="truncate font-semibold text-sm">{emoji?.name}</div>
        <div className="truncate text-sm">{`:${emoji?.id}:`}</div>
      </div>
    </div>
  );
}

function NoEmoji({ i18n }: Pick<UseEmojiPickerType, 'i18n'>) {
  return (
    <div className="flex h-14 max-h-14 min-h-14 items-center border-muted border-t p-2">
      <div className="flex items-center justify-center text-2xl">😢</div>
      <div className="overflow-hidden pl-2">
        <div className="truncate font-bold text-sm">
          {i18n.searchNoResultsTitle}
        </div>
        <div className="truncate text-sm">{i18n.searchNoResultsSubtitle}</div>
      </div>
    </div>
  );
}

function PickAnEmoji({ i18n }: Pick<UseEmojiPickerType, 'i18n'>) {
  return (
    <div className="flex h-14 max-h-14 min-h-14 items-center border-muted border-t p-2">
      <div className="flex items-center justify-center text-2xl">☝️</div>
      <div className="overflow-hidden pl-2">
        <div className="truncate font-semibold text-sm">{i18n.pick}</div>
      </div>
    </div>
  );
}

function EmojiPickerPreview({
  emoji,
  hasFound = true,
  i18n,
  isSearching = false,
  ...props
}: Pick<UseEmojiPickerType, 'emoji' | 'hasFound' | 'i18n' | 'isSearching'>) {
  const showPickEmoji = !emoji && (!isSearching || hasFound);
  const showNoEmoji = isSearching && !hasFound;
  const showPreview = emoji && !showNoEmoji && !showNoEmoji;

  return (
    <>
      {showPreview && <EmojiPreview emoji={emoji} {...props} />}
      {showPickEmoji && <PickAnEmoji i18n={i18n} {...props} />}
      {showNoEmoji && <NoEmoji i18n={i18n} {...props} />}
    </>
  );
}

function EmojiPickerNavigation({
  emojiLibrary,
  focusedCategory,
  i18n,
  icons,
  onClick,
}: {
  onClick: (id: EmojiCategoryList) => void;
} & Pick<
  UseEmojiPickerType,
  'emojiLibrary' | 'focusedCategory' | 'i18n' | 'icons'
>) {
  return (
    <TooltipProvider delayDuration={500}>
      <nav
        id="emoji-nav"
        className="mb-2.5 border-0 border-b border-b-border border-solid p-1.5"
      >
        <div className="relative flex items-center justify-evenly">
          {emojiLibrary
            .getGrid()
            .sections()
            .map(({ id }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-fit rounded-full fill-current p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground',
                      id === focusedCategory &&
                        'pointer-events-none bg-accent fill-current text-accent-foreground'
                    )}
                    onClick={() => {
                      onClick(id);
                    }}
                    aria-label={i18n.categories[id]}
                    type="button"
                  >
                    <span className="inline-flex size-5 items-center justify-center">
                      {icons.categories[id].outline}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {i18n.categories[id]}
                </TooltipContent>
              </Tooltip>
            ))}
        </div>
      </nav>
    </TooltipProvider>
  );
}

const emojiCategoryIcons: Record<
  EmojiCategoryList,
  {
    outline: React.ReactElement;
    solid: React.ReactElement; // Needed to add another solid variant - outline will be used for now
  }
> = {
  activity: {
    outline: (
      <svg
        className="size-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1" />
        <path d="m5 4.9 14 14.2" />
        <path d="M21.9 10.6a10.1 10.1 0 0 0-11.3 11.3" />
      </svg>
    ),
    solid: (
      <svg
        className="size-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1" />
        <path d="m5 4.9 14 14.2" />
        <path d="M21.9 10.6a10.1 10.1 0 0 0-11.3 11.3" />
      </svg>
    ),
  },

  custom: {
    outline: <StarIcon className="size-full" />,
    solid: <StarIcon className="size-full" />,
  },

  flags: {
    outline: <FlagIcon className="size-full" />,
    solid: <FlagIcon className="size-full" />,
  },

  foods: {
    outline: <AppleIcon className="size-full" />,
    solid: <AppleIcon className="size-full" />,
  },

  frequent: {
    outline: <ClockIcon className="size-full" />,
    solid: <ClockIcon className="size-full" />,
  },

  nature: {
    outline: <LeafIcon className="size-full" />,
    solid: <LeafIcon className="size-full" />,
  },

  objects: {
    outline: <LightbulbIcon className="size-full" />,
    solid: <LightbulbIcon className="size-full" />,
  },

  people: {
    outline: <SmileIcon className="size-full" />,
    solid: <SmileIcon className="size-full" />,
  },

  places: {
    outline: <CompassIcon className="size-full" />,
    solid: <CompassIcon className="size-full" />,
  },

  symbols: {
    outline: <MusicIcon className="size-full" />,
    solid: <MusicIcon className="size-full" />,
  },
};

const emojiSearchIcons = {
  delete: <XIcon className="size-4 text-current" />,
  loupe: <SearchIcon className="size-4 text-current" />,
};
'use client';

import * as React from 'react';

import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Toolbar({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Root>) {
  return (
    <ToolbarPrimitive.Root
      className={cn('relative flex select-none items-center', className)}
      {...props}
    />
  );
}

export function ToolbarToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToolbarToggleGroup>) {
  return (
    <ToolbarPrimitive.ToolbarToggleGroup
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

export function ToolbarLink({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Link>) {
  return (
    <ToolbarPrimitive.Link
      className={cn('font-medium underline underline-offset-4', className)}
      {...props}
    />
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      className={cn('mx-2 my-1 w-px shrink-0 bg-border', className)}
      {...props}
    />
  );
}

// From toggleVariants
const toolbarButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent aria-checked:text-accent-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 min-w-9 px-2',
        lg: 'h-10 min-w-10 px-2.5',
        sm: 'h-8 min-w-8 px-1.5',
      },
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
    },
  }
);

const dropdownArrowVariants = cva(
  cn(
    'inline-flex items-center justify-center rounded-r-md font-medium text-foreground text-sm transition-colors disabled:pointer-events-none disabled:opacity-50'
  ),
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 w-6',
        lg: 'h-10 w-8',
        sm: 'h-8 w-4',
      },
      variant: {
        default:
          'bg-transparent hover:bg-muted hover:text-muted-foreground aria-checked:bg-accent aria-checked:text-accent-foreground',
        outline:
          'border border-input border-l-0 bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
    },
  }
);

type ToolbarButtonProps = {
  isDropdown?: boolean;
  pressed?: boolean;
} & Omit<
  React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
  'asChild' | 'value'
> &
  VariantProps<typeof toolbarButtonVariants>;

export const ToolbarButton = withTooltip(function ToolbarButtonContent({
  children,
  className,
  isDropdown,
  pressed,
  size = 'sm',
  variant,
  ...props
}: ToolbarButtonProps) {
  return typeof pressed === 'boolean' ? (
    <ToolbarToggleGroup disabled={props.disabled} value="single" type="single">
      <ToolbarToggleItem
        className={cn(
          toolbarButtonVariants({
            size,
            variant,
          }),
          isDropdown && 'justify-between gap-1 pr-1',
          className
        )}
        value={pressed ? 'single' : ''}
        {...props}
      >
        {isDropdown ? (
          <>
            <div className="flex flex-1 items-center gap-2 whitespace-nowrap">
              {children}
            </div>
            <div>
              <ChevronDown
                className="size-3.5 text-muted-foreground"
                data-icon
              />
            </div>
          </>
        ) : (
          children
        )}
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
  ) : (
    <ToolbarPrimitive.Button
      className={cn(
        toolbarButtonVariants({
          size,
          variant,
        }),
        isDropdown && 'pr-1',
        className
      )}
      {...props}
    >
      {children}
    </ToolbarPrimitive.Button>
  );
});

export function ToolbarSplitButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToolbarButton>) {
  return (
    <ToolbarButton
      className={cn('group flex gap-0 px-0 hover:bg-transparent', className)}
      {...props}
    />
  );
}

type ToolbarSplitButtonPrimaryProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
  'value'
> &
  VariantProps<typeof toolbarButtonVariants>;

export function ToolbarSplitButtonPrimary({
  children,
  className,
  size = 'sm',
  variant,
  ...props
}: ToolbarSplitButtonPrimaryProps) {
  return (
    <span
      className={cn(
        toolbarButtonVariants({
          size,
          variant,
        }),
        'rounded-r-none',
        'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function ToolbarSplitButtonSecondary({
  className,
  size,
  variant,
  ...props
}: React.ComponentPropsWithoutRef<'span'> &
  VariantProps<typeof dropdownArrowVariants>) {
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
    },
    []
  );

  return (
    <span
      className={cn(
        dropdownArrowVariants({
          size,
          variant,
        }),
        'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
        className
      )}
      onClick={handleClick}
      role="button"
      {...props}
    >
      <ChevronDown className="size-3.5 text-muted-foreground" data-icon />
    </span>
  );
}

export function ToolbarToggleItem({
  className,
  size = 'sm',
  variant,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToggleItem> &
  VariantProps<typeof toolbarButtonVariants>) {
  return (
    <ToolbarPrimitive.ToggleItem
      className={cn(toolbarButtonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function ToolbarGroup({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/toolbar-group',
        'relative hidden has-[button]:flex',
        className
      )}
    >
      <div className="flex items-center">{children}</div>

      <div className="group-last/toolbar-group:hidden! mx-1.5 py-0.5">
        <Separator orientation="vertical" />
      </div>
    </div>
  );
}

type TooltipProps<T extends React.ElementType> = {
  tooltip?: React.ReactNode;
  tooltipContentProps?: Omit<
    React.ComponentPropsWithoutRef<typeof TooltipContent>,
    'children'
  >;
  tooltipProps?: Omit<
    React.ComponentPropsWithoutRef<typeof Tooltip>,
    'children'
  >;
  tooltipTriggerProps?: React.ComponentPropsWithoutRef<typeof TooltipTrigger>;
} & React.ComponentProps<T>;

function withTooltip<T extends React.ElementType>(Component: T) {
  return function ExtendComponent({
    tooltip,
    tooltipContentProps,
    tooltipProps,
    tooltipTriggerProps,
    ...props
  }: TooltipProps<T>) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const component = <Component {...(props as React.ComponentProps<T>)} />;

    if (tooltip && mounted) {
      return (
        <Tooltip {...tooltipProps}>
          <TooltipTrigger asChild {...tooltipTriggerProps}>
            {component}
          </TooltipTrigger>

          <TooltipContent {...tooltipContentProps}>{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return component;
  };
}

function TooltipContent({
  children,
  className,
  // CHANGE
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'z-50 w-fit origin-(--radix-tooltip-content-transform-origin) text-balance rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs',
          className
        )}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      >
        {children}
        {/* CHANGE */}
        {/* <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary fill-primary" /> */}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function ToolbarMenuGroup({
  children,
  className,
  label,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioGroup> & { label?: string }) {
  return (
    <>
      <DropdownMenuSeparator
        className={cn(
          'hidden',
          'mb-0 shrink-0 peer-has-[[role=menuitem]]/menu-group:block peer-has-[[role=menuitemradio]]/menu-group:block peer-has-[[role=option]]/menu-group:block'
        )}
      />

      <DropdownMenuRadioGroup
        {...props}
        className={cn(
          'hidden',
          'peer/menu-group group/menu-group my-1.5 has-[[role=menuitem]]:block has-[[role=menuitemradio]]:block has-[[role=option]]:block',
          className
        )}
      >
        {!!label && (
          <DropdownMenuLabel className="select-none font-semibold text-muted-foreground text-xs">
            {label}
          </DropdownMenuLabel>
        )}
        {children}
      </DropdownMenuRadioGroup>
    </>
  );
}
'use client';

import * as React from 'react';

import { formatCodeBlock, isLangSupported } from '@platejs/code-block';
import { BracesIcon, Check, CheckIcon, CopyIcon } from 'lucide-react';
import { type TCodeBlockElement, type TCodeSyntaxLeaf, NodeApi } from 'platejs';
import {
  type PlateElementProps,
  type PlateLeafProps,
  PlateElement,
  PlateLeaf,
} from 'platejs/react';
import { useEditorRef, useElement, useReadOnly } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type CodeBlockElementProps = PlateElementProps<TCodeBlockElement> & {
  showLanguageLabel?: boolean;
};

const codeBlockLanguages: { label: string; value: string }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'ABAP', value: 'abap' },
  { label: 'Agda', value: 'agda' },
  { label: 'Arduino', value: 'arduino' },
  { label: 'ASCII Art', value: 'ascii' },
  { label: 'Assembly', value: 'x86asm' },
  { label: 'Bash', value: 'bash' },
  { label: 'BASIC', value: 'basic' },
  { label: 'BNF', value: 'bnf' },
  { label: 'C', value: 'c' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'Clojure', value: 'clojure' },
  { label: 'CoffeeScript', value: 'coffeescript' },
  { label: 'Coq', value: 'coq' },
  { label: 'CSS', value: 'css' },
  { label: 'Dart', value: 'dart' },
  { label: 'Dhall', value: 'dhall' },
  { label: 'Diff', value: 'diff' },
  { label: 'Docker', value: 'dockerfile' },
  { label: 'EBNF', value: 'ebnf' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Elm', value: 'elm' },
  { label: 'Erlang', value: 'erlang' },
  { label: 'F#', value: 'fsharp' },
  { label: 'Flow', value: 'flow' },
  { label: 'Fortran', value: 'fortran' },
  { label: 'Gherkin', value: 'gherkin' },
  { label: 'GLSL', value: 'glsl' },
  { label: 'Go', value: 'go' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Haskell', value: 'haskell' },
  { label: 'HCL', value: 'hcl' },
  { label: 'HTML', value: 'html' },
  { label: 'Idris', value: 'idris' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'Julia', value: 'julia' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Less', value: 'less' },
  { label: 'Lisp', value: 'lisp' },
  { label: 'LiveScript', value: 'livescript' },
  { label: 'LLVM IR', value: 'llvm' },
  { label: 'Lua', value: 'lua' },
  { label: 'Makefile', value: 'makefile' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Markup', value: 'markup' },
  { label: 'MATLAB', value: 'matlab' },
  { label: 'Mathematica', value: 'mathematica' },
  { label: 'Mermaid', value: 'mermaid' },
  { label: 'Nix', value: 'nix' },
  { label: 'Notion Formula', value: 'notion' },
  { label: 'Objective-C', value: 'objectivec' },
  { label: 'OCaml', value: 'ocaml' },
  { label: 'Pascal', value: 'pascal' },
  { label: 'Perl', value: 'perl' },
  { label: 'PHP', value: 'php' },
  { label: 'PowerShell', value: 'powershell' },
  { label: 'Prolog', value: 'prolog' },
  { label: 'Protocol Buffers', value: 'protobuf' },
  { label: 'PureScript', value: 'purescript' },
  { label: 'Python', value: 'python' },
  { label: 'R', value: 'r' },
  { label: 'Racket', value: 'racket' },
  { label: 'Reason', value: 'reasonml' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
  { label: 'Sass', value: 'scss' },
  { label: 'Scala', value: 'scala' },
  { label: 'Scheme', value: 'scheme' },
  { label: 'SCSS', value: 'scss' },
  { label: 'Shell', value: 'shell' },
  { label: 'Smalltalk', value: 'smalltalk' },
  { label: 'Solidity', value: 'solidity' },
  { label: 'SQL', value: 'sql' },
  { label: 'Swift', value: 'swift' },
  { label: 'TOML', value: 'toml' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'VB.Net', value: 'vbnet' },
  { label: 'Verilog', value: 'verilog' },
  { label: 'VHDL', value: 'vhdl' },
  { label: 'Visual Basic', value: 'vbnet' },
  { label: 'WebAssembly', value: 'wasm' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
];

function getCodeBlockLanguageLabel(lang?: string | null) {
  const value = lang?.trim();

  if (!value) return null;

  return (
    codeBlockLanguages.find((language) => language.value === value)?.label ??
    value
  );
}

export function CodeBlockElement({
  showLanguageLabel = true,
  ...props
}: CodeBlockElementProps) {
  const { editor, element } = props;

  return (
    <PlateElement
      className="py-1 **:[.hljs-addition]:bg-[#f0fff4] **:[.hljs-addition]:text-[#22863a] dark:**:[.hljs-addition]:bg-[#3c5743] dark:**:[.hljs-addition]:text-[#ceead5] **:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#005cc5] dark:**:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#6596cf] **:[.hljs-built\\\\_in,.hljs-symbol]:text-[#e36209] dark:**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#c3854e] **:[.hljs-bullet]:text-[#735c0f] **:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] dark:**:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] **:[.hljs-deletion]:bg-[#ffeef0] **:[.hljs-deletion]:text-[#b31d28] dark:**:[.hljs-deletion]:bg-[#473235] dark:**:[.hljs-deletion]:text-[#e7c7cb] **:[.hljs-emphasis]:italic **:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#d73a49] dark:**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#ee6960] **:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#22863a] dark:**:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#36a84f] **:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#032f62] dark:**:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#3593ff] **:[.hljs-section]:font-bold **:[.hljs-section]:text-[#005cc5] dark:**:[.hljs-section]:text-[#61a5f2] **:[.hljs-strong]:font-bold **:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#6f42c1] dark:**:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#a77bfa]"
      {...props}
    >
      <div className="relative rounded-md bg-muted/50">
        <pre className="overflow-x-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid">
          <code>{props.children}</code>
        </pre>

        <div
          className="absolute top-1 right-1 z-10 flex select-none gap-0.5"
          contentEditable={false}
        >
          {isLangSupported(element.lang) && (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-xs"
              onClick={() => formatCodeBlock(editor, { element })}
              title="Format code"
            >
              <BracesIcon className="!size-3.5 text-muted-foreground" />
            </Button>
          )}

          <CodeBlockCombobox showLanguageLabel={showLanguageLabel} />

          <CopyButton
            size="icon"
            variant="ghost"
            className="size-6 gap-1 text-muted-foreground text-xs"
            value={() => NodeApi.string(element)}
          />
        </div>
      </div>
    </PlateElement>
  );
}

function CodeBlockCombobox({
  showLanguageLabel,
}: {
  showLanguageLabel: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const element = useElement<TCodeBlockElement>();
  const value = element.lang || 'plaintext';
  const [searchValue, setSearchValue] = React.useState('');

  const items = React.useMemo(
    () =>
      codeBlockLanguages.filter(
        (language) =>
          !searchValue ||
          language.label.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [searchValue]
  );

  if (readOnly) {
    if (!showLanguageLabel) return null;

    return <CodeBlockLanguageLabel lang={element.lang} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 select-none justify-between gap-1 px-2 text-muted-foreground text-xs"
          aria-expanded={open}
          role="combobox"
        >
          {getCodeBlockLanguageLabel(value) ?? 'Plain Text'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0"
        onCloseAutoFocus={() => setSearchValue('')}
      >
        <Command shouldFilter={false}>
          <CommandInput
            className="h-9"
            value={searchValue}
            onValueChange={(value) => setSearchValue(value)}
            placeholder="Search language..."
          />
          <CommandEmpty>No language found.</CommandEmpty>

          <CommandList className="h-[344px] overflow-y-auto">
            <CommandGroup>
              {items.map((language) => (
                <CommandItem
                  key={language.label}
                  className="cursor-pointer"
                  value={language.value}
                  onSelect={(value) => {
                    editor.tf.setNodes<TCodeBlockElement>(
                      { lang: value },
                      { at: element }
                    );
                    setSearchValue(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      value === language.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {language.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CodeBlockLanguageLabel({ lang }: { lang?: string | null }) {
  const label = getCodeBlockLanguageLabel(lang);

  if (!label) return null;

  return (
    <span className="flex h-6 select-none items-center px-2 text-muted-foreground text-xs">
      {label}
    </span>
  );
}

function CopyButton({
  value,
  ...props
}: { value: (() => string) | string } & Omit<
  React.ComponentProps<typeof Button>,
  'value'
>) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(
          typeof value === 'function' ? value() : value
        );
        setHasCopied(true);
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? (
        <CheckIcon className="!size-3" />
      ) : (
        <CopyIcon className="!size-3" />
      )}
    </Button>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps<TCodeSyntaxLeaf>) {
  const tokenClassName = props.leaf.className as string;

  return <PlateLeaf className={tokenClassName} {...props} />;
}
import * as React from 'react';

import type { TCodeBlockElement } from 'platejs';

import {
  type SlateElementProps,
  type SlateLeafProps,
  SlateElement,
  SlateLeaf,
} from 'platejs/static';

type CodeBlockElementStaticProps = SlateElementProps<TCodeBlockElement> & {
  showLanguageLabel?: boolean;
};

const codeBlockLanguages: { label: string; value: string }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'ABAP', value: 'abap' },
  { label: 'Agda', value: 'agda' },
  { label: 'Arduino', value: 'arduino' },
  { label: 'ASCII Art', value: 'ascii' },
  { label: 'Assembly', value: 'x86asm' },
  { label: 'Bash', value: 'bash' },
  { label: 'BASIC', value: 'basic' },
  { label: 'BNF', value: 'bnf' },
  { label: 'C', value: 'c' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'Clojure', value: 'clojure' },
  { label: 'CoffeeScript', value: 'coffeescript' },
  { label: 'Coq', value: 'coq' },
  { label: 'CSS', value: 'css' },
  { label: 'Dart', value: 'dart' },
  { label: 'Dhall', value: 'dhall' },
  { label: 'Diff', value: 'diff' },
  { label: 'Docker', value: 'dockerfile' },
  { label: 'EBNF', value: 'ebnf' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Elm', value: 'elm' },
  { label: 'Erlang', value: 'erlang' },
  { label: 'F#', value: 'fsharp' },
  { label: 'Flow', value: 'flow' },
  { label: 'Fortran', value: 'fortran' },
  { label: 'Gherkin', value: 'gherkin' },
  { label: 'GLSL', value: 'glsl' },
  { label: 'Go', value: 'go' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Haskell', value: 'haskell' },
  { label: 'HCL', value: 'hcl' },
  { label: 'HTML', value: 'html' },
  { label: 'Idris', value: 'idris' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'Julia', value: 'julia' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Less', value: 'less' },
  { label: 'Lisp', value: 'lisp' },
  { label: 'LiveScript', value: 'livescript' },
  { label: 'LLVM IR', value: 'llvm' },
  { label: 'Lua', value: 'lua' },
  { label: 'Makefile', value: 'makefile' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Markup', value: 'markup' },
  { label: 'MATLAB', value: 'matlab' },
  { label: 'Mathematica', value: 'mathematica' },
  { label: 'Mermaid', value: 'mermaid' },
  { label: 'Nix', value: 'nix' },
  { label: 'Notion Formula', value: 'notion' },
  { label: 'Objective-C', value: 'objectivec' },
  { label: 'OCaml', value: 'ocaml' },
  { label: 'Pascal', value: 'pascal' },
  { label: 'Perl', value: 'perl' },
  { label: 'PHP', value: 'php' },
  { label: 'PowerShell', value: 'powershell' },
  { label: 'Prolog', value: 'prolog' },
  { label: 'Protocol Buffers', value: 'protobuf' },
  { label: 'PureScript', value: 'purescript' },
  { label: 'Python', value: 'python' },
  { label: 'R', value: 'r' },
  { label: 'Racket', value: 'racket' },
  { label: 'Reason', value: 'reasonml' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
  { label: 'Sass', value: 'scss' },
  { label: 'Scala', value: 'scala' },
  { label: 'Scheme', value: 'scheme' },
  { label: 'SCSS', value: 'scss' },
  { label: 'Shell', value: 'shell' },
  { label: 'Smalltalk', value: 'smalltalk' },
  { label: 'Solidity', value: 'solidity' },
  { label: 'SQL', value: 'sql' },
  { label: 'Swift', value: 'swift' },
  { label: 'TOML', value: 'toml' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'VB.Net', value: 'vbnet' },
  { label: 'Verilog', value: 'verilog' },
  { label: 'VHDL', value: 'vhdl' },
  { label: 'Visual Basic', value: 'vbnet' },
  { label: 'WebAssembly', value: 'wasm' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
];

function getCodeBlockLanguageLabel(lang?: string | null) {
  const value = lang?.trim();

  if (!value) return null;

  return (
    codeBlockLanguages.find((language) => language.value === value)?.label ??
    value
  );
}

export function CodeBlockElementStatic({
  showLanguageLabel = true,
  ...props
}: CodeBlockElementStaticProps) {
  const languageLabel = getCodeBlockLanguageLabel(props.element.lang);

  return (
    <SlateElement
      className="py-1 **:[.hljs-addition]:bg-[#f0fff4] **:[.hljs-addition]:text-[#22863a] dark:**:[.hljs-addition]:bg-[#3c5743] dark:**:[.hljs-addition]:text-[#ceead5] **:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#005cc5] dark:**:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#6596cf] **:[.hljs-built\\\\_in,.hljs-symbol]:text-[#e36209] dark:**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#c3854e] **:[.hljs-bullet]:text-[#735c0f] **:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] dark:**:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] **:[.hljs-deletion]:bg-[#ffeef0] **:[.hljs-deletion]:text-[#b31d28] dark:**:[.hljs-deletion]:bg-[#473235] dark:**:[.hljs-deletion]:text-[#e7c7cb] **:[.hljs-emphasis]:italic **:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#d73a49] dark:**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#ee6960] **:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#22863a] dark:**:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#36a84f] **:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#032f62] dark:**:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#3593ff] **:[.hljs-section]:font-bold **:[.hljs-section]:text-[#005cc5] dark:**:[.hljs-section]:text-[#61a5f2] **:[.hljs-strong]:font-bold **:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#6f42c1] dark:**:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#a77bfa]"
      {...props}
    >
      <div className="relative rounded-md bg-muted/50">
        {showLanguageLabel && languageLabel && (
          <div
            className="absolute top-1 right-1 z-10 flex h-6 select-none items-center px-2 text-muted-foreground text-xs"
            contentEditable={false}
          >
            {languageLabel}
          </div>
        )}

        <pre className="overflow-x-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid">
          <code>{props.children}</code>
        </pre>
      </div>
    </SlateElement>
  );
}

export function CodeLineElementStatic(props: SlateElementProps) {
  return <SlateElement {...props} />;
}

export function CodeSyntaxLeafStatic(props: SlateLeafProps) {
  const tokenClassName = props.leaf.className as string;

  return <SlateLeaf className={tokenClassName} {...props} />;
}

/**
 * DOCX-compatible code block components.
 * Uses inline styles for proper rendering in Word documents.
 */

export function CodeBlockElementDocx(
  props: SlateElementProps<TCodeBlockElement>
) {
  return (
    <SlateElement {...props}>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          margin: '8pt 0',
          padding: '12pt',
        }}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}

export function CodeLineElementDocx(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="p"
      style={{
        fontFamily: "'Courier New', Consolas, monospace",
        fontSize: '10pt',
        margin: 0,
        padding: 0,
      }}
    />
  );
}

// Syntax highlighting color map for common token types
const syntaxColors: Record<string, string> = {
  'hljs-addition': '#22863a',
  'hljs-attr': '#005cc5',
  'hljs-attribute': '#005cc5',
  'hljs-built_in': '#e36209',
  'hljs-bullet': '#735c0f',
  'hljs-comment': '#6a737d',
  'hljs-deletion': '#b31d28',
  'hljs-doctag': '#d73a49',
  'hljs-emphasis': '#24292e',
  'hljs-formula': '#6a737d',
  'hljs-keyword': '#d73a49',
  'hljs-literal': '#005cc5',
  'hljs-meta': '#005cc5',
  'hljs-name': '#22863a',
  'hljs-number': '#005cc5',
  'hljs-operator': '#005cc5',
  'hljs-quote': '#22863a',
  'hljs-regexp': '#032f62',
  'hljs-section': '#005cc5',
  'hljs-selector-attr': '#005cc5',
  'hljs-selector-class': '#005cc5',
  'hljs-selector-id': '#005cc5',
  'hljs-selector-pseudo': '#22863a',
  'hljs-selector-tag': '#22863a',
  'hljs-string': '#032f62',
  'hljs-strong': '#24292e',
  'hljs-symbol': '#e36209',
  'hljs-template-tag': '#d73a49',
  'hljs-template-variable': '#d73a49',
  'hljs-title': '#6f42c1',
  'hljs-type': '#d73a49',
  'hljs-variable': '#005cc5',
};

// Convert regular spaces to non-breaking spaces to preserve indentation in Word
const preserveSpaces = (text: string): string => {
  // Replace regular spaces with non-breaking spaces
  return text.replace(/ /g, '\u00A0');
};

export function CodeSyntaxLeafDocx(props: SlateLeafProps) {
  const tokenClassName = props.leaf.className as string;

  // Extract color from className
  let color: string | undefined;
  let fontWeight: string | undefined;
  let fontStyle: string | undefined;

  if (tokenClassName) {
    const classes = tokenClassName.split(' ');
    for (const cls of classes) {
      if (syntaxColors[cls]) {
        color = syntaxColors[cls];
      }
      if (cls === 'hljs-strong' || cls === 'hljs-section') {
        fontWeight = 'bold';
      }
      if (cls === 'hljs-emphasis') {
        fontStyle = 'italic';
      }
    }
  }

  // Get the text content and preserve spaces
  const text = props.leaf.text as string;
  const preservedText = preserveSpaces(text);

  return (
    <span
      data-slate-leaf="true"
      style={{
        color,
        fontFamily: "'Courier New', Consolas, monospace",
        fontSize: '10pt',
        fontStyle,
        fontWeight,
      }}
    >
      {preservedText}
    </span>
  );
}
'use client';

import * as React from 'react';

import type {
  CodeDrawingType,
  TCodeDrawingElement,
  ViewMode,
} from '@platejs/code-drawing';
import {
  VIEW_MODE,
  DEFAULT_MIN_HEIGHT,
  CODE_DRAWING_TYPE_ARRAY,
  VIEW_MODE_ARRAY,
  renderCodeDrawing,
  RENDER_DEBOUNCE_DELAY,
  downloadImage,
  DOWNLOAD_FILENAME,
} from '@platejs/code-drawing';
import type { PlateElementProps } from 'platejs/react';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import debounce from 'lodash/debounce.js';
import { Trash2, DownloadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function createDebouncedCodeDrawingRenderer(
  setImage: React.Dispatch<React.SetStateAction<string>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  let lastRequestId = 0;

  return debounce(
    async (code: string | undefined, drawingType: string | undefined) => {
      lastRequestId += 1;
      const requestId = lastRequestId;

      if (!code?.trim() || !drawingType) {
        setImage('');
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const imageData = await renderCodeDrawing(
          drawingType as CodeDrawingType,
          code
        );

        if (lastRequestId === requestId) {
          setImage(imageData);
          setError(null);
        }
      } catch (err) {
        if (lastRequestId === requestId) {
          setError(err instanceof Error ? err.message : 'Rendering failed');
          setImage('');
        }
      } finally {
        if (lastRequestId === requestId) {
          setLoading(false);
        }
      }
    },
    RENDER_DEBOUNCE_DELAY
  );
}

function useCodeDrawingElement({ element }: { element: TCodeDrawingElement }) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [image, setImage] = React.useState<string>('');

  const debouncedRender = React.useMemo(
    () => createDebouncedCodeDrawingRenderer(setImage, setLoading, setError),
    []
  );

  React.useEffect(() => {
    debouncedRender(element.data?.code, element.data?.drawingType);

    return () => {
      debouncedRender.cancel();
    };
  }, [element.data?.code, element.data?.drawingType, debouncedRender]);

  const removeNode = () => {
    if (readOnly) return;

    const path = editor.api.findPath(element);
    if (path) {
      editor.tf.removeNodes({ at: path });
    }
  };

  return {
    loading,
    error,
    image,
    removeNode,
  };
}

export function CodeDrawingElement(
  props: PlateElementProps<TCodeDrawingElement>
) {
  const { children } = props;
  const isMobile = useIsMobile();
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const element = useElement<TCodeDrawingElement>();
  const { removeNode, image, loading } = useCodeDrawingElement({ element });

  const handleDownload = React.useCallback(() => {
    if (!image) return;
    downloadImage(image, DOWNLOAD_FILENAME);
  }, [image]);

  const handleCodeChange = React.useCallback(
    (code: string) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              code,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const handleDrawingTypeChange = React.useCallback(
    (drawingType: CodeDrawingType) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              drawingType,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const handleDrawingModeChange = React.useCallback(
    (drawingMode: ViewMode) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              drawingMode,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const code = element.data?.code ?? '';
  const drawingType = element.data?.drawingType ?? 'Mermaid';
  const drawingMode = element.data?.drawingMode ?? 'Both';

  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    []
  );

  const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

  const content = (
    <PlateElement {...props}>
      <div contentEditable={false}>
        <div>
          <CodeDrawingPreview
            code={code}
            drawingType={drawingType}
            drawingMode={drawingMode}
            image={image}
            loading={loading}
            onCodeChange={handleCodeChange}
            onDrawingTypeChange={handleDrawingTypeChange}
            onDrawingModeChange={handleDrawingModeChange}
            readOnly={readOnly}
            isMobile={isMobile}
          />
        </div>
      </div>
      {children}
    </PlateElement>
  );

  if (readOnly) {
    return content;
  }

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor asChild>{content}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-1"
        contentEditable={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1">
          {image && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={handleDownload}
              title="Export"
            >
              <DownloadIcon className="size-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={removeNode}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CodeDrawingPreview({
  code,
  drawingType,
  drawingMode,
  image,
  loading,
  onCodeChange,
  onDrawingTypeChange,
  onDrawingModeChange,
  readOnly = false,
  isMobile = false,
}: {
  code: string;
  drawingType: CodeDrawingType;
  drawingMode: ViewMode;
  image: string;
  loading: boolean;
  onCodeChange: (code: string) => void;
  onDrawingTypeChange: (type: CodeDrawingType) => void;
  onDrawingModeChange: (mode: ViewMode) => void;
  readOnly?: boolean;
  isMobile?: boolean;
}) {
  const viewMode = drawingMode;
  const showCode = viewMode === VIEW_MODE.Both || viewMode === VIEW_MODE.Code;
  const showBorder = viewMode === VIEW_MODE.Both;

  const handleCodeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange]
  );

  const toolbar = readOnly ? null : (
    <CodeDrawingToolbar
      drawingType={drawingType}
      viewMode={viewMode}
      readOnly={readOnly}
      isMobile={isMobile}
      onDrawingTypeChange={onDrawingTypeChange}
      onDrawingModeChange={onDrawingModeChange}
    />
  );

  return (
    <div
      className={`flex ${isMobile ? 'flex-col-reverse' : 'flex-col'} group my-4 w-full items-stretch border bg-muted/50 md:flex-row`}
      style={{
        minHeight: `${DEFAULT_MIN_HEIGHT}px`,
      }}
    >
      {showCode && (
        <CodeDrawingTextarea
          code={code}
          viewMode={viewMode}
          readOnly={readOnly}
          isMobile={isMobile}
          showBorder={showBorder}
          onCodeChange={handleCodeChange}
          toolbar={viewMode === VIEW_MODE.Code ? toolbar : null}
        />
      )}

      {viewMode !== VIEW_MODE.Code && (
        <CodeDrawingPreviewArea
          image={image}
          loading={loading}
          code={code}
          viewMode={viewMode}
          readOnly={readOnly}
          isMobile={isMobile}
          showBorder={showBorder}
          toolbar={toolbar}
        />
      )}
    </div>
  );
}

function CodeDrawingToolbar({
  drawingType,
  viewMode,
  readOnly = false,
  isMobile = false,
  onDrawingTypeChange,
  onDrawingModeChange,
}: {
  drawingType: CodeDrawingType;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  onDrawingTypeChange: (type: CodeDrawingType) => void;
  onDrawingModeChange: (mode: ViewMode) => void;
}) {
  const [toolbarVisible, setToolbarVisible] = React.useState(false);
  const [languageSelectOpen, setLanguageSelectOpen] = React.useState(false);
  const [viewModeSelectOpen, setViewModeSelectOpen] = React.useState(false);

  const opacityClass =
    isMobile || toolbarVisible || languageSelectOpen || viewModeSelectOpen
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100';

  const positionClass = isMobile
    ? 'flex items-center gap-2'
    : 'absolute right-2 z-10 flex items-center gap-2';

  return (
    <div
      role="toolbar"
      className={`${positionClass} transition-opacity ${opacityClass}`}
      onMouseEnter={() => setToolbarVisible(true)}
      onMouseLeave={() => {
        if (!languageSelectOpen && !viewModeSelectOpen) {
          setToolbarVisible(false);
        }
      }}
    >
      {!readOnly && (
        <Select
          value={drawingType}
          onValueChange={onDrawingTypeChange}
          open={languageSelectOpen}
          onOpenChange={setLanguageSelectOpen}
        >
          <SelectTrigger
            className={`h-8 w-[120px] border-0 bg-muted/50 text-xs shadow-none ${
              isMobile ? '' : 'transition-colors hover:bg-zinc-200'
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {CODE_DRAWING_TYPE_ARRAY.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!readOnly && (
        <Select
          value={viewMode}
          onValueChange={onDrawingModeChange}
          open={viewModeSelectOpen}
          onOpenChange={setViewModeSelectOpen}
        >
          <SelectTrigger
            className={`h-8 w-[80px] border-0 bg-muted/50 text-xs shadow-none ${
              isMobile ? '' : 'transition-colors hover:bg-zinc-200'
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {VIEW_MODE_ARRAY.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function CodeDrawingTextarea({
  code,
  viewMode,
  readOnly = false,
  isMobile = false,
  showBorder = false,
  onCodeChange,
  toolbar,
}: {
  code: string;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  showBorder?: boolean;
  onCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  toolbar?: React.ReactNode;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isCodeOnlyMode = viewMode === VIEW_MODE.Code;

  const [internalCode, setInternalCode] = React.useState(code);
  const lastExternalCodeRef = React.useRef(code);

  React.useEffect(() => {
    if (code !== lastExternalCodeRef.current) {
      lastExternalCodeRef.current = code;
      setInternalCode(code);
    }
  }, [code]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalCode(newValue);
      onCodeChange(e);
    },
    [onCodeChange]
  );

  return (
    <div
      className={`${
        isCodeOnlyMode ? 'w-full' : 'min-w-0 flex-1'
      } flex flex-col ${isCodeOnlyMode && !isMobile ? 'relative' : ''} ${
        showBorder && !isMobile ? 'border-r' : ''
      }`}
    >
      {toolbar && isCodeOnlyMode && (
        <div
          className={
            isMobile
              ? 'mt-2 mb-2 flex justify-end px-2'
              : 'absolute right-2 z-10 mt-2'
          }
        >
          {toolbar}
        </div>
      )}

      <div className="relative flex-1 rounded-md">
        <pre
          className={
            'm-0 overflow-x-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid'
          }
          style={{ minHeight: `${DEFAULT_MIN_HEIGHT}px`, height: '100%' }}
        >
          <code className="block h-full w-full">
            <textarea
              ref={textareaRef}
              value={internalCode}
              onChange={handleChange}
              readOnly={readOnly}
              className="m-0 h-full w-full resize-none overflow-auto border-0 bg-transparent p-0 font-mono text-sm outline-none"
              style={{ minHeight: `${DEFAULT_MIN_HEIGHT}px` }}
              placeholder="Enter your code here..."
              spellCheck={false}
            />
          </code>
        </pre>
      </div>
    </div>
  );
}

function CodeDrawingPreviewArea({
  image,
  loading,
  code,
  viewMode,
  readOnly: _readOnly = false,
  isMobile = false,
  showBorder = false,
  toolbar,
}: {
  image: string;
  loading: boolean;
  code: string;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  showBorder?: boolean;
  toolbar?: React.ReactNode;
}) {
  const showImage = viewMode === VIEW_MODE.Both || viewMode === VIEW_MODE.Image;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${isMobile ? '' : 'relative'} ${
        showBorder && isMobile ? 'border-b' : ''
      }`}
    >
      {toolbar && (
        <div
          className={
            isMobile
              ? 'mt-2 mb-2 flex justify-end px-2'
              : 'absolute right-2 z-10 mt-2'
          }
        >
          {toolbar}
        </div>
      )}

      {showImage ? (
        <div
          className={
            'flex flex-1 items-center justify-center rounded-md bg-muted/30 p-4'
          }
        >
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && image && (
            <img
              src={image}
              alt="Code drawing"
              className="max-h-full max-w-full object-contain"
            />
          )}
          {!loading && !image && (
            <div className="text-muted-foreground">
              {code.trim() ? 'Rendering...' : 'Preview will appear here'}
            </div>
          )}
        </div>
      ) : (
        <div className="pointer-events-none flex flex-1 items-center justify-center rounded-md border bg-muted/30 p-4 opacity-0">
          {/* Placeholder to maintain height */}
        </div>
      )}
    </div>
  );
}
import * as React from 'react';

import type { TCodeDrawingElement } from '@platejs/code-drawing';
import type { SlateElementProps } from 'platejs/static';

import { cn } from '@/lib/utils';
import { SlateElement } from 'platejs/static';

export function CodeDrawingElementStatic({
  children,
  ...props
}: SlateElementProps<TCodeDrawingElement>) {
  return (
    <SlateElement className="my-4 flex w-full items-stretch" {...props}>
      <div className={cn('flex w-full flex-col md:flex-row')}>
        <div className="relative h-full min-w-0 flex-1 rounded-md bg-muted/50 p-8 pr-4">
          <pre className="m-0 overflow-x-auto font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid">
            <code className="block w-full">
              {(props.element.data?.code as string) ||
                'Enter your code here...'}
            </code>
          </pre>
        </div>
        <div className="relative flex min-w-0 flex-1 items-center justify-center rounded-md border bg-muted/30 p-4">
          <div className="text-muted-foreground">
            {props.element.data?.drawingType || 'Mermaid'}
          </div>
        </div>
      </div>
      {children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { TColumnElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable, useDropLine } from '@platejs/dnd';
import { setColumns } from '@platejs/layout';
import { ResizableProvider } from '@platejs/resizable';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { useComposedRef } from '@udecode/cn';
import { type LucideProps, Trash2Icon } from 'lucide-react';
import { GripHorizontal } from 'lucide-react';
import { PathApi } from 'platejs';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC,
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const ColumnElement = withHOC(
  ResizableProvider,
  function ColumnElement(props: PlateElementProps<TColumnElement>) {
    const { width } = props.element;
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      'isSelectionAreaVisible'
    );

    const { isDragging, nodeRef, previewRef, handleRef } = useDraggable({
      element: props.element,
      orientation: 'horizontal',
      type: 'column',
      canDropNode: ({ dragEntry, dropEntry }) =>
        !!dragEntry &&
        PathApi.equals(
          PathApi.parent(dragEntry[1]),
          PathApi.parent(dropEntry[1])
        ),
    });

    return (
      <div className="group/column relative" style={{ width: width ?? '100%' }}>
        {!readOnly && !isSelectionAreaVisible && (
          <div
            ref={handleRef}
            className={cn(
              '-translate-x-1/2 -translate-y-1/2 absolute top-2 left-1/2 z-50',
              'pointer-events-auto flex items-center',
              'opacity-0 transition-opacity group-hover/column:opacity-100'
            )}
          >
            <ColumnDragHandle />
          </div>
        )}

        <PlateElement
          {...props}
          ref={useComposedRef(props.ref, previewRef, nodeRef)}
          className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0"
        >
          <div
            className={cn(
              'relative h-full border border-transparent p-1.5',
              !readOnly && 'rounded-lg border-border border-dashed',
              isDragging && 'opacity-50'
            )}
          >
            {props.children}

            {!readOnly && !isSelectionAreaVisible && <DropLine />}
          </div>
        </PlateElement>
      </div>
    );
  }
);

const ColumnDragHandle = React.memo(function ColumnDragHandle() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className="!px-1 h-5">
            <GripHorizontal
              className="text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
            />
          </Button>
        </TooltipTrigger>

        <TooltipContent>Drag to move column</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

function DropLine() {
  const { dropLine } = useDropLine({ orientation: 'horizontal' });

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        'slate-dropLine',
        'absolute bg-brand/50',
        dropLine === 'left' &&
          'group-first/column:-left-1 inset-y-0 left-[-10.5px] w-1',
        dropLine === 'right' &&
          'group-last/column:-right-1 inset-y-0 right-[-11px] w-1'
      )}
    />
  );
}

export function ColumnGroupElement(props: PlateElementProps) {
  return (
    <PlateElement className="mb-2" {...props}>
      <ColumnFloatingToolbar>
        <div className="flex size-full rounded">{props.children}</div>
      </ColumnFloatingToolbar>
    </PlateElement>
  );
}

function ColumnFloatingToolbar({ children }: React.PropsWithChildren) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const element = useElement<TColumnElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const selected = useSelected();
  const isCollapsed = useEditorSelector(
    (editor) => editor.api.isCollapsed(),
    []
  );
  const isFocusedLast = useFocusedLast();

  const open = isFocusedLast && !readOnly && selected && isCollapsed;

  const onColumnChange = (widths: string[]) => {
    setColumns(editor, {
      at: element,
      widths,
    });
  };

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="center"
        side="top"
        sideOffset={10}
      >
        <div className="box-content flex h-8 items-center">
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onColumnChange(['50%', '50%'])}
          >
            <DoubleColumnOutlined />
          </Button>
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onColumnChange(['33%', '33%', '33%'])}
          >
            <ThreeColumnOutlined />
          </Button>
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onColumnChange(['70%', '30%'])}
          >
            <RightSideDoubleColumnOutlined />
          </Button>
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onColumnChange(['30%', '70%'])}
          >
            <LeftSideDoubleColumnOutlined />
          </Button>
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onColumnChange(['25%', '50%', '25%'])}
          >
            <DoubleSideDoubleColumnOutlined />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" className="size-8" {...buttonProps}>
            <Trash2Icon />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const DoubleColumnOutlined = (props: LucideProps) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M8.5 3H13V13H8.5V3ZM7.5 2H8.5H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H8.5H7.5H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7.5ZM7.5 13H3L3 3H7.5V13Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const ThreeColumnOutlined = (props: LucideProps) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M9.25 3H6.75V13H9.25V3ZM9.25 2H6.75H5.75H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H5.75H6.75H9.25H10.25H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H10.25H9.25ZM10.25 3V13H13V3H10.25ZM3 13H5.75V3H3L3 13Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const RightSideDoubleColumnOutlined = (props: LucideProps) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M11.25 3H13V13H11.25V3ZM10.25 2H11.25H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H11.25H10.25H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H10.25ZM10.25 13H3L3 3H10.25V13Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const LeftSideDoubleColumnOutlined = (props: LucideProps) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M5.75 3H13V13H5.75V3ZM4.75 2H5.75H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H5.75H4.75H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H4.75ZM4.75 13H3L3 3H4.75V13Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const DoubleSideDoubleColumnOutlined = (props: LucideProps) => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M10.25 3H5.75V13H10.25V3ZM10.25 2H5.75H4.75H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H4.75H5.75H10.25H11.25H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H11.25H10.25ZM11.25 3V13H13V3H11.25ZM3 13H4.75V3H3L3 13Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
import * as React from 'react';

import type { TColumnElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

export function ColumnElementStatic(props: SlateElementProps<TColumnElement>) {
  const { width } = props.element;

  return (
    <div className="group/column relative" style={{ width: width ?? '100%' }}>
      <SlateElement
        className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0"
        {...props}
      >
        <div className="relative h-full border border-transparent p-1.5">
          {props.children}
        </div>
      </SlateElement>
    </div>
  );
}

export function ColumnGroupElementStatic(props: SlateElementProps) {
  return (
    <SlateElement className="mb-2" {...props}>
      <div className="flex size-full rounded">{props.children}</div>
    </SlateElement>
  );
}

/**
 * DOCX-compatible column component using table cell.
 */
export function ColumnElementDocx(props: SlateElementProps<TColumnElement>) {
  const { width } = props.element;

  return (
    <SlateElement
      {...props}
      as="td"
      style={{
        width: width ?? 'auto',
        verticalAlign: 'top',
        padding: '4px 8px',
        border: 'none',
      }}
    >
      {props.children}
    </SlateElement>
  );
}

/**
 * DOCX-compatible column group component using table layout.
 */
export function ColumnGroupElementDocx(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: 'none',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>{props.children}</tr>
        </tbody>
      </table>
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import {
  type ResizeHandle as ResizeHandlePrimitive,
  Resizable as ResizablePrimitive,
  useResizeHandle,
  useResizeHandleState,
} from '@platejs/resizable';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const mediaResizeHandleVariants = cva(
  cn(
    'top-0 flex w-6 select-none flex-col justify-center',
    "after:flex after:h-16 after:w-[3px] after:rounded-[6px] after:bg-ring after:opacity-0 after:content-['_'] group-hover:after:opacity-100"
  ),
  {
    variants: {
      direction: {
        left: '-left-3 -ml-3 pl-3',
        right: '-right-3 -mr-3 items-end pr-3',
      },
    },
  }
);

const resizeHandleVariants = cva('absolute z-40', {
  variants: {
    direction: {
      bottom: 'w-full cursor-row-resize',
      left: 'h-full cursor-col-resize',
      right: 'h-full cursor-col-resize',
      top: 'w-full cursor-row-resize',
    },
  },
});

export function ResizeHandle({
  className,
  options,
  ...props
}: React.ComponentProps<typeof ResizeHandlePrimitive> &
  VariantProps<typeof resizeHandleVariants>) {
  const state = useResizeHandleState(options ?? {});
  const resizeHandle = useResizeHandle(state);

  if (state.readOnly) return null;

  return (
    <div
      className={cn(
        resizeHandleVariants({ direction: options?.direction }),
        className
      )}
      data-resizing={state.isResizing}
      {...resizeHandle.props}
      {...props}
    />
  );
}

const resizableVariants = cva('', {
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Resizable({
  align,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive> &
  VariantProps<typeof resizableVariants>) {
  return (
    <ResizablePrimitive
      {...props}
      className={cn(resizableVariants({ align }), className)}
    />
  );
}
'use client';

import * as React from 'react';

import type { TCommentText } from 'platejs';
import type { PlateLeafProps } from 'platejs/react';

import { getCommentCount } from '@platejs/comment';
import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';

export function CommentLeaf(props: PlateLeafProps<TCommentText>) {
  const { children, leaf } = props;

  const { api, setOption } = useEditorPlugin(commentPlugin);
  const hoverId = usePluginOption(commentPlugin, 'hoverId');
  const activeId = usePluginOption(commentPlugin, 'activeId');

  const isOverlapping = getCommentCount(leaf) > 1;
  const currentId = api.comment.nodeId(leaf);
  const isActive = activeId === currentId;
  const isHover = hoverId === currentId;

  return (
    <PlateLeaf
      {...props}
      className={cn(
        'border-b-2 border-b-highlight/[.36] bg-highlight/[.13] transition-colors duration-200',
        (isHover || isActive) && 'border-b-highlight bg-highlight/25',
        isOverlapping && 'border-b-2 border-b-highlight/[.7] bg-highlight/25',
        (isHover || isActive) &&
          isOverlapping &&
          'border-b-highlight bg-highlight/45'
      )}
      attributes={{
        ...props.attributes,
        onClick: () => setOption('activeId', currentId ?? null),
        onMouseEnter: () => setOption('hoverId', currentId ?? null),
        onMouseLeave: () => setOption('hoverId', null),
      }}
    >
      {children}
    </PlateLeaf>
  );
}
import * as React from 'react';

import type { TCommentText } from 'platejs';
import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function CommentLeafStatic(props: SlateLeafProps<TCommentText>) {
  return (
    <SlateLeaf
      {...props}
      className="border-b-2 border-b-highlight/35 bg-highlight/15"
    >
      {props.children}
    </SlateLeaf>
  );
}
'use client';

import * as React from 'react';

import {
  formatDateValue,
  getDateDisplayLabel,
  parseCanonicalDateValue,
} from '@platejs/date';
import type { TDateElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useReadOnly } from 'platejs/react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { editor, element } = props;
  const readOnly = useReadOnly();

  const trigger = (
    <span
      className={cn(
        'w-fit cursor-pointer rounded-sm bg-muted px-1 text-muted-foreground',
        inlineSuggestionVariants()
      )}
      contentEditable={false}
      draggable
    >
      {element.date || element.rawDate ? (
        getDateDisplayLabel(element)
      ) : (
        <span>Pick a date</span>
      )}
    </span>
  );

  return (
    <PlateElement
      {...props}
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}
    >
      {readOnly ? (
        trigger
      ) : (
        <Popover>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              selected={parseCanonicalDateValue(element.date ?? '')}
              onSelect={(date) => {
                if (!date) return;

                editor.tf.setNodes(
                  { date: formatDateValue(date), rawDate: undefined },
                  { at: element }
                );
              }}
              mode="single"
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import { getDateDisplayLabel } from '@platejs/date';
import type { TDateElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';
import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement as="span" className="inline-block" {...props}>
      <span
        className={cn(
          'w-fit rounded-sm bg-muted px-1 text-muted-foreground',
          inlineSuggestionVariants()
        )}
      >
        {element.date || element.rawDate ? (
          getDateDisplayLabel(element)
        ) : (
          <span>Pick a date</span>
        )}
      </span>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { TFootnoteElement } from '@platejs/footnote';
import { PathApi, type Path } from 'platejs';
import { FootnoteReferencePlugin } from '@platejs/footnote/react';
import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  PlateElement,
  useEditorSelector,
  useFocused,
  useNavigationHighlight,
  usePath,
  useSelected,
} from 'platejs/react';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@/components/ui/inline-combobox';

const NUMERIC_FOOTNOTE_QUERY = /^\d+$/;

const getNavigationAttributes = (
  attributes: PlateElementProps<TFootnoteElement>['attributes'],
  navigationHighlight: ReturnType<typeof useNavigationHighlight>
) => ({
  ...attributes,
  'data-nav-cycle': navigationHighlight
    ? String(navigationHighlight.cycle)
    : undefined,
  'data-nav-highlight': navigationHighlight?.variant,
  'data-nav-pulse': navigationHighlight
    ? String(navigationHighlight.pulse)
    : undefined,
  'data-nav-target': navigationHighlight ? 'true' : undefined,
  style: {
    ...(attributes.style as React.CSSProperties | undefined),
    ['--plate-nav-feedback-duration' as const]: navigationHighlight
      ? `${navigationHighlight.duration}ms`
      : undefined,
  } as React.CSSProperties,
});

const getFootnotePreviewLabel = (text?: string) => {
  const normalized = text?.replace(/\s+/g, ' ').trim();

  if (!normalized) return 'Empty footnote';

  return normalized.length > 48
    ? `${normalized.slice(0, 45).trimEnd()}...`
    : normalized;
};

const getReferenceContextLabel = (
  editor: PlateEditor,
  path: Path,
  index: number
) => {
  const parentEntry = editor.api.parent(path);
  const fallback = `Reference ${index + 1}`;

  if (!parentEntry) return fallback;

  const text = editor.api.string(parentEntry[1]);
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) return fallback;

  return normalized.length > 56
    ? `${normalized.slice(0, 53).trimEnd()}...`
    : normalized;
};

export function FootnoteReferenceElement(
  props: PlateElementProps<TFootnoteElement>
) {
  const { editor, element } = props;
  const identifier = element.identifier ?? '';
  const footnoteApi = editor.getApi(FootnoteReferencePlugin).footnote;
  const footnoteTransforms = editor.getTransforms(
    FootnoteReferencePlugin
  ).footnote;
  const [hoverOpen, setHoverOpen] = React.useState(false);
  const focused = useFocused();
  const path = usePath();
  const navigationHighlight = useNavigationHighlight(path);
  const fallbackResolved =
    identifier && footnoteApi ? footnoteApi.isResolved({ identifier }) : false;
  const fallbackPreviewText =
    identifier && footnoteApi
      ? footnoteApi.definitionText({ identifier })
      : undefined;
  const livePreview = useEditorSelector(() => {
    if (!hoverOpen || !identifier) return null;

    return {
      isResolved: footnoteApi.isResolved({ identifier }),
      previewText: footnoteApi.definitionText({ identifier }),
    };
  }, [hoverOpen, identifier]);
  const isResolved = livePreview?.isResolved ?? fallbackResolved;
  const previewText = livePreview?.previewText ?? fallbackPreviewText;
  const selected = useSelected();
  const isSelectionInsideAtom = useEditorSelector(
    (currentEditor) => {
      const selection = currentEditor.selection;

      if (!path || !selection) return false;

      return (
        PathApi.equals(selection.anchor.path, path.concat([0])) &&
        PathApi.equals(selection.focus.path, path.concat([0])) &&
        selection.anchor.offset === selection.focus.offset
      );
    },
    [path]
  );

  return (
    <PlateElement
      {...props}
      as="sup"
      className="group/footnote-ref mx-0.5 align-super"
      attributes={{
        ...getNavigationAttributes(props.attributes, navigationHighlight),
        contentEditable: false,
        draggable: true,
      }}
    >
      {props.children}
      <HoverCard open={hoverOpen} onOpenChange={setHoverOpen} openDelay={150}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className={cn(
              'cursor-pointer rounded-xs font-medium text-primary text-xs focus:ring-2 focus:ring-ring focus:ring-offset-1 group-data-[nav-target=true]/footnote-ref:bg-(--color-highlight)',
              (selected && focused) || isSelectionInsideAtom
                ? 'ring-2 ring-ring ring-offset-1'
                : null
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              if (event.metaKey || event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                if (isResolved) {
                  footnoteTransforms.focusDefinition({ identifier });

                  return;
                }

                footnoteTransforms.createDefinition({ identifier });
              }
            }}
          >
            [{identifier}]
          </button>
        </HoverCardTrigger>
        {previewText ? (
          <HoverCardContent className="w-80">
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm leading-relaxed">
                {previewText}
              </div>
            </div>
          </HoverCardContent>
        ) : identifier ? (
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              {isResolved ? (
                <div className="text-sm leading-relaxed">
                  No preview available.
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 rounded-xs px-2 text-[11px]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    footnoteTransforms.createDefinition({ identifier });
                    setHoverOpen(false);
                  }}
                >
                  Create definition for [^{identifier}]
                </Button>
              )}
            </div>
          </HoverCardContent>
        ) : null}
      </HoverCard>
    </PlateElement>
  );
}

export function FootnoteDefinitionElement(
  props: PlateElementProps<TFootnoteElement>
) {
  const { editor, element } = props;
  const identifier = element.identifier ?? '';
  const footnoteApi = editor.getApi(FootnoteReferencePlugin).footnote;
  const footnoteTransforms = editor.getTransforms(
    FootnoteReferencePlugin
  ).footnote;
  const path = usePath();
  const definitionState = useEditorSelector(() => {
    const isDuplicateDefinition =
      !!path && !!footnoteApi.isDuplicateDefinition?.({ path });
    const referenceItems =
      !isDuplicateDefinition && identifier
        ? footnoteApi
            .references({ identifier })
            .map((entry: any, index: number) => ({
              index,
              label: getReferenceContextLabel(editor, entry[1], index),
            }))
        : [];

    return {
      duplicateReplacementIdentifier: isDuplicateDefinition
        ? footnoteApi.nextId?.()
        : undefined,
      isDuplicateDefinition,
      path,
      referenceItems,
    };
  }, [identifier, path]);
  const navigationHighlight = useNavigationHighlight(definitionState?.path);
  const isDuplicateDefinition = !!definitionState?.isDuplicateDefinition;
  const duplicateReplacementIdentifier =
    definitionState?.duplicateReplacementIdentifier;
  const [referencePickerOpen, setReferencePickerOpen] = React.useState(false);
  const referenceItems = definitionState?.referenceItems ?? [];
  const hasMultipleReferences = referenceItems.length > 1;

  return (
    <PlateElement
      {...props}
      className={cn(
        'mt-1.5 flex items-start gap-1.5 data-[nav-target=true]:rounded-md data-[nav-target=true]:bg-(--color-highlight)',
        isDuplicateDefinition &&
          'rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-2'
      )}
      attributes={getNavigationAttributes(
        props.attributes,
        navigationHighlight
      )}
    >
      <div contentEditable={false}>
        {isDuplicateDefinition ? (
          <div className="min-w-3 text-amber-700 text-xs tabular-nums">
            {identifier}
          </div>
        ) : (
          <Popover
            open={referencePickerOpen}
            onOpenChange={setReferencePickerOpen}
          >
            <PopoverAnchor asChild>
              <button
                type="button"
                aria-expanded={
                  hasMultipleReferences ? referencePickerOpen : undefined
                }
                aria-haspopup={hasMultipleReferences ? 'dialog' : undefined}
                aria-label={`Back to reference ${identifier}`}
                className="min-w-3 cursor-pointer rounded-xs text-muted-foreground text-xs tabular-nums underline-offset-2 hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (hasMultipleReferences) {
                    setReferencePickerOpen((open) => !open);

                    return;
                  }

                  footnoteTransforms.focusReference({ identifier });
                }}
              >
                {identifier}
              </button>
            </PopoverAnchor>

            {hasMultipleReferences && referencePickerOpen ? (
              <PopoverContent
                className="w-72 p-0"
                align="start"
                sideOffset={8}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {referenceItems.map(
                        (item: { index: number; label: string }) => (
                          <CommandItem
                            key={`${identifier}-${item.index}`}
                            className="cursor-pointer gap-2"
                            onMouseDown={(event) => event.preventDefault()}
                            onSelect={() => {
                              setReferencePickerOpen(false);
                              footnoteTransforms.focusReference({
                                identifier,
                                index: item.index,
                              });
                            }}
                          >
                            <span className="font-mono text-muted-foreground text-xs">
                              {item.index + 1}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </CommandItem>
                        )
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            ) : null}
          </Popover>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {isDuplicateDefinition ? (
          <div
            contentEditable={false}
            className="mb-2 flex flex-wrap items-center gap-2"
          >
            {duplicateReplacementIdentifier && path ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 rounded-xs border-amber-500/40 px-2 text-[11px] text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  footnoteTransforms.normalizeDuplicateDefinition({
                    identifier: duplicateReplacementIdentifier,
                    path,
                  });
                }}
              >
                Renumber to [^{duplicateReplacementIdentifier}]
              </Button>
            ) : null}
          </div>
        ) : null}
        {props.children}
      </div>
    </PlateElement>
  );
}

export function FootnoteInputElement(props: PlateElementProps) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');
  const footnoteApi = editor.getApi(FootnoteReferencePlugin).footnote;
  const insertTransforms = editor.getTransforms(FootnoteReferencePlugin).insert;

  const identifiers = footnoteApi.identifiers?.() ?? [];
  const nextIdentifier = footnoteApi.nextId?.() ?? '1';
  const query = search.trim();
  const numericQuery = NUMERIC_FOOTNOTE_QUERY.test(query) ? query : '';
  const proposedIdentifier = numericQuery || nextIdentifier;
  const showCreateOption = !identifiers.includes(proposedIdentifier);

  const filteredIdentifiers = identifiers.filter((identifier: string) => {
    if (!query) return true;

    const preview = footnoteApi.definitionText?.({ identifier }) ?? '';

    return (
      identifier.includes(query) ||
      preview.toLowerCase().includes(query.toLowerCase())
    );
  });

  const insertSelectedFootnote = React.useCallback(
    (identifier: string) => {
      const before = editor.selection && editor.api.before(editor.selection);

      if (before) {
        const range = editor.api.range(before, editor.selection);

        if (range && editor.api.string(range) === '[') {
          editor.tf.deleteBackward('character');
        }
      }

      insertTransforms.footnote({
        focusDefinition: false,
        identifier,
      });
    },
    [editor, insertTransforms]
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        filter={false}
        setValue={setSearch}
        trigger="^"
      >
        <InlineComboboxInput className="min-w-[1ch]" />

        <InlineComboboxContent className="my-1.5 w-72">
          {showCreateOption || filteredIdentifiers.length > 0 ? null : (
            <InlineComboboxEmpty>No footnotes</InlineComboboxEmpty>
          )}

          <InlineComboboxGroup>
            {showCreateOption && (!query || numericQuery) ? (
              <InlineComboboxItem
                value={`new-${proposedIdentifier}`}
                onClick={() => insertSelectedFootnote(proposedIdentifier)}
              >
                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                  <span className="font-mono text-muted-foreground">
                    [^{proposedIdentifier}]
                  </span>
                  <span className="truncate">: New footnote...</span>
                </span>
              </InlineComboboxItem>
            ) : null}

            {filteredIdentifiers.map((identifier: string) => (
              <InlineComboboxItem
                key={identifier}
                value={`footnote-${identifier}`}
                onClick={() => insertSelectedFootnote(identifier)}
              >
                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                  <span className="font-mono text-muted-foreground">
                    [^{identifier}]
                  </span>
                  <span className="truncate">
                    :{' '}
                    {getFootnotePreviewLabel(
                      footnoteApi.definitionText?.({ identifier })
                    )}
                  </span>
                </span>
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { TFootnoteElement } from '@platejs/footnote';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

export function FootnoteReferenceElementStatic(
  props: SlateElementProps<TFootnoteElement>
) {
  const { element } = props;

  return (
    <SlateElement
      {...props}
      as="sup"
      className="mx-0.5 align-super font-medium text-primary text-xs"
    >
      {props.children}[{element.identifier ?? ''}]
    </SlateElement>
  );
}

export function FootnoteDefinitionElementStatic(
  props: SlateElementProps<TFootnoteElement>
) {
  const { element } = props;

  return (
    <SlateElement {...props} as="div" className="mt-2 flex items-start gap-2">
      <div className="mt-0.5 min-w-4 text-muted-foreground text-sm tabular-nums">
        {element.identifier ?? ''}
      </div>
      <div className="min-w-0 flex-1">{props.children}</div>
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { PointRef, TElement } from 'platejs';

import {
  type ComboboxItemProps,
  Combobox,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxPopover,
  ComboboxProvider,
  ComboboxRow,
  Portal,
  useComboboxContext,
  useComboboxStore,
} from '@ariakit/react';
import { filterWords } from '@platejs/combobox';
import {
  type UseComboboxInputResult,
  useComboboxInput,
  useHTMLInputCursorState,
} from '@platejs/combobox/react';
import { cva } from 'class-variance-authority';
import { useComposedRef, useEditorRef } from 'platejs/react';

import { cn } from '@/lib/utils';

type FilterFn = (
  item: { value: string; group?: string; keywords?: string[]; label?: string },
  search: string
) => boolean;

type InlineComboboxContextValue = {
  filter: FilterFn | false;
  inputProps: UseComboboxInputResult['props'];
  inputRef: React.RefObject<HTMLInputElement | null>;
  removeInput: UseComboboxInputResult['removeInput'];
  showTrigger: boolean;
  trigger: string;
  setHasEmpty: (hasEmpty: boolean) => void;
};

const InlineComboboxContext = React.createContext<InlineComboboxContextValue>(
  null as unknown as InlineComboboxContextValue
);

const defaultFilter: FilterFn = (
  { group, keywords = [], label, value },
  search
) => {
  const uniqueTerms = new Set(
    [value, ...keywords, group, label].filter(Boolean)
  );

  return Array.from(uniqueTerms).some((keyword) =>
    filterWords(keyword!, search)
  );
};

type InlineComboboxProps = {
  children: React.ReactNode;
  element: TElement;
  trigger: string;
  filter?: FilterFn | false;
  hideWhenNoValue?: boolean;
  showTrigger?: boolean;
  value?: string;
  setValue?: (value: string) => void;
};

const InlineCombobox = ({
  children,
  element,
  filter = defaultFilter,
  hideWhenNoValue = false,
  setValue: setValueProp,
  showTrigger = true,
  trigger,
  value: valueProp,
}: InlineComboboxProps) => {
  const editor = useEditorRef();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cursorState = useHTMLInputCursorState(inputRef);

  const [valueState, setValueState] = React.useState('');
  const hasValueProp = valueProp !== undefined;
  const value = hasValueProp ? valueProp : valueState;

  // Check if current user is the creator of this element (for Yjs collaboration)
  const isCreator = React.useMemo(() => {
    const elementUserId = (element as any).userId;
    const currentUserId = editor.meta.userId;

    // If no userId (backwards compatibility or non-Yjs), allow
    if (!elementUserId) return true;

    return elementUserId === currentUserId;
  }, [editor.meta.userId, element]);

  const setValue = React.useCallback(
    (newValue: string) => {
      setValueProp?.(newValue);

      if (!hasValueProp) {
        setValueState(newValue);
      }
    },
    [setValueProp, hasValueProp]
  );

  /**
   * Track the point just before the input element so we know where to
   * insertText if the combobox closes due to a selection change.
   */
  const insertPointRef = React.useRef<PointRef | null>(null);

  React.useEffect(() => {
    insertPointRef.current?.unref();
    insertPointRef.current = null;

    const path = editor.api.findPath(element);

    if (!path) return;

    const point = editor.api.before(path);

    if (!point) return;

    const pointRef = editor.api.pointRef(point);
    insertPointRef.current = pointRef;

    return () => {
      if (insertPointRef.current === pointRef) {
        insertPointRef.current = null;
      }
      pointRef.unref();
    };
  }, [editor, element]);

  const { props: inputProps, removeInput } = useComboboxInput({
    cancelInputOnBlur: true,
    cursorState,
    autoFocus: isCreator,
    ref: inputRef,
    onCancelInput: (cause) => {
      if (cause !== 'backspace') {
        editor.tf.insertText(trigger + value, {
          at: insertPointRef.current?.current ?? undefined,
        });
      }
      if (cause === 'arrowLeft' || cause === 'arrowRight') {
        editor.tf.move({
          distance: 1,
          reverse: cause === 'arrowLeft',
        });
      }
    },
  });

  const [hasEmpty, setHasEmpty] = React.useState(false);

  const contextValue: InlineComboboxContextValue = React.useMemo(
    () => ({
      filter,
      inputProps,
      inputRef,
      removeInput,
      setHasEmpty,
      showTrigger,
      trigger,
    }),
    [
      trigger,
      showTrigger,
      filter,
      inputRef,
      inputProps,
      removeInput,
      setHasEmpty,
    ]
  );

  const store = useComboboxStore({
    // open: ,
    setValue: (newValue) => React.startTransition(() => setValue(newValue)),
  });

  const items = store.useState('items');

  /**
   * If there is no active ID and the list of items changes, select the first
   * item.
   */
  React.useEffect(() => {
    if (!store.getState().activeId) {
      store.setActiveId(store.first());
    }
  }, [items, store]);

  return (
    <span contentEditable={false}>
      <ComboboxProvider
        open={
          (items.length > 0 || hasEmpty) &&
          (!hideWhenNoValue || value.length > 0)
        }
        store={store}
      >
        <InlineComboboxContext.Provider value={contextValue}>
          {children}
        </InlineComboboxContext.Provider>
      </ComboboxProvider>
    </span>
  );
};

const InlineComboboxInput = ({
  className,
  ref: propRef,
  ...props
}: React.HTMLAttributes<HTMLInputElement> & {
  ref?: React.RefObject<HTMLInputElement | null>;
}) => {
  const {
    inputProps,
    inputRef: contextRef,
    showTrigger,
    trigger,
  } = React.useContext(InlineComboboxContext);

  const store = useComboboxContext()!;
  const value = store.useState('value');

  const ref = useComposedRef(propRef, contextRef);

  /**
   * To create an auto-resizing input, we render a visually hidden span
   * containing the input value and position the input element on top of it.
   * This works well for all cases except when input exceeds the width of the
   * container.
   */

  return (
    <>
      {showTrigger && trigger}

      <span className="relative min-h-[1lh]">
        <span
          className="invisible overflow-hidden text-nowrap"
          aria-hidden="true"
        >
          {value || '\u200B'}
        </span>

        <Combobox
          ref={ref}
          className={cn(
            'absolute top-0 left-0 size-full bg-transparent outline-none',
            className
          )}
          value={value}
          autoSelect
          {...inputProps}
          {...props}
        />
      </span>
    </>
  );
};

InlineComboboxInput.displayName = 'InlineComboboxInput';

const InlineComboboxContent: typeof ComboboxPopover = ({
  className,
  ...props
}) => {
  // Portal prevents CSS from leaking into popover
  const store = useComboboxContext();

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!store) return;

    const state = store.getState();
    const { items, activeId } = state;

    if (!items.length) return;

    const currentIndex = items.findIndex((item) => item.id === activeId);

    if (event.key === 'ArrowUp' && currentIndex <= 0) {
      event.preventDefault();
      store.setActiveId(store.last());
    } else if (event.key === 'ArrowDown' && currentIndex >= items.length - 1) {
      event.preventDefault();
      store.setActiveId(store.first());
    }
  }

  return (
    <Portal>
      <ComboboxPopover
        className={cn(
          'z-500 max-h-[288px] w-[300px] overflow-y-auto rounded-md bg-popover shadow-md',
          className
        )}
        onKeyDownCapture={handleKeyDown}
        {...props}
      />
    </Portal>
  );
};

const comboboxItemVariants = cva(
  'relative mx-1 flex h-[28px] select-none items-center rounded-sm px-2 text-foreground text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    defaultVariants: {
      interactive: true,
    },
    variants: {
      interactive: {
        false: '',
        true: 'cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground data-[active-item=true]:bg-accent data-[active-item=true]:text-accent-foreground',
      },
    },
  }
);

const InlineComboboxItem = ({
  className,
  focusEditor = true,
  group,
  keywords,
  label,
  onClick,
  ...props
}: {
  focusEditor?: boolean;
  group?: string;
  keywords?: string[];
  label?: string;
} & ComboboxItemProps &
  Required<Pick<ComboboxItemProps, 'value'>>) => {
  const { value } = props;

  const { filter, removeInput } = React.useContext(InlineComboboxContext);

  const store = useComboboxContext()!;

  // Optimization: Do not subscribe to value if filter is false
  const search = filter && store.useState('value');

  const visible = React.useMemo(
    () =>
      !filter || filter({ group, keywords, label, value }, search as string),
    [filter, group, keywords, label, value, search]
  );

  if (!visible) return null;

  return (
    <ComboboxItem
      className={cn(comboboxItemVariants(), className)}
      onClick={(event) => {
        removeInput(focusEditor);
        onClick?.(event);
      }}
      {...props}
    />
  );
};

const InlineComboboxEmpty = ({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { setHasEmpty } = React.useContext(InlineComboboxContext);
  const store = useComboboxContext()!;
  const items = store.useState('items');

  React.useEffect(() => {
    setHasEmpty(true);

    return () => {
      setHasEmpty(false);
    };
  }, [setHasEmpty]);

  if (items.length > 0) return null;

  return (
    <div
      className={cn(comboboxItemVariants({ interactive: false }), className)}
    >
      {children}
    </div>
  );
};

const InlineComboboxRow = ComboboxRow;

function InlineComboboxGroup({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxGroup>) {
  return (
    <ComboboxGroup
      {...props}
      className={cn(
        'hidden not-last:border-b py-1.5 [&:has([role=option])]:block',
        className
      )}
    />
  );
}

function InlineComboboxGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxGroupLabel>) {
  return (
    <ComboboxGroupLabel
      {...props}
      className={cn(
        'mt-1.5 mb-2 px-3 font-medium text-muted-foreground text-xs',
        className
      )}
    />
  );
}

export {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
  InlineComboboxRow,
};
'use client';

import * as React from 'react';

import type { TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getLinkAttributes } from '@platejs/link';
import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  return (
    <PlateElement
      {...props}
      as="a"
      className={cn(
        'font-medium text-primary underline decoration-primary underline-offset-4',
        inlineSuggestionVariants()
      )}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e) => {
          e.stopPropagation();
        },
      }}
    >
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { getLinkAttributes } from '@platejs/link';
import { SlateElement } from 'platejs/static';
import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
  return (
    <SlateElement
      {...props}
      as="a"
      className={cn(
        'font-medium text-primary underline decoration-primary underline-offset-4',
        inlineSuggestionVariants()
      )}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
      }}
    >
      {props.children}
    </SlateElement>
  );
}
'use client';

import React from 'react';

import type { TListElement } from 'platejs';

import { isOrderedList } from '@platejs/list';
import {
  useTodoListElement,
  useTodoListElementState,
} from '@platejs/list/react';
import {
  type PlateElementProps,
  type RenderNodeWrapper,
  useReadOnly,
} from 'platejs/react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const config: Record<
  string,
  {
    Li: React.FC<PlateElementProps & { lineBreakBadge?: React.ReactNode }>;
    Marker: React.FC<PlateElementProps>;
  }
> = {
  todo: {
    Li: TodoLi,
    Marker: TodoMarker,
  },
};

export const BlockList: RenderNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;
  if (!isOrderedList(props.element)) return;

  return (props) => <List {...props} />;
};

function List(props: PlateElementProps & { lineBreakBadge?: React.ReactNode }) {
  const { listStart, listStyleType } = props.element as TListElement;
  const { Li, Marker } = config[listStyleType] ?? {};
  const List = isOrderedList(props.element) ? 'ol' : 'ul';

  return (
    <List
      className="relative m-0 p-0"
      style={{ listStyleType }}
      start={listStart}
    >
      {Marker && <Marker {...props} />}
      {Li ? (
        <Li {...props} />
      ) : (
        <li>
          {props.children}
          {props.lineBreakBadge}
        </li>
      )}
    </List>
  );
}

function TodoMarker(props: PlateElementProps) {
  const state = useTodoListElementState({ element: props.element });
  const { checkboxProps } = useTodoListElement(state);
  const readOnly = useReadOnly();

  return (
    <div contentEditable={false}>
      <Checkbox
        className={cn(
          '-left-6 absolute top-1',
          readOnly && 'pointer-events-none'
        )}
        {...checkboxProps}
      />
    </div>
  );
}

function TodoLi(
  props: PlateElementProps & { lineBreakBadge?: React.ReactNode }
) {
  return (
    <li
      className={cn(
        'list-none',
        (props.element.checked as boolean) &&
          'text-muted-foreground line-through'
      )}
    >
      {props.children}
      {props.lineBreakBadge}
    </li>
  );
}
import * as React from 'react';

import type { RenderStaticNodeWrapper, TListElement } from 'platejs';
import type { SlateRenderElementProps } from 'platejs/static';

import { isOrderedList } from '@platejs/list';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const config: Record<
  string,
  {
    Li: React.FC<SlateRenderElementProps>;
    Marker: React.FC<SlateRenderElementProps>;
  }
> = {
  todo: {
    Li: TodoLiStatic,
    Marker: TodoMarkerStatic,
  },
};

export const BlockListStatic: RenderStaticNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;
  if (!isOrderedList(props.element)) return;

  return (props) => <List {...props} />;
};

function List(props: SlateRenderElementProps) {
  const { indent, listStart, listStyleType } = props.element as TListElement & {
    indent?: number;
  };
  const { Li, Marker } = config[listStyleType] ?? {};
  const List = isOrderedList(props.element) ? 'ol' : 'ul';

  // Apply margin-left for indent (24px per level) for DOCX export compatibility
  const marginLeft = indent ? `${indent * 24}px` : undefined;

  return (
    <List
      className="relative m-0 p-0"
      style={{ listStyleType, marginLeft }}
      start={listStart}
    >
      {Marker && <Marker {...props} />}
      {Li ? <Li {...props} /> : <li>{props.children}</li>}
    </List>
  );
}

function TodoMarkerStatic(props: SlateRenderElementProps) {
  const checked = props.element.checked as boolean;

  return (
    <div contentEditable={false}>
      <button
        className={cn(
          'peer -left-6 pointer-events-none absolute top-1 size-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          props.className
        )}
        data-state={checked ? 'checked' : 'unchecked'}
        type="button"
      >
        <div className={cn('flex items-center justify-center text-current')}>
          {checked && <CheckIcon className="size-4" />}
        </div>
      </button>
    </div>
  );
}

function TodoLiStatic(props: SlateRenderElementProps) {
  return (
    <li
      className={cn(
        'list-none',
        (props.element.checked as boolean) &&
          'text-muted-foreground line-through'
      )}
    >
      {props.children}
    </li>
  );
}
'use client';

import * as React from 'react';
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize';

import type { TEquationElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useEquationElement, useEquationInput } from '@platejs/math/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { CornerDownLeftIcon, RadicalIcon } from 'lucide-react';
import {
  createPrimitiveComponent,
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function EquationElement(props: PlateElementProps<TEquationElement>) {
  const texExpression =
    typeof props.element.texExpression === 'string' ||
    typeof props.element.texExpression === 'number' ||
    typeof props.element.texExpression === 'boolean'
      ? String(props.element.texExpression)
      : '';
  const selected = useSelected();
  const [open, setOpen] = React.useState(selected);
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const lineBreakBadge = (
    props as PlateElementProps<TEquationElement> & {
      lineBreakBadge?: React.ReactNode;
    }
  ).lineBreakBadge;

  useEquationElement({
    element: props.element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <PlateElement className="my-1" {...props}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex cursor-pointer select-none items-center justify-center rounded-sm hover:bg-primary/10 data-[selected=true]:bg-primary/10',
              texExpression.length === 0 ? 'bg-muted p-3 pr-9' : 'px-2 py-1'
            )}
            data-selected={selected}
            contentEditable={false}
            role="button"
          >
            {texExpression.length > 0 ? (
              <span ref={katexRef} />
            ) : (
              <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-muted-foreground text-sm">
                <RadicalIcon className="size-6 text-muted-foreground/80" />
                <div>Add a Tex equation</div>
              </div>
            )}
            {lineBreakBadge}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          open={open}
          placeholder={
            'f(x) = \\begin{cases}\n  x^2, &\\quad x > 0 \\\\\n  0, &\\quad x = 0 \\\\\n  -x^2, &\\quad x < 0\n\\end{cases}'
          }
          isInline={false}
          setOpen={setOpen}
        />
      </Popover>

      {props.children}
    </PlateElement>
  );
}

export function InlineEquationElement(
  props: PlateElementProps<TEquationElement>
) {
  const { element } = props;
  const texExpression =
    typeof element.texExpression === 'string' ||
    typeof element.texExpression === 'number' ||
    typeof element.texExpression === 'boolean'
      ? String(element.texExpression)
      : '';
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const selected = useSelected();
  const isCollapsed = useEditorSelector(
    (editor) => editor.api.isCollapsed(),
    []
  );
  const [open, setOpen] = React.useState(selected && isCollapsed);

  React.useEffect(() => {
    if (selected && isCollapsed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Open the inline equation popover when editor selection enters it.
      setOpen(true);
    }
  }, [selected, isCollapsed]);

  useEquationElement({
    element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <PlateElement
      {...props}
      className={cn(
        'mx-1 inline-block select-none rounded-sm [&_.katex-display]:my-0!'
      )}
    >
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'after:-top-0.5 after:-left-1 after:absolute after:inset-0 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
              'h-6',
              inlineSuggestionVariants(),
              ((texExpression.length > 0 && open) || selected) &&
                'after:bg-brand/15',
              texExpression.length === 0 &&
                'text-muted-foreground after:bg-neutral-500/10'
            )}
            contentEditable={false}
          >
            <span
              ref={katexRef}
              className={cn(
                texExpression.length === 0 && 'hidden',
                'font-mono leading-none'
              )}
            />
            {texExpression.length === 0 && (
              <span>
                <RadicalIcon className="mr-1 inline-block h-[19px] w-4 py-[1.5px] align-text-bottom" />
                New equation
              </span>
            )}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          className="my-auto"
          open={open}
          placeholder="E = mc^2"
          setOpen={setOpen}
          isInline
        />
      </Popover>

      {props.children}
    </PlateElement>
  );
}

const EquationInput = createPrimitiveComponent(TextareaAutosize)({
  propsHook: useEquationInput,
});

const EquationPopoverContent = ({
  className,
  isInline,
  open,
  setOpen,
  ...props
}: {
  isInline: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
} & TextareaAutosizeProps) => {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const element = useElement<TEquationElement>();

  React.useEffect(() => {
    if (isInline && open) {
      setOpen(true);
    }
  }, [isInline, open, setOpen]);

  if (readOnly) return null;

  const onClose = () => {
    setOpen(false);

    if (isInline) {
      editor.tf.select(element, { focus: true, next: true });
    } else {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.set(element.id as string);
    }
  };

  return (
    <PopoverContent
      className="flex gap-2"
      onEscapeKeyDown={(e) => {
        e.preventDefault();
      }}
      contentEditable={false}
    >
      <EquationInput
        className={cn('max-h-[50vh] grow resize-none p-2 text-sm', className)}
        state={{ isInline, open, onClose }}
        autoFocus
        {...props}
      />

      <Button variant="secondary" className="px-3" onClick={onClose}>
        Done <CornerDownLeftIcon className="size-3.5" />
      </Button>
    </PopoverContent>
  );
};
import * as React from 'react';

import type { TEquationElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { getEquationHtml } from '@platejs/math';
import { RadicalIcon } from 'lucide-react';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function EquationElementStatic(
  props: SlateElementProps<TEquationElement>
) {
  const { element } = props;
  const texExpression =
    typeof element.texExpression === 'string' ||
    typeof element.texExpression === 'number' ||
    typeof element.texExpression === 'boolean'
      ? String(element.texExpression)
      : '';

  const html = getEquationHtml({
    element,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <SlateElement className="my-1" {...props}>
      <div
        className={cn(
          'group flex select-none items-center justify-center rounded-sm hover:bg-primary/10 data-[selected=true]:bg-primary/10',
          texExpression.length === 0 ? 'bg-muted p-3 pr-9' : 'px-2 py-1'
        )}
      >
        {texExpression.length > 0 ? (
          <span
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        ) : (
          <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-muted-foreground text-sm">
            <RadicalIcon className="size-6 text-muted-foreground/80" />
            <div>Add a Tex equation</div>
          </div>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}

export function InlineEquationElementStatic(
  props: SlateElementProps<TEquationElement>
) {
  const texExpression =
    typeof props.element.texExpression === 'string' ||
    typeof props.element.texExpression === 'number' ||
    typeof props.element.texExpression === 'boolean'
      ? String(props.element.texExpression)
      : '';
  const html = getEquationHtml({
    element: props.element,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <SlateElement
      {...props}
      className="inline-block select-none rounded-sm [&_.katex-display]:my-0"
    >
      <div
        className={cn(
          'after:-top-0.5 after:-left-1 after:absolute after:inset-0 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
          'h-6',
          inlineSuggestionVariants(),
          texExpression.length === 0 &&
            'text-muted-foreground after:bg-neutral-500/10'
        )}
      >
        <span
          className={cn(
            texExpression.length === 0 && 'hidden',
            'font-mono leading-none'
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}

/**
 * DOCX-compatible block equation component.
 * Displays LaTeX source code with styling.
 */
export function EquationElementDocx(
  props: SlateElementProps<TEquationElement>
) {
  const { element } = props;
  const texExpression =
    typeof element.texExpression === 'string' ||
    typeof element.texExpression === 'number' ||
    typeof element.texExpression === 'boolean'
      ? String(element.texExpression)
      : '';

  if (!texExpression) {
    return (
      <SlateElement {...props}>
        <p style={{ color: '#888', fontStyle: 'italic' }}>[Empty equation]</p>
        {props.children}
      </SlateElement>
    );
  }

  return (
    <SlateElement {...props}>
      <p
        style={{
          fontFamily: 'Cambria Math, Consolas, monospace',
          fontSize: '12pt',
          margin: '8pt 0',
          textAlign: 'center',
        }}
      >
        {texExpression}
      </p>
      {props.children}
    </SlateElement>
  );
}

/**
 * DOCX-compatible inline equation component.
 * Displays LaTeX source code inline.
 */
export function InlineEquationElementDocx(
  props: SlateElementProps<TEquationElement>
) {
  const { element } = props;
  const texExpression =
    typeof element.texExpression === 'string' ||
    typeof element.texExpression === 'number' ||
    typeof element.texExpression === 'boolean'
      ? String(element.texExpression)
      : '';

  if (!texExpression) {
    return (
      <SlateElement {...props} as="span">
        <span style={{ color: '#888', fontStyle: 'italic' }}>[equation]</span>
        {props.children}
      </SlateElement>
    );
  }

  return (
    <SlateElement {...props} as="span">
      <span
        style={{
          fontFamily: 'Cambria Math, Consolas, monospace',
        }}
      >
        {texExpression}
      </span>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { TAudioElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';

export const AudioElement = withHOC(
  ResizableProvider,
  function AudioElement(props: PlateElementProps<TAudioElement>) {
    const { align = 'center', readOnly, unsafeUrl } = useMediaState();

    return (
      <PlateElement {...props} className="mb-1">
        <figure
          className="group relative cursor-default"
          contentEditable={false}
        >
          <div className={cn('h-16 rounded-sm')}>
            <audio className="size-full" src={unsafeUrl} controls />
          </div>

          <Caption style={{ width: '100%' }} align={align}>
            <CaptionTextarea
              className="h-20"
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </figure>
        {props.children}
      </PlateElement>
    );
  }
);
import * as React from 'react';

import type { TAudioElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function AudioElementStatic(props: SlateElementProps<TAudioElement>) {
  return (
    <SlateElement {...props} className="mb-1">
      <figure className="group relative cursor-default">
        <div className={cn('h-16 rounded-sm')}>
          <audio className="size-full" src={props.element.url} controls />
        </div>
      </figure>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from '@platejs/caption/react';
import { createPrimitiveComponent } from '@udecode/cn';
import { cva } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const captionVariants = cva('max-w-full', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Caption({
  align,
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive> &
  VariantProps<typeof captionVariants>) {
  return (
    <CaptionPrimitive
      {...props}
      className={cn(captionVariants({ align }), className)}
    />
  );
}

export function CaptionTextarea(
  props: React.ComponentProps<typeof CaptionTextareaPrimitive>
) {
  return (
    <CaptionTextareaPrimitive
      {...props}
      className={cn(
        'mt-2 w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
        'focus:outline-none focus:[&::placeholder]:opacity-0',
        'text-center print:placeholder:text-transparent',
        props.className
      )}
    />
  );
}

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
});
'use client';

import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { FileUp } from 'lucide-react';
import { PlateElement, useReadOnly, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';
import { Caption, CaptionTextarea } from './caption';

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<TFileElement>) {
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();

    return (
      <PlateElement className="my-px rounded-sm" {...props}>
        <a
          className={cn(
            'group relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px] hover:bg-muted'
          )}
          contentEditable={false}
          download={name}
          href={unsafeUrl}
          rel="noopener noreferrer"
          role="button"
          target="_blank"
        >
          <div className={cn('flex items-center gap-1 p-1')}>
            <FileUp className="size-5" />
            <div>{name}</div>
          </div>

          <Caption align="left">
            <CaptionTextarea
              className="text-left"
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </a>
        {props.children}
      </PlateElement>
    );
  }
);
import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { TSuggestionData } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { FileUp } from 'lucide-react';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function FileElementStatic(props: SlateElementProps<TFileElement>) {
  const { name, url } = props.element;
  const suggestionData = (
    props.element as TFileElement & {
      suggestion?: TSuggestionData;
    }
  ).suggestion;
  const isRemoveSuggestion = suggestionData?.type === 'remove';

  return (
    <SlateElement className="my-px rounded-sm" {...props}>
      <a
        className={cn(
          'group relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px] hover:bg-muted',
          isRemoveSuggestion && 'bg-red-100 text-red-700 hover:bg-red-200/80'
        )}
        contentEditable={false}
        download={name}
        href={url}
        rel="noopener noreferrer"
        role="button"
        target="_blank"
      >
        <div
          className={cn(
            'flex items-center gap-1 p-1',
            isRemoveSuggestion && 'line-through decoration-current'
          )}
        >
          <FileUp className="size-5" />
          <div>{name}</div>
        </div>
      </a>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import { Image, ImagePlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();
    const width = useResizableValue('width');

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <MediaToolbar plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />
              <div>
                <Image
                  ref={handleRef}
                  className={cn(
                    'block w-full max-w-full cursor-pointer object-cover px-0',
                    'rounded-sm',
                    focused && selected && 'ring-2 ring-ring ring-offset-2',
                    isDragging && 'opacity-50'
                  )}
                  alt={props.attributes.alt as string | undefined}
                />
              </div>
              <ResizeHandle
                className={mediaResizeHandleVariants({
                  direction: 'right',
                })}
                options={{ direction: 'right' }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea
                readOnly={readOnly}
                onFocus={(e) => {
                  e.preventDefault();
                }}
                placeholder="Write a caption..."
              />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);
import * as React from 'react';

import type { TCaptionProps, TImageElement, TResizableProps } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function ImageElementStatic(
  props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps>
) {
  const { align = 'center', caption, url, width } = props.element;

  return (
    <SlateElement {...props} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div
          className="relative min-w-[92px] max-w-full"
          style={{ textAlign: align }}
        >
          <div>
            <img
              className={cn(
                'w-full max-w-full cursor-default object-cover px-0',
                'rounded-sm'
              )}
              alt={(props.attributes as any).alt}
              src={url}
            />
          </div>
          {caption && (
            <figcaption
              className="mx-auto mt-2 h-[24px] max-w-full"
              style={{ textAlign: 'center' }}
            >
              {NodeApi.string(caption[0])}
            </figcaption>
          )}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { WithRequiredKey } from 'platejs';

import {
  FloatingMedia as FloatingMediaPrimitive,
  FloatingMediaStore,
  useFloatingMediaValue,
  useImagePreviewValue,
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import { Link, Trash2Icon } from 'lucide-react';
import {
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
} from 'platejs/react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { CaptionButton } from './caption';

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-transparent md:text-sm'
);

export function MediaToolbar({
  children,
  plugin,
}: {
  children: React.ReactNode;
  plugin: WithRequiredKey;
}) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    []
  );
  const isImagePreviewOpen = useImagePreviewValue('isOpen', editor.id);
  const open =
    isFocusedLast &&
    !readOnly &&
    selected &&
    selectionCollapsed &&
    !isImagePreviewOpen;
  const isEditing = useFloatingMediaValue('isEditing');

  React.useEffect(() => {
    if (!open && isEditing) {
      FloatingMediaStore.set('isEditing', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const element = useElement();
  const { props: buttonProps } = useRemoveNodeButton({ element });

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>

      <PopoverContent
        className="w-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isEditing ? (
          <div className="flex w-[330px] flex-col">
            <div className="flex items-center">
              <div className="flex items-center pr-1 pl-2 text-muted-foreground">
                <Link className="size-4" />
              </div>

              <FloatingMediaPrimitive.UrlInput
                className={inputVariants()}
                placeholder="Paste the embed link..."
                options={{ plugin }}
              />
            </div>
          </div>
        ) : (
          <div className="box-content flex items-center">
            <FloatingMediaPrimitive.EditButton
              className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            >
              Edit link
            </FloatingMediaPrimitive.EditButton>

            <CaptionButton size="sm" variant="ghost">
              Caption
            </CaptionButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button size="sm" variant="ghost" {...buttonProps}>
              <Trash2Icon />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
'use client';

import * as React from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactPlayer from 'react-player';

import type { TResizableProps, TVideoElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import { parseTwitterUrl, parseVideoUrl } from '@platejs/media';
import { useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, useEditorMounted, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const VideoElement = withHOC(
  ResizableProvider,
  function VideoElement(
    props: PlateElementProps<TVideoElement & TResizableProps>
  ) {
    const {
      align = 'center',
      embed,
      isVideo,
      isUpload,
      isYoutube,
      readOnly,
      unsafeUrl,
    } = useMediaState({
      urlParsers: [parseTwitterUrl, parseVideoUrl],
    });
    const width = useResizableValue('width');

    const isEditorMounted = useEditorMounted();
    const shouldRenderEmbedPlayer =
      isEditorMounted && !isUpload && !isYoutube && isVideo;
    const shouldRenderFileVideo = isEditorMounted && (isUpload || !isVideo);

    const isTweet = true;

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <PlateElement className="py-2.5" {...props}>
        <figure className="relative m-0 cursor-default" contentEditable={false}>
          <Resizable
            className={cn(isDragging && 'opacity-50')}
            align={align}
            options={{
              align,
              maxWidth: isTweet ? 550 : '100%',
              minWidth: isTweet ? 300 : 100,
              readOnly,
            }}
          >
            <div className="group/media">
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />

              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'right' })}
                options={{ direction: 'right' }}
              />

              {!isUpload && isYoutube && (
                <div ref={handleRef}>
                  <LiteYouTubeEmbed
                    id={embed!.id!}
                    title="youtube"
                    wrapperClass={cn(
                      'aspect-video rounded-sm',
                      'relative block cursor-pointer bg-black bg-center bg-cover [contain:content]',
                      '[&.lyt-activated]:before:absolute [&.lyt-activated]:before:top-0 [&.lyt-activated]:before:h-[60px] [&.lyt-activated]:before:w-full [&.lyt-activated]:before:bg-top [&.lyt-activated]:before:bg-repeat-x [&.lyt-activated]:before:pb-[50px] [&.lyt-activated]:before:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                      '[&.lyt-activated]:before:bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==)]',
                      'after:block after:pb-[var(--aspect-ratio)] after:content-[""]',
                      '[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full',
                      '[&_>_.lty-playbtn]:z-1 [&_>_.lty-playbtn]:h-[46px] [&_>_.lty-playbtn]:w-[70px] [&_>_.lty-playbtn]:rounded-[14%] [&_>_.lty-playbtn]:bg-[#212121] [&_>_.lty-playbtn]:opacity-80 [&_>_.lty-playbtn]:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                      '[&:hover_>_.lty-playbtn]:bg-[red] [&:hover_>_.lty-playbtn]:opacity-100',
                      '[&_>_.lty-playbtn]:before:border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:border-y-[11px] [&_>_.lty-playbtn]:before:border-r-0 [&_>_.lty-playbtn]:before:border-l-[19px] [&_>_.lty-playbtn]:before:content-[""]',
                      '[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:[transform:translate3d(-50%,-50%,0)]',
                      '[&_>_.lty-playbtn]:before:absolute [&_>_.lty-playbtn]:before:top-1/2 [&_>_.lty-playbtn]:before:left-1/2 [&_>_.lty-playbtn]:before:[transform:translate3d(-50%,-50%,0)]',
                      '[&.lyt-activated]:cursor-[unset]',
                      '[&.lyt-activated]:before:pointer-events-none [&.lyt-activated]:before:opacity-0',
                      '[&.lyt-activated_>_.lty-playbtn]:pointer-events-none [&.lyt-activated_>_.lty-playbtn]:opacity-0!'
                    )}
                  />
                </div>
              )}

              {shouldRenderFileVideo && (
                <div ref={handleRef}>
                  <video
                    className="w-full max-w-full rounded-sm object-cover px-0"
                    src={unsafeUrl}
                    controls
                  />
                </div>
              )}

              {shouldRenderEmbedPlayer && (
                <div ref={handleRef}>
                  <ReactPlayer
                    height="100%"
                    src={unsafeUrl}
                    width="100%"
                    controls
                  />
                </div>
              )}
            </div>
          </Resizable>

          <Caption style={{ width }} align={align}>
            <CaptionTextarea
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </figure>
        {props.children}
      </PlateElement>
    );
  }
);
import * as React from 'react';

import type { TCaptionElement, TResizableProps, TVideoElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

export function VideoElementStatic(
  props: SlateElementProps<TVideoElement & TCaptionElement & TResizableProps>
) {
  const { align = 'center', caption, url, width } = props.element;

  return (
    <SlateElement className="py-2.5" {...props}>
      <div style={{ textAlign: align }}>
        <figure
          className="group relative m-0 inline-block cursor-default"
          style={{ width }}
        >
          <div>
            <video
              className="w-full max-w-full rounded-sm object-cover px-0"
              src={url}
              controls
            />
          </div>
          {caption && <figcaption>{NodeApi.string(caption[0])}</figcaption>}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { TComboboxInputElement, TMentionElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getMentionOnSelectItem } from '@platejs/mention';
import { IS_APPLE, KEYS } from 'platejs';
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { inlineSuggestionVariants } from '@/lib/suggestion';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

export function MentionElement(
  props: PlateElementProps<TMentionElement> & {
    prefix?: string;
  }
) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        inlineSuggestionVariants(),
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <>
          {props.children}
          {props.prefix}
          {element.value}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {props.prefix}
          {element.value}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}

const onSelectItem = getMentionOnSelectItem();

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@"
      >
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxGroup>
            {MENTIONABLES.map((item) => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}
              >
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}

const MENTIONABLES = [
  { key: '0', text: 'Aayla Secura' },
  { key: '1', text: 'Adi Gallia' },
  {
    key: '2',
    text: 'Admiral Dodd Rancit',
  },
  {
    key: '3',
    text: 'Admiral Firmus Piett',
  },
  {
    key: '4',
    text: 'Admiral Gial Ackbar',
  },
  { key: '5', text: 'Admiral Ozzel' },
  { key: '6', text: 'Admiral Raddus' },
  {
    key: '7',
    text: 'Admiral Terrinald Screed',
  },
  { key: '8', text: 'Admiral Trench' },
  {
    key: '9',
    text: 'Admiral U.O. Statura',
  },
  { key: '10', text: 'Agen Kolar' },
  { key: '11', text: 'Agent Kallus' },
  {
    key: '12',
    text: 'Aiolin and Morit Astarte',
  },
  { key: '13', text: 'Aks Moe' },
  { key: '14', text: 'Almec' },
  { key: '15', text: 'Alton Kastle' },
  { key: '16', text: 'Amee' },
  { key: '17', text: 'AP-5' },
  { key: '18', text: 'Armitage Hux' },
  { key: '19', text: 'Artoo' },
  { key: '20', text: 'Arvel Crynyd' },
  { key: '21', text: 'Asajj Ventress' },
  { key: '22', text: 'Aurra Sing' },
  { key: '23', text: 'AZI-3' },
  { key: '24', text: 'Bala-Tik' },
  { key: '25', text: 'Barada' },
  { key: '26', text: 'Bargwill Tomder' },
  { key: '27', text: 'Baron Papanoida' },
  { key: '28', text: 'Barriss Offee' },
  { key: '29', text: 'Baze Malbus' },
  { key: '30', text: 'Bazine Netal' },
  { key: '31', text: 'BB-8' },
  { key: '32', text: 'BB-9E' },
  { key: '33', text: 'Ben Quadinaros' },
  { key: '34', text: 'Berch Teller' },
  { key: '35', text: 'Beru Lars' },
  { key: '36', text: 'Bib Fortuna' },
  {
    key: '37',
    text: 'Biggs Darklighter',
  },
  { key: '38', text: 'Black Krrsantan' },
  { key: '39', text: 'Bo-Katan Kryze' },
  { key: '40', text: 'Boba Fett' },
  { key: '41', text: 'Bobbajo' },
  { key: '42', text: 'Bodhi Rook' },
  { key: '43', text: 'Borvo the Hutt' },
  { key: '44', text: 'Boss Nass' },
  { key: '45', text: 'Bossk' },
  {
    key: '46',
    text: 'Breha Antilles-Organa',
  },
  { key: '47', text: 'Bren Derlin' },
  { key: '48', text: 'Brendol Hux' },
  { key: '49', text: 'BT-1' },
];
import * as React from 'react';

import type { TMentionElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { KEYS } from 'platejs';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';
import { inlineSuggestionVariants } from '@/lib/suggestion';

export function MentionElementStatic(
  props: SlateElementProps<TMentionElement> & {
    prefix?: string;
  }
) {
  const { prefix } = props;
  const element = props.element;

  return (
    <SlateElement
      {...props}
      as="span"
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        inlineSuggestionVariants(),
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      attributes={{
        ...props.attributes,
        'data-slate-value': element.value,
      }}
    >
      {props.children}
      {prefix}
      {element.value}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import { cva } from 'class-variance-authority';
import { CornerDownLeftIcon } from 'lucide-react';
import type {
  AnyPluginConfig,
  TElement,
  TSuggestionData,
  TSuggestionText,
  WithRequiredKey,
} from 'platejs';
import { KEYS } from 'platejs';
import type {
  PlateEditor,
  PlateLeafProps,
  RenderNodeWrapper,
} from 'platejs/react';

import { SuggestionPlugin } from '@platejs/suggestion/react';
import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';
import type { SuggestionConfig } from '@/components/editor/plugins/suggestion-kit';
import { voidRemoveSuggestionOverlayVariants } from '@/components/ui/suggestion-node-static';

const suggestionPlugin = SuggestionPlugin as WithRequiredKey<SuggestionConfig>;

export const suggestionVariants = cva(
  cn(
    'bg-emerald-100 text-emerald-700 no-underline transition-colors duration-200'
  ),
  {
    defaultVariants: {
      insertActive: false,
      remove: false,
      removeActive: false,
    },
    variants: {
      insertActive: {
        false: '',
        true: 'bg-emerald-200/80',
      },
      remove: {
        false: '',
        true: 'bg-red-100 text-red-700',
      },
      removeActive: {
        false: '',
        true: 'bg-red-200/80 no-underline',
      },
    },
  }
);

export function getBlockSuggestionWrapperClassName({
  elementType,
  isActive,
  isHover,
  isInsert,
  isRemove,
}: {
  elementType?: string;
  isActive: boolean;
  isHover: boolean;
  isInsert: boolean;
  isRemove: boolean;
}) {
  return cn(
    elementType === KEYS.columnGroup && 'flex size-full rounded',
    suggestionVariants({
      insertActive: isInsert && (isActive || isHover),
      remove: isRemove,
      removeActive: (isActive || isHover) && isRemove,
    })
  );
}

export function isVoidRemoveSuggestion(editor: PlateEditor, element: TElement) {
  return (
    editor.getApi(SuggestionPlugin).suggestion.suggestionData(element)?.type ===
    'remove'
  );
}

export function VoidRemoveSuggestionOverlay({
  editor,
  element,
}: {
  editor: PlateEditor;
  element: TElement;
}) {
  const active =
    editor.api.isVoid(element) &&
    !editor.api.isInline(element) &&
    isVoidRemoveSuggestion(editor, element);

  if (!active) return null;

  return (
    <div
      className={voidRemoveSuggestionOverlayVariants({ active })}
      contentEditable={false}
      data-slot="void-remove-suggestion"
    />
  );
}

export function SuggestionLineBreakAnchor({
  badgeProps,
  children,
  className,
}: {
  badgeProps?: React.ComponentProps<'span'>;
  children: React.ReactNode;
  className?: string;
}) {
  const badge = (
    <span
      {...badgeProps}
      className={cn(
        'inline-flex h-[calc(1lh+2px)] w-[1lh] shrink-0 items-center justify-center leading-none',
        badgeProps?.className,
        className
      )}
      contentEditable={false}
    >
      <CornerDownLeftIcon className="relative top-px size-4" />
    </span>
  );

  return (
    <>
      {children}
      {badge}
    </>
  );
}

function SuggestionLineBreakElementAnchor({
  badgeProps,
  children,
  className,
}: {
  badgeProps?: React.ComponentProps<'span'>;
  children: React.ReactElement<any>;
  className?: string;
}) {
  if (!React.isValidElement(children)) return children;
  const badge = (
    <span
      {...badgeProps}
      className={cn(
        'inline-flex h-[calc(1lh+2px)] w-[1lh] shrink-0 items-center justify-center leading-none',
        badgeProps?.className,
        className
      )}
      contentEditable={false}
    >
      <CornerDownLeftIcon className="relative top-px size-4" />
    </span>
  );

  if (children.type === 'ol' || children.type === 'ul') {
    const childNodes = React.Children.toArray(
      (children.props as { children?: React.ReactNode }).children
    );
    const lastIndex = childNodes.length - 1;
    const lastChild = childNodes[lastIndex];

    if (!React.isValidElement(lastChild) || lastChild.type !== 'li') {
      return children;
    }

    const nextLastChild = React.cloneElement(
      lastChild as React.ReactElement<any>,
      {
        children: (
          <>
            {(lastChild.props as { children?: React.ReactNode }).children}
            {badge}
          </>
        ),
      }
    );

    return React.cloneElement(children as React.ReactElement<any>, {
      children: [...childNodes.slice(0, lastIndex), nextLastChild],
    });
  }

  if (typeof children.type === 'string') {
    return (
      <>
        {children}
        {badge}
      </>
    );
  }

  return React.cloneElement(children as React.ReactElement<any>, {
    lineBreakBadge: badge,
  });
}

export function SuggestionLeaf(props: PlateLeafProps<TSuggestionText>) {
  const { api, setOption } = useEditorPlugin(suggestionPlugin);
  const leaf = props.leaf;

  const leafId: string = api.suggestion.nodeId(leaf) ?? '';
  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const hoverSuggestionId = usePluginOption(suggestionPlugin, 'hoverId');
  const dataList = api.suggestion.dataList(leaf);

  const hasRemove = dataList.some((data) => data.type === 'remove');
  const hasActive = dataList.some((data) => data.id === activeSuggestionId);
  const hasHover = dataList.some((data) => data.id === hoverSuggestionId);

  const diffOperation = { type: hasRemove ? 'delete' : 'insert' } as const;

  const Component = ({ delete: 'del', insert: 'ins', update: 'span' } as const)[
    diffOperation.type
  ];

  return (
    <PlateLeaf
      {...props}
      as={Component}
      className={cn(
        suggestionVariants({
          insertActive: hasActive || hasHover,
          remove: hasRemove,
          removeActive: (hasActive || hasHover) && hasRemove,
        })
      )}
      attributes={{
        ...props.attributes,
        onMouseEnter: () => setOption('hoverId', leafId),
        onMouseLeave: () => setOption('hoverId', null),
      }}
    >
      {props.children}
    </PlateLeaf>
  );
}
export const SuggestionLineBreak: RenderNodeWrapper<AnyPluginConfig> = ({
  api,
  element,
}) => {
  if (!api.suggestion.isBlockSuggestion(element)) return;

  const suggestionData = element.suggestion as TSuggestionData;

  return function Component({ children }) {
    return (
      <SuggestionLineBreakContent
        elementType={element.type}
        suggestionData={suggestionData}
      >
        {children}
      </SuggestionLineBreakContent>
    );
  };
};

export function SuggestionLineBreakContent({
  children,
  elementType,
  suggestionData,
}: {
  children: React.ReactNode;
  elementType?: string;
  suggestionData: TSuggestionData;
}) {
  const { isLineBreak, type } = suggestionData;
  const isRemove = type === 'remove';
  const isInsert = type === 'insert';

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const hoverSuggestionId = usePluginOption(suggestionPlugin, 'hoverId');

  const isActive = activeSuggestionId === suggestionData.id;
  const isHover = hoverSuggestionId === suggestionData.id;

  const { setOption } = useEditorPlugin(suggestionPlugin);
  const lineBreakBadgeClassName = cn(
    isInsert &&
      'bg-transparent! text-emerald-700! transition-colors duration-200',
    isInsert && (isActive || isHover) && 'bg-transparent! text-emerald-700!',
    isRemove && 'bg-transparent! text-red-700! transition-colors duration-200',
    isRemove && (isActive || isHover) && 'bg-transparent! text-red-700!'
  );

  return (
    <>
      {isLineBreak ? (
        React.isValidElement(children) && typeof children.type !== 'string' ? (
          <SuggestionLineBreakElementAnchor
            badgeProps={{
              onClick: (event) => {
                event.stopPropagation();
                setOption('activeId', suggestionData.id);
              },
              onMouseDown: (event) => {
                event.preventDefault();
              },
            }}
            className={lineBreakBadgeClassName}
          >
            {children}
          </SuggestionLineBreakElementAnchor>
        ) : React.isValidElement(children) &&
          (children.type === 'ol' || children.type === 'ul') ? (
          <SuggestionLineBreakElementAnchor
            badgeProps={{
              onClick: (event) => {
                event.stopPropagation();
                setOption('activeId', suggestionData.id);
              },
              onMouseDown: (event) => {
                event.preventDefault();
              },
            }}
            className={lineBreakBadgeClassName}
          >
            {children}
          </SuggestionLineBreakElementAnchor>
        ) : (
          <SuggestionLineBreakAnchor
            badgeProps={{
              onClick: (event) => {
                event.stopPropagation();
                setOption('activeId', suggestionData.id);
              },
              onMouseDown: (event) => {
                event.preventDefault();
              },
            }}
            className={lineBreakBadgeClassName}
          >
            {children}
          </SuggestionLineBreakAnchor>
        )
      ) : (
        <div
          className={getBlockSuggestionWrapperClassName({
            elementType,
            isActive,
            isHover,
            isInsert,
            isRemove,
          })}
          onMouseEnter={() => setOption('hoverId', suggestionData.id)}
          onMouseLeave={() => setOption('hoverId', null)}
          data-block-suggestion="true"
        >
          {children}
        </div>
      )}
    </>
  );
}
import * as React from 'react';

import { cva } from 'class-variance-authority';
import type { TElement, TSuggestionText } from 'platejs';
import type { SlateLeafProps } from 'platejs/static';

import { BaseSuggestionPlugin } from '@platejs/suggestion';
import { SlateLeaf } from 'platejs/static';

import { cn } from '@/lib/utils';

export const voidRemoveSuggestionClass =
  'relative overflow-hidden before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-20 before:flex before:size-10 before:-translate-x-1/2 before:-translate-y-1/2 before:items-center before:justify-center before:rounded-full before:bg-red-500/90 before:text-2xl before:font-semibold before:text-white before:shadow-lg before:content-["X"] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:border after:border-red-300/80 after:bg-zinc-950/35 after:content-[""]';

export const voidRemoveSuggestionOverlayVariants = cva(
  'pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]',
  {
    defaultVariants: {
      active: false,
    },
    variants: {
      active: {
        false: 'hidden',
        true: 'before:-translate-x-1/2 before:-translate-y-1/2 before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-20 before:flex before:size-10 before:items-center before:justify-center before:rounded-full before:bg-red-500/90 before:font-semibold before:text-2xl before:text-white before:shadow-lg before:content-["X"] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:border after:border-red-300/80 after:bg-zinc-950/35 after:content-[""]',
      },
    },
  }
);

export const voidRemoveSuggestionVariants = cva('', {
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: '',
      true: voidRemoveSuggestionClass,
    },
  },
});

export function isStaticVoidRemoveSuggestion(element: TElement) {
  return (
    (element as TElement & { suggestion?: { type?: string } }).suggestion
      ?.type === 'remove'
  );
}

export function VoidRemoveSuggestionOverlayStatic({
  editor,
  element,
}: {
  editor: any;
  element: TElement;
}) {
  const active =
    editor.api.isVoid(element) &&
    !editor.api.isInline(element) &&
    isStaticVoidRemoveSuggestion(element);

  if (!active) return null;

  return (
    <div
      className={voidRemoveSuggestionOverlayVariants({ active })}
      contentEditable={false}
      data-slot="void-remove-suggestion"
    />
  );
}

export function SuggestionLeafStatic(props: SlateLeafProps<TSuggestionText>) {
  const { editor, leaf } = props;

  const dataList = editor
    .getApi(BaseSuggestionPlugin)
    .suggestion.dataList(leaf);
  const hasRemove = dataList.some((data) => data.type === 'remove');
  const diffOperation = { type: hasRemove ? 'delete' : 'insert' } as const;

  const Component = ({ delete: 'del', insert: 'ins', update: 'span' } as const)[
    diffOperation.type
  ];

  return (
    <SlateLeaf
      {...props}
      as={Component}
      className={cn(
        'border-b-2 border-b-brand/[.24] bg-brand/[.08] text-brand/80 no-underline transition-colors duration-200',
        hasRemove &&
          'border-b-gray-300 bg-gray-300/25 text-gray-400 line-through'
      )}
    >
      {props.children}
    </SlateLeaf>
  );
}
'use client';

import * as React from 'react';

import { SuggestionPlugin } from '@platejs/suggestion/react';
import { PencilLineIcon } from 'lucide-react';
import { useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';

import { ToolbarButton } from './toolbar';

export function SuggestionToolbarButton() {
  const { setOption } = useEditorPlugin(SuggestionPlugin);
  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');

  return (
    <ToolbarButton
      className={cn(isSuggesting && 'text-brand/80 hover:text-brand/80')}
      onClick={() => setOption('isSuggesting', !isSuggesting)}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={isSuggesting ? 'Turn off suggesting' : 'Suggestion edits'}
    >
      <PencilLineIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';

import { getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin } from '@platejs/comment/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  MessageSquareTextIcon,
  MessagesSquareIcon,
  PencilLineIcon,
} from 'lucide-react';
import { type AnyPluginConfig, type NodeEntry, PathApi } from 'platejs';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import type { TDiscussion } from '@/components/editor/plugins/discussion-kit';
import { useBlockDiscussionItems } from '@/lib/block-discussion-index';
import { suggestionPlugin } from '@/components/editor/plugins/suggestion-kit';

import { BlockSuggestionCard, isResolvedSuggestion } from './block-suggestion';
import { Comment, CommentCreateForm } from './comment';

export const BlockDiscussion: RenderNodeWrapper<AnyPluginConfig> =
  (_props) => (props) => <BlockCommentContent {...props} />;

const BlockCommentContent = ({ children, element }: PlateElementProps) => {
  const editor = useEditorRef();
  const commentsApi = editor.getApi(CommentPlugin).comment;
  const blockPath = editor.api.findPath(element) ?? [];
  const isTopLevelBlock = blockPath.length === 1;
  const draftCommentNode = isTopLevelBlock
    ? commentsApi.node({ at: blockPath, isDraft: true })
    : undefined;
  const commentNodes = isTopLevelBlock
    ? [...commentsApi.nodes({ at: blockPath })]
    : [];
  const suggestionNodes = isTopLevelBlock
    ? [
        ...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath }),
      ].filter(([node]) => !node[getTransientSuggestionKey()])
    : [];
  const { resolvedDiscussions, resolvedSuggestions } =
    useBlockDiscussionItems(blockPath);

  const suggestionsCount = resolvedSuggestions.length;
  const discussionsCount = resolvedDiscussions.length;
  const totalCount = suggestionsCount + discussionsCount;

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const activeSuggestion =
    activeSuggestionId &&
    resolvedSuggestions.find((s) => s.suggestionId === activeSuggestionId);

  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock');
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const isCommenting = activeCommentId === getDraftCommentKey();
  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((d) => d.id === activeCommentId);

  const noneActive = !activeSuggestion && !activeDiscussion;

  const sortedMergedData = [
    ...resolvedDiscussions,
    ...resolvedSuggestions,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const selected =
    resolvedDiscussions.some((d) => d.id === activeCommentId) ||
    resolvedSuggestions.some((s) => s.suggestionId === activeSuggestionId);

  const [_open, setOpen] = React.useState(selected);

  // in some cases, we may comment the multiple blocks
  const commentingCurrent =
    !!commentingBlock && PathApi.equals(blockPath, commentingBlock);

  const open =
    _open ||
    selected ||
    (isCommenting && !!draftCommentNode && commentingCurrent);

  const anchorElement = React.useMemo(() => {
    let activeNode: NodeEntry | undefined;

    if (activeSuggestion) {
      activeNode = suggestionNodes.find(
        ([node]) =>
          editor.getApi(SuggestionPlugin).suggestion.nodeId(node) ===
          activeSuggestion.suggestionId
      );
    }

    if (activeCommentId) {
      if (activeCommentId === getDraftCommentKey()) {
        activeNode = draftCommentNode;
      } else {
        activeNode = commentNodes.find(
          ([node]) =>
            editor.getApi(commentPlugin).comment.nodeId(node) ===
            activeCommentId
        );
      }
    }

    if (!activeNode) return null;

    return editor.api.toDOMNode(activeNode[0])!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    activeSuggestion,
    activeCommentId,
    editor.api,
    suggestionNodes,
    draftCommentNode,
    commentNodes,
  ]);

  if (!isTopLevelBlock) return <>{children}</>;

  if (suggestionsCount + resolvedDiscussions.length === 0 && !draftCommentNode)
    return <div className="w-full">{children}</div>;

  return (
    <div className="flex w-full justify-between">
      <Popover
        open={open}
        onOpenChange={(_open_) => {
          if (!_open_ && isCommenting && draftCommentNode) {
            editor.tf.unsetNodes(getDraftCommentKey(), {
              at: [],
              mode: 'lowest',
              match: (n) => n[getDraftCommentKey()],
            });
          }
          setOpen(_open_);
        }}
      >
        <div className="w-full">{children}</div>
        {anchorElement && (
          <PopoverAnchor
            asChild
            className="w-full"
            virtualRef={{ current: anchorElement }}
          />
        )}

        <PopoverContent
          className="max-h-[min(50dvh,calc(-24px+var(--radix-popper-available-height)))] w-[380px] min-w-[130px] max-w-[calc(100vw-24px)] overflow-y-auto p-0 data-[state=closed]:opacity-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="center"
          side="bottom"
        >
          {isCommenting ? (
            <CommentCreateForm className="p-4" focusOnMount />
          ) : noneActive ? (
            sortedMergedData.map((item, index) =>
              isResolvedSuggestion(item) ? (
                <BlockSuggestionCard
                  key={item.suggestionId}
                  idx={index}
                  isLast={index === sortedMergedData.length - 1}
                  suggestion={item}
                />
              ) : (
                <BlockComment
                  key={item.id}
                  discussion={item}
                  isLast={index === sortedMergedData.length - 1}
                />
              )
            )
          ) : (
            <>
              {activeSuggestion && (
                <BlockSuggestionCard
                  key={activeSuggestion.suggestionId}
                  idx={0}
                  isLast={true}
                  suggestion={activeSuggestion}
                />
              )}

              {activeDiscussion && (
                <BlockComment discussion={activeDiscussion} isLast={true} />
              )}
            </>
          )}
        </PopoverContent>

        {totalCount > 0 && (
          <div className="relative left-0 size-0 select-none">
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="!px-1.5 mt-1 ml-1 flex h-6 gap-1 py-0 text-muted-foreground/80 hover:text-muted-foreground/80 data-[active=true]:bg-muted"
                data-active={open}
                contentEditable={false}
              >
                {suggestionsCount > 0 && discussionsCount === 0 && (
                  <PencilLineIcon className="size-4 shrink-0" />
                )}

                {suggestionsCount === 0 && discussionsCount > 0 && (
                  <MessageSquareTextIcon className="size-4 shrink-0" />
                )}

                {suggestionsCount > 0 && discussionsCount > 0 && (
                  <MessagesSquareIcon className="size-4 shrink-0" />
                )}

                <span className="font-semibold text-xs">{totalCount}</span>
              </Button>
            </PopoverTrigger>
          </div>
        )}
      </Popover>
    </div>
  );
};

function BlockComment({
  discussion,
  isLast,
}: {
  discussion: TDiscussion;
  isLast: boolean;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <React.Fragment key={discussion.id}>
      <div className="p-4">
        {discussion.comments.map((comment, index) => (
          <Comment
            key={comment.id ?? index}
            comment={comment}
            discussionLength={discussion.comments.length}
            documentContent={discussion?.documentContent}
            editingId={editingId}
            index={index}
            setEditingId={setEditingId}
            showDocumentContent
          />
        ))}
        <CommentCreateForm discussionId={discussion.id} />
      </div>

      {!isLast && <div className="h-px w-full bg-muted" />}
    </React.Fragment>
  );
}
'use client';

import * as React from 'react';

import { acceptSuggestion, rejectSuggestion } from '@platejs/suggestion';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { CheckIcon, XIcon } from 'lucide-react';
import { useEditorPlugin, usePluginOption } from 'platejs/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/editor/plugins/discussion-kit';

import { Comment, CommentCreateForm, formatCommentDate } from './comment';
import {
  BLOCK_SUGGESTION_TOKEN,
  type ResolvedSuggestion,
} from '@/lib/block-discussion-index';

export function BlockSuggestionCard({
  idx,
  isLast,
  suggestion,
}: {
  idx: number;
  isLast: boolean;
  suggestion: ResolvedSuggestion;
}) {
  const { api, editor } = useEditorPlugin(SuggestionPlugin);

  const userInfo = usePluginOption(discussionPlugin, 'user', suggestion.userId);

  const accept = (suggestion: ResolvedSuggestion) => {
    api.suggestion.withoutSuggestions(() => {
      acceptSuggestion(editor, suggestion);
    });
  };

  const reject = (suggestion: ResolvedSuggestion) => {
    api.suggestion.withoutSuggestions(() => {
      rejectSuggestion(editor, suggestion);
    });
  };

  const [hovering, setHovering] = React.useState(false);

  const suggestionText2Array = (text: string) => {
    if (text === BLOCK_SUGGESTION_TOKEN) return ['line breaks'];

    return text.split(BLOCK_SUGGESTION_TOKEN).filter(Boolean);
  };

  const getRemoveSummaryItems = (text: string) => {
    const items = suggestionText2Array(text).map((item) => {
      if (item === 'column_group') return 'Column';
      if (item === 'code_block') return 'Code Block';

      return item;
    });

    if (items.includes('Table')) return ['Table'];
    if (items.includes('Code Block')) return ['Code Block'];
    if (items.includes('Column')) return ['Column'];

    return items;
  };

  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <div
      key={`${suggestion.suggestionId}-${idx}`}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex flex-col p-4">
        <div className="relative flex items-center">
          {/* Replace to your own backend or refer to potion */}
          <Avatar className="size-5">
            <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
            <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
          </Avatar>
          <h4 className="mx-2 font-semibold text-sm leading-none">
            {userInfo?.name}
          </h4>
          <div className="text-muted-foreground/80 text-xs leading-none">
            <span className="mr-1">
              {formatCommentDate(new Date(suggestion.createdAt))}
            </span>
          </div>
        </div>

        <div className="relative mt-1 mb-4 pl-[32px]">
          <div className="flex flex-col gap-2">
            {suggestion.type === 'remove' &&
              getRemoveSummaryItems(suggestion.text!).map((text, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Delete:</span>

                  <span key={index} className="text-sm">
                    {text}
                  </span>
                </div>
              ))}

            {suggestion.type === 'insert' &&
              suggestionText2Array(suggestion.newText!).map((text, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Add:</span>

                  <span key={index} className="text-sm">
                    {text || 'line breaks'}
                  </span>
                </div>
              ))}

            {suggestion.type === 'replace' && (
              <div className="flex flex-col gap-2">
                {suggestionText2Array(suggestion.newText!).map(
                  (text, index) => (
                    <React.Fragment key={index}>
                      <div
                        key={index}
                        className="flex items-start gap-2 text-brand/80"
                      >
                        <span className="text-sm">with:</span>
                        <span className="text-sm">{text || 'line breaks'}</span>
                      </div>
                    </React.Fragment>
                  )
                )}

                {suggestionText2Array(suggestion.text!).map((text, index) => (
                  <React.Fragment key={index}>
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground text-sm">
                        {index === 0 ? 'Replace:' : 'Delete:'}
                      </span>
                      <span className="text-sm">{text || 'line breaks'}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}

            {suggestion.type === 'update' && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {Object.keys(suggestion.properties).map((key) => (
                    <span key={key}>Un{key}</span>
                  ))}

                  {Object.keys(suggestion.newProperties).map((key) => (
                    <span key={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  ))}
                </span>
                <span className="text-sm">{suggestion.newText}</span>
              </div>
            )}
          </div>
        </div>

        {suggestion.comments.map((comment, index) => (
          <Comment
            key={comment.id ?? index}
            comment={comment}
            discussionLength={suggestion.comments.length}
            documentContent="__suggestion__"
            editingId={editingId}
            index={index}
            setEditingId={setEditingId}
          />
        ))}

        {hovering && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              className="size-6 p-1 text-muted-foreground"
              onClick={() => accept(suggestion)}
            >
              <CheckIcon className="size-4" />
            </Button>

            <Button
              variant="ghost"
              className="size-6 p-1 text-muted-foreground"
              onClick={() => reject(suggestion)}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        )}

        <CommentCreateForm discussionId={suggestion.suggestionId} />
      </div>

      {!isLast && <div className="h-px w-full bg-muted" />}
    </div>
  );
}

export const isResolvedSuggestion = (
  suggestion: ResolvedSuggestion | TDiscussion
): suggestion is ResolvedSuggestion => 'suggestionId' in suggestion;
'use client';

import * as React from 'react';

import type { CreatePlateEditorOptions } from 'platejs/react';

import { getCommentKey, getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin, useCommentId } from '@platejs/comment/react';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from 'date-fns';
import {
  ArrowUpIcon,
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import {
  type NodeEntry,
  type TCommentText,
  type Value,
  KEYS,
  nanoid,
  NodeApi,
} from 'platejs';
import {
  Plate,
  useEditorPlugin,
  useEditorRef,
  usePlateEditor,
  usePluginOption,
} from 'platejs/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/editor/plugins/discussion-kit';

import { Editor, EditorContainer } from './editor';

export type TComment = {
  id: string;
  contentRich: Value;
  createdAt: Date;
  discussionId: string;
  isEdited: boolean;
  userId: string;
};

export function Comment(props: {
  comment: TComment;
  discussionLength: number;
  editingId: string | null;
  index: number;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  documentContent?: string;
  showDocumentContent?: boolean;
  onEditorClick?: () => void;
}) {
  const {
    comment,
    discussionLength,
    documentContent,
    editingId,
    index,
    setEditingId,
    showDocumentContent = false,
    onEditorClick,
  } = props;

  const editor = useEditorRef();
  const userInfo = usePluginOption(discussionPlugin, 'user', comment.userId);
  const currentUserId = usePluginOption(discussionPlugin, 'currentUserId');

  const resolveDiscussion = async (id: string) => {
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .map((discussion) => {
        if (discussion.id === id) {
          return { ...discussion, isResolved: true };
        }
        return discussion;
      });
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  };

  const removeDiscussion = async (id: string) => {
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .filter((discussion) => discussion.id !== id);
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  };

  const updateComment = async (input: {
    id: string;
    contentRich: Value;
    discussionId: string;
    isEdited: boolean;
  }) => {
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .map((discussion) => {
        if (discussion.id === input.discussionId) {
          const updatedComments = discussion.comments.map((comment) => {
            if (comment.id === input.id) {
              return {
                ...comment,
                contentRich: input.contentRich,
                isEdited: true,
                updatedAt: new Date(),
              };
            }
            return comment;
          });
          return { ...discussion, comments: updatedComments };
        }
        return discussion;
      });
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  };

  const { tf } = useEditorPlugin(CommentPlugin);

  // Replace to your own backend or refer to potion
  const isMyComment = currentUserId === comment.userId;

  const initialValue = comment.contentRich;

  const commentEditor = useCommentEditor(
    {
      id: comment.id,
      value: initialValue,
    },
    [initialValue]
  );

  const onCancel = () => {
    setEditingId(null);
    commentEditor.tf.replaceNodes(initialValue, {
      at: [],
      children: true,
    });
  };

  const onSave = () => {
    void updateComment({
      id: comment.id,
      contentRich: commentEditor.children,
      discussionId: comment.discussionId,
      isEdited: true,
    });
    setEditingId(null);
  };

  const onResolveComment = () => {
    void resolveDiscussion(comment.discussionId);
    tf.comment.unsetMark({ id: comment.discussionId });
  };

  const isFirst = index === 0;
  const isLast = index === discussionLength - 1;
  const isEditing = editingId && editingId === comment.id;

  const [hovering, setHovering] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative flex items-center">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
        <h4 className="mx-2 font-semibold text-sm leading-none">
          {/* Replace to your own backend or refer to potion */}
          {userInfo?.name}
        </h4>

        <div className="text-muted-foreground/80 text-xs leading-none">
          <span className="mr-1">
            {formatCommentDate(new Date(comment.createdAt))}
          </span>
          {comment.isEdited && <span>(edited)</span>}
        </div>

        {isMyComment && (hovering || dropdownOpen) && (
          <div className="absolute top-0 right-0 flex space-x-1">
            {index === 0 && (
              <Button
                variant="ghost"
                className="h-6 p-1 text-muted-foreground"
                onClick={onResolveComment}
                type="button"
              >
                <CheckIcon className="size-4" />
              </Button>
            )}

            <CommentMoreDropdown
              onCloseAutoFocus={() => {
                setTimeout(() => {
                  commentEditor.tf.focus({ edge: 'endEditor' });
                }, 0);
              }}
              onRemoveComment={() => {
                if (discussionLength === 1) {
                  tf.comment.unsetMark({ id: comment.discussionId });
                  void removeDiscussion(comment.discussionId);
                }
              }}
              comment={comment}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              setEditingId={setEditingId}
            />
          </div>
        )}
      </div>

      {isFirst && showDocumentContent && (
        <div className="relative mt-1 flex pl-[32px] text-sm text-subtle-foreground">
          {discussionLength > 1 && (
            <div className="absolute top-[5px] left-3 h-full w-0.5 shrink-0 bg-muted" />
          )}
          <div className="my-px w-0.5 shrink-0 bg-highlight" />
          {documentContent && <div className="ml-2">{documentContent}</div>}
        </div>
      )}

      <div className="relative my-1 pl-[26px]">
        {!isLast && (
          <div className="absolute top-0 left-3 h-full w-0.5 shrink-0 bg-muted" />
        )}
        <Plate readOnly={!isEditing} editor={commentEditor}>
          <EditorContainer variant="comment">
            <Editor
              variant="comment"
              className="w-auto grow"
              onClick={() => onEditorClick?.()}
            />

            {isEditing && (
              <div className="ml-auto flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-[28px]"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    void onCancel();
                  }}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-primary/40">
                    <XIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    void onSave();
                  }}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-brand">
                    <CheckIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>
              </div>
            )}
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}

function CommentMoreDropdown(props: {
  comment: TComment;
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  onCloseAutoFocus?: () => void;
  onRemoveComment?: () => void;
}) {
  const {
    comment,
    dropdownOpen,
    setDropdownOpen,
    setEditingId,
    onCloseAutoFocus,
    onRemoveComment,
  } = props;

  const editor = useEditorRef();

  const selectedEditCommentRef = React.useRef<boolean>(false);

  const onDeleteComment = React.useCallback(() => {
    if (!comment.id)
      return alert('You are operating too quickly, please try again later.');

    // Find and update the discussion
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .map((discussion) => {
        if (discussion.id !== comment.discussionId) {
          return discussion;
        }

        const commentIndex = discussion.comments.findIndex(
          (c) => c.id === comment.id
        );
        if (commentIndex === -1) {
          return discussion;
        }

        return {
          ...discussion,
          comments: [
            ...discussion.comments.slice(0, commentIndex),
            ...discussion.comments.slice(commentIndex + 1),
          ],
        };
      });

    // Save back to session storage
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
    onRemoveComment?.();
  }, [comment.discussionId, comment.id, editor, onRemoveComment]);

  const onEditComment = React.useCallback(() => {
    selectedEditCommentRef.current = true;

    if (!comment.id)
      return alert('You are operating too quickly, please try again later.');

    setEditingId(comment.id);
  }, [comment.id, setEditingId]);

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      modal={false}
    >
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className={cn('h-6 p-1 text-muted-foreground')}>
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        onCloseAutoFocus={(e) => {
          if (selectedEditCommentRef.current) {
            onCloseAutoFocus?.();
            selectedEditCommentRef.current = false;
          }

          return e.preventDefault();
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEditComment}>
            <PencilIcon className="size-4" />
            Edit comment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeleteComment}>
            <TrashIcon className="size-4" />
            Delete comment
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const useCommentEditor = (
  options: Omit<CreatePlateEditorOptions, 'plugins'> = {},
  deps: any[] = []
) => {
  const commentEditor = usePlateEditor(
    {
      id: 'comment',
      plugins: BasicMarksKit,
      value: [],
      ...options,
    },
    deps
  );

  return commentEditor;
};

export function CommentCreateForm({
  autoFocus = false,
  className,
  discussionId: discussionIdProp,
  focusOnMount = false,
}: {
  autoFocus?: boolean;
  className?: string;
  discussionId?: string;
  focusOnMount?: boolean;
}) {
  const discussions = usePluginOption(discussionPlugin, 'discussions');

  const editor = useEditorRef();
  const commentId = useCommentId();
  const discussionId = discussionIdProp ?? commentId;

  const userInfo = usePluginOption(discussionPlugin, 'currentUser');
  const [commentValue, setCommentValue] = React.useState<Value | undefined>();
  const commentContent = React.useMemo(
    () =>
      commentValue
        ? NodeApi.string({ children: commentValue, type: KEYS.p })
        : '',
    [commentValue]
  );
  const commentEditor = useCommentEditor();

  React.useEffect(() => {
    if (commentEditor && focusOnMount) {
      commentEditor.tf.focus();
    }
  }, [commentEditor, focusOnMount]);

  const onAddComment = React.useCallback(async () => {
    if (!commentValue) return;

    commentEditor.tf.reset();

    if (discussionId) {
      // Get existing discussion
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) {
        // Mock creating suggestion
        const newDiscussion: TDiscussion = {
          id: discussionId,
          comments: [
            {
              id: nanoid(),
              contentRich: commentValue,
              createdAt: new Date(),
              discussionId,
              isEdited: false,
              userId: editor.getOption(discussionPlugin, 'currentUserId'),
            },
          ],
          createdAt: new Date(),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        };

        editor.setOption(discussionPlugin, 'discussions', [
          ...discussions,
          newDiscussion,
        ]);
        return;
      }

      // Create reply comment
      const comment: TComment = {
        id: nanoid(),
        contentRich: commentValue,
        createdAt: new Date(),
        discussionId,
        isEdited: false,
        userId: editor.getOption(discussionPlugin, 'currentUserId'),
      };

      // Add reply to discussion comments
      const updatedDiscussion = {
        ...discussion,
        comments: [...discussion.comments, comment],
      };

      // Filter out old discussion and add updated one
      const updatedDiscussions = discussions
        .filter((d) => d.id !== discussionId)
        .concat(updatedDiscussion);

      editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);

      return;
    }

    const commentsNodeEntry = editor
      .getApi(CommentPlugin)
      .comment.nodes({ at: [], isDraft: true });

    if (commentsNodeEntry.length === 0) return;

    const documentContent = commentsNodeEntry
      .map(([node, _path]: NodeEntry<TCommentText>) => node.text)
      .join('');

    const _discussionId = nanoid();
    // Mock creating new discussion
    const newDiscussion: TDiscussion = {
      id: _discussionId,
      comments: [
        {
          id: nanoid(),
          contentRich: commentValue,
          createdAt: new Date(),
          discussionId: _discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        },
      ],
      createdAt: new Date(),
      documentContent,
      isResolved: false,
      userId: editor.getOption(discussionPlugin, 'currentUserId'),
    };

    editor.setOption(discussionPlugin, 'discussions', [
      ...discussions,
      newDiscussion,
    ]);

    const id = newDiscussion.id;

    commentsNodeEntry.forEach(([, path]: NodeEntry<TCommentText>) => {
      editor.tf.setNodes(
        {
          [getCommentKey(id)]: true,
        },
        { at: path, split: true }
      );
      editor.tf.unsetNodes([getDraftCommentKey()], { at: path });
    });
  }, [commentValue, commentEditor.tf, discussionId, editor, discussions]);

  return (
    <div className={cn('flex w-full', className)}>
      <div className="mt-2 mr-1 shrink-0">
        {/* Replace to your own backend or refer to potion */}
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="relative flex grow gap-2">
        <Plate
          onChange={({ value }) => {
            setCommentValue(value);
          }}
          editor={commentEditor}
        >
          <EditorContainer variant="comment">
            <Editor
              variant="comment"
              className="min-h-[25px] grow pt-0.5 pr-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddComment();
                }
              }}
              placeholder="Reply..."
              autoComplete="off"
              autoFocus={autoFocus}
            />

            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0.5 bottom-0.5 ml-auto size-6 shrink-0"
              disabled={commentContent.trim().length === 0}
              onClick={(e) => {
                e.stopPropagation();
                onAddComment();
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-full">
                <ArrowUpIcon />
              </div>
            </Button>
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}

export const formatCommentDate = (date: Date) => {
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 2) {
    return `${diffDays}d`;
  }

  return format(date, 'MM/dd/yyyy');
};
'use client';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  type PlateElementProps,
  type PlateTextProps,
  PlateElement,
  PlateText,
  usePluginOption,
} from 'platejs/react';

import { cn } from '@/lib/utils';

export function AILeaf(props: PlateTextProps) {
  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const streamingLeaf = props.editor
    .getApi(AIChatPlugin)
    .aiChat.node({ streaming: true });

  const isLast = streamingLeaf?.[0] === props.text;

  return (
    <PlateText
      className={cn(
        'border-b-2 border-b-purple-100 bg-purple-50 text-purple-800',
        'transition-all duration-200 ease-in-out',
        isLast &&
          streaming &&
          'after:ml-1.5 after:inline-block after:h-3 after:w-3 after:rounded-full after:bg-primary after:align-middle after:content-[""]'
      )}
      {...props}
    />
  );
}

export function AIAnchorElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <div className="h-[0.1px]" />
    </PlateElement>
  );
}
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { EmojiInlineIndexSearch, insertEmoji } from '@platejs/emoji';
import { EmojiPlugin } from '@platejs/emoji/react';
import { PlateElement, usePluginOption } from 'platejs/react';

import { useDebounce } from '@/hooks/use-debounce';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

const TRAILING_COLON_REGEX = /:$/;

export function EmojiInputElement(props: PlateElementProps) {
  const { children, editor, element } = props;
  const data = usePluginOption(EmojiPlugin, 'data')!;
  const [value, setValue] = React.useState('');
  const debouncedValue = useDebounce(value, 100);
  const isPending = value !== debouncedValue;

  const filteredEmojis = React.useMemo(() => {
    if (debouncedValue.trim().length === 0) return [];

    return EmojiInlineIndexSearch.getInstance(data)
      .search(debouncedValue.replace(TRAILING_COLON_REGEX, ''))
      .get();
  }, [data, debouncedValue]);

  return (
    <PlateElement as="span" {...props}>
      <InlineCombobox
        value={value}
        element={element}
        filter={false}
        setValue={setValue}
        trigger=":"
        hideWhenNoValue
      >
        <InlineComboboxInput />

        <InlineComboboxContent>
          {!isPending && <InlineComboboxEmpty>No results</InlineComboboxEmpty>}

          <InlineComboboxGroup>
            {filteredEmojis.map((emoji) => (
              <InlineComboboxItem
                key={emoji.id}
                value={emoji.name}
                onClick={() => insertEmoji(editor, emoji)}
              >
                {emoji.skins[0].native} {emoji.name}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {children}
    </PlateElement>
  );
}
'use client';

import * as React from 'react';

import { useMarkToolbarButton, useMarkToolbarButtonState } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function MarkToolbarButton({
  clear,
  nodeType,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  nodeType: string;
  clear?: string[] | string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return <ToolbarButton {...props} {...buttonProps} />;
}
'use client';

import * as React from 'react';

import { useDraggable, useDropLine } from '@platejs/dnd';
import {
  BlockSelectionPlugin,
  useBlockSelected,
} from '@platejs/selection/react';
import { resizeLengthClampStatic } from '@platejs/resizable';
import {
  getTableColumnCount,
  setCellBackground,
  setTableColSize,
  setTableMarginLeft,
  setTableRowSize,
} from '@platejs/table';
import {
  TablePlugin,
  TableProvider,
  roundCellSizeToStep,
  useCellIndices,
  useOverrideColSize,
  useOverrideMarginLeft,
  useOverrideRowSize,
  useTableCellBorders,
  useTableBordersDropdownMenuContentState,
  useTableColSizes,
  useTableElement,
  useTableMergeState,
  useTableSelectionDom,
  useTableValue,
} from '@platejs/table/react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CombineIcon,
  EraserIcon,
  Grid2X2Icon,
  GripVertical,
  PaintBucketIcon,
  SquareSplitHorizontalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  KEYS,
  PathApi,
} from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useComposedRef,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC,
} from 'platejs/react';
import { useElementSelector } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { blockSelectionVariants } from './block-selection';
import {
  ColorDropdownMenuItems,
  DEFAULT_COLORS,
} from './font-color-toolbar-button';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon,
} from './table-icons';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from './toolbar';

type TableResizeDirection = 'bottom' | 'left' | 'right';

type TableResizeStartOptions = {
  colIndex: number;
  direction: TableResizeDirection;
  handleKey: string;
  rowIndex: number;
};

type TableResizeDragState = {
  colIndex: number;
  direction: TableResizeDirection;
  initialPosition: number;
  initialSize: number;
  marginLeft: number;
  rowIndex: number;
};

type TableResizeContextValue = {
  disableMarginLeft: boolean;
  clearResizePreview: (handleKey: string) => void;
  setResizePreview: (
    event: React.PointerEvent<HTMLDivElement>,
    options: TableResizeStartOptions
  ) => void;
  startResize: (
    event: React.PointerEvent<HTMLDivElement>,
    options: TableResizeStartOptions
  ) => void;
};

const TABLE_CONTROL_COLUMN_WIDTH = 8;
const TABLE_DEFAULT_COLUMN_WIDTH = 120;
const TABLE_DEFERRED_COLUMN_RESIZE_CELL_COUNT = 1200;
const TABLE_MULTI_SELECTION_TOOLBAR_DELAY_MS = 150;

const TableResizeContext = React.createContext<TableResizeContextValue | null>(
  null
);

function useTableResizeContext() {
  const context = React.useContext(TableResizeContext);

  if (!context) {
    throw new Error('TableResizeContext is missing');
  }

  return context;
}

function useTableResizeController({
  deferColumnResize,
  dragIndicatorRef,
  hoverIndicatorRef,
  marginLeft,
  controlColumnWidth,
  tablePath,
  tableRef,
  wrapperRef,
}: {
  deferColumnResize: boolean;
  dragIndicatorRef: React.RefObject<HTMLDivElement | null>;
  hoverIndicatorRef: React.RefObject<HTMLDivElement | null>;
  marginLeft: number;
  controlColumnWidth: number;
  tablePath: number[];
  tableRef: React.RefObject<HTMLTableElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { editor, getOptions } = useEditorPlugin(TablePlugin);
  const { disableMarginLeft = false, minColumnWidth = 0 } = getOptions();
  const colSizes = useTableColSizes({
    disableOverrides: true,
  });
  const effectiveColSizes = React.useMemo(
    () => colSizes.map((colSize) => colSize || TABLE_DEFAULT_COLUMN_WIDTH),
    [colSizes]
  );
  const effectiveColSizesRef = React.useRef(effectiveColSizes);
  const activeHandleKeyRef = React.useRef<string | null>(null);
  const activeRowElementRef = React.useRef<HTMLTableRowElement | null>(null);
  const cleanupListenersRef = React.useRef<(() => void) | null>(null);
  const marginLeftRef = React.useRef(marginLeft);
  const dragStateRef = React.useRef<TableResizeDragState | null>(null);
  const frozenRowIndicesRef = React.useRef<number[] | null>(null);
  const previewHandleKeyRef = React.useRef<string | null>(null);
  const overrideColSize = useOverrideColSize();
  const overrideMarginLeft = useOverrideMarginLeft();
  const overrideRowSize = useOverrideRowSize();

  React.useEffect(() => {
    effectiveColSizesRef.current = effectiveColSizes;
  }, [effectiveColSizes]);

  React.useEffect(() => {
    marginLeftRef.current = marginLeft;
  }, [marginLeft]);

  const hideDeferredResizeIndicator = React.useCallback(() => {
    const indicator = dragIndicatorRef.current;

    if (!indicator) return;

    indicator.style.display = 'none';
    indicator.style.removeProperty('left');
  }, [dragIndicatorRef]);

  const showDeferredResizeIndicator = React.useCallback(
    (offset: number) => {
      const indicator = dragIndicatorRef.current;

      if (!indicator) return;

      indicator.style.display = 'block';
      indicator.style.left = `${offset}px`;
    },
    [dragIndicatorRef]
  );

  const hideResizeIndicator = React.useCallback(() => {
    const indicator = hoverIndicatorRef.current;

    if (!indicator) return;

    indicator.style.display = 'none';
    indicator.style.removeProperty('left');
  }, [hoverIndicatorRef]);

  const clearFrozenRowHeights = React.useCallback(() => {
    const frozenRowIndices = frozenRowIndicesRef.current;

    if (!frozenRowIndices) return;

    frozenRowIndicesRef.current = null;

    frozenRowIndices.forEach((rowIndex) => {
      overrideRowSize(rowIndex, null);
    });
  }, [overrideRowSize]);

  const freezeRowHeights = React.useCallback(() => {
    const table = tableRef.current;

    if (!table || deferColumnResize) return;

    clearFrozenRowHeights();

    const frozenRowIndices: number[] = [];

    Array.from(table.rows).forEach((row, rowIndex) => {
      const height = row.getBoundingClientRect().height;

      if (!height) return;

      overrideRowSize(rowIndex, height);
      frozenRowIndices.push(rowIndex);
    });

    frozenRowIndicesRef.current = frozenRowIndices;
  }, [clearFrozenRowHeights, deferColumnResize, overrideRowSize, tableRef]);

  const showResizeIndicatorAtOffset = React.useCallback(
    (offset: number) => {
      const indicator = hoverIndicatorRef.current;

      if (!indicator) return;

      indicator.style.display = 'block';
      indicator.style.left = `${offset}px`;
    },
    [hoverIndicatorRef]
  );

  const showResizeIndicator = React.useCallback(
    ({
      event,
      direction,
    }: Pick<TableResizeStartOptions, 'direction'> & {
      event: React.PointerEvent<HTMLDivElement>;
    }) => {
      if (direction === 'bottom') return;

      const wrapper = wrapperRef.current;

      if (!wrapper) return;

      const handleRect = event.currentTarget.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const boundaryOffset =
        handleRect.left - wrapperRect.left + handleRect.width / 2;

      showResizeIndicatorAtOffset(boundaryOffset);
    },
    [showResizeIndicatorAtOffset, wrapperRef]
  );

  const setResizePreview = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      options: TableResizeStartOptions
    ) => {
      if (activeHandleKeyRef.current) return;

      previewHandleKeyRef.current = options.handleKey;
      showResizeIndicator({ ...options, event });
    },
    [showResizeIndicator]
  );

  const clearResizePreview = React.useCallback(
    (handleKey: string) => {
      if (activeHandleKeyRef.current) return;
      if (previewHandleKeyRef.current !== handleKey) return;

      previewHandleKeyRef.current = null;
      hideResizeIndicator();
    },
    [hideResizeIndicator]
  );

  const commitColSize = React.useCallback(
    (colIndex: number, width: number) => {
      setTableColSize(editor, { colIndex, width }, { at: tablePath });
      setTimeout(() => overrideColSize(colIndex, null), 0);
    },
    [editor, overrideColSize, tablePath]
  );

  const commitRowSize = React.useCallback(
    (rowIndex: number, height: number) => {
      setTableRowSize(editor, { height, rowIndex }, { at: tablePath });
      setTimeout(() => overrideRowSize(rowIndex, null), 0);
    },
    [editor, overrideRowSize, tablePath]
  );

  const commitMarginLeft = React.useCallback(
    (nextMarginLeft: number) => {
      setTableMarginLeft(
        editor,
        { marginLeft: nextMarginLeft },
        { at: tablePath }
      );
      setTimeout(() => overrideMarginLeft(null), 0);
    },
    [editor, overrideMarginLeft, tablePath]
  );

  const getColumnBoundaryOffset = React.useCallback(
    (colIndex: number, currentWidth: number) =>
      controlColumnWidth +
      effectiveColSizesRef.current
        .slice(0, colIndex)
        .reduce((total, colSize) => total + colSize, 0) +
      currentWidth,
    [controlColumnWidth]
  );

  const applyResize = React.useCallback(
    (event: PointerEvent, finished: boolean) => {
      const dragState = dragStateRef.current;

      if (!dragState) return;

      const currentPosition =
        dragState.direction === 'bottom' ? event.clientY : event.clientX;
      const delta = currentPosition - dragState.initialPosition;

      if (dragState.direction === 'bottom') {
        const newHeight = roundCellSizeToStep(
          dragState.initialSize + delta,
          undefined
        );

        if (finished) {
          commitRowSize(dragState.rowIndex, newHeight);
        } else {
          overrideRowSize(dragState.rowIndex, newHeight);
        }

        return;
      }

      if (dragState.direction === 'left') {
        const initial =
          effectiveColSizesRef.current[dragState.colIndex] ??
          dragState.initialSize;
        const complement = (width: number) =>
          initial + dragState.marginLeft - width;
        const nextMarginLeft = roundCellSizeToStep(
          resizeLengthClampStatic(dragState.marginLeft + delta, {
            max: complement(minColumnWidth),
            min: 0,
          }),
          undefined
        );
        const nextWidth = complement(nextMarginLeft);

        if (finished) {
          commitMarginLeft(nextMarginLeft);
          commitColSize(dragState.colIndex, nextWidth);
        } else if (deferColumnResize) {
          showDeferredResizeIndicator(
            controlColumnWidth + (nextMarginLeft - dragState.marginLeft)
          );
        } else {
          showResizeIndicatorAtOffset(
            controlColumnWidth + (nextMarginLeft - dragState.marginLeft)
          );
          overrideMarginLeft(nextMarginLeft);
          overrideColSize(dragState.colIndex, nextWidth);
        }

        return;
      }

      const currentInitial =
        effectiveColSizesRef.current[dragState.colIndex] ??
        dragState.initialSize;
      const nextInitial = effectiveColSizesRef.current[dragState.colIndex + 1];
      const complement = (width: number) =>
        currentInitial + nextInitial - width;
      const currentWidth = roundCellSizeToStep(
        resizeLengthClampStatic(currentInitial + delta, {
          max: nextInitial ? complement(minColumnWidth) : undefined,
          min: minColumnWidth,
        }),
        undefined
      );
      const nextWidth = nextInitial ? complement(currentWidth) : undefined;

      if (finished) {
        commitColSize(dragState.colIndex, currentWidth);

        if (nextWidth !== undefined) {
          commitColSize(dragState.colIndex + 1, nextWidth);
        }
      } else if (deferColumnResize) {
        showDeferredResizeIndicator(
          getColumnBoundaryOffset(dragState.colIndex, currentWidth)
        );
      } else {
        showResizeIndicatorAtOffset(
          getColumnBoundaryOffset(dragState.colIndex, currentWidth)
        );
        overrideColSize(dragState.colIndex, currentWidth);

        if (nextWidth !== undefined) {
          overrideColSize(dragState.colIndex + 1, nextWidth);
        }
      }
    },
    [
      commitColSize,
      commitMarginLeft,
      commitRowSize,
      controlColumnWidth,
      deferColumnResize,
      getColumnBoundaryOffset,
      showDeferredResizeIndicator,
      showResizeIndicatorAtOffset,
      minColumnWidth,
      overrideColSize,
      overrideMarginLeft,
      overrideRowSize,
    ]
  );

  const stopResize = React.useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;
    activeHandleKeyRef.current = null;
    previewHandleKeyRef.current = null;
    dragStateRef.current = null;

    if (activeRowElementRef.current) {
      delete activeRowElementRef.current.dataset.tableResizing;
      activeRowElementRef.current = null;
    }

    hideDeferredResizeIndicator();
    hideResizeIndicator();
    clearFrozenRowHeights();
  }, [clearFrozenRowHeights, hideDeferredResizeIndicator, hideResizeIndicator]);

  React.useEffect(() => stopResize, [stopResize]);

  const startResize = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      { colIndex, direction, handleKey, rowIndex }: TableResizeStartOptions
    ) => {
      const rowHeight =
        tableRef.current?.rows.item(rowIndex)?.getBoundingClientRect().height ??
        0;

      dragStateRef.current = {
        colIndex,
        direction,
        initialPosition: direction === 'bottom' ? event.clientY : event.clientX,
        initialSize:
          direction === 'bottom'
            ? rowHeight
            : (effectiveColSizesRef.current[colIndex] ??
              TABLE_DEFAULT_COLUMN_WIDTH),
        marginLeft: marginLeftRef.current,
        rowIndex,
      };
      activeHandleKeyRef.current = handleKey;
      previewHandleKeyRef.current = null;

      const rowElement = tableRef.current?.rows.item(rowIndex) ?? null;

      if (
        activeRowElementRef.current &&
        activeRowElementRef.current !== rowElement
      ) {
        delete activeRowElementRef.current.dataset.tableResizing;
      }

      activeRowElementRef.current = rowElement;

      if (rowElement) {
        rowElement.dataset.tableResizing = 'true';
      }

      cleanupListenersRef.current?.();

      if (direction !== 'bottom') {
        freezeRowHeights();
      }

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        applyResize(pointerEvent, false);
      };

      const handlePointerEnd = (pointerEvent: PointerEvent) => {
        applyResize(pointerEvent, true);
        stopResize();
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerEnd);
      window.addEventListener('pointercancel', handlePointerEnd);

      cleanupListenersRef.current = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerEnd);
        window.removeEventListener('pointercancel', handlePointerEnd);
      };

      if (deferColumnResize && direction !== 'bottom') {
        hideResizeIndicator();
        showDeferredResizeIndicator(
          direction === 'left'
            ? controlColumnWidth
            : getColumnBoundaryOffset(
                colIndex,
                effectiveColSizesRef.current[colIndex] ??
                  TABLE_DEFAULT_COLUMN_WIDTH
              )
        );
      } else {
        showResizeIndicator({ direction, event });
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [
      controlColumnWidth,
      deferColumnResize,
      getColumnBoundaryOffset,
      hideResizeIndicator,
      showDeferredResizeIndicator,
      showResizeIndicator,
      stopResize,
      tableRef,
      applyResize,
      freezeRowHeights,
    ]
  );

  return React.useMemo(
    () => ({
      clearResizePreview,
      disableMarginLeft,
      setResizePreview,
      startResize,
    }),
    [clearResizePreview, disableMarginLeft, setResizePreview, startResize]
  );
}

export const TableElement = withHOC(
  TableProvider,
  function TableElement({
    children,
    ...props
  }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      'isSelectionAreaVisible'
    );
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const { marginLeft, props: tableProps } = useTableElement();
    const colSizes = useTableColSizes();
    const controlColumnWidth = hasControls ? TABLE_CONTROL_COLUMN_WIDTH : 0;
    const dragIndicatorRef = React.useRef<HTMLDivElement>(null);
    const hoverIndicatorRef = React.useRef<HTMLDivElement>(null);
    const deferColumnResize =
      colSizes.length * props.element.children.length >
      TABLE_DEFERRED_COLUMN_RESIZE_CELL_COUNT;
    const tablePath = useElementSelector(([, path]) => path, [], {
      key: KEYS.table,
    });
    const tableRef = React.useRef<HTMLTableElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    useTableSelectionDom(tableRef);
    const resizeController = useTableResizeController({
      controlColumnWidth,
      deferColumnResize,
      dragIndicatorRef,
      hoverIndicatorRef,
      marginLeft,
      tablePath,
      tableRef,
      wrapperRef,
    });
    const resolvedColSizes = React.useMemo(() => {
      if (colSizes.length > 0) {
        return colSizes.map((colSize) => colSize || TABLE_DEFAULT_COLUMN_WIDTH);
      }

      return Array.from(
        { length: getTableColumnCount(props.element) },
        () => TABLE_DEFAULT_COLUMN_WIDTH
      );
    }, [colSizes, props.element]);
    const tableVariableStyle = React.useMemo(() => {
      if (resolvedColSizes.length === 0) {
        return;
      }

      return {
        ...Object.fromEntries(
          resolvedColSizes.map((colSize, index) => [
            `--table-col-${index}`,
            `${colSize}px`,
          ])
        ),
      } as React.CSSProperties;
    }, [resolvedColSizes]);
    const tableStyle = React.useMemo(
      () =>
        ({
          width: `${
            resolvedColSizes.reduce((total, colSize) => total + colSize, 0) +
            controlColumnWidth
          }px`,
        }) as React.CSSProperties,
      [controlColumnWidth, resolvedColSizes]
    );

    const isSelectingTable = useBlockSelected(props.element.id as string);

    const content = (
      <PlateElement
        {...props}
        className={cn(
          'overflow-x-auto py-5',
          hasControls && '-ml-2 *:data-[slot=block-selection]:left-2'
        )}
        style={{ paddingLeft: marginLeft }}
      >
        <TableResizeContext.Provider value={resizeController}>
          <div
            ref={wrapperRef}
            className="group/table relative w-fit"
            style={tableVariableStyle}
          >
            <div
              ref={dragIndicatorRef}
              className="-translate-x-[1.5px] pointer-events-none absolute inset-y-0 z-36 hidden w-[3px] bg-ring/70"
              contentEditable={false}
            />
            <div
              ref={hoverIndicatorRef}
              className="-translate-x-[1.5px] pointer-events-none absolute inset-y-0 z-35 hidden w-[3px] bg-ring/80"
              contentEditable={false}
            />
            <table
              ref={tableRef}
              className={cn(
                'mr-0 ml-px table h-px table-fixed border-collapse',
                'data-[table-selecting=true]:[&_*::selection]:!bg-transparent',
                'data-[table-selecting=true]:[&_*::selection]:!text-inherit',
                'data-[table-selecting=true]:[&_*::-moz-selection]:!bg-transparent',
                'data-[table-selecting=true]:[&_*::-moz-selection]:!text-inherit',
                'data-[table-selecting=true]:[&_*]:!caret-transparent'
              )}
              style={tableStyle}
              {...tableProps}
            >
              {resolvedColSizes.length > 0 && (
                <colgroup>
                  {hasControls && (
                    <col
                      style={{
                        maxWidth: TABLE_CONTROL_COLUMN_WIDTH,
                        minWidth: TABLE_CONTROL_COLUMN_WIDTH,
                        width: TABLE_CONTROL_COLUMN_WIDTH,
                      }}
                    />
                  )}
                  {resolvedColSizes.map((colSize, index) => (
                    <col
                      key={index}
                      style={{
                        maxWidth: colSize,
                        minWidth: colSize,
                        width: colSize,
                      }}
                    />
                  ))}
                </colgroup>
              )}
              <tbody className="min-w-full">{children}</tbody>
            </table>

            {isSelectingTable && (
              <div
                className={blockSelectionVariants()}
                contentEditable={false}
              />
            )}
          </div>
        </TableResizeContext.Provider>
      </PlateElement>
    );

    if (readOnly) {
      return content;
    }

    return <TableFloatingToolbar>{content}</TableFloatingToolbar>;
  }
);

function TableFloatingToolbar({
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const selectedCellCount = useEditorSelector(
    (editor) =>
      editor.getApi(TablePlugin).table.getSelectedCellIds()?.length ?? 0,
    []
  );
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const [isExpandedSelectionToolbarReady, setIsExpandedSelectionToolbarReady] =
    React.useState(false);
  // `getSelectedCellIds` only reports cells once a range spans more than one
  // cell, so a count of zero means the selection (a caret or an expanded
  // range) is confined to a single cell. Gating on it instead of
  // `editor.api.isCollapsed()` keeps the row/column controls available while a
  // cell's content is fully selected (e.g. select-all inside a cell), not just
  // while the caret is collapsed in it.
  const isSingleCellToolbarOpen =
    isFocusedLast && selected && selectedCellCount === 0;
  const isExpandedSelectionPending = isFocusedLast && selectedCellCount > 1;

  React.useEffect(() => {
    if (!isExpandedSelectionPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the delayed toolbar gate when selection is no longer expanded.
      setIsExpandedSelectionToolbarReady(false);

      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsExpandedSelectionToolbarReady(true);
    }, TABLE_MULTI_SELECTION_TOOLBAR_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isExpandedSelectionPending]);

  const shouldRenderExpandedSelectionToolbar =
    isExpandedSelectionToolbarReady && isExpandedSelectionPending;
  const isToolbarOpen =
    isSingleCellToolbarOpen || shouldRenderExpandedSelectionToolbar;

  return (
    <Popover open={isToolbarOpen} modal={false}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      {isSingleCellToolbarOpen && (
        <SingleCellTableFloatingToolbarContent {...props} />
      )}
      {shouldRenderExpandedSelectionToolbar && (
        <ExpandedSelectionTableFloatingToolbarContent {...props} />
      )}
    </Popover>
  );
}

function ExpandedSelectionTableFloatingToolbarContent(
  props: React.ComponentProps<typeof PopoverContent>
) {
  const { tf } = useEditorPlugin(TablePlugin);
  const { canMerge, canSplit } = useTableMergeState();

  if (!canMerge && !canSplit) return null;

  return (
    <TableFloatingToolbarContent
      canMerge={canMerge}
      canSplit={canSplit}
      onMerge={() => tf.table.merge()}
      onSplit={() => tf.table.split()}
      {...props}
    />
  );
}

function SingleCellTableFloatingToolbarContent(
  props: React.ComponentProps<typeof PopoverContent>
) {
  const { tf } = useEditorPlugin(TablePlugin);
  const element = useElement<TTableElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const { canSplit } = useTableMergeState();

  return (
    <TableFloatingToolbarContent
      buttonProps={buttonProps}
      canSplit={canSplit}
      singleCellMode
      onDeleteColumn={() => {
        tf.remove.tableColumn();
      }}
      onDeleteRow={() => {
        tf.remove.tableRow();
      }}
      onInsertColumnAfter={() => {
        tf.insert.tableColumn();
      }}
      onInsertColumnBefore={() => {
        tf.insert.tableColumn({ before: true });
      }}
      onInsertRowAfter={() => {
        tf.insert.tableRow();
      }}
      onInsertRowBefore={() => {
        tf.insert.tableRow({ before: true });
      }}
      onSplit={() => tf.table.split()}
      {...props}
    />
  );
}

function TableFloatingToolbarContent({
  buttonProps,
  canMerge = false,
  canSplit = false,
  singleCellMode = false,
  onDeleteColumn,
  onDeleteRow,
  onInsertColumnAfter,
  onInsertColumnBefore,
  onInsertRowAfter,
  onInsertRowBefore,
  onMerge,
  onSplit,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  buttonProps?: React.ComponentProps<typeof ToolbarButton>;
  canMerge?: boolean;
  canSplit?: boolean;
  singleCellMode?: boolean;
  onDeleteColumn?: () => void;
  onDeleteRow?: () => void;
  onInsertColumnAfter?: () => void;
  onInsertColumnBefore?: () => void;
  onInsertRowAfter?: () => void;
  onInsertRowBefore?: () => void;
  onMerge?: () => void;
  onSplit?: () => void;
}) {
  return (
    <PopoverContent
      asChild
      onOpenAutoFocus={(e) => e.preventDefault()}
      contentEditable={false}
      {...props}
    >
      <Toolbar
        className="scrollbar-hide flex w-auto max-w-[80vw] flex-row overflow-x-auto rounded-md border bg-popover p-1 shadow-md print:hidden"
        contentEditable={false}
      >
        <ToolbarGroup>
          <ColorDropdownMenu tooltip="Background color">
            <PaintBucketIcon />
          </ColorDropdownMenu>
          {canMerge && onMerge && (
            <ToolbarButton
              onClick={onMerge}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Merge cells"
            >
              <CombineIcon />
            </ToolbarButton>
          )}
          {canSplit && onSplit && (
            <ToolbarButton
              onClick={onSplit}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Split cell"
            >
              <SquareSplitHorizontalIcon />
            </ToolbarButton>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ToolbarButton tooltip="Cell borders">
                <Grid2X2Icon />
              </ToolbarButton>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <TableBordersDropdownMenuContent />
            </DropdownMenuPortal>
          </DropdownMenu>

          {singleCellMode && (
            <ToolbarGroup>
              <ToolbarButton tooltip="Delete table" {...buttonProps}>
                <Trash2Icon />
              </ToolbarButton>
            </ToolbarGroup>
          )}
        </ToolbarGroup>

        {singleCellMode && (
          <ToolbarGroup>
            <ToolbarButton
              onClick={onInsertRowBefore}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Insert row before"
            >
              <ArrowUp />
            </ToolbarButton>
            <ToolbarButton
              onClick={onInsertRowAfter}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Insert row after"
            >
              <ArrowDown />
            </ToolbarButton>
            <ToolbarButton
              onClick={onDeleteRow}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Delete row"
            >
              <XIcon />
            </ToolbarButton>
          </ToolbarGroup>
        )}

        {singleCellMode && (
          <ToolbarGroup>
            <ToolbarButton
              onClick={onInsertColumnBefore}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Insert column before"
            >
              <ArrowLeft />
            </ToolbarButton>
            <ToolbarButton
              onClick={onInsertColumnAfter}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Insert column after"
            >
              <ArrowRight />
            </ToolbarButton>
            <ToolbarButton
              onClick={onDeleteColumn}
              onMouseDown={(e) => e.preventDefault()}
              tooltip="Delete column"
            >
              <XIcon />
            </ToolbarButton>
          </ToolbarGroup>
        )}
      </Toolbar>
    </PopoverContent>
  );
}

function TableBordersDropdownMenuContent(
  props: React.ComponentProps<typeof DropdownMenuContent>
) {
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder,
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      className="min-w-[220px]"
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        editor.tf.focus();
      }}
      align="start"
      side="right"
      sideOffset={0}
      {...props}
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder('top')}
        >
          <BorderTopIcon />
          <div>Top Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder('right')}
        >
          <BorderRightIcon />
          <div>Right Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder('bottom')}
        >
          <BorderBottomIcon />
          <div>Bottom Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder('left')}
        >
          <BorderLeftIcon />
          <div>Left Border</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder('none')}
        >
          <BorderNoneIcon />
          <div>No Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder('outer')}
        >
          <BorderAllIcon />
          <div>Outside Borders</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

function ColorDropdownMenu({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  const [open, setOpen] = React.useState(false);

  const editor = useEditorRef();

  const onUpdateColor = React.useCallback(
    (color: string) => {
      setOpen(false);
      setCellBackground(editor, {
        color,
        selectedCells:
          editor.getApi(TablePlugin).table.getSelectedCells() ?? [],
      });
    },
    [editor]
  );

  const onClearColor = React.useCallback(() => {
    setOpen(false);
    setCellBackground(editor, {
      color: null,
      selectedCells: editor.getApi(TablePlugin).table.getSelectedCells() ?? [],
    });
  }, [editor]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ToolbarMenuGroup label="Colors">
          <ColorDropdownMenuItems
            className="px-2"
            colors={DEFAULT_COLORS}
            updateColor={onUpdateColor}
          />
        </ToolbarMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-2" onClick={onClearColor}>
            <EraserIcon />
            <span>Clear</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableRowElement({
  children,
  ...props
}: PlateElementProps<TTableRowElement>) {
  const { element } = props;
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const rowIndex = useElementSelector(([, path]) => path.at(-1) as number, [], {
    key: KEYS.tr,
  });
  const rowSize = useElementSelector(
    ([node]) => (node as TTableRowElement).size,
    [],
    {
      key: KEYS.tr,
    }
  );
  const rowSizeOverrides = useTableValue('rowSizeOverrides');
  const rowMinHeight = rowSizeOverrides.get?.(rowIndex) ?? rowSize;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );
  const hasControls = !readOnly && !isSelectionAreaVisible;

  const { isDragging, nodeRef, previewRef, handleRef } = useDraggable({
    element,
    type: element.type,
    canDropNode: ({ dragEntry, dropEntry }) =>
      !!dragEntry &&
      PathApi.equals(
        PathApi.parent(dragEntry[1]),
        PathApi.parent(dropEntry[1])
      ),
    onDropHandler: (_, { dragItem }) => {
      const dragElement = (dragItem as { element: TElement }).element;

      if (dragElement) {
        editor.tf.select(dragElement);
      }
    },
  });

  return (
    <PlateElement
      {...props}
      ref={useComposedRef(props.ref, previewRef, nodeRef)}
      as="tr"
      className={cn('group/row', isDragging && 'opacity-50')}
      style={
        {
          ...props.style,
          '--tableRowMinHeight': rowMinHeight ? `${rowMinHeight}px` : undefined,
        } as React.CSSProperties
      }
    >
      {hasControls && (
        <td
          className="w-2 min-w-2 max-w-2 select-none p-0"
          contentEditable={false}
        >
          <RowDragHandle dragRef={handleRef} />
          <RowDropLine />
        </td>
      )}

      {children}
    </PlateElement>
  );
}

function useTableCellPresentation(element: TTableCellElement) {
  const { api } = useEditorPlugin(TablePlugin);
  const borders = useTableCellBorders({ element });
  const { col, row } = useCellIndices();

  const colSpan = api.table.getColSpan(element);
  const rowSpan = api.table.getRowSpan(element);
  const width = React.useMemo(() => {
    const terms = Array.from(
      { length: colSpan },
      (_, offset) => `var(--table-col-${col + offset}, 120px)`
    );

    return terms.length === 1 ? terms[0]! : `calc(${terms.join(' + ')})`;
  }, [col, colSpan]);

  return {
    borders,
    colIndex: col + colSpan - 1,
    colSpan,
    rowIndex: row + rowSpan - 1,
    rowSpan,
    width,
  };
}

function RowDragHandle({ dragRef }: { dragRef: React.Ref<any> }) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Button
      ref={dragRef}
      variant="outline"
      className={cn(
        '-translate-y-1/2 absolute top-1/2 left-0 z-51 h-6 w-4 p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
        'cursor-grab active:cursor-grabbing',
        'opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-data-[table-resizing=true]/row:opacity-0'
      )}
      onClick={() => {
        editor.tf.select(element);
      }}
    >
      <GripVertical className="text-muted-foreground" />
    </Button>
  );
}

function RowDropLine() {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 left-2 z-50 h-0.5 bg-brand/50',
        dropLine === 'top' ? '-top-px' : '-bottom-px'
      )}
    />
  );
}

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const readOnly = useReadOnly();
  const element = props.element;

  const tableId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.table,
  });
  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr,
  });
  const isSelectingTable = useBlockSelected(tableId);
  const isSelectingRow = useBlockSelected(rowId) || isSelectingTable;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );

  const { borders, colIndex, colSpan, rowIndex, rowSpan, width } =
    useTableCellPresentation(element);

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'relative h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        'before:size-full',
        'data-[table-cell-selected=true]:before:z-10',
        'data-[table-cell-selected=true]:before:bg-brand/5',
        "before:absolute before:box-border before:select-none before:content-['']",
        borders.bottom?.size && 'before:border-b before:border-b-border',
        borders.right?.size && 'before:border-r before:border-r-border',
        borders.left?.size && 'before:border-l before:border-l-border',
        borders.top?.size && 'before:border-t before:border-t-border'
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width,
          minWidth: width,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan,
        'data-table-cell-id': element.id,
        rowSpan,
      }}
    >
      <div
        className="relative z-20 box-border h-full px-3 py-2"
        style={
          rowSpan === 1
            ? { minHeight: 'var(--tableRowMinHeight, 0px)' }
            : undefined
        }
      >
        {props.children}
      </div>

      {!readOnly && !isSelectionAreaVisible && (
        <TableCellResizeControls colIndex={colIndex} rowIndex={rowIndex} />
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>
) {
  return <TableCellElement {...props} isHeader />;
}

const TableCellResizeControls = React.memo(function TableCellResizeControls({
  colIndex,
  rowIndex,
}: {
  colIndex: number;
  rowIndex: number;
}) {
  const {
    clearResizePreview,
    disableMarginLeft,
    setResizePreview,
    startResize,
  } = useTableResizeContext();
  const rightHandleKey = `right:${rowIndex}:${colIndex}`;
  const bottomHandleKey = `bottom:${rowIndex}:${colIndex}`;
  const leftHandleKey = `left:${rowIndex}:${colIndex}`;
  const isLeftHandle = colIndex === 0 && !disableMarginLeft;

  return (
    <div
      className="group/resize pointer-events-none absolute inset-0 z-30 select-none"
      contentEditable={false}
      suppressContentEditableWarning={true}
    >
      <div
        className="-top-2 -right-1 pointer-events-auto absolute z-40 h-[calc(100%_+_8px)] w-2 cursor-col-resize touch-none"
        onPointerEnter={(event) => {
          setResizePreview(event, {
            colIndex,
            direction: 'right',
            handleKey: rightHandleKey,
            rowIndex,
          });
        }}
        onPointerLeave={() => {
          clearResizePreview(rightHandleKey);
        }}
        onPointerDown={(event) => {
          startResize(event, {
            colIndex,
            direction: 'right',
            handleKey: rightHandleKey,
            rowIndex,
          });
        }}
      />
      <div
        className="-bottom-1 pointer-events-auto absolute left-0 z-40 h-2 w-full cursor-row-resize touch-none"
        onPointerEnter={(event) => {
          setResizePreview(event, {
            colIndex,
            direction: 'bottom',
            handleKey: bottomHandleKey,
            rowIndex,
          });
        }}
        onPointerLeave={() => {
          clearResizePreview(bottomHandleKey);
        }}
        onPointerDown={(event) => {
          startResize(event, {
            colIndex,
            direction: 'bottom',
            handleKey: bottomHandleKey,
            rowIndex,
          });
        }}
      />
      {isLeftHandle && (
        <div
          className="-left-1 pointer-events-auto absolute top-0 z-40 h-full w-2 cursor-col-resize touch-none"
          onPointerEnter={(event) => {
            setResizePreview(event, {
              colIndex,
              direction: 'left',
              handleKey: leftHandleKey,
              rowIndex,
            });
          }}
          onPointerLeave={() => {
            clearResizePreview(leftHandleKey);
          }}
          onPointerDown={(event) => {
            startResize(event, {
              colIndex,
              direction: 'left',
              handleKey: leftHandleKey,
              rowIndex,
            });
          }}
        />
      )}
    </div>
  );
});

TableCellResizeControls.displayName = 'TableCellResizeControls';
'use client';

import type { LucideProps } from 'lucide-react';

export function BorderAllIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border All</title>
      <path
        clipRule="evenodd"
        d="M0.25 1C0.25 0.585786 0.585786 0.25 1 0.25H14C14.4142 0.25 14.75 0.585786 14.75 1V14C14.75 14.4142 14.4142 14.75 14 14.75H1C0.585786 14.75 0.25 14.4142 0.25 14V1ZM1.75 1.75V13.25H13.25V1.75H1.75Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="5" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="3" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="11" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="9" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="11" />
    </svg>
  );
}

export function BorderBottomIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border Bottom</title>
      <path
        clipRule="evenodd"
        d="M1 13.25L14 13.25V14.75L1 14.75V13.25Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="5" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="5" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="3" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="3" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="11" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="11" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="9" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="9" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="11" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="11" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="5" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="3" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="7" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="1" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="9" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="11" />
    </svg>
  );
}

export function BorderLeftIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border Left</title>
      <path
        clipRule="evenodd"
        d="M1.75 1L1.75 14L0.249999 14L0.25 1L1.75 1Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 10 7)"
        width="1"
        x="10"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 10 13)"
        width="1"
        x="10"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 12 7)"
        width="1"
        x="12"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 12 13)"
        width="1"
        x="12"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 7)"
        width="1"
        x="8"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 7)"
        width="1"
        x="14"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 13)"
        width="1"
        x="8"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 13)"
        width="1"
        x="14"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 5)"
        width="1"
        x="8"
        y="5"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 5)"
        width="1"
        x="14"
        y="5"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 3)"
        width="1"
        x="8"
        y="3"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 3)"
        width="1"
        x="14"
        y="3"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 9)"
        width="1"
        x="8"
        y="9"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 9)"
        width="1"
        x="14"
        y="9"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 11)"
        width="1"
        x="8"
        y="11"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 11)"
        width="1"
        x="14"
        y="11"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 6 7)"
        width="1"
        x="6"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 6 13)"
        width="1"
        x="6"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 4 7)"
        width="1"
        x="4"
        y="7"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 4 13)"
        width="1"
        x="4"
        y="13"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 10 1)"
        width="1"
        x="10"
        y="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 12 1)"
        width="1"
        x="12"
        y="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 8 1)"
        width="1"
        x="8"
        y="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 14 1)"
        width="1"
        x="14"
        y="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 6 1)"
        width="1"
        x="6"
        y="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(90 4 1)"
        width="1"
        x="4"
        y="1"
      />
    </svg>
  );
}

export function BorderNoneIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border None</title>
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="5.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="5.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="3.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="3.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="7.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="13.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="7.025" />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        width="1"
        x="13"
        y="13.025"
      />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="7.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="13.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="5" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="7.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="13.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="3" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="7.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="13.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="9" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="11" y="7.025" />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        width="1"
        x="11"
        y="13.025"
      />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="11" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="9.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="13" y="9.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="7" y="11.025" />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        width="1"
        x="13"
        y="11.025"
      />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="5.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="3.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="7.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="13.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="1.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="9.025" />
      <rect fill="currentColor" height="1" rx=".5" width="1" x="1" y="11.025" />
    </svg>
  );
}

export function BorderRightIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border Right</title>
      <path
        clipRule="evenodd"
        d="M13.25 1L13.25 14L14.75 14L14.75 1L13.25 1Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 5 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 5 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 3 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 3 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 5)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 5)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 3)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 3)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 9)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 9)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 11)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 11)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 9 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 9 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 11 7)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 11 13)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 5 1)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 3 1)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 7 1)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 1 1)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 9 1)"
        width="1"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="matrix(0 1 1 0 11 1)"
        width="1"
      />
    </svg>
  );
}

export function BorderTopIcon(props: LucideProps) {
  return (
    <svg
      fill="none"
      height="15"
      viewBox="0 0 15 15"
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Border Top</title>
      <path
        clipRule="evenodd"
        d="M14 1.75L1 1.75L1 0.249999L14 0.25L14 1.75Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 10)"
        width="1"
        x="8"
        y="10"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 10)"
        width="1"
        x="2"
        y="10"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 12)"
        width="1"
        x="8"
        y="12"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 12)"
        width="1"
        x="2"
        y="12"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 8)"
        width="1"
        x="8"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 14)"
        width="1"
        x="8"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 8)"
        width="1"
        x="2"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 14)"
        width="1"
        x="2"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 10 8)"
        width="1"
        x="10"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 10 14)"
        width="1"
        x="10"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 12 8)"
        width="1"
        x="12"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 12 14)"
        width="1"
        x="12"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 6 8)"
        width="1"
        x="6"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 6 14)"
        width="1"
        x="6"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 4 8)"
        width="1"
        x="4"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 4 14)"
        width="1"
        x="4"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 6)"
        width="1"
        x="8"
        y="6"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 6)"
        width="1"
        x="2"
        y="6"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 8 4)"
        width="1"
        x="8"
        y="4"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 2 4)"
        width="1"
        x="2"
        y="4"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 10)"
        width="1"
        x="14"
        y="10"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 12)"
        width="1"
        x="14"
        y="12"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 8)"
        width="1"
        x="14"
        y="8"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 14)"
        width="1"
        x="14"
        y="14"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 6)"
        width="1"
        x="14"
        y="6"
      />
      <rect
        fill="currentColor"
        height="1"
        rx=".5"
        transform="rotate(-180 14 4)"
        width="1"
        x="14"
        y="4"
      />
    </svg>
  );
}
import * as React from 'react';

import type { TTableCellElement, TTableElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { BaseTablePlugin } from '@platejs/table';
import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function TableElementStatic({
  children,
  ...props
}: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin);
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft;

  return (
    <SlateElement
      {...props}
      className="overflow-x-auto py-5"
      style={{ paddingLeft: marginLeft }}
    >
      <div className="group/table relative w-fit">
        <table
          className="mr-0 ml-px table h-px table-fixed border-collapse"
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <tbody className="min-w-full">{children}</tbody>
        </table>
      </div>
    </SlateElement>
  );
}

export function TableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} as="tr" className="h-full">
      {props.children}
    </SlateElement>
  );
}

export function TableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { editor, element } = props;
  const { api } = editor.getPlugin(BaseTablePlugin);

  const { minHeight, width } = api.table.getCellSize({ element });
  const borders = api.table.getCellBorders({ element });

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left font-normal *:m-0',
        'before:size-full',
        "before:absolute before:box-border before:select-none before:content-['']",
        borders &&
          cn(
            borders.bottom?.size && 'before:border-b before:border-b-border',
            borders.right?.size && 'before:border-r before:border-r-border',
            borders.left?.size && 'before:border-l before:border-l-border',
            borders.top?.size && 'before:border-t before:border-t-border'
          )
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      <div
        className="relative z-20 box-border h-full px-4 py-2"
        style={{ minHeight }}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}

export function TableCellHeaderElementStatic(
  props: SlateElementProps<TTableCellElement>
) {
  return <TableCellElementStatic {...props} isHeader />;
}
'use client';

import * as React from 'react';

import { DndPlugin } from '@platejs/dnd';
import { useBlockSelected } from '@platejs/selection/react';
import { cva } from 'class-variance-authority';
import { type PlateElementProps, usePluginOption } from 'platejs/react';

export const blockSelectionVariants = cva(
  'pointer-events-none absolute inset-0 z-1 bg-brand/[.13] transition-opacity',
  {
    defaultVariants: {
      active: true,
    },
    variants: {
      active: {
        false: 'opacity-0',
        true: 'opacity-100',
      },
    },
  }
);

export function BlockSelection(props: PlateElementProps) {
  const isBlockSelected = useBlockSelected();
  const isDragging = usePluginOption(DndPlugin, 'isDragging');

  if (
    !isBlockSelected ||
    props.plugin.key === 'tr' ||
    props.plugin.key === 'table'
  )
    return null;

  return (
    <div
      className={blockSelectionVariants({
        active: isBlockSelected && !isDragging,
      })}
      data-slot="block-selection"
    />
  );
}
'use client';

import React from 'react';

import type {
  DropdownMenuItemProps,
  DropdownMenuProps,
} from '@radix-ui/react-dropdown-menu';

import { useComposedRef } from '@udecode/cn';
import debounce from 'lodash/debounce.js';
import { CheckIcon, EraserIcon, PlusIcon } from 'lucide-react';
import {
  type PlateEditor,
  useEditorRef,
  useEditorSelector,
} from 'platejs/react';

import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

const MAX_CUSTOM_COLORS = 19;
const HEX_COLOR_RE = /^#[\da-f]{6}$/i;

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_RE.test(color);
}

function computeIsBrightColor(hex: string): boolean {
  if (!isValidHexColor(hex)) return false;

  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 130;
}

function getEditorColorMarks(editor: PlateEditor, nodeType: string): string[] {
  const usedColors = new Set<string>();

  for (const [node] of editor.api.nodes({
    at: [],
    match: (n) =>
      'text' in n &&
      typeof (n as Record<string, unknown>)[nodeType] === 'string',
    mode: 'all',
  })) {
    const color = (node as Record<string, unknown>)[nodeType] as string;
    usedColors.add(normalizeColor(color));
  }

  return Array.from(usedColors);
}

export function FontColorToolbarButton({
  children,
  nodeType,
  tooltip,
}: {
  nodeType: string;
  tooltip?: string;
} & DropdownMenuProps) {
  const editor = useEditorRef();

  const selectionDefined = useEditorSelector(
    (editor) => !!editor.selection,
    []
  );

  const color = useEditorSelector(
    (editor) => editor.api.mark(nodeType) as string,
    [nodeType]
  );

  const [selectedColor, setSelectedColor] = React.useState<string>();
  const [updatedColor, setUpdatedColor] = React.useState<string>();
  const [open, setOpen] = React.useState(false);
  const [colorsQueue, setColorsQueue] = React.useState<string[]>([]);

  const recordColorUsage = React.useCallback((color: string) => {
    const normalized = normalizeColor(color);

    if (!isValidHexColor(normalized)) return;

    setColorsQueue((prev) => {
      const filtered = prev
        .filter((c) => c !== normalized)
        .filter(
          (c) => !DEFAULT_COLORS.some((dc) => normalizeColor(dc.value) === c)
        );

      return [normalized, ...filtered].slice(0, 30);
    });
  }, []);

  const appendColors = React.useCallback((colors: string[]) => {
    setColorsQueue((prev) => {
      const normalized = colors.map(normalizeColor).filter(isValidHexColor);
      const existingSet = new Set(prev);
      const newColors = normalized
        .filter((c) => !existingSet.has(c))
        .filter(
          (c) => !DEFAULT_COLORS.some((dc) => normalizeColor(dc.value) === c)
        );

      return [...newColors, ...prev].slice(0, 30);
    });
  }, []);

  const onToggle = React.useCallback(
    (value = !open) => {
      setOpen(value);

      if (value) {
        const colorUsed = getEditorColorMarks(editor, nodeType);
        appendColors(colorUsed);

        if (selectedColor) {
          recordColorUsage(normalizeColor(selectedColor));
        }
      }
      if (!value) {
        setUpdatedColor(undefined);

        if (editor.selection) {
          setTimeout(() => {
            editor.tf.focus();
          }, 100);
        }
      }
    },
    [open, editor, nodeType, appendColors, selectedColor, recordColorUsage]
  );

  const updateColor = React.useCallback(
    (value: string) => {
      if (editor.selection) {
        setSelectedColor(value);
        setUpdatedColor(value);

        editor.tf.select(editor.selection);
        editor.tf.addMarks({ [nodeType]: value });
      }
    },
    [editor, nodeType]
  );

  const updateColorAndClose = React.useCallback(
    (value: string) => {
      updateColor(value);
      onToggle();
    },
    [onToggle, updateColor]
  );

  const clearColor = React.useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection);
      editor.tf.removeMarks(nodeType);
      onToggle();
    }
  }, [editor, onToggle, nodeType]);

  React.useEffect(() => {
    if (selectionDefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Preserve the mark color while menu focus clears editor selection.
      setSelectedColor(color);
    }
  }, [color, selectionDefined]);

  return (
    <DropdownMenu modal onOpenChange={onToggle} open={open}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltip}>
          {children}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ColorPicker
          clearColor={clearColor}
          color={selectedColor || color}
          colors={DEFAULT_COLORS}
          colorsQueue={colorsQueue}
          customColors={DEFAULT_CUSTOM_COLORS}
          recordColorUsage={recordColorUsage}
          updateColor={updateColorAndClose}
          updateCustomColor={updateColor}
          updatedColor={updatedColor}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PureColorPicker({
  className,
  clearColor,
  color,
  colors,
  colorsQueue,
  customColors,
  recordColorUsage,
  updateColor,
  updateCustomColor,
  updatedColor,
  ...props
}: React.ComponentProps<'div'> & {
  colors: TColor[];
  colorsQueue: string[];
  customColors: TColor[];
  clearColor: () => void;
  recordColorUsage: (color: string) => void;
  updateColor: (color: string) => void;
  updateCustomColor: (color: string) => void;
  color?: string;
  updatedColor?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <ToolbarMenuGroup label="Custom Colors">
        <ColorCustom
          className="px-2"
          color={color}
          colors={colors}
          colorsQueue={colorsQueue}
          customColors={customColors}
          recordColorUsage={recordColorUsage}
          updateColor={updateColor}
          updateCustomColor={updateCustomColor}
          updatedColor={updatedColor}
        />
      </ToolbarMenuGroup>
      <ToolbarMenuGroup label="Default Colors">
        <ColorDropdownMenuItems
          className="px-2"
          color={color}
          colors={colors}
          updateColor={updateColor}
        />
      </ToolbarMenuGroup>
      {color && (
        <ToolbarMenuGroup>
          <DropdownMenuItem className="p-2" onClick={clearColor}>
            <EraserIcon />
            <span>Clear</span>
          </DropdownMenuItem>
        </ToolbarMenuGroup>
      )}
    </div>
  );
}

const ColorPicker = React.memo(
  PureColorPicker,
  (prev, next) =>
    prev.color === next.color &&
    prev.colors === next.colors &&
    prev.colorsQueue === next.colorsQueue &&
    prev.customColors === next.customColors &&
    prev.updatedColor === next.updatedColor
);

function ColorCustom({
  className,
  color,
  colors,
  colorsQueue,
  customColors,
  recordColorUsage,
  updateColor,
  updateCustomColor,
  updatedColor,
  ...props
}: {
  colors: TColor[];
  colorsQueue: string[];
  customColors: TColor[];
  recordColorUsage: (color: string) => void;
  updateColor: (color: string) => void;
  updateCustomColor: (color: string) => void;
  color?: string;
  updatedColor?: string;
} & React.ComponentPropsWithoutRef<'div'>) {
  const [value, setValue] = React.useState<string>(color || '#000000');

  const fullCustomColors = React.useMemo(
    () =>
      colorsQueue
        .filter((c) => normalizeColor(c) !== normalizeColor(updatedColor || ''))
        .filter(
          (c) =>
            !DEFAULT_COLORS.some(
              (dc) => normalizeColor(dc.value) === normalizeColor(c)
            )
        )
        .filter(
          (c) =>
            !DEFAULT_CUSTOM_COLORS.some(
              (dc) => normalizeColor(dc.value) === normalizeColor(c)
            )
        )
        .map((c) => ({
          isBrightColor: computeIsBrightColor(c),
          name: c,
          value: c,
        }))
        .slice(
          0,
          MAX_CUSTOM_COLORS - customColors.length - (updatedColor ? 1 : 0)
        ),
    [colorsQueue, customColors, updatedColor]
  );

  const isColorInCollections = React.useCallback(
    (targetColor: string) =>
      colors.some(
        (c) => normalizeColor(c.value) === normalizeColor(targetColor)
      ) ||
      customColors.some(
        (c) => normalizeColor(c.value) === normalizeColor(targetColor)
      ) ||
      fullCustomColors.some(
        (c) => normalizeColor(c.value) === normalizeColor(targetColor)
      ),
    [colors, customColors, fullCustomColors]
  );

  const customColor = React.useMemo(() => {
    if (!updatedColor || isColorInCollections(updatedColor)) {
      return null;
    }

    return updatedColor;
  }, [isColorInCollections, updatedColor]);

  const computedColors = React.useMemo(
    () =>
      customColor
        ? [
            ...customColors,
            {
              isBrightColor: computeIsBrightColor(customColor),
              name: customColor,
              value: customColor,
            },
            ...fullCustomColors,
          ]
        : [...customColors, ...fullCustomColors],
    [customColor, fullCustomColors, customColors]
  );

  const updateCustomColorDebounced = React.useMemo(
    () => debounce((value: string) => updateCustomColor(value), 100),
    [updateCustomColor]
  );

  React.useEffect(
    () => () => {
      updateCustomColorDebounced.cancel();
    },
    [updateCustomColorDebounced]
  );

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <ColorDropdownMenuItems
        color={color}
        colors={computedColors}
        updateColor={(c) => {
          updateColor(c);
          recordColorUsage(normalizeColor(c));
        }}
      >
        <ColorInput
          className="col-start-10"
          onChange={(e) => {
            setValue(e.target.value);
            updateCustomColorDebounced(e.target.value);
          }}
          value={value}
        >
          <DropdownMenuItem
            className={cn(
              buttonVariants({
                size: 'icon',
                variant: 'outline',
              }),
              'flex size-8 items-center justify-center rounded-full'
            )}
            onSelect={(e) => {
              e.preventDefault();
            }}
          >
            <span className="sr-only">Custom</span>
            <PlusIcon />
          </DropdownMenuItem>
        </ColorInput>
      </ColorDropdownMenuItems>
    </div>
  );
}

function ColorInput({
  children,
  className,
  value = '#000000',
  ...props
}: React.ComponentProps<'input'> & { className?: string }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {React.Children.map(children, (child) => {
        if (!child) return child;

        return React.cloneElement(
          child as React.ReactElement<{
            onClick: () => void;
          }>,
          {
            onClick: () => inputRef.current?.click(),
          }
        );
      })}
      <input
        {...props}
        className="size-0 overflow-hidden border-0 p-0"
        ref={useComposedRef(props.ref, inputRef)}
        type="color"
        value={value}
      />
    </div>
  );
}

type TColor = {
  isBrightColor: boolean;
  name: string;
  value: string;
};

function ColorDropdownMenuItem({
  className,
  isBrightColor,
  isSelected,
  name,
  updateColor,
  value,
  ...props
}: {
  isBrightColor: boolean;
  isSelected: boolean;
  value: string;
  updateColor: (color: string) => void;
  name?: string;
} & DropdownMenuItemProps) {
  const content = (
    <DropdownMenuItem
      className={cn(
        buttonVariants({
          size: 'icon',
          variant: 'outline',
        }),
        'my-1 flex size-6 items-center justify-center rounded-full border border-muted border-solid p-0 transition-all hover:scale-125',
        !isBrightColor && 'border-transparent text-white',
        className
      )}
      style={{ backgroundColor: value }}
      onSelect={(e) => {
        e.preventDefault();
        updateColor(value);
      }}
      {...props}
    >
      {isSelected ? <CheckIcon className="!size-3" strokeWidth={3} /> : null}
    </DropdownMenuItem>
  );

  return name ? (
    <Tooltip>
      <TooltipTrigger>{content}</TooltipTrigger>
      <TooltipContent className="mb-1 capitalize">{name}</TooltipContent>
    </Tooltip>
  ) : (
    content
  );
}

export function ColorDropdownMenuItems({
  className,
  color,
  colors,
  updateColor,
  ...props
}: {
  colors: TColor[];
  updateColor: (color: string) => void;
  color?: string;
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(10,1fr)] place-items-center gap-x-1',
        className
      )}
      {...props}
    >
      <TooltipProvider>
        {colors.map(({ isBrightColor, name, value }) => (
          <ColorDropdownMenuItem
            name={name}
            key={name ?? value}
            value={value}
            isBrightColor={isBrightColor}
            isSelected={
              !!color && normalizeColor(color) === normalizeColor(value)
            }
            updateColor={updateColor}
          />
        ))}
        {props.children}
      </TooltipProvider>
    </div>
  );
}

export const DEFAULT_COLORS = [
  {
    isBrightColor: false,
    name: 'black',
    value: '#000000',
  },
  {
    isBrightColor: false,
    name: 'dark grey 4',
    value: '#434343',
  },
  {
    isBrightColor: false,
    name: 'dark grey 3',
    value: '#666666',
  },
  {
    isBrightColor: false,
    name: 'dark grey 2',
    value: '#999999',
  },
  {
    isBrightColor: false,
    name: 'dark grey 1',
    value: '#B7B7B7',
  },
  {
    isBrightColor: false,
    name: 'grey',
    value: '#CCCCCC',
  },
  {
    isBrightColor: false,
    name: 'light grey 1',
    value: '#D9D9D9',
  },
  {
    isBrightColor: true,
    name: 'light grey 2',
    value: '#EFEFEF',
  },
  {
    isBrightColor: true,
    name: 'light grey 3',
    value: '#F3F3F3',
  },
  {
    isBrightColor: true,
    name: 'white',
    value: '#FFFFFF',
  },
  {
    isBrightColor: false,
    name: 'red berry',
    value: '#980100',
  },
  {
    isBrightColor: false,
    name: 'red',
    value: '#FE0000',
  },
  {
    isBrightColor: false,
    name: 'orange',
    value: '#FE9900',
  },
  {
    isBrightColor: true,
    name: 'yellow',
    value: '#FEFF00',
  },
  {
    isBrightColor: false,
    name: 'green',
    value: '#00FF00',
  },
  {
    isBrightColor: false,
    name: 'cyan',
    value: '#00FFFF',
  },
  {
    isBrightColor: false,
    name: 'cornflower blue',
    value: '#4B85E8',
  },
  {
    isBrightColor: false,
    name: 'blue',
    value: '#1300FF',
  },
  {
    isBrightColor: false,
    name: 'purple',
    value: '#9900FF',
  },
  {
    isBrightColor: false,
    name: 'magenta',
    value: '#FF00FF',
  },

  {
    isBrightColor: false,
    name: 'light red berry 3',
    value: '#E6B8AF',
  },
  {
    isBrightColor: false,
    name: 'light red 3',
    value: '#F4CCCC',
  },
  {
    isBrightColor: true,
    name: 'light orange 3',
    value: '#FCE4CD',
  },
  {
    isBrightColor: true,
    name: 'light yellow 3',
    value: '#FFF2CC',
  },
  {
    isBrightColor: true,
    name: 'light green 3',
    value: '#D9EAD3',
  },
  {
    isBrightColor: false,
    name: 'light cyan 3',
    value: '#D0DFE3',
  },
  {
    isBrightColor: false,
    name: 'light cornflower blue 3',
    value: '#C9DAF8',
  },
  {
    isBrightColor: true,
    name: 'light blue 3',
    value: '#CFE1F3',
  },
  {
    isBrightColor: true,
    name: 'light purple 3',
    value: '#D9D2E9',
  },
  {
    isBrightColor: true,
    name: 'light magenta 3',
    value: '#EAD1DB',
  },

  {
    isBrightColor: false,
    name: 'light red berry 2',
    value: '#DC7E6B',
  },
  {
    isBrightColor: false,
    name: 'light red 2',
    value: '#EA9999',
  },
  {
    isBrightColor: false,
    name: 'light orange 2',
    value: '#F9CB9C',
  },
  {
    isBrightColor: true,
    name: 'light yellow 2',
    value: '#FFE598',
  },
  {
    isBrightColor: false,
    name: 'light green 2',
    value: '#B7D6A8',
  },
  {
    isBrightColor: false,
    name: 'light cyan 2',
    value: '#A1C4C9',
  },
  {
    isBrightColor: false,
    name: 'light cornflower blue 2',
    value: '#A4C2F4',
  },
  {
    isBrightColor: false,
    name: 'light blue 2',
    value: '#9FC5E8',
  },
  {
    isBrightColor: false,
    name: 'light purple 2',
    value: '#B5A7D5',
  },
  {
    isBrightColor: false,
    name: 'light magenta 2',
    value: '#D5A6BD',
  },

  {
    isBrightColor: false,
    name: 'light red berry 1',
    value: '#CC4125',
  },
  {
    isBrightColor: false,
    name: 'light red 1',
    value: '#E06666',
  },
  {
    isBrightColor: false,
    name: 'light orange 1',
    value: '#F6B26B',
  },
  {
    isBrightColor: false,
    name: 'light yellow 1',
    value: '#FFD966',
  },
  {
    isBrightColor: false,
    name: 'light green 1',
    value: '#93C47D',
  },
  {
    isBrightColor: false,
    name: 'light cyan 1',
    value: '#76A5AE',
  },
  {
    isBrightColor: false,
    name: 'light cornflower blue 1',
    value: '#6C9EEB',
  },
  {
    isBrightColor: false,
    name: 'light blue 1',
    value: '#6FA8DC',
  },
  {
    isBrightColor: false,
    name: 'light purple 1',
    value: '#8D7CC3',
  },
  {
    isBrightColor: false,
    name: 'light magenta 1',
    value: '#C27BA0',
  },

  {
    isBrightColor: false,
    name: 'dark red berry 1',
    value: '#A61B00',
  },
  {
    isBrightColor: false,
    name: 'dark red 1',
    value: '#CC0000',
  },
  {
    isBrightColor: false,
    name: 'dark orange 1',
    value: '#E59138',
  },
  {
    isBrightColor: false,
    name: 'dark yellow 1',
    value: '#F1C231',
  },
  {
    isBrightColor: false,
    name: 'dark green 1',
    value: '#6AA74F',
  },
  {
    isBrightColor: false,
    name: 'dark cyan 1',
    value: '#45818E',
  },
  {
    isBrightColor: false,
    name: 'dark cornflower blue 1',
    value: '#3B78D8',
  },
  {
    isBrightColor: false,
    name: 'dark blue 1',
    value: '#3E84C6',
  },
  {
    isBrightColor: false,
    name: 'dark purple 1',
    value: '#664EA6',
  },
  {
    isBrightColor: false,
    name: 'dark magenta 1',
    value: '#A64D78',
  },

  {
    isBrightColor: false,
    name: 'dark red berry 2',
    value: '#84200D',
  },
  {
    isBrightColor: false,
    name: 'dark red 2',
    value: '#990001',
  },
  {
    isBrightColor: false,
    name: 'dark orange 2',
    value: '#B45F05',
  },
  {
    isBrightColor: false,
    name: 'dark yellow 2',
    value: '#BF9002',
  },
  {
    isBrightColor: false,
    name: 'dark green 2',
    value: '#38761D',
  },
  {
    isBrightColor: false,
    name: 'dark cyan 2',
    value: '#124F5C',
  },
  {
    isBrightColor: false,
    name: 'dark cornflower blue 2',
    value: '#1155CB',
  },
  {
    isBrightColor: false,
    name: 'dark blue 2',
    value: '#0C5394',
  },
  {
    isBrightColor: false,
    name: 'dark purple 2',
    value: '#351C75',
  },
  {
    isBrightColor: false,
    name: 'dark magenta 2',
    value: '#741B47',
  },

  {
    isBrightColor: false,
    name: 'dark red berry 3',
    value: '#5B0F00',
  },
  {
    isBrightColor: false,
    name: 'dark red 3',
    value: '#660000',
  },
  {
    isBrightColor: false,
    name: 'dark orange 3',
    value: '#783F04',
  },
  {
    isBrightColor: false,
    name: 'dark yellow 3',
    value: '#7E6000',
  },
  {
    isBrightColor: false,
    name: 'dark green 3',
    value: '#274E12',
  },
  {
    isBrightColor: false,
    name: 'dark cyan 3',
    value: '#0D343D',
  },
  {
    isBrightColor: false,
    name: 'dark cornflower blue 3',
    value: '#1B4487',
  },
  {
    isBrightColor: false,
    name: 'dark blue 3',
    value: '#083763',
  },
  {
    isBrightColor: false,
    name: 'dark purple 3',
    value: '#1F124D',
  },
  {
    isBrightColor: false,
    name: 'dark magenta 3',
    value: '#4C1130',
  },
];

const DEFAULT_CUSTOM_COLORS = [
  {
    isBrightColor: false,
    name: 'dark orange 3',
    value: '#783F04',
  },
  {
    isBrightColor: false,
    name: 'dark grey 3',
    value: '#666666',
  },
  {
    isBrightColor: false,
    name: 'dark grey 2',
    value: '#999999',
  },
  {
    isBrightColor: false,
    name: 'light cornflower blue 1',
    value: '#6C9EEB',
  },
  {
    isBrightColor: false,
    name: 'dark magenta 3',
    value: '#4C1130',
  },
];
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { useTocElement, useTocElementState } from '@platejs/toc/react';
import { cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';

import { Button } from '@/components/ui/button';

const headingItemVariants = cva(
  'block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium underline decoration-[0.5px] underline-offset-4',
  {
    variants: {
      active: {
        false: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        true: 'bg-accent text-foreground decoration-foreground',
      },
      depth: {
        1: 'pl-0.5',
        2: 'pl-[26px]',
        3: 'pl-[50px]',
      },
    },
  }
);

export function TocElement(props: PlateElementProps) {
  const state = useTocElementState();
  const { props: btnProps } = useTocElement(state);
  const { activeContentId, headingList } = state;

  return (
    <PlateElement {...props} className="mb-1 p-0">
      <div contentEditable={false}>
        {headingList.length > 0 ? (
          headingList.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={headingItemVariants({
                active: item.id === activeContentId,
                depth: item.depth as 1 | 2 | 3,
              })}
              onClick={(e) => btnProps.onClick(e, item, 'smooth')}
              aria-current={
                item.id === activeContentId ? 'location' : undefined
              }
            >
              {item.title}
            </Button>
          ))
        ) : (
          <div className="text-gray-500 text-sm">
            Create a heading to display the table of contents.
          </div>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { type Heading, BaseTocPlugin, isHeading } from '@platejs/toc';
import { cva } from 'class-variance-authority';
import { type SlateEditor, type TElement, NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { Button } from '@/components/ui/button';

const headingItemVariants = cva(
  'block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground',
  {
    variants: {
      depth: {
        1: 'pl-0.5',
        2: 'pl-[26px]',
        3: 'pl-[50px]',
      },
    },
  }
);

export function TocElementStatic(props: SlateElementProps) {
  const { editor } = props;
  const headingList = getHeadingList(editor);

  return (
    <SlateElement {...props} className="mb-1 p-0">
      <div>
        {headingList.length > 0 ? (
          headingList.map((item: Heading) => (
            <Button
              key={item.title}
              variant="ghost"
              className={headingItemVariants({
                depth: item.depth as 1 | 2 | 3,
              })}
            >
              {item.title}
            </Button>
          ))
        ) : (
          <div className="text-gray-500 text-sm">
            Create a heading to display the table of contents.
          </div>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}

const headingDepth: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

const getHeadingList = (editor?: SlateEditor) => {
  if (!editor) return [];

  const options = editor.getOptions(BaseTocPlugin);

  if (options.queryHeading) {
    return options.queryHeading(editor);
  }

  const headingList: Heading[] = [];

  const values = editor.api.nodes<TElement>({
    at: [],
    match: (n) => isHeading(n),
  });

  if (!values) return [];

  Array.from(values).forEach(([node, path]) => {
    const { type } = node;
    const title = NodeApi.string(node);
    const depth = headingDepth[type];
    const id = node.id as string;

    if (title) {
      headingList.push({ id, depth, path, title, type });
    }
  });

  return headingList;
};

/**
 * DOCX-compatible TOC component.
 * Renders TOC items as anchor links for proper Word internal navigation.
 */
export function TocElementDocx(props: SlateElementProps) {
  const { editor } = props;
  const headingList = getHeadingList(editor);

  const depthIndent: Record<number, string> = {
    1: '0',
    2: '24pt',
    3: '48pt',
  };

  return (
    <SlateElement {...props}>
      <div
        style={{
          marginBottom: '12pt',
          padding: '8pt 0',
        }}
      >
        {headingList.length > 0 ? (
          headingList.map((item: Heading) => (
            <p
              key={item.id}
              style={{
                margin: '4pt 0',
                paddingLeft: depthIndent[item.depth] || '0',
              }}
            >
              <a
                href={`#${item.id}`}
                style={{
                  color: '#0066cc',
                  textDecoration: 'underline',
                }}
              >
                {item.title}
              </a>
            </p>
          ))
        ) : (
          <p style={{ color: '#666', fontSize: '10pt' }}>
            Create a heading to display the table of contents.
          </p>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
import { ChevronRight } from 'lucide-react';
import { PlateElement } from 'platejs/react';

import { Button } from '@/components/ui/button';

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="pl-6">
      <Button
        size="icon"
        variant="ghost"
        className="-left-0.5 absolute top-0 size-6 cursor-pointer select-none items-center justify-center rounded-md p-px text-muted-foreground transition-colors hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
        {...buttonProps}
      >
        <ChevronRight
          className={
            open
              ? 'rotate-90 transition-transform duration-75'
              : 'rotate-0 transition-transform duration-75'
          }
        />
      </Button>
      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { ChevronRight } from 'lucide-react';
import { SlateElement } from 'platejs/static';

export function ToggleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className="pl-6">
      <div
        className="-left-0.5 absolute top-0 size-6 cursor-pointer select-none items-center justify-center rounded-md p-px text-muted-foreground transition-colors hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
      >
        <ChevronRight className="rotate-0 transition-transform duration-75" />
      </div>
      {props.children}
    </SlateElement>
  );
}
'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import { useEditorPlugin } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function AIToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { api } = useEditorPlugin(AIChatPlugin);

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        api.aiChat.show();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    />
  );
}
'use client';

import * as React from 'react';

import type { Alignment } from '@platejs/basic-styles';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';

const items = [
  {
    icon: AlignLeftIcon,
    value: 'left',
  },
  {
    icon: AlignCenterIcon,
    value: 'center',
  },
  {
    icon: AlignRightIcon,
    value: 'right',
  },
  {
    icon: AlignJustifyIcon,
    value: 'justify',
  },
];

export function AlignToolbarButton(props: DropdownMenuProps) {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: 'start',
      getProp: (node) => node.align,
    }) ?? 'left';

  const [open, setOpen] = React.useState(false);
  const IconValue =
    items.find((item) => item.value === value)?.icon ?? AlignLeftIcon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            tf.textAlign.setNodes(value as Alignment);
            editor.tf.focus();
          }}
        >
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="pl-2 data-[state=checked]:bg-accent *:first:[span]:hidden"
              value={itemValue}
            >
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from '@platejs/selection/react';
import { KEYS } from 'platejs';
import {
  useEditorPlugin,
  useEditorReadOnly,
  usePluginOption,
} from 'platejs/react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { setBlockType } from '@/components/editor/transforms';
import { useIsTouchDevice } from '@/hooks/use-is-touch-device';

type Value = 'askAI' | null;

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const isTouch = useIsTouchDevice();
  const readOnly = useEditorReadOnly();
  const openId = usePluginOption(BlockMenuPlugin, 'openId');
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID;

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([, path]) => {
          setBlockType(editor, type, { at: path });
        });
    },
    [editor]
  );

  const handleAlign = React.useCallback(
    (align: 'center' | 'left' | 'right') => {
      editor
        .getTransforms(BlockSelectionPlugin)
        .blockSelection.setNodes({ align });
    },
    [editor]
  );

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        }
      }}
      modal={false}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled =
            dataset?.slateEditor === 'true' ||
            readOnly ||
            dataset?.plateOpenContextMenu === 'false';

          if (disabled) return event.preventDefault();

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            });
          }, 0);
        }}
      >
        <div className="w-full">{children}</div>
      </ContextMenuTrigger>
      {isOpen && (
        <ContextMenuContent
          className="w-64"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.getApi(BlockSelectionPlugin).blockSelection.focus();

            if (value === 'askAI') {
              editor.getApi(AIChatPlugin).aiChat.show();
            }

            setValue(null);
          }}
        >
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                setValue('askAI');
              }}
            >
              Ask AI
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes();
                editor.tf.focus();
              }}
            >
              Delete
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.duplicate();
              }}
            >
              Duplicate
              {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Turn into</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                  Paragraph
                </ContextMenuItem>

                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                  Heading 1
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                  Heading 2
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                  Heading 3
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTurnInto(KEYS.blockquote)}
                >
                  Blockquote
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTurnInto(KEYS.codeDrawing)}
                >
                  Code Drawing
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(1)
              }
            >
              Indent
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(-1)
              }
            >
              Outdent
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Align</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleAlign('left')}>
                  Left
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('center')}>
                  Center
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAlign('right')}>
                  Right
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
'use client';

import * as React from 'react';

import { MessageSquareTextIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { commentPlugin } from '@/components/editor/plugins/comment-kit';

import { ToolbarButton } from './toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip="Comment"
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import { DndPlugin, useDraggable, useDropLine } from '@platejs/dnd';
import { expandListItemsWithChildren } from '@platejs/list';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { GripVertical } from 'lucide-react';
import { type TElement, getPluginByType, isType, KEYS } from 'platejs';
import {
  type PlateEditor,
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
  useEditorRef,
  useElement,
  usePluginOption,
} from 'platejs/react';
import { useSelected } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const UNDRAGGABLE_KEYS = [KEYS.column, KEYS.tr, KEYS.td];

export const BlockDraggable: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props;

  const enabled = React.useMemo(() => {
    if (editor.dom.readOnly) return false;

    if (path.length === 1 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      return true;
    }
    if (path.length === 3 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(KEYS.column),
        },
      });

      if (block) {
        return true;
      }
    }
    if (path.length === 4 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(KEYS.table),
        },
      });

      if (block) {
        return true;
      }
    }

    return false;
  }, [editor, element, path]);

  if (!enabled) return;

  return (props) => <Draggable {...props} />;
};

function Draggable(props: PlateElementProps) {
  const { children, editor, element, path } = props;
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin).blockSelection;

  const { isAboutToDrag, isDragging, nodeRef, previewRef, handleRef } =
    useDraggable({
      element,
      onDropHandler: (_, { dragItem }) => {
        const id = (dragItem as { id: string[] | string }).id;

        if (blockSelectionApi) {
          blockSelectionApi.add(id);
        }
        resetPreview();
      },
    });

  const isInColumn = path.length === 3;
  const isInTable = path.length === 4;

  const [previewTop, setPreviewTop] = React.useState(0);

  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren();
      previewRef.current?.classList.add('hidden');
    }
  };

  // clear up virtual multiple preview when drag end
  React.useEffect(() => {
    if (!isDragging) {
      resetPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  React.useEffect(() => {
    if (isAboutToDrag) {
      previewRef.current?.classList.remove('opacity-0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAboutToDrag]);

  const [dragButtonTop, setDragButtonTop] = React.useState(0);

  return (
    <div
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        getPluginByType(editor, element.type)?.node.isContainer
          ? 'group/container'
          : 'group'
      )}
      onMouseEnter={() => {
        if (isDragging) return;
        setDragButtonTop(calcDragButtonTop(editor, element));
      }}
    >
      {!isInTable && (
        <Gutter>
          <div
            className={cn(
              'slate-blockToolbarWrapper',
              'flex h-[1.5em]',
              isInColumn && 'h-4'
            )}
          >
            <div
              className={cn(
                'slate-blockToolbar relative w-4.5',
                'pointer-events-auto mr-1 flex items-center',
                isInColumn && 'mr-1.5'
              )}
            >
              <Button
                ref={handleRef}
                variant="ghost"
                className="-left-0 absolute h-6 w-full p-0"
                style={{ top: `${dragButtonTop + 3}px` }}
                data-plate-prevent-deselect
              >
                <DragHandle
                  isDragging={isDragging}
                  previewRef={previewRef}
                  resetPreview={resetPreview}
                  setPreviewTop={setPreviewTop}
                />
              </Button>
            </div>
          </div>
        </Gutter>
      )}

      <div
        ref={previewRef}
        className={cn('-left-0 absolute hidden w-full')}
        style={{ top: `${-previewTop}px` }}
        contentEditable={false}
      />

      <div
        ref={nodeRef}
        className="slate-blockWrapper flow-root"
        onContextMenu={(event) =>
          editor
            .getApi(BlockSelectionPlugin)
            .blockSelection.addOnContextMenu({ element, event })
        }
      >
        <MemoizedChildren>{children}</MemoizedChildren>
        <DropLine />
      </div>
    </div>
  );
}

function Gutter({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const editor = useEditorRef();
  const element = useElement();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );
  const selected = useSelected();

  return (
    <div
      {...props}
      className={cn(
        'slate-gutterLeft',
        '-translate-x-full absolute top-0 z-50 flex h-full cursor-text hover:opacity-100 sm:opacity-0',
        getPluginByType(editor, element.type)?.node.isContainer
          ? 'group-hover/container:opacity-100'
          : 'group-hover:opacity-100',
        isSelectionAreaVisible && 'hidden',
        !selected && 'opacity-0',
        className
      )}
      contentEditable={false}
    >
      {children}
    </div>
  );
}

const DragHandle = React.memo(function DragHandle({
  isDragging,
  previewRef,
  resetPreview,
  setPreviewTop,
}: {
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  resetPreview: () => void;
  setPreviewTop: (top: number) => void;
}) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex size-full items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            editor.getApi(BlockSelectionPlugin).blockSelection.focus();
          }}
          onMouseDown={(e) => {
            resetPreview();

            if ((e.button !== 0 && e.button !== 2) || e.shiftKey) return;

            const blockSelection = editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.getNodes({ sort: true });

            let selectionNodes =
              blockSelection.length > 0
                ? blockSelection
                : editor.api.blocks({ mode: 'highest' });

            // If current block is not in selection, use it as the starting point
            if (!selectionNodes.some(([node]) => node.id === element.id)) {
              selectionNodes = [[element, editor.api.findPath(element)!]];
            }

            // Process selection nodes to include list children
            const blocks = expandListItemsWithChildren(
              editor,
              selectionNodes
            ).map(([node]) => node);

            if (blockSelection.length === 0) {
              editor.tf.blur();
              editor.tf.collapse();
            }

            const elements = createDragPreviewElements(editor, blocks);
            previewRef.current?.append(...elements);
            previewRef.current?.classList.remove('hidden');
            previewRef.current?.classList.add('opacity-0');
            editor.setOption(DndPlugin, 'multiplePreviewRef', previewRef);

            editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.set(blocks.map((block) => block.id as string));
          }}
          onMouseEnter={() => {
            if (isDragging) return;

            const blockSelection = editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.getNodes({ sort: true });

            let selectedBlocks =
              blockSelection.length > 0
                ? blockSelection
                : editor.api.blocks({ mode: 'highest' });

            // If current block is not in selection, use it as the starting point
            if (!selectedBlocks.some(([node]) => node.id === element.id)) {
              selectedBlocks = [[element, editor.api.findPath(element)!]];
            }

            // Process selection to include list children
            const processedBlocks = expandListItemsWithChildren(
              editor,
              selectedBlocks
            );

            const ids = processedBlocks.map((block) => block[0].id as string);

            if (ids.length > 1 && ids.includes(element.id as string)) {
              const previewTop = calculatePreviewTop(editor, {
                blocks: processedBlocks.map((block) => block[0]),
                element,
              });
              setPreviewTop(previewTop);
            } else {
              setPreviewTop(0);
            }
          }}
          onMouseUp={() => {
            resetPreview();
          }}
          data-plate-prevent-deselect
          role="button"
        >
          <GripVertical className="text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>Drag to move</TooltipContent>
    </Tooltip>
  );
});

const DropLine = React.memo(function DropLine({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      {...props}
      className={cn(
        'slate-dropLine',
        'absolute inset-x-0 h-0.5 opacity-100 transition-opacity',
        'bg-brand/50',
        dropLine === 'top' && '-top-px',
        dropLine === 'bottom' && '-bottom-px',
        className
      )}
    />
  );
});

const createDragPreviewElements = (
  editor: PlateEditor,
  blocks: TElement[]
): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  const ids: string[] = [];

  /**
   * Remove data attributes from the element to avoid recognized as slate
   * elements incorrectly.
   */
  const removeDataAttributes = (element: HTMLElement) => {
    Array.from(element.attributes).forEach((attr) => {
      if (
        attr.name.startsWith('data-slate') ||
        attr.name.startsWith('data-block-id')
      ) {
        element.removeAttribute(attr.name);
      }
    });

    Array.from(element.children).forEach((child) => {
      removeDataAttributes(child as HTMLElement);
    });
  };

  const resolveElement = (node: TElement, index: number) => {
    const domNode = editor.api.toDOMNode(node)!;
    const newDomNode = domNode.cloneNode(true) as HTMLElement;

    // Apply visual compensation for horizontal scroll
    const applyScrollCompensation = (
      original: Element,
      cloned: HTMLElement
    ) => {
      const scrollLeft = original.scrollLeft;

      if (scrollLeft > 0) {
        // Create a wrapper to handle the scroll offset
        const scrollWrapper = document.createElement('div');
        scrollWrapper.style.overflow = 'hidden';
        scrollWrapper.style.width = `${original.clientWidth}px`;

        // Create inner container with the full content
        const innerContainer = document.createElement('div');
        innerContainer.style.transform = `translateX(-${scrollLeft}px)`;
        innerContainer.style.width = `${original.scrollWidth}px`;

        // Move all children to the inner container
        while (cloned.firstChild) {
          innerContainer.append(cloned.firstChild);
        }

        // Apply the original element's styles to maintain appearance
        const originalStyles = window.getComputedStyle(original);
        cloned.style.padding = '0';
        innerContainer.style.padding = originalStyles.padding;

        scrollWrapper.append(innerContainer);
        cloned.append(scrollWrapper);
      }
    };

    applyScrollCompensation(domNode, newDomNode);

    ids.push(node.id as string);
    const wrapper = document.createElement('div');
    wrapper.append(newDomNode);
    wrapper.style.display = 'flow-root';

    const lastDomNode = blocks[index - 1];

    if (lastDomNode) {
      const lastDomNodeRect = editor.api
        .toDOMNode(lastDomNode)!
        .parentElement!.getBoundingClientRect();

      const domNodeRect = domNode.parentElement!.getBoundingClientRect();

      const distance = domNodeRect.top - lastDomNodeRect.bottom;

      // Check if the two elements are adjacent (touching each other)
      if (distance > 15) {
        wrapper.style.marginTop = `${distance}px`;
      }
    }

    removeDataAttributes(newDomNode);
    elements.push(wrapper);
  };

  blocks.forEach((node, index) => {
    resolveElement(node, index);
  });

  editor.setOption(DndPlugin, 'draggingId', ids);

  return elements;
};

const calculatePreviewTop = (
  editor: PlateEditor,
  {
    blocks,
    element,
  }: {
    blocks: TElement[];
    element: TElement;
  }
): number => {
  const child = editor.api.toDOMNode(element)!;
  const editable = editor.api.toDOMNode(editor)!;
  const firstSelectedChild = blocks[0];

  const firstDomNode = editor.api.toDOMNode(firstSelectedChild)!;
  // Get editor's top padding
  const editorPaddingTop = Number(
    window.getComputedStyle(editable).paddingTop.replace('px', '')
  );

  // Calculate distance from first selected node to editor top
  const firstNodeToEditorDistance =
    firstDomNode.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  // Get margin top of first selected node
  const firstMarginTopString = window.getComputedStyle(firstDomNode).marginTop;
  const marginTop = Number(firstMarginTopString.replace('px', ''));

  // Calculate distance from current node to editor top
  const currentToEditorDistance =
    child.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace('px', ''));

  const previewElementsTopDistance =
    currentToEditorDistance -
    firstNodeToEditorDistance +
    marginTop -
    currentMarginTop;

  return previewElementsTopDistance;
};

const calcDragButtonTop = (editor: PlateEditor, element: TElement): number => {
  const child = editor.api.toDOMNode(element)!;

  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace('px', ''));

  return currentMarginTop;
};
'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'scrollbar-hide sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        props.className
      )}
    />
  );
}
'use client';

import * as React from 'react';

import {
  ArrowUpToLineIcon,
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  HighlighterIcon,
  ItalicIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './ai-toolbar-button';
import { AlignToolbarButton } from './align-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { ExportToolbarButton } from './export-toolbar-button';
import { FontColorToolbarButton } from './font-color-toolbar-button';
import { FontSizeToolbarButton } from './font-size-toolbar-button';
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import { ImportToolbarButton } from './import-toolbar-button';
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from './indent-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { LineHeightToolbarButton } from './line-height-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from './list-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { ModeToolbarButton } from './mode-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { TableToolbarButton } from './table-toolbar-button';
import { ToggleToolbarButton } from './toggle-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ExportToolbarButton>
              <ArrowUpToLineIcon />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
              <BaselineIcon />
            </FontColorToolbarButton>

            <FontColorToolbarButton
              nodeType={KEYS.backgroundColor}
              tooltip="Background color"
            >
              <PaintBucketIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />

            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableToolbarButton />
            <EmojiToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={KEYS.img} />
            <MediaToolbarButton nodeType={KEYS.video} />
            <MediaToolbarButton nodeType={KEYS.audio} />
            <MediaToolbarButton nodeType={KEYS.file} />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <div className="grow" />

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
          <HighlighterIcon />
        </MarkToolbarButton>
        <CommentToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <ModeToolbarButton />
      </ToolbarGroup>
    </div>
  );
}
'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { toUnitLess } from '@platejs/basic-styles';
import { FontSizePlugin } from '@platejs/basic-styles/react';
import { Minus, Plus } from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorSelector } from 'platejs/react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ToolbarButton } from './toolbar';

const DEFAULT_FONT_SIZE = '16';

const FONT_SIZE_MAP = {
  h1: '36',
  h2: '24',
  h3: '20',
} as const;

const FONT_SIZES = [
  '8',
  '9',
  '10',
  '12',
  '14',
  '16',
  '18',
  '24',
  '30',
  '36',
  '48',
  '60',
  '72',
  '96',
] as const;

export function FontSizeToolbarButton() {
  const [inputValue, setInputValue] = React.useState(DEFAULT_FONT_SIZE);
  const [isFocused, setIsFocused] = React.useState(false);
  const { editor, tf } = useEditorPlugin(FontSizePlugin);

  const cursorFontSize = useEditorSelector((editor) => {
    const fontSize = editor.api.marks()?.[KEYS.fontSize];

    if (fontSize) {
      return toUnitLess(fontSize as string);
    }

    const [block] = editor.api.block<TElement>() || [];

    if (!block?.type) return DEFAULT_FONT_SIZE;

    return block.type in FONT_SIZE_MAP
      ? FONT_SIZE_MAP[block.type as keyof typeof FONT_SIZE_MAP]
      : DEFAULT_FONT_SIZE;
  }, []);

  const handleInputChange = () => {
    const newSize = toUnitLess(inputValue);

    if (
      Number.parseInt(newSize, 10) < 1 ||
      Number.parseInt(newSize, 10) > 100
    ) {
      editor.tf.focus();

      return;
    }
    if (newSize !== toUnitLess(cursorFontSize)) {
      tf.fontSize.addMark(`${newSize}px`);
    }

    editor.tf.focus();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Number(displayValue) + delta;
    tf.fontSize.addMark(`${newSize}px`);
    editor.tf.focus();
  };

  const displayValue = isFocused ? inputValue : cursorFontSize;

  return (
    <div className="flex h-7 items-center gap-1 rounded-md bg-muted/60 p-0">
      <ToolbarButton onClick={() => handleFontSizeChange(-1)}>
        <Minus />
      </ToolbarButton>

      <Popover open={isFocused} modal={false}>
        <PopoverTrigger asChild>
          <input
            className={cn(
              'h-full w-10 shrink-0 bg-transparent px-1 text-center text-sm hover:bg-muted'
            )}
            value={displayValue}
            onBlur={() => {
              setIsFocused(false);
              handleInputChange();
            }}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setInputValue(toUnitLess(cursorFontSize));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputChange();
              }
            }}
            data-plate-focus="true"
            type="text"
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-10 px-px py-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              className={cn(
                'flex h-8 w-full items-center justify-center text-sm hover:bg-accent data-[highlighted=true]:bg-accent'
              )}
              onClick={() => {
                tf.fontSize.addMark(`${size}px`);
                setIsFocused(false);
              }}
              data-highlighted={size === displayValue}
              type="button"
            >
              {size}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <ToolbarButton onClick={() => handleFontSizeChange(1)}>
        <Plus />
      </ToolbarButton>
    </div>
  );
}
'use client';

import * as React from 'react';

import { Redo2Icon, Undo2Icon } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function RedoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (editor) => editor.history.redos.length === 0,
    []
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.redo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip="Redo"
    >
      <Redo2Icon />
    </ToolbarButton>
  );
}

export function UndoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (editor) => editor.history.undos.length === 0,
    []
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.undo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip="Undo"
    >
      <Undo2Icon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
} from '@platejs/list/react';
import { List, ListOrdered, ListTodoIcon } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

export function BulletedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          });
        }}
        data-state={pressed ? 'on' : 'off'}
      >
        <List className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Disc,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current bg-current" />
                Default
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Circle,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current" />
                Circle
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Square,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 border border-current bg-current" />
                Square
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function NumberedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.UpperAlpha,
        ListStyleType.LowerRoman,
        ListStyleType.UpperRoman,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() =>
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          })
        }
        data-state={pressed ? 'on' : 'off'}
      >
        <ListOrdered className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Decimal,
                })
              }
            >
              Decimal (1, 2, 3)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerAlpha,
                })
              }
            >
              Lower Alpha (a, b, c)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperAlpha,
                })
              }
            >
              Upper Alpha (A, B, C)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerRoman,
                })
              }
            >
              Lower Roman (i, ii, iii)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperRoman,
                })
              }
            >
              Upper Roman (I, II, III)
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function TodoListToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useIndentTodoToolBarButtonState({ nodeType: 'todo' });
  const { props: buttonProps } = useIndentTodoToolBarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Todo">
      <ListTodoIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
} from '@platejs/list/react';
import { List, ListOrdered, ListTodoIcon } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

export function BulletedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          });
        }}
        data-state={pressed ? 'on' : 'off'}
      >
        <List className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Disc,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current bg-current" />
                Default
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Circle,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current" />
                Circle
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Square,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 border border-current bg-current" />
                Square
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function NumberedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.UpperAlpha,
        ListStyleType.LowerRoman,
        ListStyleType.UpperRoman,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() =>
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          })
        }
        data-state={pressed ? 'on' : 'off'}
      >
        <ListOrdered className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" alignOffset={-32}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Decimal,
                })
              }
            >
              Decimal (1, 2, 3)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerAlpha,
                })
              }
            >
              Lower Alpha (a, b, c)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperAlpha,
                })
              }
            >
              Upper Alpha (A, B, C)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerRoman,
                })
              }
            >
              Lower Roman (i, ii, iii)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperRoman,
                })
              }
            >
              Upper Roman (I, II, III)
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function TodoListToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useIndentTodoToolBarButtonState({ nodeType: 'todo' });
  const { props: buttonProps } = useIndentTodoToolBarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Todo">
      <ListTodoIcon />
    </ToolbarButton>'use client';

import * as React from 'react';

import { useIndentButton, useOutdentButton } from '@platejs/indent/react';
import { IndentIcon, OutdentIcon } from 'lucide-react';

import { ToolbarButton } from './toolbar';

export function IndentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useIndentButton();

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Indent">
      <IndentIcon />
    </ToolbarButton>
  );
}

export function OutdentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useOutdentButton();

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Outdent">
      <OutdentIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { importDocx } from '@platejs/docx-io';
import { MarkdownPlugin } from '@platejs/markdown';
import { ArrowUpToLineIcon } from 'lucide-react';
import { getEditorDOMFromHtmlString } from 'platejs/static';
import { useEditorRef } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';

type ImportType = 'html' | 'markdown';

export function ImportToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const getFileNodes = (text: string, type: ImportType) => {
    if (type === 'html') {
      const editorNode = getEditorDOMFromHtmlString(text);
      const nodes = editor.api.html.deserialize({
        element: editorNode,
      });

      return nodes;
    }

    if (type === 'markdown') {
      return editor.getApi(MarkdownPlugin).markdown.deserialize(text);
    }

    return [];
  };

  const { openFilePicker: openMdFilePicker } = useFilePicker({
    accept: ['.md', '.mdx'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const text = await plainFiles[0].text();

      const nodes = getFileNodes(text, 'markdown');

      editor.tf.insertNodes(nodes);
    },
  });

  const { openFilePicker: openHtmlFilePicker } = useFilePicker({
    accept: ['text/html'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const text = await plainFiles[0].text();

      const nodes = getFileNodes(text, 'html');

      editor.tf.insertNodes(nodes);
    },
  });

  const { openFilePicker: openDocxFilePicker } = useFilePicker({
    accept: ['.docx'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const arrayBuffer = await plainFiles[0].arrayBuffer();
      const result = await importDocx(editor, arrayBuffer);

      editor.tf.insertNodes(result.nodes as typeof editor.children);
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Import" isDropdown>
          <ArrowUpToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              openHtmlFilePicker();
            }}
          >
            Import from HTML
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              openMdFilePicker();
            }}
          >
            Import from Markdown
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              openDocxFilePicker();
            }}
          >
            Import from Word
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  SuperscriptIcon,
  TableIcon,
  TableOfContentsIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  insertBlock,
  insertInlineElement,
} from '@/components/editor/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

type Group = {
  group: string;
  items: Item[];
};

type Item = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
};

const groups: Group[] = [
  {
    group: 'Basic blocks',
    items: [
      {
        icon: <PilcrowIcon />,
        label: 'Paragraph',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        label: 'Heading 1',
        value: 'h1',
      },
      {
        icon: <Heading2Icon />,
        label: 'Heading 2',
        value: 'h2',
      },
      {
        icon: <Heading3Icon />,
        label: 'Heading 3',
        value: 'h3',
      },
      {
        icon: <TableIcon />,
        label: 'Table',
        value: KEYS.table,
      },
      {
        icon: <FileCodeIcon />,
        label: 'Code',
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
        label: 'Quote',
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon />,
        label: 'Divider',
        value: KEYS.hr,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Lists',
    items: [
      {
        icon: <ListIcon />,
        label: 'Bulleted list',
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        label: 'Numbered list',
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
        label: 'To-do list',
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        label: 'Toggle list',
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Media',
    items: [
      {
        icon: <ImageIcon />,
        label: 'Image',
        value: KEYS.img,
      },
      {
        icon: <FilmIcon />,
        label: 'Embed',
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Advanced blocks',
    items: [
      {
        icon: <TableOfContentsIcon />,
        label: 'Table of contents',
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: '3 columns',
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Equation',
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        label: 'Excalidraw',
        value: KEYS.excalidraw,
      },
      {
        icon: <Code2 />,
        label: 'Code Drawing',
        value: KEYS.codeDrawing,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: 'Inline',
    items: [
      {
        icon: <Link2Icon />,
        label: 'Link',
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        label: 'Date',
        value: KEYS.date,
      },
      {
        focusEditor: true,
        icon: <SuperscriptIcon />,
        label: 'Footnote',
        value: 'action_footnote',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Inline Equation',
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert" isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { LineHeightPlugin } from '@platejs/basic-styles/react';
import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import { CheckIcon, WrapText } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';

export function LineHeightToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const { defaultNodeValue, validNodeValues: values = [] } =
    editor.getInjectProps(LineHeightPlugin);

  const value = useSelectionFragmentProp({
    defaultValue: defaultNodeValue,
    getProp: (node) => node.lineHeight,
  });

  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Line height" isDropdown>
          <WrapText />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) => {
            editor
              .getTransforms(LineHeightPlugin)
              .lineHeight.setNodes(Number(newValue));
            editor.tf.focus();
          }}
        >
          {values.map((value) => (
            <DropdownMenuRadioItem
              key={value}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={value}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from '@platejs/link/react';
import { Link } from 'lucide-react';

import { ToolbarButton } from './toolbar';

export function LinkToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip="Link">
      <Link />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { PlaceholderPlugin } from '@platejs/media/react';
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
} from 'lucide-react';
import { isUrl, KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    title: string;
    tooltip: string;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    icon: <AudioLinesIcon className="size-4" />,
    title: 'Insert Audio',
    tooltip: 'Audio',
  },
  [KEYS.file]: {
    accept: ['*'],
    icon: <FileUpIcon className="size-4" />,
    title: 'Insert File',
    tooltip: 'File',
  },
  [KEYS.img]: {
    accept: ['image/*'],
    icon: <ImageIcon className="size-4" />,
    title: 'Insert Image',
    tooltip: 'Image',
  },
  [KEYS.video]: {
    accept: ['video/*'],
    icon: <FilmIcon className="size-4" />,
    title: 'Insert Video',
    tooltip: 'Video',
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const currentConfig = MEDIA_CONFIG[nodeType];

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  return (
    <>
      <ToolbarSplitButton
        onClick={() => {
          openFilePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          open={open}
          onOpenChange={setOpen}
          modal={false}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="start"
            alignOffset={-32}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                Upload from computer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                Insert via URL
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [url, setUrl] = React.useState('');

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error('Invalid URL');

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: '' }],
      name: nodeType === KEYS.file ? url.split('/').pop() : undefined,
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          Accept
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
'use client';

import * as React from 'react';

import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  type DropdownMenuProps,
  DropdownMenuItemIndicator,
} from '@radix-ui/react-dropdown-menu';
import { CheckIcon, EyeIcon, PencilLineIcon, PenIcon } from 'lucide-react';
import {
  useEditorReadOnly,
  useEditorRef,
  usePluginOption,
} from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';

export function ModeToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const [open, setOpen] = React.useState(false);

  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');

  let value = 'editing';

  if (readOnly) value = 'viewing';

  if (isSuggesting) value = 'suggestion';

  const item: Record<string, { icon: React.ReactNode; label: string }> = {
    editing: {
      icon: <PenIcon />,
      label: 'Editing',
    },
    suggestion: {
      icon: <PencilLineIcon />,
      label: 'Suggestion',
    },
    viewing: {
      icon: <EyeIcon />,
      label: 'Viewing',
    },
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Editing mode" isDropdown>
          {item[value].icon}
          <span className="hidden lg:inline">{item[value].label}</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuRadioGroup
          onValueChange={(newValue) => {
            if (newValue === 'viewing') {
              editor.store.setReadOnly(true);

              return;
            }
            editor.store.setReadOnly(false);

            if (newValue === 'suggestion') {
              editor.setOption(SuggestionPlugin, 'isSuggesting', true);

              return;
            }
            editor.setOption(SuggestionPlugin, 'isSuggesting', false);

            if (newValue === 'editing') {
              editor.tf.focus();

              return;
            }
          }}
          value={value}
        >
          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="editing"
          >
            <Indicator />
            {item.editing.icon}
            {item.editing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="viewing"
          >
            <Indicator />
            {item.viewing.icon}
            {item.viewing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="suggestion"
          >
            <Indicator />
            {item.suggestion.icon}
            {item.suggestion.label}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Indicator() {
  return (
    <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <CheckIcon />
      </DropdownMenuItemIndicator>
    </span>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  KeyboardIcon,
  MoreHorizontalIcon,
  SubscriptIcon,
  SuperscriptIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';

export function MoreToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert">
          <MoreHorizontalIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar flex max-h-[500px] min-w-[180px] flex-col overflow-y-auto"
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.kbd);
              editor.tf.collapse({ edge: 'end' });
              editor.tf.focus();
            }}
          >
            <KeyboardIcon />
            Keyboard input
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sup, {
                remove: KEYS.sub,
              });
              editor.tf.focus();
            }}
          >
            <SuperscriptIcon />
            Superscript
            {/* (⌘+,) */}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sub, {
                remove: KEYS.sup,
              });
              editor.tf.focus();
            }}
          >
            <SubscriptIcon />
            Subscript
            {/* (⌘+.) */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TablePlugin, useTableMergeState } from '@platejs/table/react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Combine,
  Grid3x3Icon,
  Table,
  Trash2Icon,
  Ungroup,
  XIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorSelector } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { ToolbarButton } from './toolbar';

export function TableToolbarButton(props: DropdownMenuProps) {
  const tableSelected = useEditorSelector(
    (editor) => editor.api.some({ match: { type: KEYS.table } }),
    []
  );

  const { editor, tf } = useEditorPlugin(TablePlugin);
  const [open, setOpen] = React.useState(false);
  const mergeState = useTableMergeState();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Table" isDropdown>
          <Table />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex w-[180px] min-w-0 flex-col"
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Grid3x3Icon className="size-4" />
              <span>Table</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="m-0 p-0">
              <TablePicker />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>Cell</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!mergeState.canMerge}
                onSelect={() => {
                  tf.table.merge();
                  editor.tf.focus();
                }}
              >
                <Combine />
                Merge cells
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!mergeState.canSplit}
                onSelect={() => {
                  tf.table.split();
                  editor.tf.focus();
                }}
              >
                <Ungroup />
                Split cell
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>Row</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableRow({ before: true });
                  editor.tf.focus();
                }}
              >
                <ArrowUp />
                Insert row before
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableRow();
                  editor.tf.focus();
                }}
              >
                <ArrowDown />
                Insert row after
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.remove.tableRow();
                  editor.tf.focus();
                }}
              >
                <XIcon />
                Delete row
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              disabled={!tableSelected}
            >
              <div className="size-4" />
              <span>Column</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableColumn({ before: true });
                  editor.tf.focus();
                }}
              >
                <ArrowLeft />
                Insert column before
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.insert.tableColumn();
                  editor.tf.focus();
                }}
              >
                <ArrowRight />
                Insert column after
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-w-[180px]"
                disabled={!tableSelected}
                onSelect={() => {
                  tf.remove.tableColumn();
                  editor.tf.focus();
                }}
              >
                <XIcon />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="min-w-[180px]"
            disabled={!tableSelected}
            onSelect={() => {
              tf.remove.table();
              editor.tf.focus();
            }}
          >
            <Trash2Icon />
            Delete table
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TablePicker() {
  const { editor, tf } = useEditorPlugin(TablePlugin);

  const [tablePicker, setTablePicker] = React.useState({
    grid: Array.from({ length: 8 }, () => Array.from({ length: 8 }).fill(0)),
    size: { colCount: 0, rowCount: 0 },
  });

  const onCellMove = (rowIndex: number, colIndex: number) => {
    const newGrid = [...tablePicker.grid];

    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        newGrid[i][j] =
          i >= 0 && i <= rowIndex && j >= 0 && j <= colIndex ? 1 : 0;
      }
    }

    setTablePicker({
      grid: newGrid,
      size: { colCount: colIndex + 1, rowCount: rowIndex + 1 },
    });
  };

  return (
    <div
      className="flex! m-0 flex-col p-0"
      onClick={() => {
        tf.insert.table(tablePicker.size, { select: true });
        editor.tf.focus();
      }}
      role="button"
    >
      <div className="grid size-[130px] grid-cols-8 gap-0.5 p-1">
        {tablePicker.grid.map((rows, rowIndex) =>
          rows.map((value, columIndex) => (
            <div
              key={`(${rowIndex},${columIndex})`}
              className={cn(
                'col-span-1 size-3 border border-solid bg-secondary',
                !!value && 'border-current'
              )}
              onMouseMove={() => {
                onCellMove(rowIndex, columIndex);
              }}
            />
          ))
        )}
      </div>

      <div className="text-center text-current text-xs">
        {tablePicker.size.rowCount} x {tablePicker.size.colCount}
      </div>
    </div>
  );
}
'use client';

import * as React from 'react';

import {
  useToggleToolbarButton,
  useToggleToolbarButtonState,
} from '@platejs/toggle/react';
import { ListCollapseIcon } from 'lucide-react';

import { ToolbarButton } from './toolbar';

export function ToggleToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Toggle">
      <ListCollapseIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getBlockType,
  setBlockType,
} from '@/components/editor/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

export const turnIntoItems = [
  {
    icon: <PilcrowIcon />,
    keywords: ['paragraph'],
    label: 'Text',
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ['title', 'h1'],
    label: 'Heading 1',
    value: 'h1',
  },
  {
    icon: <Heading2Icon />,
    keywords: ['subtitle', 'h2'],
    label: 'Heading 2',
    value: 'h2',
  },
  {
    icon: <Heading3Icon />,
    keywords: ['subtitle', 'h3'],
    label: 'Heading 3',
    value: 'h3',
  },
  {
    icon: <Heading4Icon />,
    keywords: ['subtitle', 'h4'],
    label: 'Heading 4',
    value: 'h4',
  },
  {
    icon: <Heading5Icon />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: 'h5',
  },
  {
    icon: <Heading6Icon />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: 'h6',
  },
  {
    icon: <ListIcon />,
    keywords: ['unordered', 'ul', '-'],
    label: 'Bulleted list',
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ['ordered', 'ol', '1'],
    label: 'Numbered list',
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ['checklist', 'task', 'checkbox', '[]'],
    label: 'To-do list',
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ['collapsible', 'expandable'],
    label: 'Toggle list',
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ['```'],
    label: 'Code',
    value: KEYS.codeBlock,
  },
  {
    icon: <Code2 />,
    keywords: [
      'code-drawing',
      'diagram',
      'plantuml',
      'graphviz',
      'flowchart',
      'mermaid',
    ],
    label: 'Code Drawing',
    value: KEYS.codeDrawing,
  },
  {
    icon: <QuoteIcon />,
    keywords: ['citation', 'blockquote', '>'],
    label: 'Quote',
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    label: '3 columns',
    value: 'action_three_columns',
  },
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip="Turn into"
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="Turn into"
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

  );
}
'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { exportToDocx } from '@platejs/docx-io';
import { MarkdownPlugin } from '@platejs/markdown';
import { ArrowDownToLineIcon } from 'lucide-react';
import type { SlatePlugin } from 'platejs';
import { createSlateEditor } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { serializeHtml } from 'platejs/static';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BaseEditorKit } from '@/components/editor/editor-base-kit';

import { EditorStatic } from './editor-static';
import { ToolbarButton } from './toolbar';
import { DocxExportKit } from '@/components/editor/plugins/docx-export-kit';

const siteUrl = 'https://platejs.org';

export function ExportToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const getCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas-pro');

    const style = document.createElement('style');
    document.head.append(style);

    const canvas = await html2canvas(editor.api.toDOMNode(editor)!, {
      onclone: (document: Document) => {
        const editorElement = document.querySelector(
          '[contenteditable="true"]'
        );
        if (editorElement) {
          Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
            const existingStyle = element.getAttribute('style') || '';
            element.setAttribute(
              'style',
              `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
            );
          });
        }
      },
    });
    style.remove();

    return canvas;
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  };

  const exportToPdf = async () => {
    const canvas = await getCanvas();

    const PDFLib = await import('pdf-lib');
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([canvas.width, canvas.height]);
    const imageEmbed = await pdfDoc.embedPng(canvas.toDataURL('PNG'));
    const { height, width } = imageEmbed.scale(1);
    page.drawImage(imageEmbed, {
      height,
      width,
      x: 0,
      y: 0,
    });
    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

    await downloadFile(pdfBase64, 'plate.pdf');
  };

  const exportToImage = async () => {
    const canvas = await getCanvas();
    await downloadFile(canvas.toDataURL('image/png'), 'plate.png');
  };

  const exportToHtml = async () => {
    const editorStatic = createSlateEditor({
      plugins: BaseEditorKit,
      value: editor.children,
    });

    const editorHtml = await serializeHtml(editorStatic, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } },
    });

    const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
    const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`;

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        ${tailwindCss}
        ${katexCss}
        <style>
          :root {
            --font-sans: 'Inter', 'Inter Fallback';
            --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback';
          }
        </style>
      </head>
      <body>
        ${editorHtml}
      </body>
    </html>`;

    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    await downloadFile(url, 'plate.html');
  };

  const exportToMarkdown = async () => {
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
    await downloadFile(url, 'plate.md');
  };

  const exportToWord = async () => {
    const blob = await exportToDocx(editor.children, {
      editorPlugins: [...BaseEditorKit, ...DocxExportKit] as SlatePlugin[],
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plate.docx';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Export" isDropdown>
          <ArrowDownToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToHtml}>
            Export as HTML
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>
            Export as Image
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            Export as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToWord}>
            Export as Word
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
'use client';

import * as React from 'react';

import {
  type FloatingToolbarState,
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from '@platejs/floating';
import { useComposedRef } from '@udecode/cn';
import { KEYS } from 'platejs';
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from 'platejs/react';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, 'open');

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen || isAIChatOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: [
            'top-start',
            'top-end',
            'bottom-start',
            'bottom-end',
          ],
          padding: 12,
        }),
      ],
      placement: 'top',
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef);

  if (hidden) return null;

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          'scrollbar-hide absolute z-50 overflow-x-auto whitespace-nowrap rounded-md border bg-popover p-1 opacity-100 shadow-md print:hidden',
          'max-w-[80vw]',
          className
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}
'use client';

import * as React from 'react';

import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './ai-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
'use client';

import * as React from 'react';

import { insertInlineEquation } from '@platejs/math';
import { RadicalIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function InlineEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
      tooltip="Mark as equation"
    >
      <RadicalIcon />
    </ToolbarButton>
  );
}
'use client';

import * as React from 'react';

import type { TLinkElement } from 'platejs';

import {
  type UseVirtualFloatingOptions,
  flip,
  offset,
} from '@platejs/floating';
import { getLinkAttributes } from '@platejs/link';
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react';
import { cva } from 'class-variance-authority';
import { ExternalLink, Link, Text, Unlink } from 'lucide-react';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption,
} from 'platejs/react';

import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const popoverVariants = cva(
  'z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden'
);

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-transparent md:text-sm'
);

export function LinkFloatingToolbar({
  state,
}: {
  state?: LinkFloatingToolbarState;
}) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId');
  const activeSuggestionId = usePluginOption(
    { key: KEYS.suggestion },
    'activeId'
  );

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(
    () => ({
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12,
        }),
      ],
      placement:
        activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start',
    }),
    [activeCommentId, activeSuggestionId]
  );

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState);
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  if (hidden) return null;

  const input = (
    <div className="flex w-[330px] flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Link className="size-4" />
        </div>

        <FloatingLinkUrlInput
          className={inputVariants()}
          placeholder="Paste link"
          data-plate-focus
        />
      </div>
      <Separator className="my-1" />
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Text className="size-4" />
        </div>
        <input
          className={inputVariants()}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
        />
      </div>
    </div>
  );

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center">
      <button
        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
        type="button"
        {...editButtonProps}
      >
        Edit link
      </button>

      <Separator orientation="vertical" />

      <LinkOpenButton />

      <Separator orientation="vertical" />

      <button
        className={buttonVariants({
          size: 'sm',
          variant: 'ghost',
        })}
        type="button"
        {...unlinkButtonProps}
      >
        <Unlink width={18} />
      </button>
    </div>
  );

  return (
    <>
      <div ref={insertRef} className={popoverVariants()} {...insertProps}>
        {input}
      </div>

      <div ref={editRef} className={popoverVariants()} {...editProps}>
        {editContent}
      </div>
    </>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = React.useMemo(
    () => {
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      if (!entry) {
        return {};
      }
      const [element] = entry;
      return getLinkAttributes(editor, element);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, selection]
  );

  return (
    <a
      {...attributes}
      className={buttonVariants({
        size: 'sm',
        variant: 'ghost',
      })}
      onMouseOver={(e) => {
        e.stopPropagation();
      }}
      aria-label="Open link in a new tab"
      target="_blank"
    >
      <ExternalLink width={18} />
    </a>
  );
}
'use client';

import * as React from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import { Tweet } from 'react-tweet';

import type { TMediaEmbedElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { parseTwitterUrl, parseVideoUrl } from '@platejs/media';
import { MediaEmbedPlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const MediaEmbedElement = withHOC(
  ResizableProvider,
  function MediaEmbedElement(props: PlateElementProps<TMediaEmbedElement>) {
    const {
      align = 'center',
      embed,
      focused,
      isTweet,
      isVideo,
      isYoutube,
      readOnly,
      selected,
    } = useMediaState({
      urlParsers: [parseTwitterUrl, parseVideoUrl],
    });
    const width = useResizableValue('width');
    const provider = embed?.provider;

    return (
      <MediaToolbar plugin={MediaEmbedPlugin}>
        <PlateElement className="py-2.5" {...props}>
          <figure
            className="group relative m-0 w-full cursor-default"
            contentEditable={false}
          >
            <Resizable
              align={align}
              options={{
                align,
                maxWidth: isTweet ? 550 : '100%',
                minWidth: isTweet ? 300 : 100,
              }}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />

              {isVideo ? (
                isYoutube ? (
                  <div>
                    <LiteYouTubeEmbed
                      id={embed!.id!}
                      title="youtube"
                      wrapperClass={cn(
                        'rounded-sm',
                        focused && selected && 'ring-2 ring-ring ring-offset-2',
                        'relative block cursor-pointer bg-black bg-center bg-cover [contain:content]',
                        '[&.lyt-activated]:before:absolute [&.lyt-activated]:before:top-0 [&.lyt-activated]:before:h-[60px] [&.lyt-activated]:before:w-full [&.lyt-activated]:before:bg-top [&.lyt-activated]:before:bg-repeat-x [&.lyt-activated]:before:pb-[50px] [&.lyt-activated]:before:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                        '[&.lyt-activated]:before:bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==)]',
                        'after:block after:pb-[var(--aspect-ratio)] after:content-[""]',
                        '[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full',
                        '[&_>_.lty-playbtn]:z-1 [&_>_.lty-playbtn]:h-[46px] [&_>_.lty-playbtn]:w-[70px] [&_>_.lty-playbtn]:rounded-[14%] [&_>_.lty-playbtn]:bg-[#212121] [&_>_.lty-playbtn]:opacity-80 [&_>_.lty-playbtn]:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                        '[&:hover_>_.lty-playbtn]:bg-[red] [&:hover_>_.lty-playbtn]:opacity-100',
                        '[&_>_.lty-playbtn]:before:border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:border-y-[11px] [&_>_.lty-playbtn]:before:border-r-0 [&_>_.lty-playbtn]:before:border-l-[19px] [&_>_.lty-playbtn]:before:content-[""]',
                        '[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:[transform:translate3d(-50%,-50%,0)]',
                        '[&_>_.lty-playbtn]:before:absolute [&_>_.lty-playbtn]:before:top-1/2 [&_>_.lty-playbtn]:before:left-1/2 [&_>_.lty-playbtn]:before:[transform:translate3d(-50%,-50%,0)]',
                        '[&.lyt-activated]:cursor-[unset]',
                        '[&.lyt-activated]:before:pointer-events-none [&.lyt-activated]:before:opacity-0',
                        '[&.lyt-activated_>_.lty-playbtn]:pointer-events-none [&.lyt-activated_>_.lty-playbtn]:opacity-0!'
                      )}
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      provider === 'vimeo' && 'pb-[75%]',
                      provider === 'youku' && 'pb-[56.25%]',
                      provider === 'dailymotion' && 'pb-[56.0417%]',
                      provider === 'coub' && 'pb-[51.25%]'
                    )}
                  >
                    <iframe
                      className={cn(
                        'absolute top-0 left-0 size-full rounded-sm',
                        isVideo && 'border-0',
                        focused && selected && 'ring-2 ring-ring ring-offset-2'
                      )}
                      title="embed"
                      src={embed!.url}
                      allowFullScreen
                    />
                  </div>
                )
              ) : null}

              {isTweet && (
                <div
                  className={cn(
                    '[&_.react-tweet-theme]:my-0',
                    !readOnly &&
                      selected &&
                      '[&_.react-tweet-theme]:ring-2 [&_.react-tweet-theme]:ring-ring [&_.react-tweet-theme]:ring-offset-2'
                  )}
                >
                  <Tweet id={embed!.id!} />
                </div>
              )}

              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'right' })}
                options={{ direction: 'right' }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea placeholder="Write a caption..." />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);
'use client';

import * as React from 'react';

import type { TPlaceholderElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import {
  PlaceholderPlugin,
  PlaceholderProvider,
  updateUploadHistory,
} from '@platejs/media/react';
import { AudioLines, FileUp, Film, ImageIcon, Loader2Icon } from 'lucide-react';
import { KEYS } from 'platejs';
import { PlateElement, useEditorPlugin, withHOC } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';

import { cn } from '@/lib/utils';
import { useUploadFile } from '@/hooks/use-upload-file';

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    icon: React.ReactNode;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    content: 'Add an audio file',
    icon: <AudioLines />,
  },
  [KEYS.file]: {
    accept: ['*'],
    content: 'Add a file',
    icon: <FileUp />,
  },
  [KEYS.img]: {
    accept: ['image/*'],
    content: 'Add an image',
    icon: <ImageIcon />,
  },
  [KEYS.video]: {
    accept: ['video/*'],
    content: 'Add a video',
    icon: <Film />,
  },
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;

    const { api } = useEditorPlugin(PlaceholderPlugin);

    const { isUploading, progress, uploadedFile, uploadFile, uploadingFile } =
      useUploadFile();

    const loading = isUploading && uploadingFile;

    const currentContent = CONTENT[element.mediaType];

    const isImage = element.mediaType === KEYS.img;

    const imageRef = React.useRef<HTMLImageElement>(null);

    const { openFilePicker } = useFilePicker({
      accept: currentContent.accept,
      multiple: true,
      onFilesSelected: ({ plainFiles: updatedFiles }) => {
        const firstFile = updatedFiles[0];
        const restFiles = updatedFiles.slice(1);

        replaceCurrentPlaceholder(firstFile);

        if (restFiles.length > 0) {
          editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
        }
      },
    });

    const replaceCurrentPlaceholder = React.useCallback(
      (file: File) => {
        void uploadFile(file);
        api.placeholder.addUploadingFile(element.id as string, file);
      },
      [api.placeholder, element.id, uploadFile]
    );

    React.useEffect(() => {
      if (!uploadedFile) return;

      const path = editor.api.findPath(element);

      editor.tf.withoutSaving(() => {
        editor.tf.removeNodes({ at: path });

        const node = {
          children: [{ text: '' }],
          initialHeight: imageRef.current?.height,
          initialWidth: imageRef.current?.width,
          isUpload: true,
          name: element.mediaType === KEYS.file ? uploadedFile.name : '',
          placeholderId: element.id as string,
          type: element.mediaType!,
          url: uploadedFile.url,
        };

        editor.tf.insertNodes(node, { at: path });

        updateUploadHistory(editor, node);
      });

      api.placeholder.removeUploadingFile(element.id as string);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile, element.id]);

    // React dev mode will call React.useEffect twice
    const isReplaced = React.useRef(false);

    /** Paste and drop */
    React.useEffect(() => {
      if (isReplaced.current) return;

      isReplaced.current = true;
      const currentFiles = api.placeholder.getUploadingFile(
        element.id as string
      );

      if (!currentFiles) return;

      replaceCurrentPlaceholder(currentFiles);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReplaced]);

    return (
      <PlateElement className="my-1" {...props}>
        {(!loading || !isImage) && (
          <div
            className={cn(
              'flex cursor-pointer select-none items-center rounded-sm bg-muted p-3 pr-9 hover:bg-primary/10'
            )}
            onClick={() => !loading && openFilePicker()}
            contentEditable={false}
          >
            <div className="relative mr-3 flex text-muted-foreground/80 [&_svg]:size-6">
              {currentContent.icon}
            </div>
            <div className="whitespace-nowrap text-muted-foreground text-sm">
              <div>
                {loading ? uploadingFile?.name : currentContent.content}
              </div>

              {loading && !isImage && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div>{formatBytes(uploadingFile?.size ?? 0)}</div>
                  <div>–</div>
                  <div className="flex items-center">
                    <Loader2Icon className="mr-1 size-3.5 animate-spin text-muted-foreground" />
                    {progress ?? 0}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isImage && loading && (
          <ImageProgress
            file={uploadingFile}
            imageRef={imageRef}
            progress={progress}
          />
        )}

        {props.children}
      </PlateElement>
    );
  }
);

export function ImageProgress({
  className,
  file,
  imageRef,
  progress = 0,
}: {
  file: File;
  className?: string;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  progress?: number;
}) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Store the object URL tied to this File and revoke it on cleanup.
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div className={cn('relative', className)} contentEditable={false}>
      <img
        ref={imageRef}
        className="h-auto w-full rounded-sm object-cover"
        alt={file.name}
        src={objectUrl}
      />
      {progress < 100 && (
        <div className="absolute right-1 bottom-1 flex items-center space-x-2 rounded-full bg-black/50 px-1 py-0.5">
          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
          <span className="font-medium text-white text-xs">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

  if (bytes === 0) return '0 Byte';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / 1024 ** i).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}
'use client';

import * as React from 'react';

import {
  PreviewImage,
  useImagePreview,
  useImagePreviewValue,
  useScaleInput,
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import { ArrowLeft, ArrowRight, Download, Minus, Plus, X } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { cn } from '@/lib/utils';

const buttonVariants = cva('rounded bg-[rgba(0,0,0,0.5)] px-1', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'text-white',
      disabled: 'cursor-not-allowed text-gray-400',
    },
  },
});

const SCROLL_SPEED = 4;
const DEFAULT_DOWNLOAD_FILENAME = 'image';

export function MediaPreviewDialog() {
  const editor = useEditorRef();
  const isOpen = useImagePreviewValue('isOpen', editor.id);
  const scale = useImagePreviewValue('scale');
  const isEditingScale = useImagePreviewValue('isEditingScale');
  const currentPreview = useImagePreviewValue('currentPreview');
  const {
    closeProps,
    currentUrlIndex,
    maskLayerProps,
    nextDisabled,
    nextProps,
    prevDisabled,
    prevProps,
    scaleTextProps,
    zommOutProps,
    zoomInDisabled,
    zoomInProps,
    zoomOutDisabled,
  } = useImagePreview({ scrollSpeed: SCROLL_SPEED });
  const downloadUrl = getImageDownloadUrl(currentPreview?.url);
  const downloadDisabled = !downloadUrl;
  const handleDownload = () => {
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.download = getImageDownloadFilename(downloadUrl);
    link.href = downloadUrl;
    link.rel = 'noopener noreferrer';
    document.body.append(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-50 h-screen w-screen select-none',
        !isOpen && 'hidden'
      )}
      onContextMenu={(e) => e.stopPropagation()}
      {...maskLayerProps}
    >
      <div className="absolute inset-0 size-full bg-black opacity-30" />
      <div className="absolute inset-0 size-full bg-black opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex max-h-screen w-full items-center">
          <PreviewImage
            className={cn(
              'mx-auto block max-h-[calc(100vh-4rem)] w-auto object-contain transition-transform'
            )}
          />
          <div
            className="-translate-x-1/2 absolute bottom-0 left-1/2 z-40 flex w-fit justify-center gap-4 p-2 text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1">
              <button
                {...prevProps}
                className={cn(
                  buttonVariants({
                    variant: prevDisabled ? 'disabled' : 'default',
                  })
                )}
                type="button"
              >
                <ArrowLeft />
              </button>
              {(currentUrlIndex ?? 0) + 1}
              <button
                {...nextProps}
                className={cn(
                  buttonVariants({
                    variant: nextDisabled ? 'disabled' : 'default',
                  })
                )}
                type="button"
              >
                <ArrowRight />
              </button>
            </div>
            <div className="flex">
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomOutDisabled ? 'disabled' : 'default',
                  })
                )}
                {...zommOutProps}
                type="button"
              >
                <Minus className="size-4" />
              </button>
              <div className="mx-px">
                {isEditingScale ? (
                  <>
                    <ScaleInput className="w-10 rounded px-1 text-slate-500 outline" />{' '}
                    <span>%</span>
                  </>
                ) : (
                  <span {...scaleTextProps}>{`${scale * 100}%`}</span>
                )}
              </div>
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomInDisabled ? 'disabled' : 'default',
                  })
                )}
                {...zoomInProps}
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              aria-label="Download image"
              className={cn(
                buttonVariants({
                  variant: downloadDisabled ? 'disabled' : 'default',
                })
              )}
              disabled={downloadDisabled}
              onClick={handleDownload}
              type="button"
            >
              <Download className="size-4" />
            </button>
            <button
              {...closeProps}
              className={cn(buttonVariants())}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleInput(props: React.ComponentProps<'input'>) {
  const { props: scaleInputProps, ref } = useScaleInput();

  return <input {...scaleInputProps} {...props} ref={ref} />;
}

function getImageDownloadFilename(url: string) {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    const filename = pathname.split('/').filter(Boolean).pop();

    return filename || DEFAULT_DOWNLOAD_FILENAME;
  } catch {
    return DEFAULT_DOWNLOAD_FILENAME;
  }
}

function getImageDownloadUrl(url: string | undefined) {
  if (!url) return null;

  try {
    // Classify relative URLs without changing their document-relative resolution.
    const parsed = new URL(url, 'https://plate.invalid');

    if (
      ['http:', 'https:', 'blob:'].includes(parsed.protocol) ||
      (parsed.protocol === 'data:' &&
        parsed.pathname.toLowerCase().startsWith('image/'))
    ) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}
'use client';

import * as React from 'react';

import { PlaceholderPlugin, UploadErrorCode } from '@platejs/media/react';
import { usePluginOption } from 'platejs/react';
import { toast } from 'sonner';

export function MediaUploadToast() {
  useUploadErrorToast();

  return null;
}

const useUploadErrorToast = () => {
  const uploadError = usePluginOption(PlaceholderPlugin, 'error');

  React.useEffect(() => {
    if (!uploadError) return;

    const { code, data } = uploadError;

    switch (code) {
      case UploadErrorCode.INVALID_FILE_SIZE: {
        toast.error(
          `The size of files ${data.files
            .map((f) => f.name)
            .join(', ')} is invalid`
        );

        break;
      }
      case UploadErrorCode.INVALID_FILE_TYPE: {
        toast.error(
          `The type of files ${data.files
            .map((f) => f.name)
            .join(', ')} is invalid`
        );

        break;
      }
      case UploadErrorCode.TOO_LARGE: {
        toast.error(
          `The size of files ${data.files
            .map((f) => f.name)
            .join(', ')} is too large than ${data.maxFileSize}`
        );

        break;
      }
      case UploadErrorCode.TOO_LESS_FILES: {
        toast.error(
          `The mini um number of files is ${data.minFileCount} for ${data.fileType}`
        );

        break;
      }
      case UploadErrorCode.TOO_MANY_FILES: {
        toast.error(
          `The maximum number of files is ${data.maxFileCount} ${
            data.fileType ? `for ${data.fileType}` : ''
          }`
        );

        break;
      }
    }
  }, [uploadError]);
};
'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  SparklesIcon,
  Square,
  SuperscriptIcon,
  Table,
  TableOfContentsIcon,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import {
  insertBlock,
  insertInlineElement,
} from '@/components/editor/transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'AI',
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: 'AI',
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: 'Basic blocks',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph'],
        label: 'Text',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1'],
        label: 'Heading 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2'],
        label: 'Heading 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3'],
        label: 'Heading 3',
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-'],
        label: 'Bulleted list',
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1'],
        label: 'Numbered list',
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]'],
        label: 'To-do list',
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable'],
        label: 'Toggle',
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```'],
        label: 'Code Block',
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        label: 'Table',
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>'],
        label: 'Blockquote',
        value: KEYS.blockquote,
      },
      {
        description: 'Insert a highlighted block.',
        icon: <LightbulbIcon />,
        keywords: ['note'],
        label: 'Callout',
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Advanced blocks',
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc'],
        label: 'Table of contents',
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: '3 columns',
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Equation',
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        keywords: ['excalidraw'],
        label: 'Excalidraw',
        value: KEYS.excalidraw,
      },
      {
        icon: <Code2 />,
        keywords: [
          'code-drawing',
          'diagram',
          'plantuml',
          'graphviz',
          'flowchart',
          'mermaid',
        ],
        label: 'Code Drawing',
        value: KEYS.codeDrawing,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Inline',
    items: [
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ['time'],
        label: 'Date',
        value: KEYS.date,
      },
      {
        focusEditor: true,
        icon: <SuperscriptIcon />,
        keywords: ['citation', 'fn', 'footnote', '[^]'],
        label: 'Footnote',
        value: 'action_footnote',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Inline Equation',
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
import * as React from 'react';

import type { OurFileRouter } from '@/lib/uploadthing';
import type {
  ClientUploadedFileData,
  UploadFilesOptions,
} from 'uploadthing/types';

import { generateReactHelpers } from '@uploadthing/react';
import { toast } from 'sonner';
import { z } from 'zod';

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter['editorUploader']>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  ...props
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      const res = await uploadFiles('editorUploader', {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      setUploadedFile(res[0]);

      onUploadComplete?.(res[0]);

      return uploadedFile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : 'Something went wrong, please try again later.';

      toast.error(message);

      onUploadError?.(error);

      // Mock upload for unauthenticated users
      // toast.info('User not logged in. Mocking upload process.');
      const mockUploadedFile = {
        key: 'mock-key-0',
        appUrl: `https://mock-app-url.com/${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      } as UploadedFile;

      // Simulate upload progress
      let progress = 0;

      const simulateProgress = async () => {
        while (progress < 100) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          progress += 2;
          setProgress(Math.min(progress, 100));
        }
      };

      await simulateProgress();

      setUploadedFile(mockUploadedFile);

      return mockUploadedFile;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export const { uploadFiles, useUploadThing } =
  generateReactHelpers<OurFileRouter>();

export function getErrorMessage(err: unknown) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => issue.message);

    return errors.join('\n');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return unknownError;
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
const getServerSnapshot = () => false;

export function useIsMobile() {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    mql.addEventListener('change', onStoreChange);

    return () => mql.removeEventListener('change', onStoreChange);
  }, []);

  const getSnapshot = React.useCallback(
    () => window.matchMedia(MOBILE_MEDIA_QUERY).matches,
    []
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
import * as React from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
import * as React from 'react';

export const useDebounce = <T>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
'use client';

import * as React from 'react';

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    function onResize() {
      setIsTouchDevice(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          navigator.maxTouchPoints > 0
      );
    }

    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return isTouchDevice;
}
import type { FileRouter } from 'uploadthing/next';

import { createUploadthing } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
  editorUploader: f(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
    .middleware(() => {
      // Replace this development-only allowance with your application's session and permission checks.
      if (process.env.NODE_ENV !== 'development') {
        throw new UploadThingError({
          code: 'FORBIDDEN',
          message: 'Configure upload authorization before enabling uploads.',
        });
      }

      return {};
    })
    .onUploadComplete(({ file }) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.ufsUrl,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
import { cva } from 'class-variance-authority';

export const inlineSuggestionVariants = cva(
  'in-data-[inline-suggestion=insert]:bg-emerald-100! in-data-[inline-suggestion=remove]:bg-red-100! in-data-[inline-suggestion=insert]:text-emerald-700! in-data-[inline-suggestion=remove]:text-red-700! data-[inline-suggestion=insert]:bg-emerald-100! data-[inline-suggestion=remove]:bg-red-100! data-[inline-suggestion=insert]:text-emerald-700! data-[inline-suggestion=remove]:text-red-700!'
);
'use client';

import * as React from 'react';

import type { TResolvedSuggestion } from '@platejs/suggestion';
import type { PlateEditor } from 'platejs/react';

import { CommentPlugin } from '@platejs/comment/react';
import { getSuggestionKey, keyId2SuggestionId } from '@platejs/suggestion';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  type NodeEntry,
  NodeApi,
  type Path,
  type TCommentText,
  type TElement,
  type TSuggestionText,
  ElementApi,
  KEYS,
  PathApi,
  TextApi,
} from 'platejs';
import { useEditorRef, useEditorVersion, usePluginOption } from 'platejs/react';

import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/editor/plugins/discussion-kit';

import type { TComment } from '@/components/ui/comment';

export interface ResolvedSuggestion extends TResolvedSuggestion {
  comments: TComment[];
}

export const BLOCK_SUGGESTION_TOKEN = '__block__';

type BlockDiscussionEntry = NodeEntry<
  TCommentText | TElement | TSuggestionText
>;
type SuggestionEntry = NodeEntry<TElement | TSuggestionText>;

type BlockDiscussionIndex = {
  discussionsByBlock: Map<string, TDiscussion[]>;
  suggestionsByBlock: Map<string, ResolvedSuggestion[]>;
};

type BuildBlockDiscussionIndexOptions = {
  entries: BlockDiscussionEntry[];
  discussions: TDiscussion[];
  getCommentId: (node: TCommentText) => string | undefined;
  getSuggestionData: (node: TElement | TSuggestionText) =>
    | {
        createdAt: Date | number | string;
        id: string;
        isLineBreak?: boolean;
        newProperties?: Record<string, unknown>;
        properties?: Record<string, unknown>;
        type: 'insert' | 'remove' | 'update';
        userId: string;
      }
    | undefined;
  getSuggestionDataList: (node: TSuggestionText) => Array<{
    id: string;
    newProperties?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    type: 'insert' | 'remove' | 'update';
  }>;
  getSuggestionId: (node: TElement | TSuggestionText) => string | undefined;
  isBlockSuggestion: (node: TElement | TSuggestionText) => boolean;
};

const discussionIndexCache = new WeakMap<
  PlateEditor,
  {
    discussions: TDiscussion[];
    index: BlockDiscussionIndex;
    version: number;
  }
>();

const TYPE_TEXT_MAP: Record<string, (node?: TElement) => string> = {
  [KEYS.audio]: () => 'Audio',
  [KEYS.blockquote]: () => 'Blockquote',
  [KEYS.callout]: () => 'Callout',
  [KEYS.codeBlock]: () => 'Code Block',
  [KEYS.column]: () => 'Column',
  [KEYS.equation]: () => 'Equation',
  [KEYS.file]: () => 'File',
  [KEYS.h1]: () => 'Heading 1',
  [KEYS.h2]: () => 'Heading 2',
  [KEYS.h3]: () => 'Heading 3',
  [KEYS.h4]: () => 'Heading 4',
  [KEYS.h5]: () => 'Heading 5',
  [KEYS.h6]: () => 'Heading 6',
  [KEYS.hr]: () => 'Horizontal Rule',
  [KEYS.img]: () => 'Image',
  [KEYS.mediaEmbed]: () => 'Media',
  [KEYS.p]: (node) => {
    if (node?.[KEYS.listType] === KEYS.listTodo) return 'Todo List';
    if (node?.[KEYS.listType] === KEYS.ol) return 'Ordered List';
    if (node?.[KEYS.listType] === KEYS.ul) return 'List';

    return 'Paragraph';
  },
  [KEYS.table]: () => 'Table',
  [KEYS.toc]: () => 'Table of Contents',
  [KEYS.toggle]: () => 'Toggle',
  [KEYS.video]: () => 'Video',
};

const appendByKey = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const values = map.get(key);

  if (values) {
    values.push(value);
    return;
  }

  map.set(key, [value]);
};

const getBlockKey = (path: Path) => path.join(',');

const getTopLevelPath = (path: Path): Path | null =>
  path.length > 0 ? path.slice(0, 1) : null;

const getSuggestionIds = (
  node: TCommentText | TElement | TSuggestionText,
  getSuggestionDataList: BuildBlockDiscussionIndexOptions['getSuggestionDataList'],
  getSuggestionId: BuildBlockDiscussionIndexOptions['getSuggestionId']
) => {
  if (TextApi.isText(node)) {
    const dataList = getSuggestionDataList(node as TSuggestionText);
    const updateIds = dataList
      .filter((data) => data.type === 'update')
      .map((data) => data.id);

    if (updateIds.length > 0) return updateIds;

    const suggestionId = getSuggestionId(node as TSuggestionText);

    return suggestionId ? [suggestionId] : [];
  }

  if (ElementApi.isElement(node)) {
    const suggestionId = getSuggestionId(node);

    return suggestionId ? [suggestionId] : [];
  }

  return [];
};

const suggestionTypeText = (node: TElement) =>
  (TYPE_TEXT_MAP[node.type] ?? (() => node.type))(node);

const formatSuggestionDateText = (date: string) => {
  const elementDate = new Date(date);

  if (Number.isNaN(elementDate.getTime())) return date;

  const today = new Date();
  const yesterday = new Date(today);
  const tomorrow = new Date(today);

  yesterday.setDate(today.getDate() - 1);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (left: Date, right: Date) =>
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear();

  if (sameDay(elementDate, today)) return 'Today';
  if (sameDay(elementDate, yesterday)) return 'Yesterday';
  if (sameDay(elementDate, tomorrow)) return 'Tomorrow';

  return elementDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getInlineSuggestionElementText = (node: TElement) => {
  if (typeof node.value === 'string' && node.value.length > 0) {
    return node.value;
  }

  if (typeof node.date === 'string' && node.date.length > 0) {
    return formatSuggestionDateText(node.date);
  }

  if (
    node.type === KEYS.inlineEquation &&
    typeof (node as TElement & { texExpression?: unknown }).texExpression ===
      'string' &&
    (node as TElement & { texExpression: string }).texExpression.length > 0
  ) {
    return (node as TElement & { texExpression: string }).texExpression;
  }

  const nodeText = NodeApi.string(node);

  if (nodeText.length > 0) {
    return nodeText;
  }
};

const toResolvedSuggestion = ({
  discussionsById,
  entries,
  getSuggestionData,
  getSuggestionDataList,
  id,
  isBlockSuggestion,
}: {
  discussionsById: Map<string, TDiscussion>;
  entries: SuggestionEntry[];
  getSuggestionData: BuildBlockDiscussionIndexOptions['getSuggestionData'];
  getSuggestionDataList: BuildBlockDiscussionIndexOptions['getSuggestionDataList'];
  id: string;
  isBlockSuggestion: BuildBlockDiscussionIndexOptions['isBlockSuggestion'];
}): ResolvedSuggestion | null => {
  const sortedEntries = [...entries].sort(([, path1], [, path2]) =>
    PathApi.isChild(path1, path2) ? -1 : 1
  );

  if (sortedEntries.length === 0) return null;

  let newText = '';
  let text = '';
  let properties: Record<string, unknown> = {};
  let newProperties: Record<string, unknown> = {};

  sortedEntries.forEach(([node]) => {
    if (TextApi.isText(node)) {
      getSuggestionDataList(node as TSuggestionText).forEach((data) => {
        if (data.id !== id) return;

        switch (data.type) {
          case 'insert': {
            newText += node.text;
            break;
          }
          case 'remove': {
            text += node.text;
            break;
          }
          case 'update': {
            properties = { ...properties, ...data.properties };
            newProperties = { ...newProperties, ...data.newProperties };
            newText += node.text;
            break;
          }
        }
      });

      return;
    }

    if (!ElementApi.isElement(node)) return;

    const suggestionData = getSuggestionData(node);

    if (suggestionData?.id !== keyId2SuggestionId(id)) return;

    const inlineSuggestionText = getInlineSuggestionElementText(node);

    if (inlineSuggestionText) {
      if (suggestionData.type === 'insert') {
        newText += inlineSuggestionText;
      } else if (suggestionData.type === 'remove') {
        text += inlineSuggestionText;
      } else if (suggestionData.type === 'update') {
        properties = { ...properties, ...suggestionData.properties };
        newProperties = {
          ...newProperties,
          ...suggestionData.newProperties,
        };
        newText += inlineSuggestionText;
      }

      return;
    }

    if (!isBlockSuggestion(node)) return;

    const nextText = suggestionData.isLineBreak
      ? BLOCK_SUGGESTION_TOKEN
      : `${BLOCK_SUGGESTION_TOKEN}${suggestionTypeText(node)}`;

    if (suggestionData.type === 'insert') {
      newText += nextText;
    } else if (suggestionData.type === 'remove') {
      text += nextText;
    }
  });

  const suggestionData = getSuggestionData(sortedEntries[0][0]);

  if (!suggestionData) return null;

  const keyId = getSuggestionKey(id);
  const comments = discussionsById.get(id)?.comments ?? [];
  const createdAt = new Date(suggestionData.createdAt);
  const suggestionId = keyId2SuggestionId(id);

  if (suggestionData.type === 'update') {
    return {
      comments,
      createdAt,
      keyId,
      newProperties,
      newText,
      properties,
      suggestionId,
      type: 'update',
      userId: suggestionData.userId,
    };
  }

  if (newText.length > 0 && text.length > 0) {
    return {
      comments,
      createdAt,
      keyId,
      newText,
      suggestionId,
      text,
      type: 'replace',
      userId: suggestionData.userId,
    };
  }

  if (newText.length > 0) {
    return {
      comments,
      createdAt,
      keyId,
      newText,
      suggestionId,
      type: 'insert',
      userId: suggestionData.userId,
    };
  }

  if (text.length > 0) {
    return {
      comments,
      createdAt,
      keyId,
      suggestionId,
      text,
      type: 'remove',
      userId: suggestionData.userId,
    };
  }

  return null;
};

export const buildBlockDiscussionIndex = ({
  discussions,
  entries,
  getCommentId,
  getSuggestionData,
  getSuggestionDataList,
  getSuggestionId,
  isBlockSuggestion,
}: BuildBlockDiscussionIndexOptions): BlockDiscussionIndex => {
  const commentOwnerById = new Map<string, Path>();
  const suggestionOwnerById = new Map<string, Path>();
  const commentIds = new Set<string>();
  const suggestionEntriesById = new Map<string, SuggestionEntry[]>();
  const discussionsById = new Map(
    discussions.map((discussion) => [discussion.id, discussion])
  );

  entries.forEach(([node, path]) => {
    const blockPath = getTopLevelPath(path);

    if (!blockPath) return;

    if (TextApi.isText(node)) {
      const commentId = getCommentId(node);

      if (commentId) {
        commentIds.add(commentId);

        if (!commentOwnerById.has(commentId)) {
          commentOwnerById.set(commentId, blockPath);
        }
      }
    }

    getSuggestionIds(node, getSuggestionDataList, getSuggestionId).forEach(
      (suggestionId) => {
        if (!suggestionOwnerById.has(suggestionId)) {
          suggestionOwnerById.set(suggestionId, blockPath);
        }

        appendByKey(suggestionEntriesById, suggestionId, [
          node as TElement | TSuggestionText,
          path,
        ]);
      }
    );
  });

  const discussionsByBlock = new Map<string, TDiscussion[]>();

  discussions.forEach((discussion) => {
    const ownerPath = commentOwnerById.get(discussion.id);

    if (!ownerPath || !commentIds.has(discussion.id) || discussion.isResolved) {
      return;
    }

    appendByKey(discussionsByBlock, getBlockKey(ownerPath), {
      ...discussion,
      createdAt: new Date(discussion.createdAt),
    });
  });

  const suggestionsByBlock = new Map<string, ResolvedSuggestion[]>();

  suggestionEntriesById.forEach((suggestionEntries, suggestionId) => {
    const ownerPath = suggestionOwnerById.get(suggestionId);

    if (!ownerPath) return;

    const resolvedSuggestion = toResolvedSuggestion({
      discussionsById,
      entries: suggestionEntries,
      getSuggestionData,
      getSuggestionDataList,
      id: suggestionId,
      isBlockSuggestion,
    });

    if (!resolvedSuggestion) return;

    appendByKey(suggestionsByBlock, getBlockKey(ownerPath), resolvedSuggestion);
  });

  return {
    discussionsByBlock,
    suggestionsByBlock,
  };
};

const getDiscussionIndex = (
  editor: PlateEditor,
  discussions: TDiscussion[],
  version: number
) => {
  const cached = discussionIndexCache.get(editor);

  if (
    cached &&
    cached.version === version &&
    cached.discussions === discussions
  ) {
    return cached.index;
  }

  const commentApi = editor.getApi(CommentPlugin).comment;
  const suggestionApi = editor.getApi(SuggestionPlugin).suggestion;

  const index = buildBlockDiscussionIndex({
    discussions,
    entries: [...editor.api.nodes({ at: [], mode: 'all' })],
    getCommentId: (node) => commentApi.nodeId(node),
    getSuggestionData: (node) => suggestionApi.suggestionData(node),
    getSuggestionDataList: (node) => suggestionApi.dataList(node),
    getSuggestionId: (node) => suggestionApi.nodeId(node),
    isBlockSuggestion: (node) =>
      ElementApi.isElement(node) && suggestionApi.isBlockSuggestion(node),
  });

  discussionIndexCache.set(editor, { discussions, index, version });

  return index;
};

export const useBlockDiscussionItems = (blockPath: Path) => {
  const editor = useEditorRef();
  const discussions = usePluginOption(discussionPlugin, 'discussions');
  const version = useEditorVersion() ?? 0;

  return React.useMemo(() => {
    const index = getDiscussionIndex(editor, discussions, version);
    const blockKey = getBlockKey(blockPath);

    return {
      resolvedDiscussions: index.discussionsByBlock.get(blockKey) ?? [],
      resolvedSuggestions: index.suggestionsByBlock.get(blockKey) ?? [],
    };
  }, [blockPath, discussions, editor, version]);
};
import type { TextStreamPart, ToolSet } from 'ai';

/**
 * Transform chunks like [**,bold,**] to [**bold**] make the md deserializer
 * happy.
 *
 * @experimental
 */
export const markdownJoinerTransform =
  <TOOLS extends ToolSet>() =>
  () => {
    const joiner = new MarkdownJoiner();
    let lastTextDeltaId: string | undefined;
    let textStreamEnded = false;

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async flush(controller) {
        // Only flush if we haven't seen text-end yet
        if (!textStreamEnded) {
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta',
            } as TextStreamPart<TOOLS>);
          }
        }
      },
      async transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          lastTextDeltaId = chunk.id;
          const processedText = joiner.processText(chunk.text);
          if (processedText) {
            controller.enqueue({
              ...chunk,
              text: processedText,
            });
            await delay(joiner.delayInMs);
          }
        } else if (chunk.type === 'text-end') {
          // Flush any remaining buffer before text-end
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta',
            } as TextStreamPart<TOOLS>);
          }
          textStreamEnded = true;
          controller.enqueue(chunk);
        } else {
          controller.enqueue(chunk);
        }
      },
    });
  };

const DEFAULT_DELAY_IN_MS = 10;
const NEST_BLOCK_DELAY_IN_MS = 100;

const BOLD_PATTERN = /\*\*.*?\*\*/;
const CODE_LINE_PATTERN = /```[^\s]+/;
const LINK_PATTERN = /^\[.*?\]\(.*?\)$/;
const UNORDERED_LIST_PATTERN = /^[*-]\s+.+/;
const TODO_LIST_PATTERN = /^[*-]\s+\[[ xX]\]\s+.+/;
const ORDERED_LIST_PATTERN = /^\d+\.\s+.+/;
const MDX_TAG_PATTERN = /<([A-Za-z][A-Za-z0-9\-_]*)>/;
const DIGIT_PATTERN = /^[0-9]$/;

export class MarkdownJoiner {
  delayInMs = DEFAULT_DELAY_IN_MS;

  private buffer = '';
  private documentCharacterCount = 0;
  private isBuffering = false;
  private streamingCodeBlock = false;
  private streamingLargeDocument = false;
  private streamingTable = false;

  private clearBuffer(): void {
    this.buffer = '';
    this.isBuffering = false;
  }
  private isCompleteBold(): boolean {
    return BOLD_PATTERN.test(this.buffer);
  }

  private isCompleteCodeBlockEnd(): boolean {
    return this.buffer.trimEnd() === '```';
  }

  private isCompleteCodeBlockStart(): boolean {
    return CODE_LINE_PATTERN.test(this.buffer);
  }

  private isCompleteLink(): boolean {
    return LINK_PATTERN.test(this.buffer);
  }

  private isCompleteList(): boolean {
    if (UNORDERED_LIST_PATTERN.test(this.buffer) && this.buffer.includes('['))
      return TODO_LIST_PATTERN.test(this.buffer);

    return (
      UNORDERED_LIST_PATTERN.test(this.buffer) ||
      ORDERED_LIST_PATTERN.test(this.buffer) ||
      TODO_LIST_PATTERN.test(this.buffer)
    );
  }

  private isCompleteMdxTag(): boolean {
    return MDX_TAG_PATTERN.test(this.buffer);
  }

  private isCompleteTableStart(): boolean {
    return this.buffer.startsWith('|') && this.buffer.endsWith('|');
  }

  private isFalsePositive(char: string): boolean {
    // when link is not complete, even if ths buffer is more than 30 characters, it is not a false positive
    if (this.buffer.startsWith('[') && this.buffer.includes('http')) {
      return false;
    }

    return char === '\n' || this.buffer.length > 30;
  }

  private isLargeDocumentStart(): boolean {
    return this.documentCharacterCount > 2500;
  }

  private isListStartChar(char: string): boolean {
    return char === '-' || char === '*' || DIGIT_PATTERN.test(char);
  }

  private isTableExisted(): boolean {
    return this.buffer.length > 10 && !this.buffer.includes('|');
  }

  flush(): string {
    const remaining = this.buffer;
    this.clearBuffer();
    return remaining;
  }

  processText(text: string): string {
    let output = '';

    for (const char of text) {
      if (
        this.streamingCodeBlock ||
        this.streamingTable ||
        this.streamingLargeDocument
      ) {
        this.buffer += char;

        if (char === '\n') {
          output += this.buffer;
          this.clearBuffer();
        }

        if (this.isCompleteCodeBlockEnd() && this.streamingCodeBlock) {
          this.streamingCodeBlock = false;
          this.delayInMs = DEFAULT_DELAY_IN_MS;

          output += this.buffer;
          this.clearBuffer();
        }

        if (this.isTableExisted() && this.streamingTable) {
          this.streamingTable = false;
          this.delayInMs = DEFAULT_DELAY_IN_MS;

          output += this.buffer;
          this.clearBuffer();
        }
      } else if (this.isBuffering) {
        this.buffer += char;

        if (this.isCompleteCodeBlockStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingCodeBlock = true;
          continue;
        }

        if (this.isCompleteTableStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingTable = true;
          continue;
        }

        if (this.isLargeDocumentStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingLargeDocument = true;
          continue;
        }

        if (
          this.isCompleteBold() ||
          this.isCompleteMdxTag() ||
          this.isCompleteList() ||
          this.isCompleteLink()
        ) {
          output += this.buffer;
          this.clearBuffer();
        } else if (this.isFalsePositive(char)) {
          // False positive - flush buffer as raw text
          output += this.buffer;
          this.clearBuffer();
        }
        // Check if we should start buffering
      } else if (
        char === '*' ||
        char === '<' ||
        char === '`' ||
        char === '|' ||
        char === '[' ||
        this.isListStartChar(char)
      ) {
        this.buffer = char;
        this.isBuffering = true;
      } else {
        // Pass through character directly
        output += char;
      }
    }

    this.documentCharacterCount += text.length;
    return output;
  }
}

async function delay(delayInMs?: number | null): Promise<void> {
  return delayInMs == null
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, delayInMs));
}
app

editor

page.tsx

api

uploadthing

route.ts

ai

command

route.ts

utils.ts

prompt

index.ts

common.ts

getChooseToolPrompt.ts

getCommentPrompt.ts

getEditPrompt.ts

getEditTablePrompt.ts

getGeneratePrompt.ts

copilot

route.ts

@components

editor

plate-editor.tsx

editor-kit.tsx

plugins

copilot-kit.tsx

markdown-kit.tsx

ai-kit.tsx

cursor-overlay-kit.tsx

align-base-kit.tsx

basic-blocks-base-kit.tsx

basic-marks-base-kit.tsx

callout-base-kit.tsx

code-block-base-kit.tsx

code-drawing-base-kit.tsx

column-base-kit.tsx

comment-base-kit.tsx

date-base-kit.tsx

footnote-base-kit.tsx

font-base-kit.tsx

line-height-base-kit.tsx

link-base-kit.tsx

list-base-kit.tsx

indent-base-kit.tsx

math-base-kit.tsx

media-base-kit.tsx

mention-base-kit.tsx

suggestion-base-kit.tsx

suggestion-kit.tsx

discussion-kit.tsx

basic-marks-kit.tsx

table-base-kit.tsx

toc-base-kit.tsx

toggle-base-kit.tsx

align-kit.tsx

autoformat-kit.tsx

basic-nodes-kit.tsx

basic-blocks-kit.tsx

block-menu-kit.tsx

block-selection-kit.tsx

block-placeholder-kit.tsx

callout-kit.tsx

code-block-kit.tsx

column-kit.tsx

comment-kit.tsx

date-kit.tsx

dnd-kit.tsx

docx-kit.tsx

emoji-kit.tsx

exit-break-kit.tsx

fixed-toolbar-kit.tsx

docx-export-kit.tsx

floating-toolbar-kit.tsx

font-kit.tsx

line-height-kit.tsx

link-kit.tsx

list-kit.tsx

indent-kit.tsx

math-kit.tsx

media-kit.tsx

mention-kit.tsx

slash-kit.tsx

table-kit.tsx

toc-kit.tsx

toggle-kit.tsx

plate-types.ts

settings-dialog.tsx

use-chat.ts

editor-base-kit.tsx

transforms.ts

components

ui

ghost-text.tsx

cursor-overlay.tsx

ai-menu.tsx

ai-chat-editor.tsx

editor.tsx

editor-static.tsx

blockquote-node.tsx

blockquote-node-static.tsx

heading-node.tsx

heading-node-static.tsx

hr-node.tsx

hr-node-static.tsx

paragraph-node.tsx

paragraph-node-static.tsx

code-node.tsx

code-node-static.tsx

highlight-node.tsx

highlight-node-static.tsx

kbd-node.tsx

kbd-node-static.tsx

callout-node.tsx

callout-node-static.tsx

emoji-toolbar-button.tsx

toolbar.tsx

code-block-node.tsx

code-block-node-static.tsx

code-drawing-node.tsx

code-drawing-node-static.tsx

column-node.tsx

column-node-static.tsx

resize-handle.tsx

comment-node.tsx

comment-node-static.tsx

date-node.tsx

date-node-static.tsx

footnote-node.tsx

footnote-node-static.tsx

inline-combobox.tsx

link-node.tsx

link-node-static.tsx

block-list.tsx

block-list-static.tsx

equation-node.tsx

equation-node-static.tsx

media-audio-node.tsx

media-audio-node-static.tsx

caption.tsx

media-file-node.tsx

media-file-node-static.tsx

media-image-node.tsx

media-image-node-static.tsx

media-toolbar.tsx

media-video-node.tsx

media-video-node-static.tsx

mention-node.tsx

mention-node-static.tsx

suggestion-node.tsx

suggestion-node-static.tsx

suggestion-toolbar-button.tsx

block-discussion.tsx

block-suggestion.tsx

comment.tsx

ai-node.tsx

emoji-node.tsx

mark-toolbar-button.tsx

table-node.tsx

table-icons.tsx

table-node-static.tsx

block-selection.tsx

font-color-toolbar-button.tsx

toc-node.tsx

toc-node-static.tsx

toggle-node.tsx

toggle-node-static.tsx

ai-toolbar-button.tsx

align-toolbar-button.tsx

block-context-menu.tsx

comment-toolbar-button.tsx

block-draggable.tsx

fixed-toolbar.tsx

fixed-toolbar-buttons.tsx

font-size-toolbar-button.tsx

history-toolbar-button.tsx

list-toolbar-button.tsx

indent-toolbar-button.tsx

import-toolbar-button.tsx

insert-toolbar-button.tsx

line-height-toolbar-button.tsx

link-toolbar-button.tsx

media-toolbar-button.tsx

mode-toolbar-button.tsx

more-toolbar-button.tsx

table-toolbar-button.tsx

toggle-toolbar-button.tsx

turn-into-toolbar-button.tsx

export-toolbar-button.tsx

floating-toolbar.tsx

floating-toolbar-buttons.tsx

equation-toolbar-button.tsx

link-toolbar.tsx

media-embed-node.tsx

media-placeholder-node.tsx

media-preview-dialog.tsx

media-upload-toast.tsx

slash-node.tsx

hooks

use-upload-file.ts

use-mobile.ts

use-mounted.ts

use-debounce.ts

use-is-touch-device.ts

lib

uploadthing.ts

suggestion.ts

block-discussion-index.ts

markdown-joiner-transform.