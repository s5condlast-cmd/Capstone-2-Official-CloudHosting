'use client';

import * as React from 'react';
import {
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Upload,
  Link,
  ChevronDown,
} from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToolbarButton } from './toolbar';

const MEDIA_TYPES = [
  {
    type: 'img',
    label: 'Image',
    accept: 'image/*',
    icon: ImageIcon,
    desc: 'PNG, JPG, SVG, WebP',
  },
  {
    type: 'video',
    label: 'Video',
    accept: 'video/*',
    icon: Film,
    desc: 'MP4, WebM',
  },
  {
    type: 'audio',
    label: 'Audio',
    accept: 'audio/*',
    icon: Music,
    desc: 'MP3, WAV, AAC',
  },
  {
    type: 'file',
    label: 'File Attachment',
    accept: '*/*',
    icon: FileText,
    desc: 'PDF, Word, Excel, etc.',
  },
];

export function MediaToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedMediaType, setSelectedMediaType] = React.useState<string>('img');

  const handleUploadClick = (type: string) => {
    setSelectedMediaType(type);
    const media = MEDIA_TYPES.find((m) => m.type === type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = media?.accept || '*/*';
      fileInputRef.current.click();
    }
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    try {
      editor?.tf?.insertNodes?.([
        {
          type: selectedMediaType,
          url,
          name: file.name,
          children: [{ text: '' }],
        },
      ]);
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }

    e.target.value = '';
  };

  const handleUrlInsert = (type: string) => {
    setOpen(false);
    const url = window.prompt(`Enter ${type} URL:`);
    if (!url) return;

    try {
      editor?.tf?.insertNodes?.([
        {
          type,
          url,
          name: url.split('/').pop() || `${type} link`,
          children: [{ text: '' }],
        },
      ]);
      editor?.tf?.focus?.();
    } catch { /* non-fatal */ }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            pressed={open}
            tooltip="Insert Media"
            aria-label="Insert Media"
            isDropdown
          >
            <ImageIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
          </ToolbarButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 p-1.5" align="start">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Insert Media
          </div>
          {MEDIA_TYPES.map(({ type, label, icon: Icon, desc }) => (
            <div
              key={type}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => handleUploadClick(type)}
              >
                <div className="p-1 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {label}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate">{desc}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => handleUploadClick(type)}
                  title="Upload from device"
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUrlInsert(type)}
                  title="Insert via URL"
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
