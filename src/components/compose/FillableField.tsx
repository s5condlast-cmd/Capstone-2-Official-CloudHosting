import React from 'react';
import { motion } from 'motion/react';
import { PenLine } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface FillableFieldProps {
  /** The field label, e.g. "Full Name" */
  label: string;
  /** Current value if filled */
  value?: string;
  /** Called when clicking the fill indicator */
  onClick: (fieldLabel: string) => void;
  /** Inline layout — sits within a sentence flow */
  inline?: boolean;
  /** Width class override */
  widthClass?: string;
  /** Whether this field is currently active in the workflow drawer */
  isActive?: boolean;
  /** Optional class override for the text inside the field */
  textClass?: string;
}

/**
 * A small clickable indicator that sits on top of blank template fields.
 * When empty, shows a subtle dashed box with a pencil icon and the field name.
 * When filled, shows the value with a light edit indicator.
 */
export const FillableField: React.FC<FillableFieldProps> = ({
  label,
  value,
  onClick,
  inline = false,
  widthClass,
  isActive = false,
  textClass
}) => {
  if (inline) {
    return (
      <motion.button
        type="button"
        data-label={label}
        onClick={(e) => { e.stopPropagation(); onClick(label); }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all cursor-pointer align-baseline mx-1 group",
          isActive
            ? "bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/50"
            : value
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 border-dashed text-amber-600 dark:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600",
          widthClass
        )}
        title={value ? `Edit: ${label}` : `Fill in: ${label}`}
      >
        <PenLine size={10} className="shrink-0 opacity-60 group-hover:opacity-100" />
        <span className={cn("text-[11px] font-medium", textClass)}>
          {value || label}
        </span>
      </motion.button>
    );
  }

  // Block / table-cell variant — fills the entire cell
  return (
    <motion.button
      type="button"
      data-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(label); }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full h-full min-h-[28px] flex items-center gap-1.5 px-2 py-1 rounded transition-all cursor-pointer group",
        isActive
          ? "bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/50"
          : value
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-50/40 dark:bg-amber-950/10 border border-dashed border-amber-200/60 dark:border-amber-800/30 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-700",
        widthClass
      )}
      title={value ? `Edit: ${label}` : `Fill in: ${label}`}
    >
      <PenLine size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
      <span className={cn("text-[11px] font-medium", textClass)}>
        {value || label}
      </span>
    </motion.button>
  );
};
