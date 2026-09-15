/**
 * toolbar.tsx
 * Plate UI Toolbar primitive components.
 * Matches @plate/editor-ai toolbar styling with theme tokens and accessible buttons.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

export const toolbarVariants = cva(
  'relative flex select-none items-center gap-0.5',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'w-full',
        floating: 'rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-1',
      },
    },
  }
);

export function Toolbar({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof toolbarVariants>) {
  return (
    <div
      role="toolbar"
      data-editor-toolbar
      className={cn(toolbarVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/toolbar-group flex items-center gap-0.5 shrink-0',
        className
      )}
    >
      {children}
      <ToolbarSeparator />
    </div>
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      className={cn(
        'mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 group-last/toolbar-group:hidden',
        className
      )}
      {...props}
    />
  );
}

export const toolbarButtonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium text-xs outline-none',
    'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70',
    'focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    'aria-checked:bg-zinc-200 dark:aria-checked:bg-zinc-800 aria-checked:text-zinc-900 dark:aria-checked:text-zinc-100',
    'transition-colors'
  ),
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-8 min-w-8 px-2',
        sm: 'h-7 min-w-7 px-1.5',
        lg: 'h-9 min-w-9 px-2.5',
      },
      variant: {
        default: 'bg-transparent',
        active: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold',
        accent: 'bg-primary/10 text-primary hover:bg-primary/20',
      },
    },
  }
);

export interface ToolbarButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof toolbarButtonVariants> {
  active?: boolean;
  tooltip?: string;
  isDropdown?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    {
      active = false,
      children,
      className,
      disabled,
      isDropdown = false,
      onClick,
      size = 'sm',
      title,
      tooltip,
      variant,
      ...props
    },
    ref
  ) {
    const tooltipText = tooltip || title;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={active}
        aria-checked={active}
        title={tooltipText}
        onMouseDown={(e) => {
          // Prevent losing text focus and selection in the Slate editor
          e.preventDefault();
          onClick?.(e as any);
        }}
        className={cn(
          toolbarButtonVariants({
            size,
            variant: active ? 'active' : variant,
          }),
          isDropdown && 'pr-1.5 gap-1',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToolbarButton.displayName = 'ToolbarButton';

