import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { cn } from '@/src/lib/utils';
import { Loader2 } from 'lucide-react';

interface DocxViewerProps {
  buffer?: ArrayBuffer | null;
  className?: string;
  isEditable?: boolean;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ buffer, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !buffer) return;

    let isMounted = true;

    const renderDocx = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (containerRef.current) {
          containerRef.current.innerHTML = ''; // Clear previous render
          const bufferClone = buffer.slice(0);
          await renderAsync(bufferClone, containerRef.current, undefined, {
            className: "docx-document",
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            ignoreFonts: false,
            useBase64URL: true,
            experimental: true,
          });

          // Remove header elements as they should not be visible in the preview
          const headers = containerRef.current.querySelectorAll('header');
          headers.forEach(h => h.remove());

          // Implement DOCX Template Editing Pattern TreeWalker
          let blankIndex = 0;
          let dateIndex = 0;

          const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
          const nodesToModify = [];

          let node;
          while ((node = walker.nextNode())) {
            if (node.nodeValue && /(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g.test(node.nodeValue)) {
              nodesToModify.push(node);
            }
          }

          nodesToModify.forEach((textNode) => {
            const parent = textNode.parentNode;
            if (!parent) return;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            const text = textNode.nodeValue || '';
            
            // Reset regex index
            const regex = /(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
              // Add text before match
              if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
              }

              const matchedStr = match[0];
              const span = document.createElement('span');
              span.className = 'editable-placeholder';
              span.textContent = matchedStr;
              
              if (/_{3,}/.test(matchedStr)) {
                span.setAttribute('data-blank-index', blankIndex.toString());
                blankIndex++;
              } else if (/^\s*Date\s*:?\s*$/.test(matchedStr)) {
                span.setAttribute('data-date-index', dateIndex.toString());
                dateIndex++;
              } else {
                span.setAttribute('data-original', matchedStr);
              }

              fragment.appendChild(span);
              lastIndex = regex.lastIndex;
            }

            // Add remaining text
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            parent.replaceChild(fragment, textNode);
          });
        }
      } catch (err) {
        console.error('docx-preview error:', err);
        if (isMounted) setError('Failed to render document preview.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    renderDocx();

    return () => {
      isMounted = false;
    };
  }, [buffer]);

  return (
    <div className="relative w-full min-h-[400px]">
      {(!buffer || isLoading) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-12 text-zinc-400 text-sm gap-2">
          <Loader2 className="animate-spin text-zinc-600 dark:text-zinc-400" size={24} />
          <span>Loading document preview...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-zinc-900 p-12 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-hidden [&_section]:!w-full [&_section]:!max-w-full [&_section]:!box-border [&_section]:!min-h-0 [&_section]:!py-8 [&_section]:!px-10 [&_.docx-wrapper]:!bg-transparent [&_.docx-wrapper]:!p-0",
          className
        )}
      />
    </div>
  );
};
