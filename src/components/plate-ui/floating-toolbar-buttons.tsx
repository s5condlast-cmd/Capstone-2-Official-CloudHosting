'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';
import { ToolbarGroup } from './toolbar';
import { MarkToolbarButton } from './mark-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  if (readOnly) return null;

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarGroup>
        <TurnIntoToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </MarkToolbarButton>

        <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
        </MarkToolbarButton>

        <LinkToolbarButton />
      </ToolbarGroup>
    </div>
  );
}

