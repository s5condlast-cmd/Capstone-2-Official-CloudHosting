/**
 * toolbar.tsx
 * Plate UI Toolbar primitive components.
 * Matches @plate/editor-ai toolbar styling with theme tokens and accessible buttons.
 */
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
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
        floating: 'rounded-xl bg-card border border-border shadow-lg p-1',
      },
    },
  }
);

export function Toolbar({
  className,
  variant,
  children,
  ref,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof toolbarVariants>) {
  return (
    <div
      ref={ref}
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
        'group/toolbar-group flex items-center gap-1 shrink-0',
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
        'mx-1.5 h-5 w-px bg-border shrink-0 group-last/toolbar-group:hidden',
        className
      )}
      {...props}
    />
  );
}

export const toolbarButtonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium text-xs outline-none',
    'text-muted-foreground hover:text-foreground hover:bg-muted',
    'focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
    'aria-checked:bg-primary/10 aria-checked:text-primary aria-checked:border aria-checked:border-primary/20',
    'transition-[color,background-color,transform] active:scale-[0.98]'
  ),
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-8 min-w-8 px-1.5',
        sm: 'h-7.5 min-w-7.5 px-1.5',
        lg: 'h-9 min-w-9 px-2.5',
      },
      variant: {
        default: 'bg-transparent',
        active: 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-2xs',
        accent: 'bg-primary/15 text-primary hover:bg-primary/25',
      },
    },
  }
);

export interface ToolbarButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof toolbarButtonVariants> {
  active?: boolean;
  pressed?: boolean;
  tooltip?: string;
  isDropdown?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    {
      active = false,
      pressed,
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
    const isPressed = pressed !== undefined ? pressed : active;
    const tooltipText = tooltip || title;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={isPressed}
        aria-checked={isPressed}
        title={tooltipText}
        onMouseDown={(e) => {
          // Prevent losing text focus and selection in the Slate editor
          e.preventDefault();
        }}
        onClick={onClick}
        className={cn(
          toolbarButtonVariants({
            size,
            variant: isPressed ? 'active' : variant,
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

export function ToolbarSplitButton({
  className,
  pressed = false,
  children,
  ...props
}: React.ComponentProps<'div'> & { pressed?: boolean }) {
  return (
    <div
      data-state={pressed ? 'on' : 'off'}
      className={cn(
        'group inline-flex items-center rounded-lg text-xs font-medium transition-colors hover:bg-muted',
        pressed && 'bg-primary/10 text-primary border border-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ToolbarSplitButtonPartProps
  extends React.ComponentProps<'button'> {
  active?: boolean;
  tooltip?: string;
}

export const ToolbarSplitButtonPrimary = React.forwardRef<
  HTMLButtonElement,
  ToolbarSplitButtonPartProps
>(function ToolbarSplitButtonPrimary(
  { className, active = false, children, title, tooltip, onClick, ...props },
  ref
) {
  const tooltipText = tooltip || title;
  return (
    <button
      ref={ref}
      type="button"
      title={tooltipText}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={onClick}
      className={cn(
        'inline-flex h-8.5 items-center justify-center px-2 rounded-l-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        active && 'bg-primary/10 text-primary font-semibold border-y border-l border-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ToolbarSplitButtonPrimary.displayName = 'ToolbarSplitButtonPrimary';

export const ToolbarSplitButtonSecondary = React.forwardRef<
  HTMLButtonElement,
  ToolbarSplitButtonPartProps
>(function ToolbarSplitButtonSecondary(
  { className, active = false, children, title, tooltip, onClick, ...props },
  ref
) {
  const tooltipText = tooltip || title;
  return (
    <button
      ref={ref}
      type="button"
      title={tooltipText}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={onClick}
      className={cn(
        'inline-flex h-8.5 w-5 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        active && 'bg-primary/10 text-primary border-y border-r border-primary/20',
        className
      )}
      {...props}
    >
      {children || <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
});
ToolbarSplitButtonSecondary.displayName = 'ToolbarSplitButtonSecondary';

export function ToolbarMenuGroup({
  label,
  children,
  className,
}: React.ComponentProps<'div'> & { label?: string }) {
  return (
    <div className={cn('py-1', className)}>
      {label && (
        <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
