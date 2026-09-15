/**
 * editor.tsx
 * Official Plate UI container and sheet editor components.
 * Matches @plate/editor-ai template specification with authentic paper sheet aesthetics.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { PlateContainer, PlateContent, type PlateContentProps } from 'platejs/react';
import { cn } from '@/src/lib/utils';

export const editorContainerVariants = cva(
  'relative w-full cursor-text select-text overflow-y-auto caret-primary selection:bg-primary/20 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-primary/25 [&_.slate-selection-area]:bg-primary/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'h-full bg-zinc-100/70 dark:bg-zinc-950/80 p-4 md:p-8 flex justify-center',
        demo: 'min-h-[750px] bg-zinc-100/70 dark:bg-zinc-950/80 p-4 md:p-8 flex justify-center rounded-b-xl border-x border-b border-zinc-200 dark:border-zinc-800',
        fullWidth: 'size-full px-6 md:px-12 py-8 bg-zinc-100/70 dark:bg-zinc-950/80',
        sheet: 'min-h-[850px] bg-zinc-100/80 dark:bg-zinc-950 p-6 md:p-10 flex justify-center',
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

export const editorVariants = cva(
  cn(
    'group/editor plate-editor-content',
    'relative w-full cursor-text select-text overflow-x-hidden whitespace-break-spaces break-words',
    'focus-visible:outline-none',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    '[&_strong]:font-bold'
  ),
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-60',
      },
      focused: {
        true: '',
      },
      variant: {
        default:
          'size-full max-w-[850px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-xl px-12 py-12 text-base text-zinc-900 dark:text-zinc-100 font-serif leading-relaxed',
        demo:
          'w-full max-w-[850px] min-h-[750px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-md rounded-xl px-8 md:px-14 py-10 md:py-12 text-base text-zinc-900 dark:text-zinc-100 font-serif leading-relaxed',
        fullWidth:
          'size-full max-w-none bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-xl px-8 py-8 text-base font-serif',
        none: '',
      },
    },
  }
);

export type EditorProps = PlateContentProps &
  VariantProps<typeof editorVariants> & {
    ref?: React.Ref<HTMLDivElement>;
  };

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(function Editor(
  { className, disabled, focused, variant = 'demo', ...props },
  ref
) {
  return (
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
      data-editor-content
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12pt',
        lineHeight: 1.5,
      }}
      {...props}
    />
  );
});

Editor.displayName = 'Editor';

