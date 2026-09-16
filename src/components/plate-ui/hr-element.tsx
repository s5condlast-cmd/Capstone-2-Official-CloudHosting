'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import { cn } from '@/src/lib/utils';

export function HrElement(props: PlateElementProps) {
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement {...props}>
      <div className="py-6" contentEditable={false}>
        <hr
          className={cn(
            'h-0.5 rounded-sm border-none bg-zinc-200 dark:bg-zinc-800 bg-clip-content',
            selected && focused && 'ring-2 ring-primary ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}
